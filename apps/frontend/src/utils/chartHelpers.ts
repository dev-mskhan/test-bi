export const colorPalette = {
  blue: "#6366f1",
  green: "#22c55e",
  red: "#ef4444",
  orange: "#f97316",
  purple: "#a855f7",
};

export const multiColors = ["#6366f1", "#22c55e", "#f97316", "#a855f7", "#3b82f6", "#ec4899"];

export const getColorForScheme = (scheme?: string, index: number = 0): string => {
  if (!scheme) return colorPalette.blue;
  if (scheme === "multi") {
    return multiColors[index % multiColors.length];
  }
  return colorPalette[scheme as keyof typeof colorPalette] || colorPalette.blue;
};

export const getColorsList = (scheme?: string): string[] => {
  if (scheme === "multi") return multiColors;
  const col = colorPalette[scheme as keyof typeof colorPalette] || colorPalette.blue;
  return [col];
};
