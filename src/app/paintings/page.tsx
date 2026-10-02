"use client";

import { FilterX, Palette, Search, X } from "lucide-react";
import { useRef } from "react";

import type { SortBy, SortOrder } from "@/types/paiting.type";
import type { Painting } from "@/types/types";
import { data_painting } from "../../../public/data/data.json";
import { ALL, usePaintings } from "./usePantings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaintingCard } from "./components/PaintingCard";
import { PaintingsPagination } from "./components/PaintingsPagination";
import { EmptySection } from "@/components/empty-section";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const paintings: Painting[] = (data_painting || [])
  .filter((p) => p.width && p.height && p.imagePainting)
  .map((p) => ({
    ...p,
    imagePainting: `/assets/paintings/${p.imagePainting}`,
    alt: `Obra "${p.namePainting}" (${p.datePainting}) por Van Gogh.`,
  }));

const SORT_OPTIONS: { value: `${SortBy}-${SortOrder}`; label: string }[] = [
  { value: "name-asc", label: "Nome (A–Z)" },
  { value: "name-desc", label: "Nome (Z–A)" },
  { value: "date-asc", label: "Mais antigas" },
  { value: "date-desc", label: "Mais recentes" },
];

const shortPeriod = (period: string) => period.replace(/^Período de /, "");

