export interface DescriptiveStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  count: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  trendPerYear: number;
  trendPerDecade: number;
  fittedLine: number[];
  ciSlope: [number, number];
}

export interface MannKendallResult {
  s: number;
  varS: number;
  z: number;
  pValue: number;
  trend: 'increasing' | 'decreasing' | 'no trend';
}

export interface TrendAnalysisResult {
  stats: DescriptiveStats;
  regression: RegressionResult;
  mannKendall: MannKendallResult;
  classification: 'significant increasing' | 'significant decreasing' | 'no significant trend' | 'insufficient observations';
}

export function calculateDescriptiveStats(data: number[]): DescriptiveStats {
  const count = data.length;
  if (count === 0) throw new Error("No data");

  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const median = sorted[Math.floor(count / 2)];
  const min = sorted[0];
  const max = sorted[count - 1];
  const stdDev = Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count);

  return { mean, median, min, max, stdDev, count };
}

export function calculateLinearRegression(data: number[]): RegressionResult {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssRes = y.reduce((a, b, i) => a + Math.pow(b - (slope * i + intercept), 2), 0);
  const ssTot = y.reduce((a, b) => a + Math.pow(b - yMean, 2), 0);
  const r2 = 1 - ssRes / ssTot;

  const fittedLine = x.map(i => slope * i + intercept);

  // Simplified CI calculation
  const seSlope = Math.sqrt(ssRes / (n - 2)) / Math.sqrt(sumXX - Math.pow(sumX, 2) / n);
  const ciSlope: [number, number] = [slope - 1.96 * seSlope, slope + 1.96 * seSlope];

  return { slope, intercept, r2, trendPerYear: slope, trendPerDecade: slope * 10, fittedLine, ciSlope };
}

export function calculateMannKendall(data: number[]): MannKendallResult {
  const n = data.length;
  if (n < 3) {
    return { s: 0, varS: 1, z: 0, pValue: 1, trend: 'no trend' };
  }

  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      s += Math.sign(data[j] - data[i]);
    }
  }

  // Calculate tie correction: sum(t * (t - 1) * (2t + 5))
  const counts: Record<number, number> = {};
  for (const val of data) {
    // Round to avoid floating point precision artifacts creating false distinct values
    const rounded = Math.round(val * 1000) / 1000;
    counts[rounded] = (counts[rounded] || 0) + 1;
  }

  let tieCorrection = 0;
  for (const key of Object.keys(counts)) {
    const t = counts[parseFloat(key)];
    if (t > 1) {
      tieCorrection += t * (t - 1) * (2 * t + 5);
    }
  }

  const varS = (n * (n - 1) * (2 * n + 5) - tieCorrection) / 18;
  
  let z = 0;
  if (varS > 0) {
    if (s > 0) z = (s - 1) / Math.sqrt(varS);
    else if (s < 0) z = (s + 1) / Math.sqrt(varS);
  }
  
  // Two-sided p-value (approximation using normal distribution)
  const pValue = Math.min(1, Math.max(0, 2 * (1 - normalCDF(Math.abs(z)))));

  return { 
    s, 
    varS, 
    z, 
    pValue, 
    trend: s > 0 && pValue < 0.05 ? 'increasing' : s < 0 && pValue < 0.05 ? 'decreasing' : 'no trend' 
  };
}

function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function erf(x: number): number {
  // Approximation of error function
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  return sign * (1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
}

export function calculateSenSlope(data: number[], years?: number[]): { senSlope: number; senSlopePerDecade: number } {
  const n = data.length;
  if (n < 2) return { senSlope: 0, senSlopePerDecade: 0 };
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dt = years ? (years[j] - years[i]) : (j - i);
      if (dt !== 0) {
        slopes.push((data[j] - data[i]) / dt);
      }
    }
  }
  if (slopes.length === 0) return { senSlope: 0, senSlopePerDecade: 0 };
  slopes.sort((a, b) => a - b);
  const mid = Math.floor(slopes.length / 2);
  const medianSlope = slopes.length % 2 === 0
    ? (slopes[mid - 1] + slopes[mid]) / 2
    : slopes[mid];
  return {
    senSlope: medianSlope,
    senSlopePerDecade: medianSlope * 10
  };
}

export function calculateLag1Autocorrelation(data: number[]): number {
  const n = data.length;
  if (n < 4) return 0;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const diff = data[i] - mean;
    den += diff * diff;
    if (i < n - 1) {
      num += diff * (data[i + 1] - mean);
    }
  }
  return den !== 0 ? num / den : 0;
}

export interface AnnualPoint {
  year: number;
  value: number;
}

