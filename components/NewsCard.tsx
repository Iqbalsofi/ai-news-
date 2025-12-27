
import React from 'react';
import { NewsItem, Sentiment } from '../types';
import { ExternalLink, Twitter, Clock, MapPin, TrendingUp, TrendingDown, Minus, ShieldCheck } from 'lucide-react';

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
      <Icon size={10} />
      {config.label}
    </div>
  );
};

const NewsCard: React.FC<NewsCardProps> = React.memo(({ news, onPostToX, isLatest }) => {
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(news.timestamp);

  return (
    <div className={`glass rounded-2xl overflow-hidden mb-5 transition-all duration-500 card-glow group ${isLatest ? 'ring-1 ring-indigo-500/30' : ''}`}>
      <div className="md:flex h-full">
        {/* Visual Content Section */}
        <div className="md:w-64 lg:w-80 relative overflow-hidden shrink-0">
          <img 
            src={news.imageUrl} 
            alt={news.title} 
            className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent md:bg-gradient-to-t" />
          
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <span className="bg-indigo-600 px-2 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-tighter">
                {news.topic}
              </span>
              {news.location && news.location !== 'Global' && (
                <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase flex items-center gap-1">
                  <MapPin size={8} />
                  {news.location}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Info Section */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between bg-gradient-to-br from-white/[0.02] to-transparent">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-indigo-400" />
                  {formattedTime}
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <div className="flex items-center gap-1 text-emerald-500/70">
                  <ShieldCheck size={12} />
                  Verified Signal
                </div>
              </div>
              <SentimentBadge sentiment={news.sentiment} />
            </div>
            
            <h3 className="text-xl lg:text-2xl font-extrabold mb-4 text-white leading-[1.15] tracking-tight group-hover:text-indigo-300 transition-colors duration-300">
              {news.title}
            </h3>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
              {news.summary}
            </p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/[0.03]">
            <div className="flex items-center gap-1">
              {news.sources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center bg-white/[0.03] hover:bg-indigo-500/20 rounded-xl border border-white/[0.05] text-slate-400 hover:text-indigo-300 transition-all duration-300"
                  title={source.title}
                >
                  <ExternalLink size={14} />
                </a>
              ))}
              <span className="ml-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                {news.sources.length} Intelligence Sources
              </span>
            </div>
            
            <button 
              onClick={() => onPostToX?.(news)}
              disabled={news.isPostedToX}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                news.isPostedToX 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                  : 'bg-white text-black hover:bg-indigo-500 hover:text-white shadow-lg shadow-white/5'
              }`}
            >
              {news.isPostedToX ? 'Broadcasting Success' : <><Twitter size={14} /> Syndication</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default NewsCard;