export default function PaintingsPage() {
  const { currentItems, pagination, filter, sort, ui } = usePaintings({
    paintings: paintings,
    initialItemsPerPage: 6,
  });
  const scopeRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const firstItem =
    pagination.totalItems === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const lastItem = Math.min(
    pagination.currentPage * pagination.itemsPerPage,
    pagination.totalItems,
  );

  const goToPage = (page: number) => {
    pagination.setCurrentPage(page);
    resultsRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  // Cards animate in again whenever the grid content changes.
  const gridKey = [
    pagination.currentPage,
    pagination.itemsPerPage,
    filter.period,
    filter.genre,
    sort.sortBy,
    sort.order,
    currentItems.map((item) => item.id).join(","),
  ].join("|");

  useGsap(() => {
    if (prefersReducedMotion()) {
      gsap.set("[data-reveal]", { autoAlpha: 1 });
      return;
    }
    gsap
      .timeline({ defaults: { ease: "expo.out" } })
      .set("[data-title]", { autoAlpha: 1 })
      .from("[data-title-word]", {
        yPercent: 120,
        rotate: 4,
        duration: 1.1,
        stagger: 0.08,
      })
      .fromTo(
        "[data-intro]",
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 },
        0.3,
      );
  }, scopeRef);

  // Cards are hung on the wall one after another.
  useGsap(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      if (prefersReducedMotion()) {
        gsap.set(cards, { autoAlpha: 1 });
        return;
      }
      gsap.fromTo(
        cards,
        {
          autoAlpha: 0,
          y: 40,
          rotationX: -18,
          scale: 0.96,
          transformPerspective: 1000,
          transformOrigin: "50% 0%",
        },
        {
          autoAlpha: 1,
          y: 0,
          rotationX: 0,
          scale: 1,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.06,
          delay: 0.15,
        },
      );
    },
    scopeRef,
    [gridKey],
  );

  return (
    <main
      ref={scopeRef}
      className="px-[6%] md:pl-24 md:pr-10 xl:pl-28 min-[1440px]:!px-10 pt-12 pb-10 md:pt-14 w-full max-w-7xl mx-auto"
    >
      <header className="mb-10 text-center">
        <h1
          id="gallery-title"
          data-title
          data-reveal
          className="text-5xl font-bold md:text-7xl tracking-tight"
        >
          {["Galeria", "de", "Pinturas"].map((word, index, words) => (
            <span
              key={word}
              className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-top"
            >
              <span data-title-word className="inline-block">
                {word}
              </span>
              {index < words.length - 1 && "\u00a0"}
            </span>
          ))}
        </h1>

        <p
          data-intro
          data-reveal
          className="mt-3 text-lg text-muted-foreground"
        >
          Explore as obras-primas de Van Gogh, contemplando cada traço e
          detalhe.
        </p>
      </header>

      <section
        aria-label="Filtros de pesquisa"
        data-intro
        data-reveal
        className="mb-5 scroll-mt-24"
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,11.5rem))] lg:items-end">
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-1.5">
            <Label htmlFor="search">Buscar pintura</Label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="search"
                type="search"
                placeholder="Nome ou título original..."
                value={filter.searchTerm}
                onChange={(e) => filter.setSearchTerm(e.target.value)}
                className="pl-9 pr-9 pt-2 [&::-webkit-search-cancel-button]:hidden"
                autoComplete="off"
              />
              {filter.searchTerm && (
                <button
                  type="button"
                  onClick={() => filter.setSearchTerm("")}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="period">Período</Label>
            <Select value={filter.period} onValueChange={filter.setPeriod}>
              <SelectTrigger id="period" className="w-full pb-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="font-josefin pb-1">
                  Todos os períodos
                </SelectItem>
                {filter.periodOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.count === 0}
                    hint={option.count}
                    className="font-josefin pb-1"
                  >
                    {shortPeriod(option.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="genre">Gênero</Label>
            <Select value={filter.genre} onValueChange={filter.setGenre}>
              <SelectTrigger id="genre" className="w-full pb-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="font-josefin pb-1">
                  Todos os gêneros
                </SelectItem>
                {filter.genreOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.count === 0}
                    hint={option.count}
                    className="font-josefin pb-1"
                  >
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 lg:col-span-1 flex flex-col gap-1.5">
            <Label htmlFor="sortBy">Ordenar por</Label>
            <Select
              value={`${sort.sortBy}-${sort.order}`}
              onValueChange={(value) => {
                const [sortBy, order] = value.split("-") as [SortBy, SortOrder];
                sort.setSortBy(sortBy);
                sort.setOrder(order);
              }}
            >
              <SelectTrigger id="sortBy" className="w-full pb-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="font-josefin pb-1"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          ref={resultsRef}
          className="mt-4 flex min-h-8 items-center justify-between gap-3 text-sm text-muted-foreground scroll-mt-6"
        >
          <p role="status" aria-live="polite" className="pt-1">
            {pagination.totalItems === 0
              ? "Nenhuma obra encontrada"
              : `Mostrando ${firstItem}–${lastItem} de ${pagination.totalItems} ${
                  pagination.totalItems === 1 ? "obra" : "obras"
                }`}
            {filter.searchTerm.trim() && ` para "${filter.searchTerm.trim()}"`}
          </p>
          {filter.hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={filter.clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <FilterX className="h-4 w-4 mb-0.5" aria-hidden="true" />
              Limpar filtros
            </Button>
          )}
        </div>
      </section>

      {currentItems.length > 0 ? (
        <section aria-labelledby="gallery-title" className="mx-auto">
          <ul
            key={gridKey}
            ref={ui.containerRef}
            aria-busy={filter.isPending}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none"
          >
            {currentItems.map((photo, i) => (
              <li key={photo.id} data-card data-reveal>
                <PaintingCard
                  photo={photo}
                  isActive={ui.activeId === photo.id}
                  onCardClick={ui.handleItemClick}
                  index={i}
                />
              </li>
            ))}
          </ul>

          <footer className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row w-full">
            <div className="hidden sm:flex items-center gap-2">
              <Label htmlFor="rows-per-page">Itens por página</Label>
              <Select
                value={String(pagination.itemsPerPage)}
                onValueChange={(value) =>
                  pagination.setItemsPerPage(Number(value))
                }
              >
                <SelectTrigger id="rows-per-page" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {[6, 12, 18, 24].map((n) => (
                    <SelectItem key={n} value={`${n}`}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <PaintingsPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
            />
          </footer>
        </section>
      ) : (
        <div
          data-card
          data-reveal
          role="region"
          aria-labelledby="empty-section-title"
        >
          <EmptySection
            icon={<Palette aria-hidden="true" className="w-16 h-16" />}
            title="Nenhuma Pintura Encontrada"
            description={`Parece que não há obras que correspondam à sua busca.\nTente ajustar os filtros ou limpar a pesquisa`}
            buttonText="Limpar filtros"
            onClear={filter.clearFilters}
          />
        </div>
      )}
    </main>
  );
}
