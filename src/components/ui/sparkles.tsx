"use client";
import type { Container, ISourceOptions } from "@tsparticles/engine";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { memo, useEffect, useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ParticlesProps = {
  id?: string;
  className?: string;
  background?: string;
  particleSize?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

let engineReady: Promise<void> | null = null;

function ensureEngine() {
  engineReady ??= initParticlesEngine(async (engine) => {
    await loadSlim(engine);
  });
  return engineReady;
}

// Memoized because <Particles> reloads the whole container every time it
// receives new props; it should only reload when the visual options change.
export const SparklesCore = memo(function SparklesCore(props: ParticlesProps) {
  const {
    id,
    className,
    background,
    minSize,
    maxSize,
    speed,
    particleColor,
    particleDensity,
  } = props;
  const [init, setInit] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    ensureEngine().then(() => {
      if (active) setInit(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const controls = useAnimation();

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      controls.start({
        opacity: 1,
        transition: {
          duration: 1,
        },
      });
    }
  };

  const options = useMemo<ISourceOptions>(
    () => ({
      background: {
        color: {
          value: background || "#0d47a1",
        },
      },
      fullScreen: {
        enable: false,
        zIndex: 1,
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
        },
      },
      particles: {
        color: {
          value: particleColor || "#ffffff",
        },
        move: {
          enable: !reduceMotion,
          direction: "none",
          outModes: {
            default: "out",
          },
          random: false,
          speed: {
            min: 0.1,
            max: 1,
          },
          straight: false,
        },
        number: {
          density: {
            enable: true,
            width: 400,
            height: 400,
          },
          value: particleDensity || 120,
        },
        opacity: {
          value: {
            min: 0.1,
            max: 1,
          },
          animation: {
            enable: !reduceMotion,
            speed: speed || 4,
            sync: false,
            mode: "auto",
            startValue: "random",
            destroy: "none",
          },
        },
        shape: {
          type: "circle",
        },
        size: {
          value: {
            min: minSize || 1,
            max: maxSize || 3,
          },
        },
      },
      detectRetina: true,
    }),
    [
      background,
      particleColor,
      particleDensity,
      minSize,
      maxSize,
      speed,
      reduceMotion,
    ],
  );

  const generatedId = useId();
  return (
    <motion.div animate={controls} className={cn("opacity-0", className)}>
      {init && (
        <Particles
          id={id || generatedId}
          className={cn("h-full w-full")}
          particlesLoaded={particlesLoaded}
          options={options}
        />
      )}
    </motion.div>
  );
});
