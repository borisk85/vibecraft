"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { heroFadeIn } from "@/lib/animations";

/** Плавное появление при загрузке (как текст в Hero главной) —
 *  маскирует подмену шрифта, в отличие от whileInView не зависит от скролла. */
export function MotionFadeIn({
  children,
  delay = 0,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      variants={heroFadeIn}
      initial="hidden"
      animate="visible"
      custom={delay}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