export interface AnnualTrendAnalysisResult {
  stats: DescriptiveStats;
  minYear: number;
  maxYear: number;
  minYearValue: number;
  maxYearValue: number;
  regression: RegressionResult;
  mannKendall: MannKendallResult;
  senSlope: number;
  senSlopePerDecade: number;
  autocorrelationR1: number;
  classification: 'significant increasing' | 'significant decreasing' | 'no significant trend' | 'insufficient observations';
  scientificExplanation: string;
}

export function analyzeAnnualTrend(points: AnnualPoint[]): AnnualTrendAnalysisResult {
  const validPoints = points.filter(p => typeof p.value === 'number' && !isNaN(p.value) && isFinite(p.value) && p.value !== -999);
  validPoints.sort((a, b) => a.year - b.year);

  if (validPoints.length < 5) {
    const emptyStats = { mean: 0, median: 0, min: 0, max: 0, stdDev: 0, count: 0 };
    return {
      stats: emptyStats,
      minYear: 0,
      maxYear: 0,
      minYearValue: 0,
      maxYearValue: 0,
      regression: { slope: 0, intercept: 0, r2: 0, trendPerYear: 0, trendPerDecade: 0, fittedLine: [], ciSlope: [0, 0] },
      mannKendall: { s: 0, varS: 1, z: 0, pValue: 1, trend: 'no trend' },
      senSlope: 0,
      senSlopePerDecade: 0,
      autocorrelationR1: 0,
      classification: 'insufficient observations',
      scientificExplanation: 'Insufficient valid annual observations to compute linear regression and Mann-Kendall statistics.'
    };
  }

  const values = validPoints.map(p => p.value);
  const years = validPoints.map(p => p.year);
  const stats = calculateDescriptiveStats(values);
  
  // Find years corresponding to min and max values
  let minYear = validPoints[0].year;
  let minVal = validPoints[0].value;
  let maxYear = validPoints[0].year;
  let maxVal = validPoints[0].value;

  for (const pt of validPoints) {
    if (pt.value < minVal) {
      minVal = pt.value;
      minYear = pt.year;
    }
    if (pt.value > maxVal) {
      maxVal = pt.value;
      maxYear = pt.year;
    }
  }

  // OLS Linear Regression over year steps
  const reg = calculateLinearRegression(values);
  const mannKendall = calculateMannKendall(values);
  const { senSlope, senSlopePerDecade } = calculateSenSlope(values, years);
  const r1 = calculateLag1Autocorrelation(values);

  const regression: RegressionResult = {
    ...reg,
    trendPerYear: reg.slope,
    trendPerDecade: reg.slope * 10,
    ciSlope: [reg.ciSlope[0], reg.ciSlope[1]]
  };

  let classification: AnnualTrendAnalysisResult['classification'] = 'no significant trend';
  if (mannKendall.pValue < 0.05) {
    classification = mannKendall.z > 0 ? 'significant increasing' : 'significant decreasing';
  }

  // Generate scientific explanation strictly adhering to statistical findings (no invented causation)
  const isSignificant = mannKendall.pValue < 0.05;
  const slopeDir = reg.trendPerDecade > 0 ? 'warming' : 'cooling';
  const slopeAbs = Math.abs(reg.trendPerDecade).toFixed(3);
  const senAbs = Math.abs(senSlopePerDecade).toFixed(3);

  let explanation = '';
  if (isSignificant) {
    explanation = `Over the ${validPoints[0].year}–${validPoints[validPoints.length - 1].year} analysis window, the empirical time-series demonstrates a statistically significant monotonic ${classification.includes('increasing') ? 'increasing' : 'decreasing'} trend (Mann-Kendall S = ${mannKendall.s}, Z = ${mannKendall.z.toFixed(2)}, p = ${mannKendall.pValue.toFixed(4)} < 0.05). Ordinary least squares linear regression yields an annual trajectory of ${reg.slope > 0 ? '+' : ''}${reg.slope.toFixed(3)} °C/year (${reg.trendPerDecade > 0 ? '+' : ''}${reg.trendPerDecade.toFixed(2)} °C/decade, R² = ${reg.r2.toFixed(3)}), with a non-parametric Sen's slope estimator of ${senSlope > 0 ? '+' : ''}${senSlope.toFixed(3)} °C/year (${senSlopePerDecade > 0 ? '+' : ''}${senSlopePerDecade.toFixed(2)} °C/decade). Note: Serial lag-1 autocorrelation is measured at r₁ = ${r1.toFixed(2)}; while standard Mann-Kendall variance does not independently adjust for persistence, the empirical trajectory remains statistically discernible under the α = 0.05 threshold.`;
  } else {
    explanation = `Over the ${validPoints[0].year}–${validPoints[validPoints.length - 1].year} monitoring period, the Mann-Kendall test yields p = ${mannKendall.pValue.toFixed(4)}, which exceeds the critical threshold of α = 0.05 (Z = ${mannKendall.z.toFixed(2)}). Consequently, the observed nominal decadal slope of ${reg.trendPerDecade > 0 ? '+' : ''}${reg.trendPerDecade.toFixed(2)} °C/decade cannot be confirmed as a statistically significant monotonic shift, and remains within the bounds of interannual meteorological variability. Lag-1 serial autocorrelation is r₁ = ${r1.toFixed(2)}.`;
  }

  return {
    stats,
    minYear,
    maxYear,
    minYearValue: minVal,
    maxYearValue: maxVal,
    regression,
    mannKendall,
    senSlope,
    senSlopePerDecade,
    autocorrelationR1: r1,
    classification,
    scientificExplanation: explanation
  };
}

