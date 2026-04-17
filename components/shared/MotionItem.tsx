"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cardItem } from "@/lib/animations";

type MotionItemProps = HTMLMotionProps<"div"> & {
  interactive?: boolean;
};

export function MotionItem({
  children,
  interactive = false,
  ...rest
}: MotionItemProps) {
  return (
    <motion.div
      variants={cardItem}
      whileHover={
        interactive
          ? { scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }
          : undefined
      }
      {...rest}
    >
      {children}
    </motion.div>
  );
}
