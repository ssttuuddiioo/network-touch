import * as React from "react";
import { motion, useMotionValue } from "framer-motion";
import { useIconTransform } from "./use-icon-transform";

export function Item({ row, col, planeX, planeY, dimensions }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  const { icon, grid } = dimensions;
  const { cellWidth, cellHeight } = grid;

  // Calculate the origin x and y offsets using proper grid positioning
  // Hexagonal offset for Apple Watch style arrangement
  const xOffset = col * cellWidth + (row % 2) * (cellWidth / 2);
  const yOffset = row * cellHeight;

  // Store color in a ref to prevent re-rendering
  const colorRef = React.useRef(`hsla(${Math.random() * 360}, 95%, 55%, 1)`);

  // Transform the icon's x, y and scale based on the position of the draggable plane
  useIconTransform({ 
    x, 
    y, 
    scale, 
    planeX, 
    planeY, 
    xOffset, 
    yOffset, 
    dimensions 
  });

  return (
    <motion.div
      style={{
        position: "absolute",
        left: xOffset,
        top: yOffset,
        x,
        y,
        scale,
        width: icon.size,
        height: icon.size,
        borderRadius: "50%",
        contain: "strict",
        background: colorRef.current
      }}
    />
  );
}
