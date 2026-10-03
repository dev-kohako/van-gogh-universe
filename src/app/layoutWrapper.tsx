"use client";

import { AppSidebar } from "@/components/AppSidebar";
import { GalleryBackdrop } from "@/components/GalleryBackdrop";
import { PageTransition } from "@/components/PageTransition";
import { Toaster } from "@/components/ui/sonner";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition>
      <div className="flex">
        <GalleryBackdrop />
        <AppSidebar />
        {/* Bottom padding keeps content clear of the mobile dock. */}
        <main className="flex-1 flex justify-center items-center w-full min-w-0 pb-24 md:pb-0 font-josefin">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </PageTransition>
  );
}
