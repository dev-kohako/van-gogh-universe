"use client";

import { motion } from "framer-motion";
import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePageTransition } from "@/components/PageTransition";
import { Button } from "./button";

type Variant =
  | "link"
  | "outline"
  | "default"
  | "destructive"
  | "secondary"
  | "ghost";

interface BackButtonProps {
  title?: string;
  icon?: React.ReactNode;
  redirect?: string;
  buttonVariant?: Variant;
}

export function BackButton({
  title = "Voltar",
  icon,
  redirect,
  buttonVariant = "ghost",
}: BackButtonProps) {
  const router = useRouter();
  const { navigate } = usePageTransition();

  const handleClick = () => {
    if (redirect) {
      navigate(redirect);
    } else {
      router.back();
    }
  };

  return (
    <motion.div
      whileHover={{ x: 12, transition: { duration: 0.2 } }}
      className="w-fit"
    >
      <Button
        onClick={handleClick}
        variant={buttonVariant}
        className="flex items-center gap-1 p-2 pt-3 -ml-2"
      >
        {icon || <Undo2 className="w-5 h-5 mb-1.5" aria-hidden="true" />}
        <span className="text-lg">{title}</span>
      </Button>
    </motion.div>
  );
}
