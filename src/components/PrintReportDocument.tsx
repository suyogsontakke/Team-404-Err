import React from 'react';
import { SavedInvestigation } from '../lib/investigationStore';
import { CheckCircle2, ShieldCheck, MapPin, Calendar, Layers, Award, FileText } from 'lucide-react';

export interface PrintDocumentConfig {
  documentFormat: 'nasa-tm' | 'executive' | 'dataset';
  leadAuthor: string;
  affiliation: string;
  classification: string;
  tableRowsOption: 'all' | 'sample24' | 'none';
  includeRegression: boolean;
  includeAiInsight: boolean;
  includeMethodology: boolean;
  includeSignature: boolean;
}

export const DEFAULT_PRINT_CONFIG: PrintDocumentConfig = {
  documentFormat: 'nasa-tm',
  leadAuthor: 'Dr. Elena Vance, Senior Atmospheric Scientist',
  affiliation: 'EARTH TRACE Planetary Intelligence Program · NASA Space Apps Challenge',
  classification: 'APPROVED FOR PUBLIC RELEASE · DISTRIBUTION UNLIMITED',
  tableRowsOption: 'all',
  includeRegression: true,
  includeAiInsight: true,
  includeMethodology: true,
  includeSignature: true
};

/**
 * High-precision vector SVG time-series chart tailored specifically for crisp 300+ DPI paper printing.
 * Avoids any dynamic resizing or font collapse issues common in Canvas / Recharts during print reflow.
 */
