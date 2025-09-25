import * as React from "react";
import { motion, useMotionValue } from "framer-motion";
import { Item } from "./Item";
import { getResponsiveDimensions } from "./settings";

export function AppleWatchDock() {
  const [dimensions, setDimensions] = React.useState(() => getResponsiveDimensions());

  // Update dimensions on window resize
  React.useEffect(() => {
    const handleResize = () => {
      setDimensions(getResponsiveDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create large grid for infinite scrolling effect
  const grid = React.useMemo(() => {
    const { rows, cols } = dimensions.grid;
    const gridItems = [];
    
    // Create a proper grid without overlapping
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        gridItems.push({ 
          row: rowIndex, 
          col: colIndex, 
          id: `${rowIndex}-${colIndex}` 
        });
      }
    }
    
    return gridItems;
  }, [dimensions.grid]);

  // Calculate initial position to minimize borders and fill screen
  const { device, grid: gridDims } = dimensions;
  const { cellWidth, cellHeight, cols, rows } = gridDims;
  
  // Center the grid in the viewport with minimal border
  const gridWidth = cols * cellWidth;
  const gridHeight = rows * cellHeight;
  
  // Position to minimize white space - start closer to edges
  const initialX = -(gridWidth - device.width) / 2 + cellWidth;
  const initialY = -(gridHeight - device.height) / 2 + cellHeight;

  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);

  // Calculate drag constraints to minimize borders
  const dragConstraints = {
    left: -(gridWidth - device.width + cellWidth),
    right: cellWidth,
    top: -(gridHeight - device.height + cellHeight), 
    bottom: cellHeight
  };

  // Update motion values when dimensions change
  React.useEffect(() => {
    x.set(initialX);
    y.set(initialY);
  }, [dimensions, x, y, initialX, initialY]);

  // Log total circles for debugging
  React.useEffect(() => {
    console.log(`Grid: ${gridDims.rows} rows × ${gridDims.cols} cols = ${gridDims.totalCircles} total circles`);
    console.log(`Grid size: ${gridWidth}px × ${gridHeight}px`);
    console.log(`Cell size: ${cellWidth}px × ${cellHeight}px`);
  }, [dimensions, gridDims, gridWidth, gridHeight, cellWidth, cellHeight]);

  return (
    <div className="device" style={device}>
      <motion.div
        drag
        dragConstraints={dragConstraints}
        style={{
          width: gridWidth,
          height: gridHeight,
          x,
          y,
          background: "transparent"
        }}
      >
        {grid.map((item) => (
          <Item 
            key={item.id}
            row={item.row} 
            col={item.col} 
            planeX={x} 
            planeY={y}
            dimensions={dimensions}
          />
        ))}
      </motion.div>
    </div>
  );
}
