import { DescriptiveStats, RegressionResult, MannKendallResult } from './statistics';

export interface SavedInvestigation {
  id: string;
  title: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  locationName: string;
  lat: number;
  lon: number;
  elevationMeters?: number;
  parameterKey: string;
  parameterName: string;
  units: string;
  startYear: number;
  endYear: number;
  source: string;
  retrievedAt: string;
  points: { period: string; dateLabel: string; value: number }[];
  stats: DescriptiveStats;
  regression: RegressionResult;
  mannKendall: MannKendallResult;
  classification: string;
  aiInsight?: {
    scientificSummary: string;
    whatChanged: string;
    whereChanged: string;
    howMuchChanged: string;
    statisticalSignificance: string;
    environmentalMeaning: string;
    limitationsAndUncertainty: string;
    keyTakeawayBullets: string[];
  };
  dataLimitations: string[];
}

const STORAGE_KEY = 'earthscope_saved_investigations_v2';

// Seed demo investigations so the library is immediately functional with atmospheric & PM2.5 dossiers
const INITIAL_DEMO_INVESTIGATIONS: SavedInvestigation[] = [
  {
    id: 'inv-nagpur-pm25-2018-2024',
    title: 'Nagpur Atmospheric PM2.5 Particulate Burden & Boundary Layer Inversion',
    notes: 'Inland central Indian Deccan plateau atmospheric baseline. Demonstrates severe winter boundary layer compression (nocturnal radiation inversion) causing PM2.5 spikes up to 88 µg/m³, contrasting with summer monsoon wet scavenging down to 16 µg/m³.',
    tags: ['Atmosphere', 'PM2.5', 'Air Quality', 'Boundary Layer', 'Central India'],
    createdAt: '2026-10-27T09:15:00.000Z',
    locationName: 'Nagpur',
    lat: 21.1458,
    lon: 79.0882,
    elevationMeters: 282,
    parameterKey: 'PM25',
    parameterName: 'PM2.5 Air Quality Mass',
    units: 'µg/m³',
    startYear: 2018,
    endYear: 2024,
    source: 'NASA POWER Project / MERRA-2 GOCART Atmospheric Reanalysis',
    retrievedAt: '2026-10-27T09:12:00.000Z',
    points: [
      { period: '2018-01', dateLabel: 'Jan 2018', value: 76.4 },
      { period: '2018-04', dateLabel: 'Apr 2018', value: 38.2 },
      { period: '2018-07', dateLabel: 'Jul 2018', value: 16.5 },
      { period: '2018-10', dateLabel: 'Oct 2018', value: 68.9 },
      { period: '2019-01', dateLabel: 'Jan 2019', value: 81.2 },
      { period: '2019-07', dateLabel: 'Jul 2019', value: 18.1 },
      { period: '2020-01', dateLabel: 'Jan 2020', value: 74.8 },
      { period: '2020-07', dateLabel: 'Jul 2020', value: 15.3 },
      { period: '2021-01', dateLabel: 'Jan 2021', value: 79.5 },
      { period: '2021-07', dateLabel: 'Jul 2021', value: 17.0 },
      { period: '2022-01', dateLabel: 'Jan 2022', value: 83.1 },
      { period: '2022-07', dateLabel: 'Jul 2022', value: 19.4 },
      { period: '2023-01', dateLabel: 'Jan 2023', value: 85.0 },
      { period: '2023-07', dateLabel: 'Jul 2023', value: 18.7 },
      { period: '2024-01', dateLabel: 'Jan 2024', value: 88.2 },
      { period: '2024-07', dateLabel: 'Jul 2024', value: 19.8 }
    ],
    stats: {
      count: 84,
      mean: 49.32,
      median: 46.10,
      min: 15.30,
      max: 88.20,
      stdDev: 24.60
    },
    regression: {
      slope: 0.124,
      intercept: 44.10,
      r2: 0.22,
      trendPerYear: 1.488,
      trendPerDecade: 14.88,
      fittedLine: [44.1, 45.6, 47.1, 48.6, 50.1, 51.6, 53.1, 54.6],
      ciSlope: [0.38, 2.60]
    },
    mannKendall: {
      s: 186,
      varS: 2490,
      z: 1.84,
      pValue: 0.065,
      trend: 'no trend'
    },
    classification: 'no statistically significant trend',
    aiInsight: {
      scientificSummary: 'Nagpur exhibits persistent high PM2.5 levels (mean 49.32 µg/m³) exceeding the WHO annual guideline of 5 µg/m³ by approximately 10-fold. The linear regression indicates an upward slope of +1.49 µg/m³/year, but the Mann-Kendall test yields p = 0.065, showing the decadal shift is not statistically significant at alpha = 0.05.',
      whatChanged: 'Atmospheric PM2.5 fine aerosol concentration and optical depth.',
      whereChanged: 'Nagpur urban atmospheric basin, Maharashtra, India (21.1458° N, 79.0882° E, Elevation: 282m).',
      howMuchChanged: 'Annual average increased by ~1.49 µg/m³/year (+14.88 µg/m³/decade nominal slope) with severe seasonal winter peaks.',
      statisticalSignificance: 'Borderline non-significant (p = 0.065 >= 0.05). Trend cannot be confirmed with 95% statistical confidence despite nominal upward trajectory.',
      environmentalMeaning: 'Atmospheric boundary layer trapping during dry winter calm winds prevents vertical dispersion, whereas southwest monsoon rainfall provides effective wet scavenging.',
      limitationsAndUncertainty: 'NASA reanalysis captures grid-averaged aerosol mass (0.5° resolution); near-roadway micro-hotspots may be higher.',
      keyTakeawayBullets: [
        'Average PM2.5 of 49.32 µg/m³ substantially exceeds WHO 24-hr (15 µg/m³) and annual (5 µg/m³) limits.',
        'Winter peaks reach 88.2 µg/m³ due to low boundary layer ventilation.',
        'Summer monsoon rain scavenging drops particulate mass down to ~15 µg/m³.',
        'Trend slope (+14.88 µg/m³/dec) is statistically borderline (p = 0.065).'
      ]
    },
    dataLimitations: ['MERRA-2 aerosol reanalysis resolution 0.5° x 0.625°', 'Monthly averaged values smooth out severe sub-daily hazardous smog episodes']
  },
  {
    id: 'inv-delhi-pm25-2018-2024',
    title: 'Delhi Indo-Gangetic Basin Extreme PM2.5 Trajectory & Air Quality',
    notes: 'Indo-Gangetic plain atmospheric trap. Low wind speeds, shallow winter mixing depths (PBL < 400m), and regional biomass aerosol loading.',
    tags: ['Atmosphere', 'PM2.5', 'Indo-Gangetic Basin', 'Aerosol Optical Depth', 'Extreme Smog'],
    createdAt: '2026-10-27T11:00:00.000Z',
    locationName: 'Delhi',
    lat: 28.6139,
    lon: 77.2090,
    elevationMeters: 216,
    parameterKey: 'PM25',
    parameterName: 'PM2.5 Air Quality Mass',
    units: 'µg/m³',
    startYear: 2018,
    endYear: 2024,
    source: 'NASA POWER Project / MERRA-2 GOCART Atmospheric Reanalysis',
    retrievedAt: '2026-10-27T10:55:00.000Z',
    points: [
      { period: '2018-01', dateLabel: 'Jan 2018', value: 165.2 },
      { period: '2018-07', dateLabel: 'Jul 2018', value: 42.1 },
      { period: '2018-11', dateLabel: 'Nov 2018', value: 210.4 },
      { period: '2019-01', dateLabel: 'Jan 2019', value: 172.0 },
      { period: '2019-07', dateLabel: 'Jul 2019', value: 45.8 },
      { period: '2019-11', dateLabel: 'Nov 2019', value: 228.6 },
      { period: '2020-01', dateLabel: 'Jan 2020', value: 158.4 },
      { period: '2020-07', dateLabel: 'Jul 2020', value: 36.2 },
      { period: '2020-11', dateLabel: 'Nov 2020', value: 198.0 },
      { period: '2021-01', dateLabel: 'Jan 2021', value: 168.1 },
      { period: '2021-07', dateLabel: 'Jul 2021', value: 39.5 },
      { period: '2022-01', dateLabel: 'Jan 2022', value: 162.7 },
      { period: '2023-01', dateLabel: 'Jan 2023', value: 159.2 },
      { period: '2024-01', dateLabel: 'Jan 2024', value: 164.0 }
    ],
    stats: {
      count: 84,
      mean: 104.5,
      median: 98.2,
      min: 34.0,
      max: 228.6,
      stdDev: 52.8
    },
    regression: {
      slope: -0.042,
      intercept: 106.2,
      r2: 0.03,
      trendPerYear: -0.504,
      trendPerDecade: -5.04,
      fittedLine: [106.2, 105.7, 105.2, 104.7],
      ciSlope: [-1.85, 0.84]
    },
    mannKendall: {
      s: -32,
      varS: 2510,
      z: -0.45,
      pValue: 0.652,
      trend: 'no trend'
    },
    classification: 'no statistically significant trend',
    aiInsight: {
      scientificSummary: 'Delhi exhibits chronic hazardous PM2.5 levels (mean 104.5 µg/m³, over 20x WHO annual limits). Winter post-monsoon peaks exceed 200 µg/m³. The Mann-Kendall test (p = 0.652) indicates no statistically significant decadal reduction despite episodic mitigation efforts.',
      whatChanged: 'Atmospheric PM2.5 particulate mass concentration.',
      whereChanged: 'Delhi National Capital Region, India (28.6139° N, 77.2090° E).',
      howMuchChanged: 'Minimal nominal shift (-0.50 µg/m³/year) which is not statistically significant.',
      statisticalSignificance: 'No significant trend (p = 0.652 > 0.05). Ambient particulate loading remains stubbornly high.',
      environmentalMeaning: 'Atmospheric boundary layer compression to <350m depth and wind stagnation (WS10M < 1.5 m/s) prevent particulate dissipation during winter months.',
      limitationsAndUncertainty: 'Satellite aerosol optical depth retrievals can be obscured by heavy cloud cover during peak monsoon.',
      keyTakeawayBullets: [
        'Chronic hazardous air quality: mean PM2.5 is 104.5 µg/m³.',
        'Winter inversions generate severe episodes exceeding 220 µg/m³.',
        'Monsoon rains scavenge particulates down to 34–45 µg/m³.',
        'No statistically detectable trend over 2018–2024 (p = 0.652).'
      ]
    },
    dataLimitations: ['Extreme seasonal swings dominate linear fit', 'Monthly aggregation misses acute 24-hr peaks']
  },
  {
    id: 'inv-nagpur-temp-2018-2024',
    title: 'Nagpur Decadal Surface Air Temperature Trajectory',
    notes: 'Inland central Indian Deccan plateau baseline. Demonstrates seasonal variance with dry summer peaks and moderate winter moderation.',
    tags: ['Central India', 'Urban Climatology', 'Thermal Dynamics'],
    createdAt: '2026-10-25T14:30:00.000Z',
    locationName: 'Nagpur',
    lat: 21.1458,
    lon: 79.0882,
    elevationMeters: 282,
    parameterKey: 'T2M',
    parameterName: 'Mean Temperature',
    units: '°C',
    startYear: 2018,
    endYear: 2024,
    source: 'NASA Langley Research Center POWER Project (CERES / MERRA-2)',
    retrievedAt: '2026-10-25T14:28:40.000Z',
    points: [
      { period: '2018-01', dateLabel: 'Jan 2018', value: 20.4 },
      { period: '2018-04', dateLabel: 'Apr 2018', value: 35.8 },
      { period: '2018-05', dateLabel: 'May 2018', value: 37.6 },
      { period: '2018-07', dateLabel: 'Jul 2018', value: 27.8 },
      { period: '2019-01', dateLabel: 'Jan 2019', value: 19.8 },
      { period: '2019-05', dateLabel: 'May 2019', value: 38.2 },
      { period: '2020-01', dateLabel: 'Jan 2020', value: 20.1 },
      { period: '2020-05', dateLabel: 'May 2020', value: 37.1 },
      { period: '2021-01', dateLabel: 'Jan 2021', value: 21.2 },
      { period: '2021-05', dateLabel: 'May 2021', value: 36.9 },
      { period: '2022-01', dateLabel: 'Jan 2022', value: 20.2 },
      { period: '2022-05', dateLabel: 'May 2022', value: 38.5 },
      { period: '2023-01', dateLabel: 'Jan 2023', value: 20.8 },
      { period: '2023-05', dateLabel: 'May 2023', value: 37.4 },
      { period: '2024-01', dateLabel: 'Jan 2024', value: 21.0 },
      { period: '2024-05', dateLabel: 'May 2024', value: 38.9 }
    ],
    stats: {
      count: 84,
      mean: 27.35,
      median: 27.1,
      min: 18.2,
      max: 38.9,
      stdDev: 5.12
    },
    regression: {
      slope: 0.0118,
      intercept: 26.85,
      r2: 0.28,
      trendPerYear: 0.142,
      trendPerDecade: 1.42,
      fittedLine: [26.85, 27.0, 27.15, 27.3, 27.45, 27.6, 27.75, 27.9],
      ciSlope: [0.045, 0.239]
    },
    mannKendall: {
      s: 242,
      varS: 2540,
      z: 2.12,
      pValue: 0.034,
      trend: 'increasing'
    },
    classification: 'significant increasing',
    aiInsight: {
      scientificSummary: 'Over the 2018–2024 monitoring cycle, Nagpur exhibits a statistically significant upward temperature trajectory with an empirical decadal slope of +1.42 °C/decade (Mann-Kendall p = 0.034).',
      whatChanged: 'Mean monthly ambient air temperature measured at 2 meters above ground level.',
      whereChanged: 'Nagpur, Maharashtra, India (Coordinates: 21.1458° N, 79.0882° E, Elevation: 282m).',
      howMuchChanged: 'Temperature increased at a rate of approximately 0.142 °C/year, equivalent to +1.42 °C per decade over the 7-year sample window.',
      statisticalSignificance: 'The trend is statistically significant under the alpha = 0.05 threshold (p = 0.034), supported by an S-statistic of 242.',
      environmentalMeaning: 'May indicate intensified pre-monsoon thermal heat accumulation and land-surface warming typical of urbanizing semi-arid continental interiors.',
      limitationsAndUncertainty: 'Observations span 7 years; decadal oscillations and multi-year drought-monsoon transitions contribute internal climatic noise.',
      keyTakeawayBullets: [
        'Significant upward trend detected (p = 0.034 < 0.05).',
        'Average temperature recorded at 27.35 °C with high standard deviation (5.12 °C).',
        'Fitted slope indicates +1.42 °C per decade.',
        'Continuous observation recommended to decouple urban microclimate from regional warming.'
      ]
    },
    dataLimitations: ['Monthly aggregated resolution', 'No missing observations']
  }
];

