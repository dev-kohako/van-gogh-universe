"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef } from "react";
import { SplitWords } from "@/components/ui/split-words";
import { useGsap } from "@/hooks/useGsap";
import { gsap, hasFinePointer, prefersReducedMotion } from "@/lib/gsap";
// Registers the plugin used by the `scrollTrigger` options below.
import "@/lib/scrollTrigger";
import VanGoghDetails from "./components/VanGoghDetails";

// three.js and the model are only downloaded on this page, after it paints.
const VanGogh3DCard = dynamic(
  () =>
    import("./components/VanGogh3DCard").then((module) => module.VanGogh3DCard),
  {
    ssr: false,
    loading: () => (
      <div className="h-[60vh] min-h-[420px] w-full rounded-2xl border border-border bg-black/40 lg:h-full lg:min-h-[520px]" />
    ),
  },
);

const IMMERSIVE_TEXT = [
  "O Van Gogh Universe transforma a contemplação em descoberta. Ao navegar pelas galerias, o visitante interage com obras em movimento, observa detalhes invisíveis a olho nu e compreende a emoção presente em cada traço.",
  "Tudo é dinâmico — as cores reagem, as formas respiram e a arte ganha vida através da tecnologia. É um convite para mergulhar nas emoções de Van Gogh e enxergar o mundo através de seus olhos.",
];

const VALUES = [
  {
    title: "Nossa Visão",
    paragraphs: [
      "Acreditamos que a arte deve ser acessível, viva e inspiradora. O Van Gogh Universe conecta o passado e o presente, permitindo que a intensidade das cores e emoções do artista sejam sentidas de forma autêntica e contemporânea.",
      "Nosso objetivo é oferecer uma experiência que vá além da contemplação — uma imersão na mente criativa de Van Gogh.",
    ],
  },
  {
    title: "Tecnologia e Arte",
    paragraphs: [
      "Criado com Next.js, GSAP e Three.js, o projeto traduz o movimento e a textura das pinceladas em experiências interativas 3D que evocam a profundidade emocional das obras originais.",
      "Cada detalhe visual foi cuidadosamente desenvolvido para respeitar a essência da arte clássica enquanto explora as possibilidades infinitas do digital.",
    ],
  },
];

const QUOTE = "A arte é para consolar aqueles que são quebrados pela vida.";

