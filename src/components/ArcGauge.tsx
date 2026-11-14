/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ArcGaugeProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  sublabel?: string;
  unit?: string;
  color?: string;
  size?: number;
  thresholds?: { value: number; color: string; label: string }[];
}

export default function ArcGauge({
  value,
  min = 0,
  max = 100,
  label,
  sublabel,
  unit = '',
  color = '#A6B7D4',
  size = 110,
  thresholds
}: ArcGaugeProps) {
  const strokeWidth = 5.5;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;

  // 240 degree arc (from 135 deg to 405 deg)
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;

  const clampedVal = Math.min(Math.max(value, min), max);
  const percentage = (clampedVal - min) / (max - min);
  const currentAngle = startAngle + percentage * totalAngle;

  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(cx, cy, r, endA);
    const end = polarToCartesian(cx, cy, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  // Determine active threshold color if provided
  let activeColor = color;
  if (thresholds && thresholds.length > 0) {
    for (const t of thresholds) {
      if (clampedVal >= t.value) {
        activeColor = t.color;
      }
    }
  }

  const bgPath = describeArc(center, center, radius, startAngle, endAngle);
  const valuePath = describeArc(center, center, radius, startAngle, currentAngle);

  return (
    <div className="flex flex-col items-center justify-center relative select-none font-sans" style={{ width: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Track Background */}
        <path
          d={bgPath}
          fill="none"
          stroke="#2D354A"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value Arc */}
        {percentage > 0.01 && (
          <path
            d={valuePath}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        )}

        {/* Tick points at min and max */}
        <circle
          cx={polarToCartesian(center, center, radius, startAngle).x}
          cy={polarToCartesian(center, center, radius, startAngle).y}
          r={1.8}
          fill="#838FA3"
        />
        <circle
          cx={polarToCartesian(center, center, radius, endAngle).x}
          cy={polarToCartesian(center, center, radius, endAngle).y}
          r={1.8}
          fill="#838FA3"
        />
      </svg>

      {/* Center Numeric Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-0.5">
        <div className="flex items-baseline">
          <span className="text-lg font-bold font-mono tracking-tight text-[#F0EBDD] tabular-nums">
            {typeof value === 'number' && Number.isFinite(value) ? (value % 1 === 0 ? value : value.toFixed(1)) : '--'}
          </span>
          {unit && <span className="text-[9px] font-mono text-[#B5BDCC] ml-0.5">{unit}</span>}
        </div>
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#B5BDCC]">
          {label}
        </span>
        {sublabel && (
          <span className="text-[8px] text-[#838FA3] truncate max-w-[85px] text-center">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
