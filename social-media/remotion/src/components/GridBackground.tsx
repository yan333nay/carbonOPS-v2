import React from 'react';

interface GridBackgroundProps {
  width: number;
  height: number;
  gridSize?: number;
  gridColor?: string;
  gridOpacity?: number;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  width,
  height,
  gridSize = 40,
  gridColor = '#1A1A1A',
  gridOpacity = 0.4,
}) => {
  const cols = Math.ceil(width / gridSize) + 1;
  const rows = Math.ceil(height / gridSize) + 1;

  return (
    <svg
      style={{ position: 'absolute', inset: 0 }}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vertical lines */}
      {Array.from({ length: cols }, (_, i) => (
        <line
          key={`v-${i}`}
          x1={i * gridSize}
          y1={0}
          x2={i * gridSize}
          y2={height}
          stroke={gridColor}
          strokeWidth={1}
          opacity={gridOpacity}
        />
      ))}
      {/* Horizontal lines */}
      {Array.from({ length: rows }, (_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * gridSize}
          x2={width}
          y2={i * gridSize}
          stroke={gridColor}
          strokeWidth={1}
          opacity={gridOpacity}
        />
      ))}
    </svg>
  );
};
