import React from 'react';

export interface UnifyLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  size?: number;
  color?: string;
}

export const UnifyLogo: React.FC<UnifyLogoProps> = ({
  className,
  width,
  height,
  size,
  color = '#FAFAFA'
}) => {
  const finalWidth = width ?? (size ? size * 1.6 : 46);
  const finalHeight = height ?? (size ? size * 0.8 : 23);

  return (
    <svg
      width={finalWidth}
      height={finalHeight}
      viewBox="0 0 120 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <g fill={color}>
        {/* 5 Horizontal Lines merging into Arrow */}
        {/* Line 1 (Top) */}
        <path d="M 0 6 H 32 C 37 6 41 8 44 12 L 53 23 H 62 L 49 8 C 45 3 40 1 34 1 H 0 V 6 Z" />

        {/* Line 2 */}
        <path d="M 0 18 H 32 C 36 18 39 19 41 22 L 48 30 H 57 L 46 16 C 42 12 37 11 32 11 H 0 V 18 Z" />

        {/* Line 3 (Middle) */}
        <path d="M 0 30 H 35 L 43 30 H 52 L 43 23 H 0 V 30 Z" />

        {/* Line 4 */}
        <path d="M 0 42 H 32 C 37 42 41 40 44 36 L 53 27 H 45 L 39 33 C 37 35 34 36 31 36 H 0 V 42 Z" />

        {/* Line 5 (Bottom) */}
        <path d="M 0 54 H 32 C 38 54 43 51 47 46 L 57 34 H 49 L 42 43 C 39 46 35 48 30 48 H 0 V 54 Z" />

        {/* Main Arrow Stem & Arrow Head */}
        <path d="M 44 48 L 72 16 H 58 V 5 H 85 V 32 H 74 V 18 L 47 50 Z" />
      </g>
    </svg>
  );
};

export default UnifyLogo;
