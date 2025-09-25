import { useTransform } from "framer-motion";

export function useIconTransform({ planeX, planeY, xOffset, yOffset, dimensions }) {
  const { icon, grid, device } = dimensions;

  // Calculate the distance from the center of the screen
  const distanceFromCenterX = useTransform(planeX, (planeXValue) => {
    const screenCenterX = device.width / 2;
    const iconScreenX = xOffset + planeXValue;
    return iconScreenX - screenCenterX;
  });

  const distanceFromCenterY = useTransform(planeY, (planeYValue) => {
    const screenCenterY = device.height / 2;
    const iconScreenY = yOffset + planeYValue;
    return iconScreenY - screenCenterY;
  });

  // A direct distance calculation would be expensive.
  // By using the separate x and y distances, we can calculate scale and transform
  // with a little more trigonometry but much higher performance.
  const scale = useTransform(
    [distanceFromCenterX, distanceFromCenterY],
    ([dx, dy]) => {
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = Math.sqrt(Math.pow(device.width / 2, 2) + Math.pow(device.height / 2, 2));
      
      // Scale icons down the further they are from the center
      const newScale = 1 - (distance / maxDistance) * 0.7;
      return Math.max(newScale, 0.3); // Minimum scale
    }
  );

  return { scale };
}
