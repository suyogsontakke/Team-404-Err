import React from 'react';

interface ArcGaugeProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  sublabel?: string;
  unit?: string;
  color?: string; // hex or tailwind stroke
  size?: number; // width/height in px
  thresholds?: { value: number; color: string; label: string }[];
}

export default function ArcGauge({
  value,
  min = 0,
  max = 100,
  label,
  sublabel,
  unit = '',
  color = '#22D3EE',
  size = 110,
  thresholds
}: ArcGaugeProps) {
  const strokeWidth = 7;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;

  // 240 degree arc (from 150 deg to 390 deg)
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
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Glow Filter */}
        <defs>
          <filter id={`glow-${label}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track Background */}
        <path
          d={bgPath}
          fill="none"
          stroke="#152238"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value Arc with Glow */}
        {percentage > 0.01 && (
          <path
            d={valuePath}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter={`url(#glow-${label})`}
            className="transition-all duration-700 ease-out"
          />
        )}

        {/* Tick points at min and max */}
        <circle
          cx={polarToCartesian(center, center, radius, startAngle).x}
          cy={polarToCartesian(center, center, radius, startAngle).y}
          r={2}
          fill="#475569"
        />
        <circle
          cx={polarToCartesian(center, center, radius, endAngle).x}
          cy={polarToCartesian(center, center, radius, endAngle).y}
          r={2}
          fill="#475569"
        />
      </svg>

      {/* Center Numeric Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
        <div className="flex items-baseline">
          <span className="text-xl font-black font-mono tracking-tight text-white tabular-nums drop-shadow">
            {typeof value === 'number' && Number.isFinite(value) ? (value % 1 === 0 ? value : value.toFixed(1)) : '--'}
          </span>
          {unit && <span className="text-[10px] font-sans text-slate-400 ml-0.5">{unit}</span>}
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 -mt-0.5">
          {label}
        </span>
        {sublabel && (
          <span className="text-[9px] font-sans text-cyan-400 truncate max-w-[85px] text-center">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
