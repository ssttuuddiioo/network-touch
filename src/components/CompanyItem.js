import React from "react";
import { motion } from "framer-motion";
import { useIconTransform } from "../AppleWatchDock/use-icon-transform";
import CompanyImage from "./CompanyImage";

export function CompanyItem({ row, col, company, planeX, planeY, dimensions, onClick, layoutId }) {
  const { icon, grid } = dimensions;
  const { cellWidth, cellHeight } = grid;

  const xOffset = col * cellWidth + (row % 2) * (cellWidth * 0.5);
  const yOffset = row * cellHeight * 0.75;

  const { scale } = useIconTransform({ 
    planeX, 
    planeY, 
    xOffset, 
    yOffset, 
    dimensions 
  });

  return (
    <motion.button
      layoutId={layoutId}
      onClick={onClick}
      style={{
        position: "absolute",
        left: xOffset,
        top: yOffset,
        scale,
        width: icon.size,
        height: icon.size,
        borderRadius: "50%",
        border: "1px solid var(--border)",
        cursor: "pointer",
        contain: "strict",
        background: "var(--bg-card)",
        boxShadow: "0 8px 24px var(--shadow)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0
      }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }}
    >
      <CompanyImage 
        company={company}
        imageType="logo"
        style={{
            width: "80%",
            height: "80%",
            objectFit: "contain",
            borderRadius: "50%"
        }}
      />
    </motion.button>
  );
}
