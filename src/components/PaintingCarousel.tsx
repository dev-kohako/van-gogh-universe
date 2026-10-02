"use client";

import Image from "next/image";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-coverflow";
import { PaintingCarouselProps } from "@/types/homePage.type";

export function PaintingCarousel({ paintings }: PaintingCarouselProps) {
  return (
    <Swiper
      effect="coverflow"
      grabCursor
      centeredSlides
      loop
      autoplay={{ delay: 2500, disableOnInteraction: false }}
      speed={1200}
      slidesPerView={2}
      coverflowEffect={{
        rotate: 30,
        stretch: 0,
        depth: 150,
        modifier: 1,
        slideShadows: true,
      }}
      modules={[EffectCoverflow, Autoplay]}
      className="w-[90vw] max-w-7xl my-5 mask-x-from-90% mask-x-to-97% z-40 overflow-visible"
    >
      {paintings.map((painting, i) => (
        <SwiperSlide
          // biome-ignore lint/suspicious/noArrayIndexKey: the list repeats paintings
          key={`${painting.src}-${i}`}
          className="flex justify-center items-center"
        >
          <Image
            src={painting.src}
            alt={painting.alt ?? `Obra de arte ${i + 1}`}
            width={800}
            height={600}
            // Two slides share the carousel width (90vw).
            sizes="(min-width: 1440px) 640px, 45vw"
            placeholder={painting.blurDataURL ? "blur" : "empty"}
            blurDataURL={painting.blurDataURL}
            className="w-full h-40 sm:h-52 md:h-64 lg:h-80 xl:h-96 short:h-64 object-cover rounded-lg"
            priority={i < 2}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
