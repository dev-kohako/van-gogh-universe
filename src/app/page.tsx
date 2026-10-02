import { getPaintings } from "@/lib/paintings";
import { paintings } from "../../public/data/paintings";
import { HomePageClient } from "./home-page-client";

export default function HomePage() {
  // Blurred previews show the colors of each painting while it loads.
  const blurBySrc = new Map(
    getPaintings().map((painting) => [
      painting.imagePainting,
      painting.blurDataURL,
    ]),
  );
  const slides = paintings.map((painting) => ({
    ...painting,
    blurDataURL: blurBySrc.get(painting.src),
  }));

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100dvh-6rem)] md:min-h-dvh w-full font-josefin pt-5 sm:pt-10 md:pt-0 relative md:pl-16 xl:pl-0">
      <main className="flex flex-col items-center justify-center flex-1 w-full max-w-7xl px-4 mx-auto text-center">
        <HomePageClient paintings={slides} />
      </main>
    </div>
  );
}