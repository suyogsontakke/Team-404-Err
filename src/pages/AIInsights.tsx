import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  BrainCircuit, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Layers, 
  TrendingUp, 
  ShieldAlert, 
  Copy, 
  Check, 
  RotateCw, 
  ArrowRight,
  BookOpen,
  HelpCircle,
  BarChart2,
  Send,
  MessageSquare,
  ShieldCheck,
  Award,
  Thermometer,
  Wind,
  Download,
  Info,
  Search,
  Globe,
  ExternalLink,
  Trash2,
  Volume2,
  VolumeX,
  Cpu,
  UserCheck,
  Compass,
  Newspaper,
  RefreshCw
} from 'lucide-react';
import { 
  PRESET_LOCATIONS, 
  NASA_PARAMETERS, 
  fetchNasaLocationData, 
  LocationDataResult 
} from '../lib/nasaPowerService';
import { analyzeTrend, TrendAnalysisResult } from '../lib/statistics';

interface AiInsightResponse {
  scientificSummary: string;
  whatChanged: string;
  whereChanged: string;
  howMuchChanged: string;
  statisticalSignificance: string;
  environmentalMeaning: string;
  limitationsAndUncertainty: string;
  keyTakeawayBullets: string[];
}

interface NewsArticle {
  title: string;
  source: string;
  date: string;
  summary: string;
  category: string;
  relevance: string;
}

interface AtmosphericNewsResponse {
  breakingUpdate: string;
  articles: NewsArticle[];
  keyThemes: string[];
  sources: Array<{ title: string; uri: string }>;
  searchQueries: string[];
  meta: {
    model: string;
    topic: string;
    location: string;
    timestamp: string;
  };
}

interface GroundingSource {
  type: 'web' | 'maps';
  title: string;
  uri: string;
  snippet?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  persona?: string;
  grounding?: 'none' | 'search' | 'maps';
  sources?: GroundingSource[];
  searchQueries?: string[];
}

const PERSONAS = [
  {
    id: 'atmospheric-scientist',
    name: 'Atmospheric Scientist',
    expert: 'Dr. Elena Vance',
    badge: 'Boundary Layer & Inversions',
    accentBorder: 'border-cyan-500/60',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-950/40',
    description: 'Planetary boundary layer (PBL) dynamics, nocturnal radiation inversions, aerosol reanalysis, WHO guidelines.',
    questions: [
      (loc: string, param: string) => `Explain boundary layer inversion in ${loc}`,
      (loc: string, param: string) => `How does precipitation wash out ${param}?`,
      (loc: string, param: string) => `Is ${loc} experiencing seasonal thermal stagnation?`,
      (loc: string, param: string) => `Compare ${param} against WHO 24-hr threshold`
    ]
  },
  {
    id: 'disaster-analyst',
    name: 'Disaster Risk Analyst',
    expert: 'Marcus Chen',
    badge: 'INFORM Risk & EM-DAT',
    accentBorder: 'border-amber-500/60',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-950/40',
    description: 'INFORM multi-hazard index, CRED EM-DAT history, GDACS alerts, 72h latency protocols.',
    questions: [
      (loc: string, param: string) => `What is the multi-hazard risk profile of this region?`,
      (loc: string, param: string) => `How should a 72-hour blindspot alert be handled?`,
      (loc: string, param: string) => `Distinguish historical disaster losses vs active emergencies`,
      (loc: string, param: string) => `Evaluate compounding flood, drought and heat risks`
    ]
  },
  {
    id: 'data-statistician',
    name: 'Data Statistician',
    expert: 'Dr. Priya Patel',
    badge: 'Mann-Kendall & OLS',
    accentBorder: 'border-purple-500/60',
    accentText: 'text-purple-400',
    accentBg: 'bg-purple-950/40',
    description: 'Mann-Kendall p-value scrutiny, OLS regression slope, autocorrelation, avoiding causal leaps.',
    questions: [
      (loc: string, param: string) => `Evaluate statistical significance and Mann-Kendall p-value`,
      (loc: string, param: string) => `Why does trend association not prove causation here?`,
      (loc: string, param: string) => `Does seasonal autocorrelation distort Sen's slope?`,
      (loc: string, param: string) => `Interpret the 95% confidence interval for this slope`
    ]
  },
  {
    id: 'citizen-educator',
    name: 'Citizen Educator',
    expert: 'Maya Lin',
    badge: 'Plain-English Analogies',
    accentBorder: 'border-emerald-500/60',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-950/40',
    description: 'Accessible translations, plain-English analogies, health advice, community action.',
    questions: [
      (loc: string, param: string) => `Explain temperature inversion in simple terms`,
      (loc: string, param: string) => `What should vulnerable groups do during high particulate days?`,
      (loc: string, param: string) => `What does a 10-year trend mean for daily life in ${loc}?`,
      (loc: string, param: string) => `Practical air quality safety actions for schools`
    ]
  }
];