export default function AboutPage() {
  const scopeRef = useRef<HTMLElement>(null);

  useGsap(() => {
    if (prefersReducedMotion()) {
      gsap.set("[data-reveal]", { autoAlpha: 1 });
      return;
    }

    // Opening: the portrait emerges from the dark wall as the light finds
    // him, then the title rises word by word.
    gsap
      .timeline({ defaults: { ease: "expo.out" } })
      .set("[data-reveal-hero]", { autoAlpha: 1 })
      .fromTo(
        "[data-hero-portrait]",
        { scale: 1.18, filter: "brightness(0) blur(6px)" },
        {
          scale: 1,
          filter: "brightness(1) blur(0px)",
          duration: 2.6,
          ease: "power3.out",
        },
      )
      .from(
        "[data-hero-title] [data-word]",
        { yPercent: 120, rotate: 4, duration: 1.2, stagger: 0.08 },
        0.5,
      )
      .from(
        "[data-hero-fade]",
        { y: 24, autoAlpha: 0, duration: 1, stagger: 0.12 },
        0.9,
      );

    // While scrolling past, the portrait drifts back into the wall.
    gsap.fromTo(
      "[data-hero-shift]",
      { yPercent: 0, opacity: 1 },
      {
        yPercent: 12,
        opacity: 0.3,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      },
    );

    // Sections rise into view as they are reached.
    for (const section of gsap.utils.toArray<HTMLElement>("[data-rise]")) {
      gsap.fromTo(
        section,
        { autoAlpha: 0, y: 60 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: section, start: "top 85%", once: true },
        },
      );
    }

    gsap.from("[data-bio-field]", {
      autoAlpha: 0,
      y: 16,
      duration: 0.8,
      ease: "expo.out",
      stagger: 0.06,
      scrollTrigger: { trigger: "[data-bio]", start: "top 75%", once: true },
    });

    // The two value cards swing in from the sides like gallery doors.
    gsap.fromTo(
      "[data-value-card]",
      {
        autoAlpha: 0,
        rotationY: (index: number) => (index === 0 ? 35 : -35),
        x: (index: number) => (index === 0 ? -40 : 40),
        transformPerspective: 1200,
        transformOrigin: (index: number) =>
          index === 0 ? "0% 50%" : "100% 50%",
      },
      {
        autoAlpha: 1,
        rotationY: 0,
        x: 0,
        duration: 1.4,
        ease: "expo.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: "[data-values]",
          start: "top 80%",
          once: true,
        },
      },
    );

    // The immersive text lights up word by word as it is read.
    gsap.set("[data-immersive]", { autoAlpha: 1 });
    gsap.fromTo(
      "[data-immersive] [data-word]",
      { opacity: 0.15 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.05,
        scrollTrigger: {
          trigger: "[data-immersive]",
          start: "top 80%",
          end: "bottom 55%",
          scrub: 0.6,
        },
      },
    );

    // The quote is written in gold, then a glint runs over it.
    gsap
      .timeline({
        scrollTrigger: {
          trigger: "[data-quote]",
          start: "top 85%",
          once: true,
        },
      })
      .set("[data-quote]", { autoAlpha: 1 })
      // The brush letters overflow their boxes, so they are not masked:
      // each word fades in out of a soft blur instead.
      .from("[data-quote] [data-word]", {
        autoAlpha: 0,
        y: 18,
        filter: "blur(8px)",
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.07,
        clearProps: "filter",
      })
      .fromTo(
        "[data-quote] [data-word]",
        { backgroundPosition: "100% 0" },
        {
          backgroundPosition: "0% 0",
          duration: 1.6,
          ease: "power2.inOut",
          stagger: 0.08,
        },
        0.6,
      )
      .from("[data-quote-author]", { autoAlpha: 0, y: 10, duration: 0.8 }, 1);

    // A small parallax on the portrait follows the mouse.
    if (hasFinePointer()) {
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      const portrait = document.querySelector("[data-hero-shift]");
      if (hero && portrait) {
        const moveX = gsap.quickTo(portrait, "x", {
          duration: 1.2,
          ease: "power3",
        });
        const moveY = gsap.quickTo(portrait, "y", {
          duration: 1.2,
          ease: "power3",
        });
        const handleMove = (event: PointerEvent) => {
          const rect = hero.getBoundingClientRect();
          moveX(((event.clientX - rect.left) / rect.width - 0.5) * -24);
          moveY(((event.clientY - rect.top) / rect.height - 0.5) * -16);
        };
        hero.addEventListener("pointermove", handleMove);
        return () => hero.removeEventListener("pointermove", handleMove);
      }
    }
  }, scopeRef);

  return (
    <main
      ref={scopeRef}
      aria-labelledby="about-title"
      className="relative mx-auto w-full max-w-7xl px-[6%] pb-16 pt-10 md:pl-24 md:pr-10 xl:pl-28 2xl:px-10"
    >
      {/* Hero: the portrait emerges from the wall, the title beside it. */}
      <header
        data-hero
        data-reveal-hero
        data-reveal
        className="relative grid min-h-[calc(100dvh-8rem)] items-center lg:min-h-[calc(100dvh-5rem)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-[6%] right-0 md:-left-12 lg:right-[18%]"
        >
          <div data-hero-shift className="absolute inset-[-3%]">
            <div data-hero-portrait className="about-portrait absolute inset-0">
              <Image
                src="/assets/van-gogh-portrait.jpg"
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 80vw, 100vw"
                className="object-cover object-[35%_center]"
              />
            </div>
          </div>
        </div>

        <div className="relative ml-auto max-w-xl pt-[45vh] text-right sm:pt-[40vh] lg:pt-0">
          <p
            data-hero-fade
            className="mb-3 text-xs uppercase tracking-[0.3em] text-gold"
          >
            O projeto
          </p>
          <h1
            id="about-title"
            data-hero-title
            className="text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl"
          >
            <SplitWords text="Sobre o Van Gogh Universe" mask />
          </h1>
          <p
            data-hero-fade
            className="mt-5 text-lg leading-relaxed text-foreground/80"
          >
            Uma experiência digital imersiva que une arte, emoção e tecnologia —
            inspirada na vida e na visão de Vincent van Gogh.
          </p>
          <p
            data-hero-fade
            className="mt-6 text-xs uppercase tracking-[0.25em] text-muted-foreground"
          >
            Retrato de Vincent van Gogh por John Peter Russell, 1886
          </p>
        </div>
      </header>

      {/* The artist: placard and the 3D model side by side. */}
      <section
        data-bio
        className="mt-16 grid items-stretch gap-10 lg:mt-24 lg:grid-cols-2 lg:gap-14"
      >
        <div
          data-rise
          data-reveal
          className="flex flex-col justify-center gap-6"
        >
          <VanGoghDetails />
          <p className="text-pretty text-base leading-relaxed text-foreground/80">
            Van Gogh foi um dos artistas mais influentes da história da arte
            ocidental. Sua paleta vibrante e pinceladas intensas expressavam
            emoções profundas, tornando visível a beleza e o sofrimento humanos.
          </p>
          <blockquote className="border-l-2 border-gold/70 pl-4 italic text-foreground">
            “Eu sonho minha pintura e depois pinto meu sonho.”
          </blockquote>
        </div>
        <div data-rise data-reveal className="min-h-[420px]">
          <VanGogh3DCard />
        </div>
      </section>

      {/* Vision and technology. */}
      <section
        data-values
        aria-label="Visão e tecnologia"
        className="mt-24 grid gap-6 md:grid-cols-2 lg:gap-10"
      >
        {VALUES.map((value) => (
          <article
            key={value.title}
            data-value-card
            data-reveal
            className="rounded-2xl border border-border/80 bg-card/60 p-8 shadow-[0_30px_60px_-35px_rgb(0_0_0/0.8)] backdrop-blur-md"
          >
            <h2 className="text-2xl font-semibold text-foreground">
              {value.title}
            </h2>
            <span
              aria-hidden="true"
              className="mt-3 block h-px w-16 bg-gradient-to-r from-gold to-transparent"
            />
            {value.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="mt-4 text-pretty leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </section>

      {/* Immersive experience: the words light up while reading. */}
      <section
        aria-labelledby="immersive-title"
        className="mx-auto mt-28 max-w-4xl text-center"
      >
        <h2
          id="immersive-title"
          data-rise
          data-reveal
          className="mb-8 text-3xl font-semibold md:text-4xl"
        >
          Uma Experiência Imersiva
        </h2>
        <div
          data-immersive
          data-reveal
          className="space-y-6 text-xl leading-relaxed md:text-2xl"
        >
          {IMMERSIVE_TEXT.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>
              <SplitWords text={paragraph} />
            </p>
          ))}
        </div>
      </section>

      {/* Legacy and the closing quote. */}
      <section
        aria-labelledby="legacy-title"
        className="mx-auto mt-28 max-w-3xl text-center"
      >
        <h2
          id="legacy-title"
          data-rise
          data-reveal
          className="mb-6 text-3xl font-semibold text-foreground md:text-4xl"
        >
          O Legado de Van Gogh
        </h2>
        <p
          data-rise
          data-reveal
          className="text-pretty text-lg leading-relaxed text-muted-foreground"
        >
          Van Gogh nos ensinou que a arte é uma forma de cura e expressão
          universal. Mesmo em meio à dor e à solidão, ele encontrou nas cores um
          meio de eternizar sua alma. Este projeto é uma homenagem à sua coragem
          e à sua visão incompreendida — um testemunho de que a beleza pode
          nascer do caos.
        </p>

        <figure data-quote data-reveal className="mt-14">
          <blockquote>
            <p className="font-brush text-5xl leading-tight md:text-6xl">
              <SplitWords
                text={`“${QUOTE}”`}
                wordClassName="text-gilded inline-block px-[0.06em]"
              />
            </p>
          </blockquote>
          <figcaption
            data-quote-author
            className="mt-4 text-sm uppercase tracking-[0.25em] text-muted-foreground"
          >
            Vincent van Gogh
          </figcaption>
        </figure>
      </section>
    </main>
  );
}
