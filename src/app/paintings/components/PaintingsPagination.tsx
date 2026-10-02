"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageItem = number | "ellipsis-start" | "ellipsis-end";

/** Compact page list, e.g. 1 … 4 5 6 … 17. */
export function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const start = Math.max(2, Math.min(current - 1, total - 4));
  const end = Math.min(total - 1, Math.max(current + 1, 5));
  const items: PageItem[] = [1];
  if (start > 2) items.push("ellipsis-start");
  for (let page = start; page <= end; page++) items.push(page);
  if (end < total - 1) items.push("ellipsis-end");
  items.push(total);
  return items;
}

interface PaintingsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaintingsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaintingsPaginationProps) {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav
      aria-label="Paginação de pinturas"
      className="flex items-center gap-1.5"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={isFirst}
        aria-label="Primeira página"
        className="hidden sm:inline-flex"
      >
        <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>

      <ol className="hidden sm:flex items-center gap-1.5">
        {getPageItems(currentPage, totalPages).map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Button
                variant={item === currentPage ? "default" : "ghost"}
                size="icon"
                onClick={() => onPageChange(item)}
                aria-label={`Página ${item}`}
                aria-current={item === currentPage ? "page" : undefined}
                className={cn(
                  "tabular-nums pt-0.5",
                  item !== currentPage && "text-muted-foreground",
                )}
              >
                {item}
              </Button>
            </li>
          ) : (
            <li
              key={item}
              aria-hidden="true"
              className="w-6 text-center text-muted-foreground select-none"
            >
              …
            </li>
          ),
        )}
      </ol>

      <span className="sm:hidden px-2 pt-1 text-sm tabular-nums">
        Página {currentPage} de {totalPages}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        aria-label="Próxima página"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={isLast}
        aria-label="Última página"
        className="hidden sm:inline-flex"
      >
        <ChevronsRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