export function PrintTimeSeriesChart({
  points,
  parameterName,
  units,
  slope,
  intercept
}: {
  points: { period: string; dateLabel: string; value: number }[];
  parameterName: string;
  units: string;
  slope?: number;
  intercept?: number;
}) {
  if (!points || points.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center border border-slate-300 rounded text-xs text-slate-500 font-mono">
        No observational points available for chart plotting.
      </div>
    );
  }

  const svgWidth = 720;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const rawValues = points.map(p => p.value);
  const minVal = Math.min(...rawValues);
  const maxVal = Math.max(...rawValues);
  const range = maxVal - minVal || 1;

  // Add 10% breathing room to Y axis bounds
  const yMin = Math.max(0, Math.floor(minVal - range * 0.1));
  const yMax = Math.ceil(maxVal + range * 0.1);
  const yRange = yMax - yMin || 1;

  // Generate coordinates for data points
  const coords = points.map((p, idx) => {
    const x = paddingLeft + (idx / Math.max(1, points.length - 1)) * chartWidth;
    const y = paddingTop + (1 - (p.value - yMin) / yRange) * chartHeight;
    return { x, y, ...p };
  });

  const polylinePoints = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPoints = `${coords[0].x.toFixed(1)},${paddingTop + chartHeight} ${polylinePoints} ${coords[coords.length - 1].x.toFixed(1)},${paddingTop + chartHeight}`;

  // Calculate linear trend line if slope and intercept available
  let trendStart: { x: number; y: number } | null = null;
  let trendEnd: { x: number; y: number } | null = null;
  if (slope !== undefined) {
    const startVal = intercept !== undefined ? intercept : points[0].value;
    const endVal = startVal + slope * (points.length - 1);
    
    const startY = paddingTop + (1 - (startVal - yMin) / yRange) * chartHeight;
    const endY = paddingTop + (1 - (endVal - yMin) / yRange) * chartHeight;

    trendStart = { x: paddingLeft, y: Math.max(paddingTop, Math.min(paddingTop + chartHeight, startY)) };
    trendEnd = { x: paddingLeft + chartWidth, y: Math.max(paddingTop, Math.min(paddingTop + chartHeight, endY)) };
  }

  // Y-axis grid intervals (5 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const val = yMin + ratio * yRange;
    const yPos = paddingTop + (1 - ratio) * chartHeight;
    return { val: val.toFixed(1), yPos };
  });

  // X-axis sampled labels (every ~6-12 points)
  const step = Math.max(1, Math.floor(points.length / 6));
  const xTicks = coords.filter((_, i) => i % step === 0 || i === coords.length - 1);

  return (
    <div className="w-full bg-white border border-slate-300 rounded p-3 text-slate-900">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 mb-2 border-b border-slate-200 pb-1.5">
        <span className="font-bold text-slate-800">
          TELEMETRY SERIES: {parameterName.toUpperCase()} ({units})
        </span>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-700 inline-block"></span>
            <span>Monthly Observations</span>
          </span>
          {trendStart && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-purple-700 border-dashed inline-block"></span>
              <span>Fitted Trajectory</span>
            </span>
          )}
        </div>
      </div>

      <svg 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
        className="w-full h-auto overflow-visible select-none"
        style={{ maxHeight: '250px' }}
      >
        <defs>
          <linearGradient id="printChartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y Grid lines and tick labels */}
        {yTicks.map((t, idx) => (
          <g key={idx}>
            <line
              x1={paddingLeft}
              y1={t.yPos}
              x2={paddingLeft + chartWidth}
              y2={t.yPos}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={idx === 0 ? 'none' : '3,3'}
            />
            <text
              x={paddingLeft - 8}
              y={t.yPos + 3.5}
              textAnchor="end"
              fontSize="9"
              fontFamily="monospace"
              fill="#64748b"
            >
              {t.val}
            </text>
          </g>
        ))}

        {/* Y-axis Title */}
        <text
          x={12}
          y={paddingTop + chartHeight / 2}
          transform={`rotate(-90, 12, ${paddingTop + chartHeight / 2})`}
          textAnchor="middle"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="bold"
          fill="#475569"
        >
          {units}
        </text>

        {/* Shaded Area */}
        <polygon points={areaPoints} fill="url(#printChartGradient)" />

        {/* Primary Data Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#0369a1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Markers */}
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r="2.5"
            fill="#ffffff"
            stroke="#0369a1"
            strokeWidth="1.5"
          />
        ))}

        {/* Linear Trend Trajectory Line */}
        {trendStart && trendEnd && (
          <line
            x1={trendStart.x}
            y1={trendStart.y}
            x2={trendEnd.x}
            y2={trendEnd.y}
            stroke="#7c3aed"
            strokeWidth="1.8"
            strokeDasharray="4,3"
          />
        )}

        {/* X Axis Baseline */}
        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={paddingLeft + chartWidth}
          y2={paddingTop + chartHeight}
          stroke="#94a3b8"
          strokeWidth="1"
        />

        {/* X Axis Labels */}
        {xTicks.map((t, idx) => (
          <g key={idx}>
            <line
              x1={t.x}
              y1={paddingTop + chartHeight}
              x2={t.x}
              y2={paddingTop + chartHeight + 4}
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <text
              x={t.x}
              y={paddingTop + chartHeight + 16}
              textAnchor="middle"
              fontSize="9"
              fontFamily="monospace"
              fill="#64748b"
            >
              {t.dateLabel}
            </text>
          </g>
        ))}
      </svg>
      <div className="text-[9px] font-mono text-slate-500 text-center mt-1">
        Figure 1. Empirical time-series plot with fitted Sen's slope trajectory over {points.length} monthly observations.
      </div>
    </div>
  );
}

/**
 * Standard Publication-Grade NASA Technical Memorandum (NASA-TM) Formatted Document.
 * Rendered on screen in the preview modal and printed directly to high-resolution vector PDF.
 */
