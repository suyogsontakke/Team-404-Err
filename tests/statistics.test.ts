import { calculateDescriptiveStats, calculateLinearRegression, calculateMannKendall } from '../src/lib/statistics.ts';

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
    console.log("PASS:", message);
}

// Simple test for descriptive stats
const data1 = [1, 2, 3, 4, 5];
const stats1 = calculateDescriptiveStats(data1);
assert(stats1.mean === 3, "Mean should be 3");
assert(stats1.max === 5, "Max should be 5");

// Simple test for regression
const reg1 = calculateLinearRegression(data1);
assert(Math.abs(reg1.slope - 1) < 0.001, "Slope should be 1");

// Test for Mann-Kendall with ties
const tiedData = [1, 2, 2, 3, 4, 4, 5, 6, 6, 7];
const mkTied = calculateMannKendall(tiedData);
assert(mkTied.pValue <= 0.05, "Tied data with steady increase should be statistically significant");

// Test for series comparison
import { compareSeries } from '../src/lib/statistics.ts';
const statsA = { mean: 28.5, median: 28, min: 18, max: 42, stdDev: 5.2, count: 60 };
const regA = { slope: 0.02, intercept: 27, r2: 0.45, trendPerYear: 0.24, trendPerDecade: 2.4, fittedLine: [], ciSlope: [0.1, 0.3] as [number, number] };
const statsB = { mean: 27.1, median: 27, min: 20, max: 35, stdDev: 3.1, count: 60 };
const regB = { slope: 0.01, intercept: 26.5, r2: 0.30, trendPerYear: 0.12, trendPerDecade: 1.2, fittedLine: [], ciSlope: [0.05, 0.19] as [number, number] };

const comp = compareSeries(statsA, regA, statsB, regB, false);
assert(Math.abs(comp.deltaMean - 1.4) < 1e-4, "Delta mean should be 1.4");
assert(comp.fasterWarmingLocation === 'A', "Location A warms faster");
assert(comp.relativeMeanDiffPct === null, "Ratio scale percentage diff should be null for interval scale (Celsius)");

const compRatio = compareSeries(statsA, regA, statsB, regB, true);
assert(compRatio.relativeMeanDiffPct !== null && compRatio.relativeMeanDiffPct > 0, "Ratio scale percentage diff should be calculated");

// Test Sen slope and annual trend
import { calculateSenSlope, calculateLag1Autocorrelation, analyzeAnnualTrend } from '../src/lib/statistics.ts';
const senRes = calculateSenSlope([20, 21, 22, 23, 24]);
assert(Math.abs(senRes.senSlope - 1.0) < 1e-4, "Sen slope should be 1.0");
assert(Math.abs(senRes.senSlopePerDecade - 10.0) < 1e-4, "Sen slope per decade should be 10.0");

const annualPts = [
  { year: 2001, value: 26.5 },
  { year: 2002, value: 26.8 },
  { year: 2003, value: 26.7 },
  { year: 2004, value: 27.0 },
  { year: 2005, value: 27.2 },
  { year: 2006, value: 27.5 },
  { year: 2007, value: 27.4 },
  { year: 2008, value: 27.8 }
];
const annualRes = analyzeAnnualTrend(annualPts);
assert(annualRes.stats.count === 8, "Annual trend count should be 8");
assert(annualRes.regression.trendPerDecade > 0, "Trend per decade should be positive");
assert(annualRes.classification === 'significant increasing', "Annual trend should be significant increasing");

console.log("All comprehensive tests passed!");


