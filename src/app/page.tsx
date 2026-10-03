import { getPaintings } from "@/lib/paintings";
import type { FeaturedPainting } from "@/types/homePage.type";
import { featuredPaintingIds } from "../../public/data/paintings";
import { HomePageClient } from "./home-page-client";

export default function HomePage() {
  const byId = new Map(
    getPaintings().map((painting) => [painting.id, painting]),
  );
  const featured: FeaturedPainting[] = featuredPaintingIds.flatMap((id) => {
    const painting = byId.get(id);
    return painting
      ? [
          {
            id: painting.id,
            src: painting.imagePainting,
            alt: `${painting.namePainting}, de Vincent van Gogh`,
            name: painting.namePainting,
            date: painting.datePainting,
            blurDataURL: painting.blurDataURL,
          },
        ]
      : [];
  });

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100dvh-6rem)] md:min-h-dvh w-full font-josefin pt-5 sm:pt-10 md:pt-0 relative md:pl-16 xl:pl-0">
      <main className="flex flex-col items-center justify-center flex-1 w-full max-w-7xl px-4 mx-auto text-center">
        <HomePageClient paintings={featured} />
      </main>
    </div>
  );
}
