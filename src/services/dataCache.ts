/**
 * NASA POWER Investigation Data Cache Service
 * Memoized storage using an in-memory Map object backed by localStorage for caching 
 * NASA POWER API location & time-range investigations.
 */

import { 
  LocationDataResult, 
  fetchNasaLocationData, 
  NasaDailyAnnualInvestigationResult, 
  fetchNasaDailyAnnualT2M 
} from '../lib/nasaPowerService';
import { 
  analyzeAnnualTrend, 
  AnnualTrendAnalysisResult, 
  analyzeTrend, 
  TrendAnalysisResult 
} from '../lib/statistics';

export interface CacheRecord<T> {
  data: T;
  timestamp: number;
}

class DataCacheService {
  private cacheMap = new Map<string, CacheRecord<any>>();
  private defaultTtlMs = 24 * 60 * 60 * 1000; // 24 Hours TTL

  /**
   * Deterministic cache key generator based on location coordinates, year range & parameter
   */
  public generateKey(lat: number, lon: number, startYear: number, endYear: number, paramKey: string = 'T2M'): string {
    const roundedLat = Number(lat).toFixed(4);
    const roundedLon = Number(lon).toFixed(4);
    return `earthscope_data_cache_${roundedLat}_${roundedLon}_${startYear}_${endYear}_${paramKey}`;
  }

  /**
   * Get cached result if valid
   */
  public get<T>(key: string): T | null {
    // 1. Check in-memory Map first
    if (this.cacheMap.has(key)) {
      const record = this.cacheMap.get(key)!;
      if (Date.now() - record.timestamp < this.defaultTtlMs) {
        return record.data;
      } else {
        this.cacheMap.delete(key);
      }
    }

    // 2. Check localStorage fallback
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const record: CacheRecord<T> = JSON.parse(stored);
        if (Date.now() - record.timestamp < this.defaultTtlMs) {
          this.cacheMap.set(key, record);
          return record.data;
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch (err) {
      console.warn('DataCache read error:', err);
    }

    return null;
  }

  /**
   * Store result in memory Map and localStorage
   */
  public set<T>(key: string, data: T): void {
    const record: CacheRecord<T> = {
      data,
      timestamp: Date.now()
    };

    this.cacheMap.set(key, record);

    try {
      localStorage.setItem(key, JSON.stringify(record));
    } catch (err) {
      console.warn('DataCache write error:', err);
    }
  }

  /**
   * Check if valid cache exists
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear cache
   */
  public clear(key?: string): void {
    if (key) {
      this.cacheMap.delete(key);
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn('DataCache clear error:', err);
      }
    } else {
      this.cacheMap.clear();
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('earthscope_data_cache_')) {
            localStorage.removeItem(k);
          }
        });
      } catch (err) {
        console.warn('DataCache clear all error:', err);
      }
    }
  }
}

export const dataCache = new DataCacheService();

/**
 * Integrated helper for Trend Detective daily annual temperature investigation with memoized cache
 */
export async function fetchCachedDailyAnnualT2M(
  lat: number,
  lon: number,
  startYear: number,
  endYear: number,
  locationName: string = 'Custom Station',
  forceRefresh: boolean = false
): Promise<{ investigationData: NasaDailyAnnualInvestigationResult; analysis: AnnualTrendAnalysisResult; isCached: boolean }> {
  const key = dataCache.generateKey(lat, lon, startYear, endYear, 'DAILY_T2M_ANNUAL');

  if (!forceRefresh) {
    const cached = dataCache.get<{ investigationData: NasaDailyAnnualInvestigationResult; analysis: AnnualTrendAnalysisResult }>(key);
    if (cached) {
      return { ...cached, isCached: true };
    }
  }

  const rawResult = await fetchNasaDailyAnnualT2M(lat, lon, startYear, endYear, locationName);
  const annualPointsForStats = rawResult.annualPoints.map(p => ({
    year: p.year,
    value: p.avgTemp
  }));
  const trendAnalysis = analyzeAnnualTrend(annualPointsForStats);

  const result = {
    investigationData: rawResult,
    analysis: trendAnalysis
  };

  dataCache.set(key, result);

  return { ...result, isCached: false };
}

/**
 * Integrated helper for Location Comparison monthly NASA parameter investigation with memoized cache
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
  const key = dataCache.generateKey(lat, lon, startYear, endYear, paramKey);

  if (!forceRefresh) {
    const cached = dataCache.get<{ data: LocationDataResult; analysis: TrendAnalysisResult }>(key);
    if (cached) {
      return { ...cached, isCached: true };
    }
  }

  const data = await fetchNasaLocationData(lat, lon, startYear, endYear, paramKey, locationName);
  const rawValues = data.points.map(p => p.value);
  const analysis = analyzeTrend(rawValues, 12);

  const result = { data, analysis };
  dataCache.set(key, result);

  return { ...result, isCached: false };
}
