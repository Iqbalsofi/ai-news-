
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Settings, RefreshCcw, History, ChevronRight, Zap, LayoutDashboard, Radio, 
  Share2, AlertCircle, Clock, Compass, Globe, BellRing, Activity, Cpu, 
  Unplug, Twitter, CheckCircle2, XCircle, LogOut, Code, Server
} from 'lucide-react';
import { NewsItem, NewsTopic, AppConfig, AppView } from './types';
import { fetchNewsUpdate, simulatePostToX } from './services/geminiService';
import NewsCard from './components/NewsCard';

const INTERVAL_OPTIONS = [
  { label: '1m', value: 1 },
  { label: '15m', value: 15 },
  { label: '1h', value: 60 },
  { label: '4h', value: 240 }
];

const CountdownTimer: React.FC<{ initialSeconds: number, onExpire: () => void }> = ({ initialSeconds, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  useEffect(() => setTimeLeft(initialSeconds), [initialSeconds]);
  useEffect(() => {
    if (timeLeft <= 0) { onExpire(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  return <span className="mono font-black text-white">{h > 0 ? h + ':' : ''}{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('hub');
  const [newsHistory, setNewsHistory] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkingX, setIsLinkingX] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [cycleId, setCycleId] = useState(0);
  
  const [config, setConfig] = useState<AppConfig>({
    topic: NewsTopic.TECH,
    updateIntervalMinutes: 1,
    autoPostToX: true,
    localMode: false,
    isXConnected: false
  });
  
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => {
    setLogs(prev => [ `[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => addLog("Location bypass established.")
      );
    }
  }, [addLog]);

  const performUpdate = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    addLog(`GRID SCAN: Initializing ${config.topic} fetch...`);

    try {
      const newNews = await fetchNewsUpdate(config.topic, config.localMode ? userLocation : null);
      const isDuplicate = newsHistory.length > 0 && newsHistory[0].title === newNews.title;
      
      if (isDuplicate) {
        addLog("SIGNAL STABILITY: No new variations detected.");
      } else {
        let updatedNews = newNews;
        if (config.autoPostToX && config.isXConnected) {
          addLog("X-SYNDICATION: Transmitting autonomous packet...");
          await simulatePostToX(newNews);
          updatedNews = { ...newNews, isPostedToX: true };
          addLog("X-SYNDICATION: Broadcast success. API OK.");
        } else if (config.autoPostToX && !config.isXConnected) {
          addLog("X-SYNDICATION: FAILED. Uplink required.");
        }
        setNewsHistory(prev => [updatedNews, ...prev].slice(0, 20));
        addLog(`SYNC COMPLETE: "${newNews.title.substring(0, 35)}..."`);
      }
    } catch (err) {
      addLog("NODE CRITICAL: Neural link severed.");
      setError("AI Gateway failure. Automatic recovery in 60s.");
    } finally {
      setIsLoading(false);
      setCycleId(prev => prev + 1);
    }
  }, [config, newsHistory, isLoading, userLocation, addLog]);

  useEffect(() => { performUpdate(); }, []);

  const handleLinkX = () => {
    setIsLinkingX(true);
    addLog("OAUTH: Initiating X-API v2 Handshake...");
    setTimeout(() => {
      setConfig(prev => ({ ...prev, isXConnected: true }));
      setIsLinkingX(false);
      addLog("OAUTH: Linked to @Chronos_Node_Primary");
    }, 2000);
  };

  const handleManualPost = useCallback(async (news: NewsItem) => {
    if (!config.isXConnected) {
      addLog("SECURITY: Unauthorized. Link X account.");
      return;
    }
    // We already handle the browser redirect in NewsCard
    // This updates the local history state
    setNewsHistory(prev => prev.map(n => n.id === news.id ? { ...n, isPostedToX: true } : n));
    addLog("MANUAL: Direct transmission initiated.");
  }, [config.isXConnected, addLog]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#02040a] text-slate-300 selection:bg-indigo-500/30">
      {/* Sidebar - Functional Navigation */}
      <aside className="w-full md:w-80 glass border-b md:border-b-0 md:border-r border-white/[0.05] p-6 md:p-8 flex flex-col md:fixed h-auto md:h-full z-50">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-10 md:mb-16">
            <div className="relative w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] pulse-ring">
              <Radio className="text-white relative z-10" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-none uppercase">Chronos</h1>
              <p className="text-[9px] text-indigo-400 font-black tracking-[0.3em] uppercase mt-1.5">Intelligence</p>
            </div>
          </div>

          <nav className="space-y-2 mb-10">
            <NavItem 
              icon={<LayoutDashboard size={18}/>} 
              label="Neural Hub" 
              active={activeView === 'hub'} 
              onClick={() => setActiveView('hub')} 
            />
            <NavItem 
              icon={<Globe size={18}/>} 
              label="Geo-Mapping" 
              active={activeView === 'map'} 
              onClick={() => setActiveView('map')} 
            />
            <NavItem 
              icon={<History size={18}/>} 
              label="Audit Logs" 
              active={activeView === 'memory'} 
              onClick={() => setActiveView('memory')} 
            />
          </nav>

          <div className="space-y-4">
            <div className="p-5 bg-white/[0.02] rounded-3xl border border-white/[0.05] shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">X Integration</span>
                {config.isXConnected ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-rose-500" />}
              </div>
              
              {config.isXConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white">X</div>
                    <div>
                      <p className="text-xs font-black text-white">@AI_Node_Primary</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Status: Broadcasting</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setConfig({...config, isXConnected: false})} 
                    className="w-full text-[9px] font-black text-slate-500 hover:text-rose-400 transition-colors flex items-center justify-center gap-2 uppercase py-2 border border-white/[0.05] rounded-xl"
                  >
                    <LogOut size={12} /> Sever Link
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[9px] text-slate-500 font-bold leading-relaxed mb-1">Authorization required for autonomous syndication.</p>
                  <button 
                    onClick={handleLinkX}
                    disabled={isLinkingX}
                    className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isLinkingX ? <RefreshCcw size={14} className="animate-spin" /> : <Twitter size={14} />}
                    {isLinkingX ? 'Authorizing...' : 'Link X Account'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/[0.05] space-y-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Core Active</span>
             </div>
             <span className="mono text-[9px] text-indigo-500">v3.0.4-L</span>
           </div>
        </div>
      </aside>

      {/* Main Content - Functional Views */}
      <main className="flex-1 md:ml-80 relative z-10 bg-[#02040a]">
        <div className="h-10 bg-indigo-600/5 border-b border-white/[0.03] flex items-center overflow-hidden whitespace-nowrap z-30 relative pointer-events-none">
          <div className="bg-indigo-600 px-4 h-full flex items-center text-[9px] font-black text-white uppercase tracking-[0.2em] z-10">NEURAL-BUS</div>
          <div className="animate-ticker inline-block text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest pl-10">
            Node status: ACTIVE | Topic: {config.topic} | Automation: {config.autoPostToX ? 'AUTO' : 'MANUAL'} | {config.isXConnected ? 'X-SYNDICATION: READY' : 'X-SYNDICATION: OFFLINE'} | Latency: 42ms | Synchronizing global frequency...
          </div>
        </div>

        <div className="p-6 md:p-14 min-h-screen">
          {activeView === 'hub' ? (
            <>
              <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-16">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
                    <Zap size={14} className="fill-indigo-400" /> Autonomous News Grid
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]">Command<br/>Hub</h2>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  <div className="glass px-8 py-5 rounded-[2rem] flex items-center gap-6 border border-white/[0.08] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <div className="p-3 bg-indigo-500/10 rounded-2xl relative z-10">
                      <Clock size={28} className="text-indigo-400" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] uppercase text-slate-500 font-black mb-1.5 tracking-widest">Next Signal</p>
                      <div className="text-3xl min-w-[100px]">
                        <CountdownTimer key={cycleId} initialSeconds={config.updateIntervalMinutes * 60} onExpire={performUpdate} />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => performUpdate()} 
                    disabled={isLoading} 
                    className="px-10 py-5 bg-white text-black font-black uppercase text-xs rounded-[2rem] hover:bg-indigo-600 hover:text-white transition-all duration-500 flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
                    Scan Frequency
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                <div className="xl:col-span-8 space-y-6">
                  {error && (
                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4 text-rose-400 border-l-4 shadow-lg">
                      <AlertCircle size={28} />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">Critical Fault</p>
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {newsHistory.length === 0 && isLoading ? (
                    <div className="h-[600px] flex flex-col items-center justify-center glass rounded-[4rem] border-dashed border-2 border-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
                       <div className="relative mb-10">
                          <div className="w-28 h-28 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                          <Radio size={36} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
                       </div>
                       <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Acquiring Intel</h3>
                       <p className="text-xs text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Scanning Global Neural Layers...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {newsHistory.map((item, index) => (
                        <NewsCard key={item.id} news={item} isLatest={index === 0} onPostToX={handleManualPost} />
                      ))}
                      {newsHistory.length === 0 && !isLoading && (
                        <div className="text-center py-32 opacity-20 flex flex-col items-center border-2 border-dashed border-white/5 rounded-[4rem]">
                          <Unplug size={64} className="mb-6" />
                          <p className="text-xl font-black uppercase tracking-[0.4em]">Grid Silent</p>
                          <p className="text-xs mt-2 uppercase font-bold tracking-widest">Execute Scan to sync</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="xl:col-span-4 space-y-10">
                  <section className="glass rounded-[3rem] p-10 border border-white/[0.05] shadow-2xl sticky top-14">
                    <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 uppercase tracking-tighter">
                      <Settings size={22} className="text-indigo-400" /> Matrix Configuration
                    </h3>
                    <div className="space-y-10">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4 block">Operation Focus</label>
                        <select 
                          value={config.topic}
                          onChange={(e) => setConfig({...config, topic: e.target.value as NewsTopic})}
                          className="w-full bg-[#0a0f1e] border border-white/[0.08] rounded-2xl p-5 text-sm text-white font-black uppercase tracking-widest focus:ring-2 ring-indigo-500/50 outline-none cursor-pointer hover:bg-indigo-500/5 transition-all"
                        >
                          {Object.values(NewsTopic).map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4 block">Neural Cadence</label>
                        <div className="grid grid-cols-4 gap-2">
                          {INTERVAL_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setConfig({...config, updateIntervalMinutes: opt.value})}
                              className={`py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl border transition-all duration-300 ${
                                config.updateIntervalMinutes === opt.value ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105' : 'bg-white/[0.03] border-white/[0.05] text-slate-500 hover:border-white/20'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-6">
                        <Toggle 
                          label="Local mode" 
                          sub="Geo-Targeted Intel" 
                          active={config.localMode} 
                          disabled={!userLocation} 
                          onClick={() => setConfig({...config, localMode: !config.localMode})} 
                          icon={<Compass size={18}/>}
                        />
                        <Toggle 
                          label="Auto-Syndicate" 
                          sub="Autonomous X-Posts" 
                          active={config.autoPostToX} 
                          onClick={() => setConfig({...config, autoPostToX: !config.autoPostToX})} 
                          icon={<Share2 size={18}/>}
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </>
          ) : activeView === 'map' ? (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-10">
              <div className="relative">
                <Globe size={120} className="text-indigo-500 animate-pulse relative z-10" />
                <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-6xl font-black text-white tracking-tighter uppercase">Intelligence Grid</h2>
                <p className="text-slate-500 uppercase font-black tracking-[0.5em]">Real-time Global Heatmap Synthesis</p>
              </div>
              <div className="w-full max-w-4xl h-96 glass rounded-[4rem] flex flex-col items-center justify-center border-dashed border-2 border-white/5 space-y-6">
                 <Server size={48} className="text-indigo-500/40" />
                 <p className="text-xs text-indigo-400 font-mono tracking-[0.3em] uppercase">[ DECRYPTING GEOSPATIAL LAYERS ]</p>
                 <div className="flex gap-2">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-8 h-1 bg-indigo-500/20 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 animate-progress" style={{animationDelay: `${i*200}ms`}}></div>
                    </div>)}
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
               <div>
                  <h2 className="text-6xl font-black text-white tracking-tighter leading-none mb-4 uppercase">Neural<br/>Audit</h2>
                  <p className="text-slate-500 uppercase font-black tracking-[0.3em]">System cycles and autonomous decisions.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-8 glass rounded-[3rem] border border-white/5 bg-indigo-600/5 col-span-full">
                     <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Code size={14} /> LIVE LOG STREAM
                     </h4>
                     <div className="space-y-4 font-mono text-[11px] h-[500px] overflow-y-auto custom-scrollbar pr-4">
                        {logs.length > 0 ? logs.map((log, i) => (
                          <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] flex gap-5 group hover:bg-white/[0.05] transition-colors">
                             <span className="text-indigo-500/50 font-black shrink-0 w-8">#{logs.length - i}</span>
                             <span className="text-slate-400 group-hover:text-white transition-colors">{log}</span>
                          </div>
                        )) : (
                          <div className="flex items-center justify-center h-full text-slate-700 uppercase font-black tracking-widest">No cycles recorded</div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-4 w-full p-5 rounded-2xl transition-all duration-500 font-black text-[11px] uppercase tracking-[0.2em] relative group ${
      active 
        ? 'bg-indigo-600 text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.5)] scale-105 z-10' 
        : 'text-slate-500 hover:text-white hover:bg-white/[0.05]'
    }`}
  >
    <span className={`transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    {label}
    {active && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]"></div>}
  </button>
);

const Toggle: React.FC<{label: string, sub: string, icon: React.ReactNode, active: boolean, onClick: () => void, disabled?: boolean}> = ({label, sub, icon, active, onClick, disabled}) => (
  <div className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 ${disabled ? 'opacity-30 pointer-events-none grayscale' : ''} ${active ? 'bg-indigo-600/10 border-indigo-500/30 shadow-inner' : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10'}`}>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl transition-all duration-500 ${active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/[0.05] text-slate-500'}`}>
        {icon}
      </div>
      <div>
        <p className="text-[12px] font-black text-white uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{sub}</p>
      </div>
    </div>
    <button 
      onClick={onClick} 
      className={`w-14 h-7 rounded-full relative transition-all duration-500 overflow-hidden ${active ? 'bg-indigo-600' : 'bg-slate-800'}`}
    >
      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 ${active ? 'left-8' : 'left-1'}`}></div>
    </button>
  </div>
);

export default App;