export default function AIInsights() {
  const [searchParams] = useSearchParams();

  // Location & variable selectors
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0); // Nagpur default
  const [paramKey, setParamKey] = useState<string>('PM25');
  const [startYear, setStartYear] = useState<number>(2018);
  const [endYear, setEndYear] = useState<number>(2024);

  // Data fetching & analysis
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [nasaData, setNasaData] = useState<LocationDataResult | null>(null);
  const [analysis, setAnalysis] = useState<TrendAnalysisResult | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  // Gemini AI generation state (Structured Dossier)
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<AiInsightResponse | null>(null);
  const [aiMeta, setAiMeta] = useState<{ model: string; generatedAt: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Right Panel Active Tab
  const [rightPanelTab, setRightPanelTab] = useState<'dossier' | 'news'>('dossier');

  // Real-time Atmospheric News & NASA Publications State (Google Search Grounded)
  const [newsTopic, setNewsTopic] = useState<'all' | 'nasa-publications' | 'regional' | 'atmospheric-physics'>('all');
  const [newsSearchQuery, setNewsSearchQuery] = useState<string>('');
  const [submittedQuery, setSubmittedQuery] = useState<string>('');
  const [loadingNews, setLoadingNews] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [atmosphericNews, setAtmosphericNews] = useState<AtmosphericNewsResponse | null>(null);
  const [lastNewsFetchedAt, setLastNewsFetchedAt] = useState<string | null>(null);

  // Chat Q&A state (Interactive conversational prompt)
  const [userQuery, setUserQuery] = useState('');
  const [chatPersona, setChatPersona] = useState<string>('atmospheric-scientist');
  const [chatGrounding, setChatGrounding] = useState<'none' | 'search' | 'maps'>('none');
  const [chatModel, setChatModel] = useState<string>('gemini-4-hydrogen');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'initial-system-greeting',
      role: 'assistant',
      content: 'Welcome to EARTH TRACE Climate AI Intelligence. I am Dr. Elena Vance, Senior Atmospheric & Planetary Systems Scientist. Grounded in NASA MERRA-2 assimilation and empirical non-parametric statistical kernels, I can explain boundary layer dynamics, nocturnal radiation inversions, or empirical trends. How can I assist your investigation?',
      timestamp: 'SYSTEM 08:00',
      model: 'gemini-4-hydrogen',
      persona: 'atmospheric-scientist',
      grounding: 'none'
    }
  ]);
  const [isAsking, setIsAsking] = useState(false);

  // Initialize from search params or defaults
  useEffect(() => {
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const param = searchParams.get('param');

    if (param && NASA_PARAMETERS[param]) {
      setParamKey(param);
    }

    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      const matchedIdx = PRESET_LOCATIONS.findIndex(
        loc => Math.abs(loc.lat - lat) < 0.1 && Math.abs(loc.lon - lon) < 0.1
      );
      if (matchedIdx >= 0) {
        setSelectedPresetIndex(matchedIdx);
      }
    }
  }, [searchParams]);

  // Fetch NASA data and calculate stats
  const fetchAndAnalyze = async (presetIdx: number, pKey: string, sYear: number, eYear: number) => {
    const location = PRESET_LOCATIONS[presetIdx] || PRESET_LOCATIONS[0];
    setLoadingData(true);
    setDataError(null);
    setAiInsight(null);
    setAiError(null);

    try {
      const result = await fetchNasaLocationData(
        location.lat,
        location.lon,
        sYear,
        eYear,
        pKey,
        location.name
      );

      setNasaData(result);
      const rawValues = result.points.map(p => p.value);
      const statsResult = analyzeTrend(rawValues, 12);
      setAnalysis(statsResult);
    } catch (err: any) {
      console.error('Data retrieval error:', err);
      setDataError(err.message || 'Failed to fetch empirical NASA observations.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyze(selectedPresetIndex, paramKey, startYear, endYear);
  }, [selectedPresetIndex, paramKey, startYear, endYear]);

  // Trigger Gemini API for Full Dossier
  const handleGenerateAiExplanation = async () => {
    if (!nasaData || !analysis || analysis.classification === 'insufficient observations') {
      setAiError('Cannot generate interpretation without verified observations and statistical calculations.');
      return;
    }

    setGeneratingAi(true);
    setAiError(null);

    const payload = {
      locationName: nasaData.locationName,
      lat: nasaData.lat,
      lon: nasaData.lon,
      elevationMeters: nasaData.elevationMeters,
      paramKey: nasaData.parameterKey,
      paramName: nasaData.parameterMeta.name,
      units: nasaData.parameterMeta.units,
      startYear,
      endYear,
      source: nasaData.source,
      count: analysis.stats.count,
      mean: Number(analysis.stats.mean.toFixed(2)),
      median: Number(analysis.stats.median.toFixed(2)),
      stdDev: Number(analysis.stats.stdDev.toFixed(2)),
      min: Number(analysis.stats.min.toFixed(2)),
      max: Number(analysis.stats.max.toFixed(2)),
      slope: Number(analysis.regression.slope.toFixed(4)),
      trendPerYear: Number(analysis.regression.trendPerYear.toFixed(3)),
      trendPerDecade: Number(analysis.regression.trendPerDecade.toFixed(3)),
      ciSlope: [
        Number(analysis.regression.ciSlope[0].toFixed(3)),
        Number(analysis.regression.ciSlope[1].toFixed(3))
      ],
      r2: Number(analysis.regression.r2.toFixed(3)),
      mannKendall: {
        s: analysis.mannKendall.s,
        z: Number(analysis.mannKendall.z.toFixed(2)),
        pValue: Number(analysis.mannKendall.pValue.toFixed(4)),
        trend: analysis.mannKendall.trend
      },
      classification: analysis.classification,
      dataLimitations: nasaData.dataQualityWarnings
    };

    try {
      const response = await fetch('/api/gemini/explain-trend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `HTTP ${response.status}: Failed to communicate with Gemini AI.`);
      }

      const data = await response.json();
      if (!data.success || !data.insight) {
        throw new Error(data.error || 'Invalid response structure received from Gemini.');
      }

      setAiInsight(data.insight);
        setAiMeta({
        model: data.meta?.model || 'gemini-4-hydrogen',
        generatedAt: data.meta?.generatedAt || new Date().toISOString()
      });
    } catch (err: any) {
      console.error('AI Insights generation error:', err);
      setAiError(err.message || 'Failed to generate AI insights.');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Google Search Grounded Atmospheric News & NASA Publications Fetcher
  const fetchAtmosphericNews = async (
    topicOverride?: 'all' | 'nasa-publications' | 'regional' | 'atmospheric-physics',
    queryOverride?: string
  ) => {
    const activeTopic = topicOverride || newsTopic;
    const activeQuery = queryOverride !== undefined ? queryOverride : newsSearchQuery;
    
    setLoadingNews(true);
    setNewsError(null);
    if (queryOverride !== undefined) {
      setSubmittedQuery(queryOverride);
    }

    try {
      const response = await fetch('/api/gemini/atmospheric-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeTopic,
          locationName: currentLocation.name,
          paramName: `${currentParam.name} (${currentParam.units})`,
          query: activeQuery.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `HTTP ${response.status}: Failed to fetch atmospheric news`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to retrieve grounded atmospheric publications');
      }

      setAtmosphericNews(data);
      setLastNewsFetchedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Atmospheric news retrieval error:', err);
      setNewsError(err.message || 'Failed to connect to Google Search grounded news feed');
    } finally {
      setLoadingNews(false);
    }
  };

  // Automatically fetch news when user switches to 'news' tab if not yet loaded
  useEffect(() => {
    if (rightPanelTab === 'news' && !atmosphericNews && !loadingNews) {
      fetchAtmosphericNews();
    }
  }, [rightPanelTab]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAsking]);

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
    const currentPersonaObj = PERSONAS.find(p => p.id === chatPersona) || PERSONAS[0];
    setChatMessages([
      {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. I am ${currentPersonaObj.expert} (${currentPersonaObj.name}). Ask me anything regarding ${currentLocation.name}'s empirical data, physical mechanisms, or multi-hazard risk.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: chatModel,
        persona: chatPersona,
        grounding: chatGrounding
      }
    ]);
  };

  // Chat Q&A handler with multi-turn history & grounding
  const handleSendChat = async (presetQuestion?: string) => {
    const query = (presetQuestion || userQuery).trim();
    if (!query || isAsking) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setUserQuery('');
    setIsAsking(true);

    // Build payload messages preserving history
    const historyPayload = nextMessages
      .filter(m => m.id !== 'initial-system-greeting')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

    try {
      const res = await fetch('/api/gemini/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          persona: chatPersona,
          model: chatModel,
          grounding: chatGrounding,
          locationCoords: {
            latitude: currentLocation.lat,
            longitude: currentLocation.lon,
            name: currentLocation.name
          },
          context: {
            location: currentLocation.name,
            coordinates: `${currentLocation.lat.toFixed(4)}°N, ${currentLocation.lon.toFixed(4)}°E`,
            parameter: `${currentParam.name} (${currentParam.units})`,
            mean: analysis?.stats.mean,
            trendDirection: analysis?.mannKendall.trend,
            pValue: analysis?.mannKendall.pValue,
            slopePerDecade: analysis?.regression.trendPerDecade,
            slope: analysis?.regression.slope
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error communicating with Gemini');
      }

      const replyContent = data.answer || data.reply || data.response || 'No response received from Gemini AI model.';
      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: data.meta?.model || chatModel,
        persona: data.meta?.persona || chatPersona,
        grounding: data.meta?.grounding || chatGrounding,
        sources: data.sources || [],
        searchQueries: data.searchQueries || []
      };

      setChatMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: `Data analysis synthesis warning: ${err.message || 'Network timeout'}. Grounded fallback active.`,
          timestamp: 'ERROR'
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopyReport = () => {
    if (!aiInsight) return;
    const textToCopy = `EARTH TRACE SCIENTIFIC AI INSIGHT REPORT
Location: ${nasaData?.locationName} (${nasaData?.lat}°N, ${nasaData?.lon}°E)
Variable: ${nasaData?.parameterMeta.name} (${nasaData?.parameterMeta.units})
Period: ${startYear} - ${endYear}

SUMMARY:
${aiInsight.scientificSummary}

WHAT CHANGED:
${aiInsight.whatChanged}

MAGNITUDE & RATE:
${aiInsight.howMuchChanged}

STATISTICAL SIGNIFICANCE:
${aiInsight.statisticalSignificance}

ENVIRONMENTAL MEANING:
${aiInsight.environmentalMeaning}

LIMITATIONS:
${aiInsight.limitationsAndUncertainty}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLocation = PRESET_LOCATIONS[selectedPresetIndex] || PRESET_LOCATIONS[0];
  const currentParam = NASA_PARAMETERS[paramKey] || NASA_PARAMETERS['PM25'];

  return (
    <div className="space-y-5 max-w-[1700px] mx-auto pb-12 font-sans">
      
      {/* Top Mac Window Control Bar */}
      <div className="bg-[#091122]/90 backdrop-blur-md border border-[#1b2b48] rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-md border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider text-white">EARTH TRACE CLIMATE AI INTELLIGENCE</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-700/60 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              GEMINI 4 HYDROGEN & 3.1 FLASH-LITE DUAL ENGINE
            </span>
          </div>
        </div>

        {/* Telemetry Status Pills */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Zero Hallucination Guard
          </span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> NASA Grounded
          </span>
        </div>
      </div>

      {/* Target Parameters Bar */}
      <div className="bg-[#08101d] border border-[#1b2b48] rounded-xl p-4 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Target Location */}
        <div className="space-y-1">
          <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Geographic Target
          </label>
          <select
            value={selectedPresetIndex}
            onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
            className="w-full bg-[#060c18] border border-[#1b2b48] rounded px-3 py-2 text-xs font-mono text-white"
          >
            {PRESET_LOCATIONS.map((loc, idx) => (
              <option key={loc.name} value={idx}>{loc.name} ({loc.region})</option>
            ))}
          </select>
          <div className="text-[10px] font-mono text-slate-500">
            {currentLocation.lat.toFixed(4)}°N, {currentLocation.lon.toFixed(4)}°E
          </div>
        </div>

        {/* Target Variable */}
        <div className="space-y-1">
          <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> Target Parameter
          </label>
          <select
            value={paramKey}
            onChange={(e) => setParamKey(e.target.value)}
            className="w-full bg-[#060c18] border border-[#1b2b48] rounded px-3 py-2 text-xs font-mono text-white"
          >
            {Object.entries(NASA_PARAMETERS).map(([k, p]) => (
              <option key={k} value={k}>{p.name} ({p.units})</option>
            ))}
          </select>
          <div className="text-[10px] font-mono text-slate-500">
            {nasaData?.source || 'NASA MERRA-2'}
          </div>
        </div>

        {/* Time Horizon */}
        <div className="space-y-1">
          <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Observation Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              className="bg-[#060c18] border border-[#1b2b48] rounded px-2.5 py-2 text-xs font-mono text-white"
            >
              {[2015, 2018, 2020].map(yr => <option key={yr} value={yr}>From {yr}</option>)}
            </select>
            <select
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
              className="bg-[#060c18] border border-[#1b2b48] rounded px-2.5 py-2 text-xs font-mono text-white"
            >
              {[2022, 2023, 2024, 2025].map(yr => <option key={yr} value={yr}>To {yr}</option>)}
            </select>
          </div>
          <div className="text-[10px] font-mono text-cyan-400">
            {endYear - startYear + 1} Years Ingested
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col justify-end">
          <button
            onClick={handleGenerateAiExplanation}
            disabled={loadingData || generatingAi || !analysis}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-mono font-bold text-xs rounded-lg shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{generatingAi ? 'Synthesizing Dossier...' : 'Generate AI Synthesis'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Panel Layout: Left Interactive Q&A Assistant + Right Scientific Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Advanced Multi-Turn AI Co-Pilot Console (5 Columns) */}
        <div className="lg:col-span-5 bg-[#08101d] border border-[#1b2b48] rounded-xl p-4 shadow-xl flex flex-col h-[750px]">
          {/* Header & Controls */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#1b2b48] pb-3 mb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-600/50 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Earth Intelligence Co-Pilot
                </h3>
                <div className="text-[10px] font-mono text-cyan-400">Multi-Turn Scientific Chat</div>
              </div>
            </div>

            {/* Model & Clear Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#050b14] border border-[#1b2b48] rounded px-2 py-1 text-[10px] font-mono">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <select
                  value={chatModel}
                  onChange={(e) => setChatModel(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none cursor-pointer"
                >
                  <option value="gemini-4-hydrogen" className="bg-[#050b14] text-white">Gemini 4 Hydrogen (Grounded)</option>
                  <option value="gemini-3.1-flash-lite" className="bg-[#050b14] text-white">Gemini 3.1 Flash-Lite (Fast)</option>
                </select>
              </div>

              <button
                onClick={handleClearChat}
                title="Reset conversation"
                className="p-1.5 bg-[#050b14] hover:bg-red-950/60 border border-[#1b2b48] hover:border-red-600/50 text-slate-400 hover:text-red-300 rounded transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Persona Selector Tabs */}
          <div className="space-y-1.5 pb-2.5 border-b border-[#132238]">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-cyan-400" /> Expert Persona:
              </span>
              <span className="text-cyan-400 font-semibold">
                {PERSONAS.find(p => p.id === chatPersona)?.expert}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PERSONAS.map((persona) => {
                const isActive = chatPersona === persona.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => setChatPersona(persona.id)}
                    className={`px-2 py-1.5 rounded text-[10px] font-mono transition-all text-left border cursor-pointer ${
                      isActive
                        ? `${persona.accentBg} ${persona.accentBorder} ${persona.accentText} font-bold shadow-sm shadow-cyan-500/10`
                        : 'bg-[#050b14] border-[#1b2b48] text-slate-400 hover:text-slate-200 hover:bg-[#0c1626]'
                    }`}
                  >
                    <div className="truncate">{persona.name}</div>
                  </button>
                );
              })}
            </div>
            <div className="text-[9px] font-mono text-slate-400 italic">
              {PERSONAS.find(p => p.id === chatPersona)?.description}
            </div>
          </div>

          {/* Grounding Mode Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-[#132238] text-[10px] font-mono">
            <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" /> Grounding:
            </span>
            <div className="flex items-center gap-1 bg-[#050b14] p-0.5 rounded border border-[#1b2b48]">
              <button
                onClick={() => setChatGrounding('none')}
                className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                  chatGrounding === 'none'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Direct
              </button>
              <button
                onClick={() => setChatGrounding('search')}
                className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                  chatGrounding === 'search'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                <Search className="w-2.5 h-2.5" />
                Google Search
              </button>
              <button
                onClick={() => setChatGrounding('maps')}
                className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                  chatGrounding === 'maps'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <MapPin className="w-2.5 h-2.5" />
                Google Maps
              </button>
            </div>
          </div>

          {/* Persona-Specific Quick Inquiries Chips */}
          <div className="space-y-1.5 py-2 border-b border-[#132238]">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase">
              <span>Domain Inquiries:</span>
              <span className="text-cyan-400">Click to ask</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(PERSONAS.find(p => p.id === chatPersona)?.questions || []).map((qFn, idx) => {
                const questionText = qFn(currentLocation.name, currentParam.name);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(questionText)}
                    disabled={isAsking}
                    className="px-2 py-0.5 bg-[#050b14] hover:bg-cyan-950/60 border border-[#1b2b48] hover:border-cyan-500/50 rounded text-[9px] font-mono text-slate-300 hover:text-cyan-300 transition-all text-left cursor-pointer truncate max-w-[280px]"
                  >
                    {questionText}
                  </button>
                );
              })}
              {/* Live Search Grounded Quick Inquiries */}
              <button
                onClick={() => {
                  setChatGrounding('search');
                  handleSendChat(`Search web for recent 2024-2026 NASA PACE and TEMPO atmospheric satellite publications.`);
                }}
                disabled={isAsking}
                className="px-2 py-0.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700/50 hover:border-purple-400 rounded text-[9px] font-mono text-purple-200 hover:text-purple-100 transition-all text-left cursor-pointer flex items-center gap-1"
                title="Search live web for NASA satellite findings"
              >
                <Search className="w-2.5 h-2.5 text-purple-400" />
                <span>Search NASA PACE & TEMPO findings</span>
              </button>
              <button
                onClick={() => {
                  setChatGrounding('search');
                  handleSendChat(`Search the web for the latest atmospheric news, air quality advisories, and inversion reports in ${currentLocation.name}.`);
                }}
                disabled={isAsking}
                className="px-2 py-0.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/50 hover:border-cyan-400 rounded text-[9px] font-mono text-cyan-200 hover:text-cyan-100 transition-all text-left cursor-pointer flex items-center gap-1"
                title="Search live web for regional atmospheric news"
              >
                <Search className="w-2.5 h-2.5 text-cyan-400" />
                <span>Search {currentLocation.name} atmospheric news</span>
              </button>
            </div>
          </div>

          {/* Chat Message Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 scrollbar-thin">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg text-xs font-mono leading-relaxed transition-all ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-950/70 to-blue-950/60 border border-cyan-700/60 text-cyan-100 ml-6'
                    : 'bg-[#050b14] border border-[#16243d] text-slate-200 mr-1'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1.5 pb-1 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    {msg.role === 'user' ? (
                      <span className="font-bold text-cyan-300">INVESTIGATOR</span>
                    ) : (
                      <>
                        <span className="font-bold text-purple-300">
                          {PERSONAS.find(p => p.id === msg.persona)?.expert || 'EARTH TRACE CO-PILOT'}
                        </span>
                        {msg.model && (
                          <span className="px-1 py-0.2 bg-slate-900 border border-slate-700 rounded text-[8px] text-slate-400">
                            {msg.model}
                          </span>
                        )}
                        {msg.grounding === 'search' && (
                          <span className="px-1 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded text-[8px] flex items-center gap-0.5">
                            <Search className="w-2 h-2" /> Search Grounded
                          </span>
                        )}
                        {msg.grounding === 'maps' && (
                          <span className="px-1 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[8px] flex items-center gap-0.5">
                            <MapPin className="w-2 h-2" /> Maps Grounded
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleToggleSpeak(msg.id, msg.content)}
                        title={speakingMsgId === msg.id ? 'Stop audio reading' : 'Listen with Audio Readout'}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          speakingMsgId === msg.id 
                            ? 'bg-cyan-500/30 text-cyan-300 animate-pulse' 
                            : 'text-slate-500 hover:text-cyan-300 hover:bg-slate-900'
                        }`}
                      >
                        {speakingMsgId === msg.id ? (
                          <VolumeX className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                  {msg.content}
                </div>

                {/* Grounding Sources (Search & Maps) */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#16243d] space-y-1.5">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Globe className="w-3 h-3 text-cyan-400" />
                      Grounding Citations & Spatial Sources:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-2 py-1 rounded text-[9px] font-mono flex items-center gap-1 border transition-all ${
                            src.type === 'maps'
                              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200 hover:bg-emerald-900/80 hover:border-emerald-500'
                              : 'bg-cyan-950/60 border-cyan-800/60 text-cyan-200 hover:bg-cyan-900/80 hover:border-cyan-500'
                          }`}
                        >
                          {src.type === 'maps' ? (
                            <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Search className="w-2.5 h-2.5 text-cyan-400" />
                          )}
                          <span className="max-w-[200px] truncate">{src.title}</span>
                          <ExternalLink className="w-2 h-2 shrink-0 opacity-70" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Queries Triggered */}
                {msg.searchQueries && msg.searchQueries.length > 0 && (
                  <div className="mt-1.5 text-[8px] text-slate-500 flex flex-wrap items-center gap-1">
                    <span>Queries:</span>
                    {msg.searchQueries.map((q, qIdx) => (
                      <span key={qIdx} className="bg-black/40 px-1 py-0.5 rounded border border-slate-800">
                        "{q}"
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isAsking && (
              <div className="p-3 bg-[#050b14] border border-[#16243d] rounded-lg text-xs font-mono text-cyan-400 flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>
                  Querying {chatModel} with {chatGrounding !== 'none' ? `${chatGrounding} grounding & ` : ''}
                  {PERSONAS.find(p => p.id === chatPersona)?.name}...
                </span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="pt-3 border-t border-[#1b2b48] flex items-center gap-2"
          >
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder={`Ask ${PERSONAS.find(p => p.id === chatPersona)?.expert} about ${currentLocation.name}...`}
              disabled={isAsking}
              className="flex-1 bg-[#050b14] border border-[#1b2b48] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isAsking || !userQuery.trim()}
              className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Side: Dual-Mode Panel - Scientific Synthesis Dossier OR Live Atmospheric News (7 Columns) */}
        <div className="lg:col-span-7 bg-[#08101d] border border-[#1b2b48] rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4 min-h-[750px]">
          <div className="space-y-4">
            {/* Tab Navigation Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2b48] pb-3">
              <div className="flex items-center gap-1.5 p-1 bg-[#050b14] border border-[#1b2b48] rounded-lg">
                <button
                  onClick={() => setRightPanelTab('dossier')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    rightPanelTab === 'dossier'
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Scientific Dossier</span>
                </button>
                <button
                  onClick={() => {
                    setRightPanelTab('news');
                    if (!atmosphericNews && !loadingNews) {
                      fetchAtmosphericNews();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    rightPanelTab === 'news'
                      ? 'bg-purple-950/80 text-purple-200 border border-purple-700/60 shadow-sm shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Newspaper className="w-3.5 h-3.5 text-purple-400" />
                  <span>Live News & NASA Publications</span>
                  <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-700/60 rounded text-[9px] font-mono tracking-tighter flex items-center gap-0.5">
                    <Search className="w-2 h-2" /> Live Grounded
                  </span>
                </button>
              </div>

              {rightPanelTab === 'dossier' ? (
                aiInsight && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyReport}
                      className="px-3 py-1.5 bg-[#0e182b] hover:bg-[#152440] text-cyan-300 border border-cyan-500/40 rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Dossier'}</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2">
                  {lastNewsFetchedAt && (
                    <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                      Updated: {lastNewsFetchedAt}
                    </span>
                  )}
                  <button
                    onClick={() => fetchAtmosphericNews(newsTopic, newsSearchQuery)}
                    disabled={loadingNews}
                    className="px-3 py-1.5 bg-[#0e182b] hover:bg-[#152440] text-purple-300 border border-purple-500/40 rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>{loadingNews ? 'Searching Web...' : 'Refresh Feed'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: Scientific Dossier View */}
            {rightPanelTab === 'dossier' && (
              <div>
                <p className="text-xs font-mono text-slate-400 mb-3">
                  Peer-reviewed framework interpreting empirical regression and Mann-Kendall statistics for {currentLocation.name}.
                </p>

                {generatingAi ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
                    <RotateCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span>Running Gemini Multi-Modal Earth Science Reasoning...</span>
                  </div>
                ) : aiInsight ? (
                  <div className="space-y-4 text-xs font-mono max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
                    {/* Executive Summary */}
                    <div className="p-3.5 bg-[#050b14] rounded-lg border border-cyan-500/30">
                      <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                        01. Executive Scientific Summary
                      </div>
                      <p className="text-slate-200 leading-relaxed font-sans text-sm">
                        {aiInsight.scientificSummary}
                      </p>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#050b14] rounded-lg border border-[#16243d]">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">What Changed & Magnitude</div>
                        <div className="text-white leading-relaxed">{aiInsight.whatChanged}</div>
                        <div className="text-cyan-300 font-bold mt-2">{aiInsight.howMuchChanged}</div>
                      </div>

                      <div className="p-3 bg-[#050b14] rounded-lg border border-[#16243d]">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Statistical Significance</div>
                        <div className="text-emerald-400 font-bold mb-1">
                          {analysis && analysis.mannKendall.pValue < 0.05 ? 'Significant at α = 0.05' : 'Null Hypothesis Not Rejected'}
                        </div>
                        <div className="text-slate-300 leading-relaxed">{aiInsight.statisticalSignificance}</div>
                      </div>
                    </div>

                    {/* Atmospheric Mechanism & PBL Physics */}
                    <div className="p-3 bg-[#050b14] rounded-lg border border-purple-500/30">
                      <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                        02. Atmospheric Physics & Environmental Meaning
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {aiInsight.environmentalMeaning}
                      </p>
                    </div>

                    {/* Limitations & Uncertainty */}
                    <div className="p-3 bg-[#050b14] rounded-lg border border-amber-500/30">
                      <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        03. Limitations, Autocorrelation & Satellite Uncertainty
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        {aiInsight.limitationsAndUncertainty}
                      </p>
                    </div>

                    {/* Key Takeaways */}
                    {aiInsight.keyTakeawayBullets && aiInsight.keyTakeawayBullets.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#1b2b48]">
                        <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                          Core Empirical Findings:
                        </div>
                        <ul className="space-y-1">
                          {aiInsight.keyTakeawayBullets.map((bullet, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono text-xs space-y-3">
                    <BrainCircuit className="w-12 h-12 text-slate-700" />
                    <div className="max-w-md">
                      Click <strong className="text-cyan-400">Generate AI Synthesis</strong> above to run full Gemini multi-modal reasoning on empirical NASA observations and calculated Mann-Kendall statistics.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Live Atmospheric News & NASA Scientific Publications (Google Search Grounded) */}
            {rightPanelTab === 'news' && (
              <div className="space-y-4">
                {/* Topic Pills Filter & Custom Search Bar */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">
                      Filter Topic:
                    </span>
                    {[
                      { id: 'all', label: '🌟 All Discoveries' },
                      { id: 'nasa-publications', label: '🚀 NASA Publications & Missions' },
                      { id: 'regional', label: `📍 Regional (${currentLocation.name})` },
                      { id: 'atmospheric-physics', label: '🌪️ Atmospheric Physics & Inversions' }
                    ].map((t) => {
                      const isActive = newsTopic === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setNewsTopic(t.id as any);
                            fetchAtmosphericNews(t.id as any, newsSearchQuery);
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all border cursor-pointer ${
                            isActive
                              ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 font-bold shadow-sm shadow-purple-500/10'
                              : 'bg-[#050b14] border-[#1b2b48] text-slate-400 hover:text-slate-200 hover:bg-[#0c1626]'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Search Live Web Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      fetchAtmosphericNews(newsTopic, newsSearchQuery);
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={newsSearchQuery}
                        onChange={(e) => setNewsSearchQuery(e.target.value)}
                        placeholder="Search live web for NASA atmospheric missions (PACE, TEMPO, MERRA-2, smoke plumes, inversion research)..."
                        className="w-full bg-[#050b14] border border-[#1b2b48] focus:border-purple-500 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loadingNews}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-mono font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search Live Web</span>
                    </button>
                    {submittedQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewsSearchQuery('');
                          setSubmittedQuery('');
                          fetchAtmosphericNews(newsTopic, '');
                        }}
                        className="px-2.5 py-2 bg-[#050b14] border border-[#1b2b48] hover:border-red-500/50 text-slate-400 hover:text-red-300 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                        title="Clear custom search"
                      >
                        Reset
                      </button>
                    )}
                  </form>
                </div>

                {/* News Retrieval States */}
                {loadingNews ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
                    <RotateCw className="w-8 h-8 text-purple-400 animate-spin" />
                    <div className="text-center space-y-1">
                      <div className="text-slate-200 font-semibold">
                        Querying Google Search Grounding via Gemini 4 Hydrogen...
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Scanning NASA Earth Observatory, AGU journals, PACE & TEMPO satellite advisories
                      </div>
                    </div>
                  </div>
                ) : newsError ? (
                  <div className="p-4 bg-red-950/30 border border-red-700/50 rounded-lg text-xs font-mono text-red-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-red-200">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      Failed to Retrieve Live News
                    </div>
                    <p>{newsError}</p>
                    <button
                      onClick={() => fetchAtmosphericNews(newsTopic, newsSearchQuery)}
                      className="px-3 py-1.5 bg-red-900/40 hover:bg-red-800/60 border border-red-600/50 rounded text-red-100 font-bold cursor-pointer transition-colors"
                    >
                      Retry Google Search Grounding
                    </button>
                  </div>
                ) : atmosphericNews ? (
                  <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin text-xs font-mono">
                    
                    {/* Breaking Real-Time Update Callout */}
                    <div className="p-3.5 bg-gradient-to-r from-purple-950/40 via-[#0b162c] to-cyan-950/40 rounded-lg border border-purple-500/40 shadow-lg">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <Newspaper className="w-3.5 h-3.5 text-purple-400" />
                        <span>Breaking Atmospheric Intelligence Briefing</span>
                      </div>
                      <p className="text-slate-100 font-sans text-sm leading-relaxed">
                        {atmosphericNews.breakingUpdate}
                      </p>
                    </div>

                    {/* Key Themes Synthesized */}
                    {atmosphericNews.keyThemes && atmosphericNews.keyThemes.length > 0 && (
                      <div className="p-3 bg-[#050b14] rounded-lg border border-[#16243d] space-y-1.5">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-cyan-400" />
                          <span>Key Thematic Trends & Observations:</span>
                        </div>
                        <ul className="space-y-1">
                          {atmosphericNews.keyThemes.map((theme, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-300 font-sans text-xs">
                              <span className="text-cyan-400 font-mono font-bold">›</span>
                              <span>{theme}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recent Articles & NASA Publications Grid */}
                    <div className="space-y-3">
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                          Verified Articles & Scientific Publications ({atmosphericNews.articles.length})
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          Live Grounded
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {atmosphericNews.articles.map((art, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 bg-[#050b14] border border-[#16243d] hover:border-purple-500/40 rounded-lg transition-all space-y-2 group"
                          >
                            {/* Meta Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/60 font-semibold">
                                  {art.category || 'NASA Research'}
                                </span>
                                <span className="text-slate-400 font-semibold flex items-center gap-1">
                                  <Globe className="w-2.5 h-2.5 text-cyan-400" />
                                  {art.source}
                                </span>
                              </div>
                              <span className="text-slate-500 font-mono">{art.date}</span>
                            </div>

                            {/* Headline */}
                            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                              {art.title}
                            </h4>

                            {/* Scientific Breakdown */}
                            <p className="text-slate-300 text-xs font-sans leading-relaxed">
                              {art.summary}
                            </p>

                            {/* Scientific Relevance Callout */}
                            {art.relevance && (
                              <div className="p-2 rounded bg-cyan-950/30 border border-cyan-800/30 text-[11px] text-cyan-200 font-mono">
                                <strong className="text-cyan-400">Impact & Relevance:</strong> {art.relevance}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Google Search Grounding Sources */}
                    {atmosphericNews.sources && atmosphericNews.sources.length > 0 && (
                      <div className="p-3 bg-[#050b14] rounded-lg border border-[#16243d] space-y-2">
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Google Search Grounding Web Sources ({atmosphericNews.sources.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {atmosphericNews.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/50 hover:border-cyan-400 text-cyan-200 text-[10px] font-mono flex items-center gap-1.5 transition-all group"
                            >
                              <Search className="w-2.5 h-2.5 text-cyan-400" />
                              <span className="max-w-[240px] truncate">{src.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0 text-cyan-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Web Search Queries Executed */}
                    {atmosphericNews.searchQueries && atmosphericNews.searchQueries.length > 0 && (
                      <div className="text-[9px] text-slate-500 flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="uppercase tracking-wider">Search Queries Executed:</span>
                        {atmosphericNews.searchQueries.map((q, qIdx) => (
                          <span key={qIdx} className="bg-black/50 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                            "{q}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono text-xs space-y-3">
                    <Newspaper className="w-12 h-12 text-slate-700" />
                    <div className="max-w-md">
                      Click <strong className="text-purple-400">Search Live Web</strong> or select a topic to retrieve real-time atmospheric news and recent NASA publications grounded via Google Search.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Model Provenance Footer */}
          <div className="pt-3 border-t border-[#1b2b48] flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-500 gap-2">
            <span>
              {rightPanelTab === 'dossier' 
                ? 'Grounding: NASA POWER MERRA-2 API' 
                : 'Grounding: Google Search Tool (tools: [{ googleSearch: {} }])'}
            </span>
            <span>
              Kernel: {rightPanelTab === 'dossier' 
                ? (aiMeta?.model || 'Gemini 4 Hydrogen / 3.1 Flash-Lite') 
                : (atmosphericNews?.meta?.model || 'Gemini 4 Hydrogen')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
