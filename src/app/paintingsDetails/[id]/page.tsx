import type { Metadata } from "next";
import { getPaintingIds, getPaintingWithNeighbours } from "@/lib/paintings";
import { PaintingDetailsView } from "./PaintingDetailsView";

type PageProps = { params: Promise<{ id: string }> };

// Every painting page is rendered at build time: instant navigation and only
// the current painting's data is sent to the browser.
export function generateStaticParams() {
  return getPaintingIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = getPaintingWithNeighbours(id);
  if (!entry) return { title: "Obra não encontrada · Van Gogh Universe" };
  return {
    title: `${entry.painting.namePainting} · Van Gogh Universe`,
    description: entry.painting.description,
  };
}

export default async function PaintingsDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const entry = getPaintingWithNeighbours(id);

  return (
    <PaintingDetailsView
      painting={entry?.painting}
      prevPainting={entry?.prevPainting}
      nextPainting={entry?.nextPainting}
      position={entry?.position}
      total={entry?.total}
    />
  );
}
