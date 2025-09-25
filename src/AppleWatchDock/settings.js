// Calculate responsive dimensions based on window size
export const getResponsiveDimensions = () => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Device dimensions - full viewport
  const deviceWidth = windowWidth;
  const deviceHeight = windowHeight;
  
  // Detect portrait mode (mobile devices typically)
  const isPortrait = windowHeight > windowWidth;
  
  // Scale icon size based on device size with better portrait support
  let baseIconSize, minIconSize;
  
  if (isPortrait) {
    // Portrait mode: make circles much larger and more touch-friendly (2x size)
    baseIconSize = 240; // 2x larger base size for portrait (was 120)
    minIconSize = 200; // 2x higher minimum for touch interaction (was 100)
    // Scale based on width for portrait, but with a more generous multiplier
    const scaleFactor = Math.min(windowWidth / 400, 1.5); // Cap scaling but be more generous
    baseIconSize = baseIconSize * scaleFactor;
  } else {
    // Landscape mode: also increase for better visibility (2x size)
    baseIconSize = 360; // 2x larger (was 180)
    minIconSize = 180; // 2x larger minimum (was 90)
  }
  
  const iconSize = Math.max(baseIconSize * (deviceWidth / 1200), minIconSize);
  const iconMargin = iconSize * 0.08; // Much tighter spacing for honeycomb effect
  
  // Create a large grid for infinite scrolling effect
  const cellWidth = iconSize + iconMargin;
  const cellHeight = iconSize + iconMargin;
  
  // Calculate how many icons fit in viewport (visible area) - adjust for larger circles
  const buffer = isPortrait ? 2 : 3; // Smaller buffer since circles are much larger
  const visibleCols = Math.ceil(deviceWidth / cellWidth) + buffer;
  const visibleRows = Math.ceil(deviceHeight / cellHeight) + buffer;
  
  // Create a grid for infinite scrolling - smaller multiplier since circles are larger
  const multiplier = isPortrait ? 2.5 : 3; // Smaller grid since each circle takes more space
  const totalCols = Math.ceil(visibleCols * multiplier);
  const totalRows = Math.ceil(visibleRows * multiplier);
  
  // Calculate total circles
  const totalCircles = totalRows * totalCols;
  
  return {
    device: {
      width: deviceWidth,
      height: deviceHeight
    },
    icon: {
      size: iconSize,
      margin: iconMargin
    },
    grid: {
      rows: totalRows,
      cols: totalCols,
      visibleRows,
      visibleCols,
      cellWidth,
      cellHeight,
      totalCircles
    }
  };
};

// Default fallback values
export const icon = {
  margin: 12,
  size: 60
};

export const device = {
  width: 800,
  height: 600
};
