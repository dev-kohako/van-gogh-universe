"use client";

import { CameraControls, Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type {
  PaintingSceneProps,
  WallTone,
} from "@/types/paintingDetails.type";
import { FramedPainting } from "./FramedPainting";
import {
  createLabelTexture,
  createPlasterBumpMap,
  createSoftShadowTexture,
  getFitDistance,
  getFrameMetrics,
  getRoomColor,
} from "./sceneUtils";

export const CAMERA_FOV = 35;

export const WALL_TONES: Record<
  WallTone,
  { label: string; color: string; shadow: number }
> = {
  charcoal: { label: "Grafite", color: "#2b2b2e", shadow: 0.6 },
  burgundy: { label: "Vinho", color: "#4a1c1f", shadow: 0.6 },
  green: { label: "Verde museu", color: "#1e3328", shadow: 0.6 },
  ivory: { label: "Marfim", color: "#d9d3c6", shadow: 0.45 },
};

const LABEL_WIDTH = 0.16;
const LABEL_HEIGHT = 0.1;
/** The wall is far larger than anything the camera can reach. */
const WALL_SIZE: [number, number] = [160, 100];
const HOME_AZIMUTH = 0;
const HOME_POLAR = Math.PI / 2;
const MAX_AZIMUTH = 0.62;

const LIGHTS = {
  ambient: 0.18,
  hemisphere: 0.35,
  fill: 0.35,
  environment: 0.55,
};

function getPageFont() {
  if (typeof document === "undefined") return "sans-serif";
  const family = getComputedStyle(document.body)
    .getPropertyValue("--font-josefin-sans")
    .trim();
  return family ? `${family}, sans-serif` : "sans-serif";
}

/** Soft shadow cast on the wall by the light above: cheap and always soft. */
function WallShadow({
  width,
  height,
  position,
  opacity,
}: {
  width: number;
  height: number;
  position: [number, number, number];
  opacity: number;
}) {
  const shadow = useMemo(
    () => createSoftShadowTexture(width / height),
    [width, height],
  );
  useEffect(() => () => shadow?.texture.dispose(), [shadow]);
  if (!shadow) return null;

  return (
    <mesh position={position} renderOrder={1}>
      <planeGeometry args={[width * shadow.scaleX, height * shadow.scaleY]} />
      <meshBasicMaterial
        color="#000000"
        alphaMap={shadow.texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

function GalleryLabel({
  label,
  position,
}: {
  label: PaintingSceneProps["label"];
  position: [number, number, number];
}) {
  const texture = useMemo(
    () => createLabelTexture(label, getPageFont()),
    [label],
  );
  useEffect(() => () => texture?.dispose(), [texture]);

  if (!texture) return null;
  return (
    <mesh position={position}>
      <boxGeometry args={[LABEL_WIDTH, LABEL_HEIGHT, 0.004]} />
      <meshStandardMaterial attach="material-0" color="#e6e1d6" />
      <meshStandardMaterial attach="material-1" color="#e6e1d6" />
      <meshStandardMaterial attach="material-2" color="#e6e1d6" />
      <meshStandardMaterial attach="material-3" color="#e6e1d6" />
      <meshStandardMaterial
        attach="material-4"
        map={texture}
        roughness={0.85}
      />
      <meshStandardMaterial attach="material-5" color="#e6e1d6" />
    </mesh>
  );
}

export function PaintingScene({
  texture,
  bumpMap,
  width,
  height,
  frameStyle,
  wallTone,
  label,
  controlsApi,
  onReady,
  onInteract,
}: PaintingSceneProps) {
  const controlsRef = useRef<CameraControls>(null);
  const introRef = useRef<gsap.core.Timeline | null>(null);
  /** Before the visitor takes control, the camera follows the pointer. */
  const showcaseRef = useRef(false);
  const spotRef = useRef<THREE.SpotLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemisphereRef = useRef<THREE.HemisphereLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const wallRef = useRef<THREE.MeshStandardMaterial>(null);
  const frameGroupRef = useRef<THREE.Group>(null);
  const { size, invalidate, gl, scene } = useThree();
  const { border, depth } = getFrameMetrics(width, height);

  const frameWidth = width + border * 2;
  const frameHeight = height + border * 2;
  // Room on the right for the wall label, so it is part of the framing. On
  // portrait screens the painting gets the whole width instead.
  const aspect = size.width / size.height;
  const labelSpace = aspect < 0.9 ? 0 : LABEL_WIDTH + 0.12;

  const plaster = useMemo(() => createPlasterBumpMap(256, WALL_SIZE), []);
  useEffect(() => () => plaster?.dispose(), [plaster]);

  useLayoutEffect(() => {
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
    invalidate();
  }, [texture, gl, invalidate]);

  const homeDistance = getFitDistance(
    frameWidth + labelSpace,
    frameHeight,
    CAMERA_FOV,
    aspect,
  );
  const homeRef = useRef(homeDistance);
  homeRef.current = homeDistance;
  // Look slightly right of the canvas so the label is framed too, and a bit
  // low so the painting sits above the toolbar.
  const lookX = labelSpace / 2;
  const lookY = -frameHeight * 0.06;
  const spotDistance = Math.max(frameHeight, 1) * 1.6;
  const spotIntensity = spotDistance ** 2 * 7;

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.minDistance = homeDistance * 0.15;
    controls.maxDistance = homeDistance * 1.35;
    // Narrow orbit: the wall always fills the view.
    controls.minAzimuthAngle = -MAX_AZIMUTH;
    controls.maxAzimuthAngle = MAX_AZIMUTH;
    controls.minPolarAngle = HOME_POLAR - 0.38;
    controls.maxPolarAngle = HOME_POLAR + 0.28;
    controls.dollyToCursor = true;
    controls.smoothTime = 0.3;
    // Keep the orbit target on the painting while panning.
    controls.setBoundary(
      new THREE.Box3(
        new THREE.Vector3(-frameWidth / 2, -frameHeight / 2, 0),
        new THREE.Vector3(
          frameWidth / 2 + LABEL_WIDTH + 0.12,
          frameHeight / 2,
          depth,
        ),
      ),
    );
  }, [homeDistance, frameWidth, frameHeight, depth]);

  // Opening shot: the room is dark, the picture light flickers on and the
  // camera glides from a raking angle along the frame to the front.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the intro runs once
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const home = homeRef.current;
    controls.setLookAt(lookX, lookY, home, lookX, lookY, 0, false);

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const lights = {
      spot: spotRef.current,
      ambient: ambientRef.current,
      hemisphere: hemisphereRef.current,
      fill: fillRef.current,
    };

    if (reduceMotion) {
      showcaseRef.current = true;
    } else {
      const pose = {
        azimuth: MAX_AZIMUTH * 0.9,
        polar: HOME_POLAR + 0.12,
        distance: home * 0.55,
      };
      const applyPose = () => {
        controls.rotateTo(pose.azimuth, pose.polar, false);
        controls.dollyTo(pose.distance, false);
        invalidate();
      };
      applyPose();

      const level = { value: 0 };
      const applyLights = () => {
        if (lights.spot) lights.spot.intensity = spotIntensity * level.value;
        if (lights.ambient) {
          lights.ambient.intensity = LIGHTS.ambient * level.value;
        }
        if (lights.hemisphere) {
          lights.hemisphere.intensity = LIGHTS.hemisphere * level.value;
        }
        if (lights.fill) lights.fill.intensity = LIGHTS.fill * level.value;
        scene.environmentIntensity = LIGHTS.environment * level.value;
        invalidate();
      };
      applyLights();

      introRef.current = gsap
        .timeline({
          onComplete: () => {
            showcaseRef.current = true;
          },
        })
        .to(level, {
          keyframes: { value: [0, 0.65, 0.1, 0.85, 0.45, 1] },
          duration: 1.1,
          ease: "none",
          onUpdate: applyLights,
        })
        .to(
          pose,
          {
            azimuth: HOME_AZIMUTH,
            polar: HOME_POLAR,
            distance: home,
            duration: 3,
            ease: "power3.inOut",
            onUpdate: applyPose,
          },
          0.25,
        );
    }

    const stopIntro = () => {
      if (introRef.current) {
        // Leave the camera where it is: the visitor takes over from there.
        introRef.current.kill();
        introRef.current = null;
        // Restore full light levels if the intro was cut short.
        if (lights.spot) lights.spot.intensity = spotIntensity;
        if (lights.ambient) lights.ambient.intensity = LIGHTS.ambient;
        if (lights.hemisphere) {
          lights.hemisphere.intensity = LIGHTS.hemisphere;
        }
        if (lights.fill) lights.fill.intensity = LIGHTS.fill;
        scene.environmentIntensity = LIGHTS.environment;
      }
      showcaseRef.current = false;
      onInteract?.();
    };
    controls.addEventListener("controlstart", stopIntro);
    invalidate();
    onReady?.();

    return () => {
      controls.removeEventListener("controlstart", stopIntro);
      introRef.current?.kill();
      introRef.current = null;
    };
  }, []);

  // Showcase: the camera leans gently towards the pointer until the visitor
  // drags, zooms or pans.
  useEffect(() => {
    const element = gl.domElement;
    const finePointer = window.matchMedia?.(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (!finePointer) return;

    const handleMove = (event: PointerEvent) => {
      const controls = controlsRef.current;
      if (!controls || !showcaseRef.current || event.buttons !== 0) return;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      controls.rotateTo(HOME_AZIMUTH - x * 0.16, HOME_POLAR - y * 0.1, true);
    };
    const handleLeave = () => {
      if (!showcaseRef.current) return;
      controlsRef.current?.rotateTo(HOME_AZIMUTH, HOME_POLAR, true);
    };
    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerleave", handleLeave);
    return () => {
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerleave", handleLeave);
    };
  }, [gl]);

  useEffect(() => {
    controlsApi.current = {
      reset: () => {
        introRef.current?.progress(1).kill();
        introRef.current = null;
        showcaseRef.current = true;
        controlsRef.current?.setLookAt(
          lookX,
          lookY,
          homeRef.current,
          lookX,
          lookY,
          0,
          true,
        );
      },
      zoom: (direction) => {
        introRef.current?.progress(1).kill();
        introRef.current = null;
        showcaseRef.current = false;
        const controls = controlsRef.current;
        if (!controls) return;
        controls.dolly(direction * controls.distance * 0.3, true);
      },
    };
    return () => {
      controlsApi.current = null;
    };
  }, [controlsApi, lookX, lookY]);

  // Repainting the wall: the colors glide instead of switching. JSX only
  // receives the initial colors; later changes are tweened here.
  const [initialTone] = useState(wallTone);
  const roomColor = useMemo(
    () => getRoomColor(WALL_TONES[initialTone].color),
    [initialTone],
  );
  const firstTone = useRef(true);
  useEffect(() => {
    const wall = wallRef.current;
    const target = new THREE.Color(WALL_TONES[wallTone].color);
    const room = getRoomColor(WALL_TONES[wallTone].color);
    const background = scene.background;
    const fog = scene.fog;
    const colors: [THREE.Color | undefined, THREE.Color][] = [
      [wall?.color, target],
      [background instanceof THREE.Color ? background : undefined, room],
      [fog?.color, room],
    ];

    if (firstTone.current) {
      firstTone.current = false;
      for (const [color, value] of colors) color?.copy(value);
      invalidate();
      return;
    }

    const tweens = colors.map(([color, value]) =>
      color
        ? gsap.to(color, {
            r: value.r,
            g: value.g,
            b: value.b,
            duration: 0.9,
            ease: "power2.inOut",
            onUpdate: invalidate,
          })
        : null,
    );
    return () => {
      for (const tween of tweens) tween?.kill();
    };
  }, [wallTone, scene, invalidate]);

  // Changing the frame: the painting is lifted off the wall and hung again.
  const firstFrame = useRef(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: animates on change
  useEffect(() => {
    if (firstFrame.current) {
      firstFrame.current = false;
      return;
    }
    const group = frameGroupRef.current;
    if (!group) return;
    const tween = gsap
      .timeline({ onUpdate: invalidate })
      .to(group.position, { z: 0.05, duration: 0.25, ease: "power2.out" })
      .to(group.rotation, { z: 0.025, duration: 0.25, ease: "power2.out" }, 0)
      .to(group.position, { z: 0, duration: 0.6, ease: "bounce.out" })
      .to(
        group.rotation,
        { z: 0, duration: 1.2, ease: "elastic.out(1, 0.3)" },
        0.25,
      );
    return () => {
      tween.progress(1).kill();
    };
  }, [frameStyle]);

  const shadowOpacity = WALL_TONES[wallTone].shadow;

  useEffect(() => {
    if (!(scene.fog instanceof THREE.Fog)) return;
    scene.fog.near = homeDistance * 1.6;
    scene.fog.far = homeDistance * 6.5;
    invalidate();
  }, [scene, homeDistance, invalidate]);

  return (
    <>
      <color attach="background" args={[roomColor]} />
      <fog attach="fog" args={[roomColor, 4, 16]} />

      <ambientLight ref={ambientRef} intensity={LIGHTS.ambient} />
      <hemisphereLight
        ref={hemisphereRef}
        args={["#fff4e0", "#1a1410", LIGHTS.hemisphere]}
      />
      {/* Gallery picture light: warm spot from above, slightly in front. */}
      <spotLight
        ref={spotRef}
        position={[0, frameHeight / 2 + spotDistance * 0.9, spotDistance]}
        angle={Math.atan((frameWidth * 0.75) / spotDistance) + 0.15}
        penumbra={0.75}
        intensity={spotIntensity}
        decay={2}
        color="#ffe9cc"
      />
      <directionalLight
        ref={fillRef}
        position={[-3, 1, 4]}
        intensity={LIGHTS.fill}
        color="#dfe8ff"
      />

      {/* Studio reflections for the varnish and the frame, rendered once. */}
      <Environment
        frames={1}
        resolution={256}
        environmentIntensity={LIGHTS.environment}
      >
        <Lightformer
          form="rect"
          intensity={3}
          position={[0, 4, 3]}
          rotation-x={Math.PI / 2}
          scale={[8, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[-5, 1, 2]}
          rotation-y={Math.PI / 2}
          scale={[6, 2, 1]}
          color="#cfe0ff"
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          position={[5, 1, 2]}
          rotation-y={-Math.PI / 2}
          scale={[6, 2, 1]}
          color="#ffe2c2"
        />
      </Environment>

      <mesh position-z={-0.001}>
        <planeGeometry args={WALL_SIZE} />
        <meshStandardMaterial
          ref={wallRef}
          color={WALL_TONES[initialTone].color}
          roughness={0.95}
          bumpMap={plaster ?? undefined}
          bumpScale={0.6}
        />
      </mesh>

      {/* The picture light is above, so shadows fall slightly downwards. */}
      <WallShadow
        width={frameWidth * 1.02}
        height={frameHeight * 1.02}
        position={[0, -frameHeight * 0.035, 0.0005]}
        opacity={shadowOpacity}
      />

      <group ref={frameGroupRef}>
        <FramedPainting
          width={width}
          height={height}
          texture={texture}
          bumpMap={bumpMap}
          frameStyle={frameStyle}
        />
      </group>

      <WallShadow
        width={LABEL_WIDTH}
        height={LABEL_HEIGHT}
        position={[
          frameWidth / 2 + 0.1 + LABEL_WIDTH / 2,
          -frameHeight / 2 +
            LABEL_HEIGHT / 2 +
            Math.min(0.12, frameHeight * 0.15) -
            0.006,
          0.0005,
        ]}
        opacity={0.35}
      />
      <GalleryLabel
        label={label}
        position={[
          frameWidth / 2 + 0.1 + LABEL_WIDTH / 2,
          -frameHeight / 2 +
            LABEL_HEIGHT / 2 +
            Math.min(0.12, frameHeight * 0.15),
          0.002,
        ]}
      />

      <CameraControls ref={controlsRef} makeDefault />
    </>
  );
}
