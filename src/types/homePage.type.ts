export interface SwiperPainting {
  src: string;
  alt: string;
  blurDataURL?: string;
}

export interface HomePageClientProps {
  paintings: SwiperPainting[];
}

export interface PaintingCarouselProps {
  paintings: SwiperPainting[];
}