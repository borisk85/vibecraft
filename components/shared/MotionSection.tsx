"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { sectionReveal } from "@/lib/animations";

export function MotionSection({
  children,
  ...rest
}: HTMLMotionProps<"section">) {
  return (
    <motion.section
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      {...rest}
    >
      {children}
    </motion.section>
  );
}
