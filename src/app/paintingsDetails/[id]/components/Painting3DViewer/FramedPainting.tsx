"use client";

import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import type {
  FrameStyle,
  FramedPaintingProps,
} from "@/types/paintingDetails.type";
import { getFrameMetrics } from "./sceneUtils";

export const WOOD_TEXTURES = [
  "/textures/fine_grained_wood_col_1k.jpg",
  "/textures/fine_grained_wood_nor_gl_1k.jpg",
  "/textures/fine_grained_wood_rough_1k.jpg",
];

type MaterialProps = {
  color: string;
  metalness: number;
  roughness: number;
};

export const FRAME_STYLES: Record<
  FrameStyle,
  {
    label: string;
    swatch: string;
    moulding: MaterialProps;
    slip: MaterialProps;
  }
> = {
  gold: {
    label: "Dourada",
    swatch: "linear-gradient(135deg, #f3dc8f, #b8913f 55%, #7a5a1f)",
    moulding: { color: "#c9a24a", metalness: 1, roughness: 0.32 },
    slip: { color: "#e9e0cb", metalness: 0, roughness: 0.9 },
  },
  wood: {
    label: "Madeira",
    swatch: "linear-gradient(135deg, #8a5a36, #5b3a22 60%, #3b2414)",
    moulding: { color: "#8c6a50", metalness: 0, roughness: 0.6 },
    slip: { color: "#c9a24a", metalness: 1, roughness: 0.35 },
  },
  black: {
    label: "Preta",
    swatch: "linear-gradient(135deg, #3a3a3a, #111 60%)",
    moulding: { color: "#141414", metalness: 0.2, roughness: 0.38 },
    slip: { color: "#c9a24a", metalness: 1, roughness: 0.35 },
  },
};

/**
 * Rectangular ring extruded along z with rounded (bevelled) edges. The given
 * sizes are the final footprint (the bevel grows the outline, so the shape is
 * inset to compensate) and the back face sits at z = 0. Mitred corners come
 * for free from the extrusion.
 */
export function createRingGeometry(
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  depth: number,
  bevel: number,
) {
  const b = Math.min(
    bevel,
    depth / 2 - 0.0005,
    (outerWidth - innerWidth) / 4 - 0.0005,
  );
  const ow = outerWidth / 2 - b;
  const oh = outerHeight / 2 - b;
  const iw = innerWidth / 2 + b;
  const ih = innerHeight / 2 + b;

  const shape = new THREE.Shape();
  shape.moveTo(-ow, -oh);
  shape.lineTo(ow, -oh);
  shape.lineTo(ow, oh);
  shape.lineTo(-ow, oh);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-iw, -ih);
  hole.lineTo(-iw, ih);
  hole.lineTo(iw, ih);
  hole.lineTo(iw, -ih);
  hole.closePath();
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.0005, depth - b * 2),
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 4,
    curveSegments: 1,
  });
  geometry.translate(0, 0, b);
  return geometry;
}

/**
 * Classic moulding profile built from stacked rings: a rounded bead at the
 * sight edge, a lower cove in the middle and a tall rolled outer edge. The
 * steps catch light and shadow the way a carved frame does.
 */
function createMouldingGeometries(
  width: number,
  height: number,
  slip: number,
  moulding: number,
  depth: number,
) {
  const sightWidth = width + slip * 2;
  const sightHeight = height + slip * 2;
  const ring = (from: number, to: number, ringDepth: number, round: number) =>
    createRingGeometry(
      sightWidth + to * 2,
      sightHeight + to * 2,
      sightWidth + from * 2,
      sightHeight + from * 2,
      ringDepth,
      (to - from) * round,
    );

  return [
    // Cove / base
    ring(-0.002, moulding, depth * 0.62, 0.12),
    // Sight-edge bead
    ring(-0.002, moulding * 0.2, depth * 0.85, 0.45),
    // Rolled outer edge
    ring(moulding * 0.52, moulding, depth, 0.42),
  ];
}

function WoodMaterial() {
  const invalidate = useThree((state) => state.invalidate);
  const textures = useTexture(WOOD_TEXTURES);
  const [map, normalMap, roughnessMap] = textures;

  useLayoutEffect(() => {
    for (const texture of textures) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      // ExtrudeGeometry UVs are in meters: ~0.6 m of wood per texture tile.
      texture.repeat.set(1.6, 1.6);
      texture.needsUpdate = true;
    }
    map.colorSpace = THREE.SRGBColorSpace;
    invalidate();
  }, [textures, map, invalidate]);

  return (
    <meshStandardMaterial
      map={map}
      normalMap={normalMap}
      roughnessMap={roughnessMap}
      color="#a07a5c"
      roughness={0.75}
      metalness={0}
    />
  );
}

function MouldingMaterial({ style }: { style: FrameStyle }) {
  const fallback = <meshStandardMaterial {...FRAME_STYLES.black.moulding} />;
  if (style === "wood") {
    return (
      <Suspense fallback={fallback}>
        <WoodMaterial />
      </Suspense>
    );
  }
  return <meshStandardMaterial {...FRAME_STYLES[style].moulding} />;
}

export function FramedPainting({
  width,
  height,
  texture,
  bumpMap,
  frameStyle,
}: FramedPaintingProps) {
  const { moulding, slip, depth, canvasDepth } = getFrameMetrics(width, height);
  // The liner overlaps the canvas edge slightly, like a real rebate.
  const lip = 0.004;

  const slipGeometry = useMemo(
    () =>
      createRingGeometry(
        width + slip * 2,
        height + slip * 2,
        width - lip * 2,
        height - lip * 2,
        canvasDepth + 0.008,
        0.003,
      ),
    [width, height, slip, canvasDepth],
  );

  const mouldingGeometries = useMemo(
    () => createMouldingGeometries(width, height, slip, moulding, depth),
    [width, height, slip, moulding, depth],
  );

  useEffect(
    () => () => {
      slipGeometry.dispose();
      for (const geometry of mouldingGeometries) geometry.dispose();
    },
    [slipGeometry, mouldingGeometries],
  );

  const style = FRAME_STYLES[frameStyle];

  return (
    <group>
      {/* Canvas on its stretcher. */}
      <mesh position-z={canvasDepth / 2}>
        <boxGeometry args={[width, height, canvasDepth]} />
        <meshStandardMaterial color="#d8cdb8" roughness={0.95} />
      </mesh>

      {/* Painted surface: varnished oil with relief from the brush strokes. */}
      <mesh position-z={canvasDepth + 0.0005}>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          map={texture}
          bumpMap={bumpMap ?? undefined}
          bumpScale={1.4}
          roughness={0.62}
          metalness={0}
          clearcoat={0.35}
          clearcoatRoughness={0.45}
        />
      </mesh>

      <mesh geometry={slipGeometry}>
        <meshStandardMaterial {...style.slip} />
      </mesh>

      {mouldingGeometries.map((geometry) => (
        <mesh key={geometry.uuid} geometry={geometry}>
          <MouldingMaterial style={frameStyle} />
        </mesh>
      ))}
    </group>
  );
}
