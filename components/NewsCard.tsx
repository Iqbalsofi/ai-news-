
import React, { useState } from 'react';
import { NewsItem, Sentiment } from '../types';
// Added CheckCircle2 to the imports from lucide-react to fix the "Cannot find name 'CheckCircle2'" error
import { ExternalLink, Twitter, Clock, MapPin, TrendingUp, TrendingDown, Minus, ShieldCheck, Image as ImageIcon, Send, CheckCircle2 } from 'lucide-react';

interface NewsCardProps {
  news: NewsItem;
  onPostToX?: (news: NewsItem) => void;
  isLatest?: boolean;
}

const SentimentBadge: React.FC<{ sentiment: Sentiment }> = ({ sentiment }) => {
  const configs = {
    bullish: { color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5', icon: TrendingUp, label: 'Bullish' },
    bearish: { color: 'text-rose-400 border-rose-500/30 bg-rose-500/5', icon: TrendingDown, label: 'Bearish' },
    neutral: { color: 'text-slate-400 border-slate-500/30 bg-slate-500/5', icon: Minus, label: 'Neutral' }
  };
  const config = configs[sentiment];
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${config.color}`}>
      <Icon size={10} /> {config.label}
    </div>
  );
};

const NewsCard: React.FC<NewsCardProps> = React.memo(({ news, onPostToX, isLatest }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: 'numeric', hour12: true,
  }).format(news.timestamp);

  const handlePostDirectly = () => {
    // Twitter Web Intent for "direct" manual posting
    const text = encodeURIComponent(`🚨 CHRONOS INTEL: ${news.title}\n\n${news.summary.substring(0, 150)}...\n\n#AI #${news.topic.replace(/\s+/g, '')}`);
    const url = encodeURIComponent(news.sources[0]?.url || "https://chronos-ai.node");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    onPostToX?.(news);
  };

  return (
    <div 
      className={`glass rounded-2xl overflow-hidden mb-5 transition-all duration-500 card-glow group ${isLatest ? 'ring-1 ring-indigo-500/30 shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="md:flex h-full">
        <div className="md:w-64 lg:w-80 relative overflow-hidden shrink-0 bg-[#0a0f1e] min-h-[240px] flex items-center justify-center">
          {!imageLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 bg-slate-900/50">
               <ImageIcon size={32} className="mb-2 animate-pulse" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Acquiring Signal...</span>
            </div>
          )}
          <img 
            src={news.imageUrl} 
            alt={news.title} 
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-1000 ease-out ${imageLoaded ? 'opacity-100 grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110' : 'opacity-0'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#02040a]/80 via-transparent to-transparent md:bg-gradient-to-t" />
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <span className="bg-indigo-600 px-2 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-tighter shadow-lg">{news.topic}</span>
               {news.location && news.location !== 'Global' && (
                <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase flex items-center gap-1 border border-white/10">
                  <MapPin size={8} /> {news.location}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between bg-gradient-to-br from-white/[0.03] to-transparent relative">
          {isLatest && (
            <div className="absolute top-4 right-8 flex items-center gap-1.5 text-[8px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
              Live Intel
            </div>
          )}
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                <div className="flex items-center gap-1.5"><Clock size={12} className="text-indigo-400" /> {formattedTime}</div>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <div className="flex items-center gap-1 text-emerald-500/70"><ShieldCheck size={12} /> Verified Signal</div>
              </div>
              <SentimentBadge sentiment={news.sentiment} />
            </div>
            <h3 className="text-xl lg:text-2xl font-black mb-4 text-white leading-[1.1] tracking-tight group-hover:text-indigo-300 transition-colors duration-300">{news.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 font-medium border-l-2 border-indigo-500/20 pl-4">{news.summary}</p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/[0.05]">
            <div className="flex items-center gap-1.5">
              {news.sources.map((source, idx) => (
                <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-white/[0.03] hover:bg-indigo-500/20 rounded-xl border border-white/[0.05] text-slate-400 hover:text-indigo-300 transition-all duration-300 group/link" title={source.title}>
                  <ExternalLink size={14} className="group-hover/link:scale-110 transition-transform" />
                </a>
              ))}
              <span className="ml-2 hidden lg:inline text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">{news.sources.length} SOURCES</span>
            </div>
            
            <button 
              onClick={handlePostDirectly}
              disabled={news.isPostedToX}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group/btn ${
                news.isPostedToX 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                  : 'bg-white text-black hover:bg-indigo-600 hover:text-white shadow-xl hover:scale-105 active:scale-95'
              }`}
            >
              <div className="absolute inset-0 bg-indigo-500 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 z-0"></div>
              <span className="relative z-10 flex items-center gap-2">
                {news.isPostedToX ? <CheckCircle2 size={14} /> : <Twitter size={14} />}
                {news.isPostedToX ? 'Syndicated' : 'Post Direct'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default NewsCard;