export function getSavedInvestigations(): SavedInvestigation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_INVESTIGATIONS));
      return INITIAL_DEMO_INVESTIGATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DEMO_INVESTIGATIONS;
  } catch (e) {
    console.error('Failed to load saved investigations from storage:', e);
    return INITIAL_DEMO_INVESTIGATIONS;
  }
}

export function saveInvestigation(data: Omit<SavedInvestigation, 'id' | 'createdAt'>): SavedInvestigation {
  const existing = getSavedInvestigations();
  const newInvestigation: SavedInvestigation = {
    ...data,
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString()
  };

  const updated = [newInvestigation, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to persist investigation to localStorage:', e);
  }
  return newInvestigation;
}

export function deleteInvestigation(id: string): void {
  const existing = getSavedInvestigations();
  const updated = existing.filter(i => i.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete investigation from localStorage:', e);
  }
}

export function getInvestigationById(id: string): SavedInvestigation | undefined {
  const existing = getSavedInvestigations();
  return existing.find(i => i.id === id);
}

export function exportInvestigationToCsv(inv: SavedInvestigation): void {
  const headers = [
    'Date_Period',
    'Date_Label',
    'Location_Name',
    'Latitude',
    'Longitude',
    'Elevation_m',
    'Variable_Code',
    'Variable_Name',
    'Observed_Value',
    'Units',
    'Data_Source',
    'Retrieval_Timestamp'
  ];

  const rows = inv.points.map(pt => [
    `"${pt.period}"`,
    `"${pt.dateLabel}"`,
    `"${inv.locationName}"`,
    inv.lat.toFixed(4),
    inv.lon.toFixed(4),
    inv.elevationMeters ?? 'N/A',
    `"${inv.parameterKey}"`,
    `"${inv.parameterName}"`,
    pt.value,
    `"${inv.units}"`,
    `"${inv.source}"`,
    `"${inv.retrievedAt}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `EARTH_TRACE_${inv.locationName}_${inv.parameterKey}_${inv.startYear}-${inv.endYear}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportSvgToPng(svgElement: SVGElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgElement.clientWidth * 2 || 1200;
        canvas.height = svgElement.clientHeight * 2 || 600;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        // Dark background matching scientific visual standard
        context.fillStyle = '#0B0E17';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${filename}.png`;
        downloadLink.href = pngUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URLObj.revokeObjectURL(blobURL);
        resolve();
      };
      image.onerror = (e) => {
        URLObj.revokeObjectURL(blobURL);
        reject(new Error('Failed to render SVG onto canvas: ' + String(e)));
      };
      image.src = blobURL;
    } catch (err) {
      reject(err);
    }
  });
}
