"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cardStagger } from "@/lib/animations";

export function MotionStagger({
  children,
  ...rest
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={cardStagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