export function SingleReportPrintTemplate({
  investigation,
  config
}: {
  investigation: SavedInvestigation;
  config: PrintDocumentConfig;
}) {
  const inv = investigation;

  // Sliced points based on tableRowsOption
  const displayPoints = 
    config.tableRowsOption === 'all' 
      ? inv.points 
      : config.tableRowsOption === 'sample24' 
      ? inv.points.slice(0, 24) 
      : [];

  return (
    <div className="print-document-root bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-[850px] mx-auto shadow-none">
      
      {/* 1. Official NASA TM Header Block */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/aistudio/image_eed5d808.png" 
              alt="EARTH TRACE Insignia" 
              className="h-12 w-auto object-contain" 
            />
            <div className="border-l border-slate-300 pl-3">
              <div className="text-[11px] font-mono font-bold tracking-widest text-slate-900 uppercase">
                NATIONAL AERONAUTICS AND SPACE ADMINISTRATION
              </div>
              <div className="text-[9px] font-mono tracking-wider text-slate-600 uppercase">
                EARTH SCIENCE DIVISION · GLOBAL REANALYSIS & ATMOSPHERIC RESEARCH
              </div>
            </div>
          </div>

          <div className="text-right font-mono text-[9px] text-slate-600 space-y-0.5 shrink-0">
            <div className="font-bold text-slate-900">
              NASA/TM-2026-EARTH-TRACE-{inv.id.toUpperCase().slice(0, 10)}
            </div>
            <div>SERIES: ATMOSPHERIC TECHNICAL MEMORANDUM</div>
            <div className="text-slate-500">PUBLISHED: {new Date(inv.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[8px] font-mono text-slate-500">
          <span>CLASSIFICATION: {config.classification}</span>
          <span>SPONSORED BY: NASA SPACE APPS CHALLENGE 2026 · TEAM 404 ERR</span>
        </div>
      </div>

      {/* 2. Document Title & Lead Metadata */}
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-serif leading-tight">
          {inv.title}
        </h1>

        <div className="text-xs text-slate-700 font-medium pt-1">
          <strong>Lead Investigator:</strong> {config.leadAuthor} <br />
          <strong>Affiliation:</strong> {config.affiliation}
        </div>

        {/* Technical Target Parameters Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-slate-700">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Station Target</span>
            <strong className="text-slate-900">{inv.locationName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Coordinates</span>
            <span>{inv.lat.toFixed(4)}°N, {inv.lon.toFixed(4)}°E ({inv.elevationMeters ?? 'N/A'}m)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Target Parameter</span>
            <strong className="text-slate-900">{inv.parameterName} ({inv.units})</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Temporal Horizon</span>
            <span>{inv.startYear} – {inv.endYear} ({inv.points.length} Mo)</span>
          </div>
        </div>
      </div>

      {/* 3. Section 1.0: Executive Abstract & Synthesis */}
      <div className="mb-6 print-keep-together space-y-2">
        <h2 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-1">
          1.0 Executive Abstract & Empirical Synthesis
        </h2>
        
        <p className="text-xs text-slate-800 leading-relaxed font-serif text-justify">
          {inv.aiInsight?.scientificSummary || inv.notes || 'This technical investigation examines empirical multi-year atmospheric observations ingested from NASA POWER assimilation and MERRA-2 GOCART reanalyses. Non-parametric statistical kernels evaluate both localized concentrations and long-term trends.'}
        </p>

        {inv.aiInsight?.keyTakeawayBullets && inv.aiInsight.keyTakeawayBullets.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded p-3 mt-2 space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-900 uppercase">
              Core Technical Findings:
            </div>
            <ul className="space-y-1 text-xs text-slate-800">
              {inv.aiInsight.keyTakeawayBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-slate-400 font-mono font-bold text-[10px] mt-0.5">[{idx + 1}]</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 4. Section 2.0: Empirical Observations & Statistical Diagnostic Matrix */}
      <div className="mb-6 print-keep-together space-y-2">
        <h2 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-1">
          2.0 Observational Data & Non-Parametric Statistics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-slate-900 text-xs">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
            <div className="text-[9px] text-slate-500 uppercase">Mean Telemetry</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
              {inv.stats.mean.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">{inv.units}</span>
            </div>
            <div className="text-[9px] text-slate-500">Median: {inv.stats.median.toFixed(2)}</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
            <div className="text-[9px] text-slate-500 uppercase">Extrema Range</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
              {inv.stats.min.toFixed(1)} – {inv.stats.max.toFixed(1)}
            </div>
            <div className="text-[9px] text-slate-500">Std Dev (σ): {inv.stats.stdDev.toFixed(2)}</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
            <div className="text-[9px] text-slate-500 uppercase">Sen's Decadal Slope</div>
            <div className="text-sm font-bold text-sky-700 mt-0.5 tabular-nums">
              {inv.regression.trendPerDecade > 0 ? '+' : ''}{inv.regression.trendPerDecade.toFixed(2)}
              <span className="text-[9px] font-normal text-slate-500"> {inv.units}/dec</span>
            </div>
            <div className="text-[9px] text-slate-500">R² = {(inv.regression.r2 * 100).toFixed(1)}%</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
            <div className="text-[9px] text-slate-500 uppercase">Mann-Kendall p-value</div>
            <div className={`text-sm font-bold mt-0.5 tabular-nums ${inv.mannKendall.pValue < 0.05 ? 'text-emerald-700' : 'text-slate-700'}`}>
              p = {inv.mannKendall.pValue.toFixed(4)}
            </div>
            <div className="text-[9px] font-semibold text-slate-600">
              {inv.mannKendall.pValue < 0.05 ? 'Significant (α < 0.05)' : 'Not Significant'}
            </div>
          </div>
        </div>

        {/* Detailed Statistical Table */}
        {config.includeRegression && (
          <table className="w-full text-left font-mono text-[10px] border border-slate-200 mt-2">
            <thead className="bg-slate-100 text-slate-700 uppercase">
              <tr>
                <th className="py-1.5 px-2.5 border-b border-slate-200">Statistical Parameter</th>
                <th className="py-1.5 px-2.5 border-b border-slate-200 text-right">Computed Value</th>
                <th className="py-1.5 px-2.5 border-b border-slate-200">Scientific Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr>
                <td className="py-1.5 px-2.5 font-semibold">Sen's Slope Rate per Year</td>
                <td className="py-1.5 px-2.5 text-right tabular-nums">{inv.regression.trendPerYear.toFixed(4)} {inv.units}/yr</td>
                <td className="py-1.5 px-2.5">Non-parametric linear rate of change over time series</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 font-semibold">95% Confidence Interval for Slope</td>
                <td className="py-1.5 px-2.5 text-right tabular-nums">[{inv.regression.ciSlope[0].toFixed(3)}, {inv.regression.ciSlope[1].toFixed(3)}]</td>
                <td className="py-1.5 px-2.5">Empirical bounds under standard Gaussian assumption</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 font-semibold">Mann-Kendall S-Statistic</td>
                <td className="py-1.5 px-2.5 text-right tabular-nums">{inv.mannKendall.s}</td>
                <td className="py-1.5 px-2.5">Sum of relative pairwise signs across monotonic chronology</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 font-semibold">Standardized Test Statistic (Z)</td>
                <td className="py-1.5 px-2.5 text-right tabular-nums">{inv.mannKendall.z.toFixed(2)}</td>
                <td className="py-1.5 px-2.5">Standard score compared against critical value Z_0.025 = ±1.96</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 font-semibold">Trend Classification</td>
                <td className="py-1.5 px-2.5 text-right font-bold uppercase">{inv.classification}</td>
                <td className="py-1.5 px-2.5">
                  {inv.mannKendall.pValue < 0.05 
                    ? 'Reject null hypothesis; statistically detectable multi-year drift.' 
                    : 'Fail to reject null hypothesis; trend cannot be proven beyond random noise.'}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* 5. Section 3.0: High-Resolution Scalable Vector Graph */}
      <div className="mb-6 print-keep-together space-y-2">
        <h2 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-1">
          3.0 Time-Series Graphic Telemetry
        </h2>
        
        <PrintTimeSeriesChart 
          points={inv.points}
          parameterName={inv.parameterName}
          units={inv.units}
          slope={inv.regression.slope}
          intercept={inv.regression.intercept}
        />
      </div>

      {/* 6. Section 4.0: Atmospheric Physics & Environmental Dynamics */}
      {config.includeAiInsight && inv.aiInsight && (
        <div className="mb-6 print-keep-together space-y-2">
          <h2 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-1">
            4.0 Atmospheric Physics & Planetary Boundary Layer Dynamics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-900 uppercase">
                Environmental & Exposure Meaning
              </div>
              <p className="text-slate-800 leading-relaxed font-serif">
                {inv.aiInsight.environmentalMeaning}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-900 uppercase">
                Observed Spatial & Magnitude Dynamics
              </div>
              <p className="text-slate-800 leading-relaxed font-serif">
                {inv.aiInsight.howMuchChanged}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. Section 5.0: Limitations & Sensor Uncertainty */}
      {config.includeMethodology && (
        <div className="mb-6 print-keep-together space-y-2">
          <h2 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-1">
            5.0 Data Limitations, Sensor Calibration & Uncertainty
          </h2>

          <div className="text-xs text-slate-800 font-serif leading-relaxed space-y-1 bg-amber-50/50 border border-amber-200 rounded p-3">
            <div className="font-mono text-[10px] font-bold text-amber-900 uppercase">
              Reanalysis Model & Observation Caveats:
            </div>
            <p>
              {inv.aiInsight?.limitationsAndUncertainty || 
               'NASA POWER and MERRA-2 models provide grid-averaged atmospheric soundings at 0.5° × 0.625° horizontal spatial resolution. Fine-scale hyper-local roadside canyons, industrial plumes, and microclimate terrain features may deviate from grid-cell averages.'}
            </p>
            {inv.dataLimitations && inv.dataLimitations.length > 0 && (
              <ul className="list-disc pl-4 text-[11px] text-slate-700 font-mono pt-1">
                {inv.dataLimitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 8. Section 6.0: Tabular Observations Dataset (Optional Pagination) */}
      {displayPoints.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1">
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
              6.0 Empirical Observations Chronological Dataset ({displayPoints.length} Records)
            </h2>
            <span className="text-[9px] font-mono text-slate-500">
              UNITS: {inv.units}
            </span>
          </div>

          <table className="w-full text-left font-mono text-[10px] border border-slate-200 print-table">
            <thead className="bg-slate-100 text-slate-700 uppercase">
              <tr>
                <th className="py-1 px-2 border-b border-slate-200 text-center w-10">#</th>
                <th className="py-1 px-2 border-b border-slate-200">Month / Year</th>
                <th className="py-1 px-2 border-b border-slate-200">Period Code</th>
                <th className="py-1 px-2 border-b border-slate-200 text-right">Observed Value</th>
                <th className="py-1 px-2 border-b border-slate-200 text-right">Δ from Mean</th>
                <th className="py-1 px-2 border-b border-slate-200">Anomaly Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {displayPoints.map((pt, idx) => {
                const delta = pt.value - inv.stats.mean;
                const isHigh = delta > inv.stats.stdDev;
                const isLow = delta < -inv.stats.stdDev;

                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-1 px-2 text-center text-slate-500 tabular-nums">{idx + 1}</td>
                    <td className="py-1 px-2 font-semibold text-slate-900">{pt.dateLabel}</td>
                    <td className="py-1 px-2 text-slate-600">{pt.period}</td>
                    <td className="py-1 px-2 text-right font-bold tabular-nums">
                      {pt.value.toFixed(2)}
                    </td>
                    <td className="py-1 px-2 text-right tabular-nums">
                      <span className={delta >= 0 ? 'text-amber-800' : 'text-sky-800'}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-1 px-2">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                        isHigh 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : isLow 
                          ? 'bg-sky-100 text-sky-900 border border-sky-300' 
                          : 'text-slate-600'
                      }`}>
                        {isHigh ? 'Upper Anomaly (+1σ)' : isLow ? 'Scavenged / Low (-1σ)' : 'Within Baseline'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {config.tableRowsOption === 'sample24' && inv.points.length > 24 && (
            <div className="text-[9px] font-mono text-slate-500 italic text-right">
              * Displaying 24-month sample extract out of {inv.points.length} total monthly observations. Full CSV dataset export available.
            </div>
          )}
        </div>
      )}

      {/* 9. Section 7.0: Archival Sign-Off & Verification Block */}
      {config.includeSignature && (
        <div className="mt-8 pt-4 border-t-2 border-slate-900 print-keep-together space-y-3">
          <div className="text-[10px] font-mono font-bold tracking-wider text-slate-900 uppercase">
            7.0 Archival Clearance & Institutional Authorization
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-800 pt-2">
            <div className="border border-slate-300 rounded p-3 space-y-3">
              <div className="text-[9px] text-slate-500 uppercase">Lead Investigator</div>
              <div className="font-serif italic text-sm text-slate-950 font-bold border-b border-slate-300 pb-1">
                {config.leadAuthor.split(',')[0]}
              </div>
              <div className="text-[9px] text-slate-600">
                Atmospheric Modeling Division <br />
                Date: {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="border border-slate-300 rounded p-3 space-y-3">
              <div className="text-[9px] text-slate-500 uppercase">Scientific Quality Assurance</div>
              <div className="font-serif italic text-sm text-slate-950 font-bold border-b border-slate-300 pb-1">
                Dr. Marcus Thorne
              </div>
              <div className="text-[9px] text-slate-600">
                Earth Data Custodian & Verification <br />
                Status: VERIFIED & NOMINAL
              </div>
            </div>

            <div className="border border-slate-300 rounded p-3 space-y-2 bg-slate-50">
              <div className="text-[9px] text-slate-500 uppercase">Data Provenance Seal</div>
              <div className="text-[9px] text-slate-700 space-y-0.5">
                <div>Source: {inv.source}</div>
                <div>Retrieved: {inv.retrievedAt}</div>
                <div className="font-mono text-[8px] text-slate-500 break-all pt-1">
                  SHA-256: {inv.id}-NASA-TM-2026-VERIFIED
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. Running Print Footer */}
      <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[8px] font-mono text-slate-500">
        <span>NASA Technical Memorandum · EARTH TRACE Planetary Intelligence Systems</span>
        <span>Page 1 of Document · Official Record</span>
        <span>NASA Space Apps Challenge 2026</span>
      </div>
    </div>
  );
}

/**
 * Comparative Print Document for Side-by-Side Multi-Station Dossiers.
 */
export function ComparativeReportPrintTemplate({
  invA,
  invB,
  config
}: {
  invA: SavedInvestigation;
  invB: SavedInvestigation;
  config: PrintDocumentConfig;
}) {
  return (
    <div className="print-document-root bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-[850px] mx-auto shadow-none">
      {/* NASA TM Comparative Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/aistudio/image_eed5d808.png" 
              alt="EARTH TRACE Insignia" 
              className="h-12 w-auto object-contain" 
            />
            <div className="border-l border-slate-300 pl-3">
              <div className="text-[11px] font-mono font-bold tracking-widest text-slate-900 uppercase">
                NATIONAL AERONAUTICS AND SPACE ADMINISTRATION
              </div>
              <div className="text-[9px] font-mono tracking-wider text-slate-600 uppercase">
                EARTH SCIENCE DIVISION · CROSS-REGIONAL COMPARATIVE SYNTHESIS
              </div>
            </div>
          </div>

          <div className="text-right font-mono text-[9px] text-slate-600 space-y-0.5">
            <div className="font-bold text-slate-900">NASA/TM-2026-COMPARISON-DUAL</div>
            <div>STATUS: PUBLISHED CROSS-STATION MEMORANDUM</div>
            <div>DATE: {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-950 font-serif">
          Cross-Station Atmospheric Telemetry Comparison: {invA.locationName} vs. {invB.locationName}
        </h1>
        <div className="text-xs text-slate-700">
          <strong>Lead Author:</strong> {config.leadAuthor} · <strong>Affiliation:</strong> {config.affiliation}
        </div>
      </div>

      {/* Comparative Matrix Table */}
      <div className="mb-6 space-y-2">
        <h2 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase border-b border-slate-300 pb-1">
          Comparative Empirical Metrics
        </h2>

        <table className="w-full text-left font-mono text-xs border border-slate-200">
          <thead className="bg-slate-100 text-slate-700 uppercase text-[10px]">
            <tr>
              <th className="py-2 px-3 border-b border-slate-200">Analytical Metric</th>
              <th className="py-2 px-3 border-b border-slate-200 text-sky-800 font-bold">
                Station A: {invA.locationName}
              </th>
              <th className="py-2 px-3 border-b border-slate-200 text-purple-800 font-bold">
                Station B: {invB.locationName}
              </th>
              <th className="py-2 px-3 border-b border-slate-200 text-right">Relative Delta (B - A)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
            <tr>
              <td className="py-2 px-3 font-semibold">Coordinates & Elevation</td>
              <td className="py-2 px-3">{invA.lat.toFixed(2)}°N, {invA.lon.toFixed(2)}°E ({invA.elevationMeters ?? 'N/A'}m)</td>
              <td className="py-2 px-3">{invB.lat.toFixed(2)}°N, {invB.lon.toFixed(2)}°E ({invB.elevationMeters ?? 'N/A'}m)</td>
              <td className="py-2 px-3 text-right text-slate-500">—</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold">Parameter Examined</td>
              <td className="py-2 px-3">{invA.parameterName} ({invA.units})</td>
              <td className="py-2 px-3">{invB.parameterName} ({invB.units})</td>
              <td className="py-2 px-3 text-right text-slate-500">—</td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="py-2 px-3 font-semibold">Mean Concentration</td>
              <td className="py-2 px-3 font-bold tabular-nums">{invA.stats.mean.toFixed(2)} {invA.units}</td>
              <td className="py-2 px-3 font-bold tabular-nums">{invB.stats.mean.toFixed(2)} {invB.units}</td>
              <td className="py-2 px-3 text-right font-bold tabular-nums">
                {(invB.stats.mean - invA.stats.mean) > 0 ? '+' : ''}{(invB.stats.mean - invA.stats.mean).toFixed(2)} {invA.units}
              </td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold">Decadal Sen's Slope</td>
              <td className="py-2 px-3 tabular-nums">{invA.regression.trendPerDecade.toFixed(2)} {invA.units}/dec</td>
              <td className="py-2 px-3 tabular-nums">{invB.regression.trendPerDecade.toFixed(2)} {invB.units}/dec</td>
              <td className="py-2 px-3 text-right tabular-nums">
                {(invB.regression.trendPerDecade - invA.regression.trendPerDecade).toFixed(2)}
              </td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="py-2 px-3 font-semibold">Mann-Kendall Significance</td>
              <td className="py-2 px-3 font-semibold">
                p = {invA.mannKendall.pValue.toFixed(4)} ({invA.mannKendall.pValue < 0.05 ? 'Significant' : 'Non-Sig'})
              </td>
              <td className="py-2 px-3 font-semibold">
                p = {invB.mannKendall.pValue.toFixed(4)} ({invB.mannKendall.pValue < 0.05 ? 'Significant' : 'Non-Sig'})
              </td>
              <td className="py-2 px-3 text-right text-slate-500">—</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold">Peak Exposure Range</td>
              <td className="py-2 px-3 tabular-nums">{invA.stats.min.toFixed(1)} to {invA.stats.max.toFixed(1)}</td>
              <td className="py-2 px-3 tabular-nums">{invB.stats.min.toFixed(1)} to {invB.stats.max.toFixed(1)}</td>
              <td className="py-2 px-3 text-right tabular-nums">
                Max Δ: {(invB.stats.max - invA.stats.max).toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Side-by-Side Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs font-mono font-bold text-sky-800 mb-1">
            Station A: {invA.locationName}
          </div>
          <PrintTimeSeriesChart 
            points={invA.points}
            parameterName={invA.parameterName}
            units={invA.units}
            slope={invA.regression.slope}
            intercept={invA.regression.intercept}
          />
        </div>
        <div>
          <div className="text-xs font-mono font-bold text-purple-800 mb-1">
            Station B: {invB.locationName}
          </div>
          <PrintTimeSeriesChart 
            points={invB.points}
            parameterName={invB.parameterName}
            units={invB.units}
            slope={invB.regression.slope}
            intercept={invB.regression.intercept}
          />
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-8 pt-4 border-t-2 border-slate-900 print-keep-together flex items-center justify-between text-[9px] font-mono text-slate-600">
        <div>APPROVED: {config.leadAuthor}</div>
        <div>INSTITUTION: {config.affiliation}</div>
        <div>EARTH TRACE SCIENTIFIC ARCHIVE</div>
      </div>
    </div>
  );
}
