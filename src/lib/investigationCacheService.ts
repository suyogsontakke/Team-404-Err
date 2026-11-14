/**
 * Investigation Cache & Storage Service
 * Memoized memory + localStorage cache for recurring NASA location investigations.
 */

import { LocationDataResult, fetchNasaLocationData, NasaDailyAnnualInvestigationResult, fetchNasaDailyAnnualT2M } from './nasaPowerService';
import { analyzeAnnualTrend, AnnualTrendAnalysisResult, analyzeTrend, TrendAnalysisResult } from './statistics';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = 'earthscope_cache_v1_';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours TTL

// In-Memory Cache Map
const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Generate a deterministic cache key for a location investigation
 */
export function getInvestigationCacheKey(
  lat: number,
  lon: number,
  startYear: number,
  endYear: number,
  paramKey: string = 'T2M'
): string {
  const roundedLat = lat.toFixed(4);
  const roundedLon = lon.toFixed(4);
  return `${CACHE_PREFIX}${roundedLat}_${roundedLon}_${startYear}_${endYear}_${paramKey}`;
}

/**
 * Retrieve cached investigation result if valid
 */
export function getCachedInvestigation<T>(key: string): T | null {
  // 1. Check in-memory cache first
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key)!;
    if (Date.now() - entry.timestamp < DEFAULT_TTL_MS) {
      return entry.data;
    } else {
      memoryCache.delete(key);
    }
  }

  // 2. Check localStorage
  try {
    const storedStr = localStorage.getItem(key);
    if (storedStr) {
      const entry: CacheEntry<T> = JSON.parse(storedStr);
      if (Date.now() - entry.timestamp < DEFAULT_TTL_MS) {
        // Populate memory cache for rapid re-reads
        memoryCache.set(key, entry);
        return entry.data;
      } else {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('Cache read error:', err);
  }

  return null;
}

/**
 * Store an investigation result in memory & localStorage
 */
export function setCachedInvestigation<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now()
  };

  memoryCache.set(key, entry);

  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    console.warn('Cache write error:', err);
  }
}

/**
 * Clear investigation cache
 */
export function clearInvestigationCache(key?: string): void {
  if (key) {
    memoryCache.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('Cache clear error:', err);
    }
  } else {
    memoryCache.clear();
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    } catch (err) {
      console.warn('Cache purge error:', err);
    }
  }
}

/**
 * High-Level Cached Fetch for Daily Annual T2M Trend Detective Case Studies
 */
export async function fetchCachedDailyAnnualT2M(
  lat: number,
  lon: number,
  startYear: number,
  endYear: number,
  locationName: string = 'Custom Station',
  forceRefresh: boolean = false
): Promise<{ investigationData: NasaDailyAnnualInvestigationResult; analysis: AnnualTrendAnalysisResult; isCached: boolean }> {
  const cacheKey = getInvestigationCacheKey(lat, lon, startYear, endYear, 'DAILY_T2M_ANNUAL');

  if (!forceRefresh) {
    const cached = getCachedInvestigation<{ investigationData: NasaDailyAnnualInvestigationResult; analysis: AnnualTrendAnalysisResult }>(cacheKey);
    if (cached) {
      return { ...cached, isCached: true };
    }
  }

  // Fetch fresh data
  const rawResult = await fetchNasaDailyAnnualT2M(lat, lon, startYear, endYear, locationName);
  
  // Calculate Mann-Kendall and OLS trend analysis
  const annualPointsForStats = rawResult.annualPoints.map(p => ({
    year: p.year,
    value: p.avgTemp
  }));
  const trendAnalysis = analyzeAnnualTrend(annualPointsForStats);

  const result = {
    investigationData: rawResult,
    analysis: trendAnalysis
  };

  setCachedInvestigation(cacheKey, result);

  return { ...result, isCached: false };
}

/**
 * High-Level Cached Fetch for Monthly Location Data (Location Comparison & General Investigations)
 */
export async function fetchCachedLocationData(
  lat: number,
  lon: number,
  startYear: number,
  endYear: number,
  paramKey: string = 'PM25',
  locationName: string = 'Selected Location',
  forceRefresh: boolean = false
): Promise<{ data: LocationDataResult; analysis: TrendAnalysisResult; isCached: boolean }> {
  const cacheKey = getInvestigationCacheKey(lat, lon, startYear, endYear, paramKey);

  if (!forceRefresh) {
    const cached = getCachedInvestigation<{ data: LocationDataResult; analysis: TrendAnalysisResult }>(cacheKey);
    if (cached) {
      return { ...cached, isCached: true };
    }
  }

  const data = await fetchNasaLocationData(lat, lon, startYear, endYear, paramKey, locationName);
  const rawValues = data.points.map(p => p.value);
  const analysis = analyzeTrend(rawValues, 12);

  const result = { data, analysis };
  setCachedInvestigation(cacheKey, result);

  return { ...result, isCached: false };
}