export function analyzeTrend(data: number[], stepsPerYear: number = 12): TrendAnalysisResult {
    // Filter any remaining non-finite or fill values
    const cleanData = data.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v) && v !== -999);

    if (cleanData.length < 5) {
        return {
            stats: cleanData.length > 0 ? calculateDescriptiveStats(cleanData) : { mean: 0, median: 0, min: 0, max: 0, stdDev: 0, count: 0 },
            regression: { slope: 0, intercept: 0, r2: 0, trendPerYear: 0, trendPerDecade: 0, fittedLine: [], ciSlope: [0, 0] },
            mannKendall: { s: 0, varS: 1, z: 0, pValue: 1, trend: 'no trend' },
            classification: 'insufficient observations'
        };
    }

    const stats = calculateDescriptiveStats(cleanData);
    const reg = calculateLinearRegression(cleanData);
    const mannKendall = calculateMannKendall(cleanData);
    
    // Annualize the slope: slope is change per data-step
    const trendPerYear = reg.slope * stepsPerYear;
    const trendPerDecade = trendPerYear * 10;
    const regression: RegressionResult = {
      ...reg,
      trendPerYear,
      trendPerDecade,
      ciSlope: [reg.ciSlope[0] * stepsPerYear, reg.ciSlope[1] * stepsPerYear]
    };

    let classification: TrendAnalysisResult['classification'] = 'no significant trend';
    if (mannKendall.pValue < 0.05) {
        classification = mannKendall.z > 0 ? 'significant increasing' : 'significant decreasing';
    }
    
    return { stats, regression, mannKendall, classification };
}

export interface ComparisonMetrics {
  deltaMean: number;
  deltaMin: number;
  deltaMax: number;
  relativeMeanDiffPct: number | null; // only valid for ratio scales (non-zero reference)
  deltaSlopePerYear: number;
  deltaR2: number;
  fasterWarmingLocation: 'A' | 'B' | 'Tie';
  higherVariabilityLocation: 'A' | 'B' | 'Tie';
}

export function compareSeries(
  statsA: DescriptiveStats,
  regA: RegressionResult,
  statsB: DescriptiveStats,
  regB: RegressionResult,
  isRatioScale: boolean = false
): ComparisonMetrics {
  const deltaMean = statsA.mean - statsB.mean;
  const deltaMin = statsA.min - statsB.min;
  const deltaMax = statsA.max - statsB.max;

  // Percentage difference is mathematically meaningful only on ratio scales with natural zero (e.g., rainfall, humidity)
  // Not on interval scales like Celsius where zero is arbitrary
  let relativeMeanDiffPct: number | null = null;
  if (isRatioScale && Math.abs(statsB.mean) > 1e-4) {
    relativeMeanDiffPct = ((statsA.mean - statsB.mean) / Math.abs(statsB.mean)) * 100;
  }

  const deltaSlopePerYear = regA.trendPerYear - regB.trendPerYear;
  const deltaR2 = regA.r2 - regB.r2;

  const fasterWarmingLocation = Math.abs(deltaSlopePerYear) < 1e-5 ? 'Tie' : regA.trendPerYear > regB.trendPerYear ? 'A' : 'B';
  const higherVariabilityLocation = Math.abs(statsA.stdDev - statsB.stdDev) < 1e-4 ? 'Tie' : statsA.stdDev > statsB.stdDev ? 'A' : 'B';

  return {
    deltaMean,
    deltaMin,
    deltaMax,
    relativeMeanDiffPct,
    deltaSlopePerYear,
    deltaR2,
    fasterWarmingLocation,
    higherVariabilityLocation
  };
}
