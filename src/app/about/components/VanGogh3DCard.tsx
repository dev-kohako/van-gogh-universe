"use client";

import { Loader, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { memo, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { BackSide, Mesh, RepeatWrapping, TextureLoader } from "three";
import { Badge } from "@/components/ui/badge";
import { RotationMenuItems } from "./RotationMenuItems";

/** Simplified and meshopt-compressed (~1 MB instead of 17 MB). */
const MODEL_URL = "/models/van-gogh.glb";

const VanGoghModel = memo(function VanGoghModel() {
  const { scene } = useGLTF(MODEL_URL);

  const memoizedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof Mesh) child.castShadow = true;
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={memoizedScene}
      scale={3.5}
      position={[0, -0.2, 0]}
      rotation={[0, Math.PI * 1.5, 0]}
    />
  );
});

const StarrySkySphere = memo(function StarrySkySphere() {
  const texture = useLoader(
    TextureLoader,
    "/textures/noite-estrelada-texture.jpg",
  );
  return (
    <mesh>
      <sphereGeometry args={[50, 64, 64]} />
      <meshBasicMaterial map={texture} side={BackSide} />
    </mesh>
  );
});

const RoundedBase = memo(function RoundedBase() {
  const texture = useLoader(
    TextureLoader,
    "/textures/brick_villa_floor_diff_1k.jpg",
  );
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 1);

  return (
    <mesh rotation={[-Math.PI, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <cylinderGeometry args={[1.2, 1.2, 0.1, 64]} />
      <meshStandardMaterial map={texture} roughness={0.5} metalness={0.3} />
    </mesh>
  );
});

/** Mounts its children once the element comes close to the viewport. */
function useNearViewport(margin = "300px") {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || near) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [margin, near]);

  return { ref, near };
}

/** Van Gogh in 3D under the Starry Night sky, turning on a pedestal. */
export function VanGogh3DCard() {
  const [autoRotate, setAutoRotate] = useState(true);
  const [velocity, setVelocity] = useState(0.5);
  // three.js work (and the model download) waits until the card is close.
  const { ref, near } = useNearViewport();

  return (
    <section
      ref={ref}
      className="relative h-[60vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-black shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] lg:h-full lg:min-h-[520px]"
      aria-label="Visualização tridimensional interativa de Van Gogh"
    >
      {near && (
        <>
          <Loader />
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            shadows
            dpr={[1, 1.75]}
            aria-label="Cena 3D de Van Gogh"
          >
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[5, 8, 5]}
              intensity={2.2}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <pointLight
              position={[-4, 3, -3]}
              intensity={0.7}
              color="#ffd27f"
            />
            <pointLight position={[4, 2, 3]} intensity={0.7} color="#aaccff" />

            <Suspense fallback={null}>
              <VanGoghModel />
              <StarrySkySphere />
              <RoundedBase />

              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -1.8, 0]}
                receiveShadow
              >
                <planeGeometry args={[1, 1]} />
                <shadowMaterial opacity={0.1} />
              </mesh>
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 2}
              maxPolarAngle={Math.PI / 2}
              autoRotate={autoRotate}
              autoRotateSpeed={velocity}
            />
          </Canvas>
        </>
      )}

      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="border-zinc-300/60 bg-black/30 pt-1 text-zinc-50 backdrop-blur-sm"
          aria-live="polite"
        >
          Rotação automática: {autoRotate ? "Ativada" : "Desativada"}
        </Badge>
        <Badge
          variant="outline"
          className="border-zinc-300/60 bg-black/30 pt-1 text-zinc-50 backdrop-blur-sm"
          aria-live="polite"
        >
          Velocidade: {velocity.toFixed(1)}
        </Badge>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <RotationMenuItems
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
          velocity={velocity}
          setVelocity={setVelocity}
        />
      </div>
    </section>
  );
}
