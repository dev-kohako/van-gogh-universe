export interface FeaturedPainting {
  id: string;
  src: string;
  alt: string;
  name: string;
  date: string;
  blurDataURL?: string;
}

export interface HomePageClientProps {
  paintings: FeaturedPainting[];
}

export interface PaintingCarouselProps {
  paintings: FeaturedPainting[];
}
