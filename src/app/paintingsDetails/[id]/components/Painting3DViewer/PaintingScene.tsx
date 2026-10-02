"use client";

import { CameraControls, Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
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
} from "./sceneUtils";

export const CAMERA_FOV = 35;

export const WALL_TONES: Record<WallTone, { label: string; color: string }> = {
  charcoal: { label: "Grafite", color: "#2b2b2e" },
  burgundy: { label: "Vinho", color: "#4a1c1f" },
  green: { label: "Verde museu", color: "#1e3328" },
  ivory: { label: "Marfim", color: "#d9d3c6" },
};

const LABEL_WIDTH = 0.16;
const LABEL_HEIGHT = 0.1;

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
  const introRef = useRef<gsap.core.Tween | null>(null);
  const { size, invalidate, gl } = useThree();
  const { border, depth } = getFrameMetrics(width, height);

  const frameWidth = width + border * 2;
  const frameHeight = height + border * 2;
  // Room on the right for the wall label, so it is part of the framing. On
  // portrait screens the painting gets the whole width instead.
  const aspect = size.width / size.height;
  const labelSpace = aspect < 0.9 ? 0 : LABEL_WIDTH + 0.12;

  const plaster = useMemo(() => createPlasterBumpMap(), []);
  useEffect(() => () => plaster?.dispose(), [plaster]);

  useLayoutEffect(() => {
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
  }, [texture, gl]);

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

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.minDistance = homeDistance * 0.15;
    controls.maxDistance = homeDistance * 1.6;
    controls.minAzimuthAngle = -Math.PI / 3;
    controls.maxAzimuthAngle = Math.PI / 3;
    controls.minPolarAngle = Math.PI / 2 - 0.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.35;
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

  // Cinematic dolly-in on open; any user input takes over immediately.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intro runs once per painting
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const end = { x: lookX, y: lookY, z: homeRef.current };
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      controls.setLookAt(end.x, end.y, end.z, lookX, lookY, 0, false);
    } else {
      const pose = {
        x: lookX + frameWidth * 1.1,
        y: frameHeight * 0.35,
        z: end.z * 1.9,
      };
      controls.setLookAt(pose.x, pose.y, pose.z, lookX, lookY, 0, false);
      introRef.current = gsap.to(pose, {
        ...end,
        duration: 2.6,
        ease: "power3.inOut",
        onUpdate: () => {
          controls.setLookAt(pose.x, pose.y, pose.z, lookX, lookY, 0, false);
          invalidate();
        },
      });
    }

    const stopIntro = () => {
      introRef.current?.kill();
      introRef.current = null;
      onInteract?.();
    };
    controls.addEventListener("controlstart", stopIntro);
    invalidate();
    onReady?.();

    return () => {
      controls.removeEventListener("controlstart", stopIntro);
      introRef.current?.kill();
    };
  }, [texture]);

  useEffect(() => {
    controlsApi.current = {
      reset: () => {
        introRef.current?.kill();
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
        introRef.current?.kill();
        const controls = controlsRef.current;
        if (!controls) return;
        controls.dolly(direction * controls.distance * 0.3, true);
      },
    };
    return () => {
      controlsApi.current = null;
    };
  }, [controlsApi, lookX, lookY]);

  const wall = WALL_TONES[wallTone];
  const lightDistance = Math.max(frameHeight, 1) * 1.6;

  return (
    <>
      <color attach="background" args={[wall.color]} />

      <ambientLight intensity={0.18} />
      <hemisphereLight args={["#fff4e0", "#1a1410", 0.35]} />
      {/* Gallery picture light: warm spot from above, slightly in front. */}
      <spotLight
        position={[0, frameHeight / 2 + lightDistance * 0.9, lightDistance]}
        angle={Math.atan((frameWidth * 0.75) / lightDistance) + 0.15}
        penumbra={0.75}
        intensity={lightDistance ** 2 * 7}
        decay={2}
        color="#ffe9cc"
      />
      <directionalLight
        position={[-3, 1, 4]}
        intensity={0.35}
        color="#dfe8ff"
      />

      {/* Studio reflections for the varnish and the frame, rendered once. */}
      <Environment frames={1} resolution={256} environmentIntensity={0.55}>
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
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial
          color={wall.color}
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
        opacity={wallTone === "ivory" ? 0.45 : 0.6}
      />

      <FramedPainting
        width={width}
        height={height}
        texture={texture}
        bumpMap={bumpMap}
        frameStyle={frameStyle}
      />

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
