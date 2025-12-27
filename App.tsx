
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  RefreshCcw, 
  History, 
  ChevronRight, 
  Zap,
  LayoutDashboard,
  Radio,
  Share2,
  AlertCircle,
  Clock,
  Compass,
  Globe,
  BellRing,
  Activity,
  Cpu,
  Unplug
} from 'lucide-react';
import { NewsItem, NewsTopic, AppConfig } from './types';
import { fetchNewsUpdate, simulatePostToX } from './services/geminiService';
import NewsCard from './components/NewsCard';

const INTERVAL_OPTIONS = [
  { label: '1m', value: 1 }, // Added 1m for quick testing
  { label: '15m', value: 15 },
  { label: '1h', value: 60 },
  { label: '4h', value: 240 }
];

// Leaf component for timer to prevent main App re-renders
const CountdownTimer: React.FC<{ initialSeconds: number, onExpire: () => void }> = ({ initialSeconds, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  
  return (
    <span className="mono font-bold text-white tracking-tighter">
      {h > 0 ? h + ':' : ''}{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
    </span>
  );
};

const App: React.FC = () => {
  const [newsHistory, setNewsHistory] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [cycleId, setCycleId] = useState(0); // Used to reset the timer key
  
  const [config, setConfig] = useState<AppConfig>({
    topic: NewsTopic.TECH,
    updateIntervalMinutes: 60,
    autoPostToX: true, // Default to true for user's request
    localMode: false
  });
  
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [ `[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => addLog("Location services bypassed.")
      );
    }
  }, [addLog]);

  const performUpdate = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    addLog(`Scanning Neural Grid: ${config.topic}`);

    try {
      const newNews = await fetchNewsUpdate(
        config.topic, 
        config.localMode ? userLocation : null
      );
      
      const isDuplicate = newsHistory.length > 0 && newsHistory[0].title === newNews.title;
      
      if (isDuplicate) {
        addLog("Signal static. Maintaining current buffer.");
      } else {
        let updatedNews = newNews;
        if (config.autoPostToX) {
          addLog("Autonomous Syndication Protocol triggered...");
          await simulatePostToX(newNews);
          updatedNews = { ...newNews, isPostedToX: true };
          addLog("Broadcast complete. Syndicated to X.");
        }
        setNewsHistory(prev => [updatedNews, ...prev].slice(0, 20));
        addLog(`Intelligence synchronized: ${newNews.sentiment.toUpperCase()}`);
      }
    } catch (err) {
      addLog("Interference detected in AI gateway.");
      setError("AI Gateway disruption. Retrying next cycle...");
    } finally {
      setIsLoading(false);
      setCycleId(prev => prev + 1); // Incrementing forces timer reset
    }
  }, [config, newsHistory, isLoading, userLocation, addLog]);

  // Initial load
  useEffect(() => {
    performUpdate();
  }, []);

  const handleManualPost = useCallback(async (news: NewsItem) => {
    addLog("Establishing manual uplink...");
    await simulatePostToX(news);
    setNewsHistory(prev => prev.map(n => n.id === news.id ? { ...n, isPostedToX: true } : n));
    addLog("Manual transmission successful.");
  }, [addLog]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#02040a] text-slate-300">
      {/* Sidebar - Fix: Non-blocking fixed position on desktop, relative on mobile */}
      <aside className="w-full md:w-80 glass border-b md:border-b-0 md:border-r border-white/[0.05] p-6 md:p-8 flex flex-col justify-between md:fixed h-auto md:h-full z-40">
        <div>
          <div className="flex items-center gap-4 mb-8 md:mb-14">
            <div className="relative w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 pulse-ring">
              <Radio className="text-white relative z-10" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">CHRONOS</h1>
              <p className="text-[10px] text-indigo-400 font-black tracking-[0.2em] uppercase mt-1">AI AUTONOMOUS</p>
            </div>
          </div>

          <nav className="hidden md:block space-y-2">
            <NavItem icon={<Activity size={18}/>} label="Neural Hub" active />
            <NavItem icon={<Globe size={18}/>} label="Global Map" />
            <NavItem icon={<History size={18}/>} label="Memory Bank" />
            <NavItem icon={<Settings size={18}/>} label="Matrix Control" />
          </nav>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="p-4 md:p-5 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Link</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-emerald-500">ACTIVE</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-white font-bold mb-3">
              <Cpu size={16} className="text-indigo-400" />
              Gemini-3-Pro
            </div>
            <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
               <div className={`h-full bg-indigo-500 transition-all duration-[3000ms] ${isLoading ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Corrected padding/margin to account for sidebar */}
      <main className="flex-1 md:ml-80 relative z-10">
        {/* Top Intelligence Ticker */}
        <div className="h-10 bg-indigo-600/10 border-b border-white/[0.05] flex items-center overflow-hidden whitespace-nowrap z-30 relative pointer-events-none">
          <div className="bg-indigo-600 px-4 h-full flex items-center text-[10px] font-black text-white uppercase tracking-widest z-10">
            AUTO-SIGNAL
          </div>
          <div className="animate-ticker inline-block text-[10px] font-bold text-indigo-300 uppercase tracking-widest pl-10">
            Neural cycles repeating every {config.updateIntervalMinutes}m... Syndication {config.autoPostToX ? 'ENABLED' : 'STBY'}... Tracking {config.topic}... Location: {userLocation ? 'Acquired' : 'Bypassed'}... Nodes: 12 Active...
          </div>
        </div>

        <div className="p-6 md:p-14 content-scroll">
          <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 md:mb-16">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">
                <Zap size={14} className="fill-indigo-400 animate-bounce" />
                Autonomous Intel Unit
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Command<br/>Center</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="glass px-6 py-4 rounded-3xl flex-1 md:flex-none flex items-center gap-5 border border-white/[0.08] shadow-2xl">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <Clock size={24} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-black leading-none mb-1 tracking-widest">Next Cycle</p>
                  <div className="text-2xl min-w-[80px]">
                    <CountdownTimer 
                      key={cycleId}
                      initialSeconds={config.updateIntervalMinutes * 60} 
                      onExpire={performUpdate} 
                    />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => performUpdate()}
                disabled={isLoading}
                className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-3xl hover:bg-indigo-500 hover:text-white transition-all duration-500 flex items-center gap-3 shadow-2xl disabled:opacity-50 group grow md:grow-0 justify-center"
              >
                <RefreshCcw size={18} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
                Scan Grid
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 lg:gap-12">
            {/* Feed Section */}
            <div className="xl:col-span-8 space-y-6">
              {error && (
                <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-400 border-l-4">
                  <AlertCircle size={24} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest mb-1">System Error</p>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {newsHistory.length === 0 && isLoading ? (
                <div className="h-[400px] md:h-[500px] flex flex-col items-center justify-center glass rounded-[3rem] border-dashed border-2 border-white/[0.05]">
                   <div className="relative mb-10">
                      <div className="w-24 h-24 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                      <Radio size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
                   </div>
                   <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Synchronizing Intel</h3>
                   <p className="text-sm text-slate-500 font-bold uppercase tracking-widest animate-pulse">Scanning Global Intelligence Nodes...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newsHistory.map((item, index) => (
                    <NewsCard 
                      key={item.id} 
                      news={item} 
                      isLatest={index === 0}
                      onPostToX={handleManualPost}
                    />
                  ))}
                  {newsHistory.length === 0 && !isLoading && (
                    <div className="text-center py-20 opacity-30">
                      <Unplug size={48} className="mx-auto mb-4" />
                      <p className="font-bold uppercase tracking-[0.2em]">Matrix Empty - Start Scan</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Matrix Config Section */}
            <div className="xl:col-span-4 space-y-10">
              <section className="glass rounded-[3rem] p-8 md:p-10 border border-white/[0.05] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full"></div>
                <h3 className="text-xl font-black text-white mb-8 md:mb-10 flex items-center gap-4 uppercase tracking-tighter">
                  <Settings size={22} className="text-indigo-400" />
                  Neural Control
                </h3>
                
                <div className="space-y-8 md:space-y-10">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block">Focus Protocol</label>
                    <div className="relative">
                      <select 
                        value={config.topic}
                        onChange={(e) => setConfig({...config, topic: e.target.value as NewsTopic})}
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 text-sm text-white font-bold focus:ring-2 ring-indigo-500/50 transition-all outline-none appearance-none cursor-pointer relative z-10"
                      >
                        {Object.values(NewsTopic).map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-20">
                        <ChevronRight className="rotate-90 text-slate-600" size={16} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block">Cycle Cadence</label>
                    <div className="grid grid-cols-4 gap-2">
                      {INTERVAL_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setConfig({...config, updateIntervalMinutes: opt.value})}
                          className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all duration-300 ${
                            config.updateIntervalMinutes === opt.value 
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30' 
                              : 'bg-white/[0.03] border-white/[0.05] text-slate-500 hover:border-white/20'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 md:pt-6">
                    <Toggle 
                      label="Local mode" 
                      sub="Regional Intel" 
                      icon={<Compass size={16}/>}
                      active={config.localMode}
                      disabled={!userLocation}
                      onClick={() => setConfig({...config, localMode: !config.localMode})}
                    />
                    <Toggle 
                      label="X Syndication" 
                      sub="Autonomous Posts" 
                      icon={<Share2 size={16}/>}
                      active={config.autoPostToX}
                      onClick={() => setConfig({...config, autoPostToX: !config.autoPostToX})}
                    />
                  </div>
                </div>
              </section>

              <section className="glass rounded-[3rem] p-8 md:p-10 border border-white/[0.05] shadow-2xl">
                <h3 className="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter">
                  <History size={22} className="text-indigo-400" />
                  Neural Audit
                </h3>
                <div className="space-y-3 font-mono text-[10px] text-slate-500 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
                  {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} className="flex gap-4 group p-2 rounded-lg hover:bg-white/[0.02] transition-colors border-l border-white/5">
                      <span className="text-indigo-500/40 font-black shrink-0">#{logs.length - i}</span>
                      <span className="group-hover:text-slate-300 transition-colors leading-relaxed tracking-tight">{log}</span>
                    </div>
                  )) : (
                    <div className="text-center py-4 opacity-30 italic">No cycles recorded...</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{icon: React.ReactNode, label: string, active?: boolean}> = ({icon, label, active}) => (
  <button className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all duration-300 font-black text-[11px] uppercase tracking-widest ${active ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/[0.05]'}`}>
    {icon}
    {label}
  </button>
);

const Toggle: React.FC<{label: string, sub: string, icon: React.ReactNode, active: boolean, onClick: () => void, disabled?: boolean}> = ({label, sub, icon, active, onClick, disabled}) => (
  <div className={`flex items-center justify-between p-4 md:p-5 rounded-3xl border transition-all duration-500 ${disabled ? 'opacity-30 grayscale pointer-events-none' : ''} ${active ? 'bg-indigo-600/5 border-indigo-500/20' : 'bg-white/[0.02] border-white/[0.05]'}`}>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl transition-all duration-500 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/[0.05] text-slate-500'}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{sub}</p>
      </div>
    </div>
    <button 
      onClick={onClick}
      className={`w-12 h-6 rounded-full relative transition-all duration-500 flex-shrink-0 ${active ? 'bg-indigo-600' : 'bg-slate-800'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 ${active ? 'left-7' : 'left-1'}`}></div>
    </button>
  </div>
);

export default App;
