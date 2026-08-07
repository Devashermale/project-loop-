'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  MessageSquare,
  ChevronRight,
  Layers,
  Flame,
  Info
} from 'lucide-react';
import Link from 'next/link';

interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  sentiment: string | null;
  createdAt: string;
  themes: {
    themeId: string;
  }[];
}

interface Theme {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

export default function TrendsPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  // Fetch themes and feedbacks
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [themesRes, feedbacksRes] = await Promise.all([
          fetch('/api/themes'),
          fetch('/api/feedback?limit=1000') // Grab a large sample of recent records for trends mapping
        ]);

        if (themesRes.ok && feedbacksRes.ok) {
          const themesData = await themesRes.json();
          const feedbacksData = await feedbacksRes.json();
          setThemes(themesData);
          setFeedbacks(feedbacksData.feedbacks || []);
        }
      } catch (err) {
        console.error('Failed to load trends data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute theme trends analytics
  const themeAnalytics = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    return themes.map(theme => {
      // Find all feedbacks matching this theme
      const matchedFeedbacks = feedbacks.filter(fb => 
        fb.themes.some(ft => ft.themeId === theme.id)
      );

      // Volume in last 7 days
      const currentPeriodCount = matchedFeedbacks.filter(fb => 
        new Date(fb.createdAt) >= sevenDaysAgo
      ).length;

      // Volume in preceding 7 days
      const previousPeriodCount = matchedFeedbacks.filter(fb => {
        const d = new Date(fb.createdAt);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
      }).length;

      // Calculate Spike Delta
      let spikeDelta = 0;
      if (previousPeriodCount > 0) {
        spikeDelta = ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100;
      } else if (currentPeriodCount > 0) {
        spikeDelta = currentPeriodCount * 100; // 100% per unit increase if started from zero
      }

      // Check if spiking (e.g. increase by more than 40% and has a minimum current volume of 2 items)
      const isSpiking = currentPeriodCount >= 2 && spikeDelta >= 40;

      // Daily distribution for sparkline (last 15 days)
      const dailyCounts = Array.from({ length: 15 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0,0,0,0);
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: 0
        };
      }).reverse();

      matchedFeedbacks.forEach(fb => {
        const fbDate = new Date(fb.createdAt);
        fbDate.setHours(0,0,0,0);
        const dayMatch = dailyCounts.find(c => new Date(c.date + `, ${new Date().getFullYear()}`).getTime() === fbDate.getTime());
        if (dayMatch) {
          dayMatch.count++;
        }
      });

      return {
        ...theme,
        totalCount: matchedFeedbacks.length,
        currentPeriodCount,
        previousPeriodCount,
        spikeDelta,
        isSpiking,
        dailyCounts,
        feedbacks: matchedFeedbacks
      };
    }).sort((a, b) => b.totalCount - a.totalCount);
  }, [themes, feedbacks]);

  // Feedbacks list for the currently selected theme
  const selectedThemeFeedbacks = useMemo(() => {
    if (!selectedTheme) return [];
    const analyticObj = themeAnalytics.find(t => t.id === selectedTheme.id);
    return analyticObj ? analyticObj.feedbacks : [];
  }, [selectedTheme, themeAnalytics]);

  return (
    <DashboardLayout>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
            Theme Trends
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Track categorized user topics, detect spiking problem areas, and drill down into customer messages.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="glass-card p-6 h-56 bg-slate-900/40" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Spike Alerts Panel */}
          {themeAnalytics.some(t => t.isSpiking) && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 animate-pulse">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-rose-400 font-bold uppercase tracking-wider block">Emerging Issues Alert</span>
                <p className="text-sm text-text-primary mt-0.5">
                  Negative comments or issue frequency is spiking for: {' '}
                  {themeAnalytics.filter(t => t.isSpiking).map((t, idx) => (
                    <span key={t.id} className="font-semibold text-rose-300">
                      {t.name} (+{Math.round(t.spikeDelta)}%){idx < themeAnalytics.filter(t => t.isSpiking).length - 1 ? ', ' : ''}
                    </span>
                  ))}.
                </p>
              </div>
            </div>
          )}

          {/* Theme Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themeAnalytics.map((theme) => {
              const spikeText = theme.spikeDelta > 0 ? `+${Math.round(theme.spikeDelta)}%` : `${Math.round(theme.spikeDelta)}%`;
              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`glass-card p-6 glass-card-hover cursor-pointer flex flex-col gap-4 relative overflow-hidden ${
                    selectedTheme?.id === theme.id ? 'border-primary shadow-glow bg-[#1C2335]/70' : ''
                  }`}
                >
                  {/* Theme Accent Border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: theme.color || '#6366F1' }} />
                  
                  {/* Title & Count */}
                  <div className="flex justify-between items-start pl-2">
                    <div className="pr-4">
                      <h3 className="font-semibold text-base text-text-primary line-clamp-1">{theme.name}</h3>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{theme.description || 'Auto-clustered feedback category.'}</p>
                    </div>
                    {theme.isSpiking && (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                        <Flame className="w-2.5 h-2.5" />
                        Spiking
                      </span>
                    )}
                  </div>

                  {/* Volume Indicators */}
                  <div className="grid grid-cols-2 gap-4 pl-2 mt-2">
                    <div className="bg-[#111522]/60 p-2.5 rounded-lg border border-border/40">
                      <span className="text-[10px] text-text-muted uppercase font-medium">Total Items</span>
                      <span className="text-2xl font-bold font-display block mt-0.5">{theme.totalCount}</span>
                    </div>

                    <div className="bg-[#111522]/60 p-2.5 rounded-lg border border-border/40 flex flex-col justify-between">
                      <span className="text-[10px] text-text-muted uppercase font-medium">Weekly Delta</span>
                      <div className="flex items-center gap-1 mt-1">
                        {theme.spikeDelta > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-rose-400" />
                        ) : theme.spikeDelta < 0 ? (
                          <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-400" />
                        )}
                        <span className={`text-sm font-bold ${
                          theme.spikeDelta > 0 ? 'text-rose-400' : 
                          theme.spikeDelta < 0 ? 'text-emerald-400' : 'text-slate-400'
                        }`}>
                          {spikeText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Theme Drilldown Arrow */}
                  <div className="flex justify-end items-center text-xs font-semibold text-primary-light hover:text-white mt-2 transition-colors pl-2">
                    <span>Inspect Feedback</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drill-down panel displaying matching feedbacks */}
          {selectedTheme && (
            <div className="glass-card p-6 border border-primary/30 relative animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      Drill-down: {selectedTheme.name}
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Displaying {selectedThemeFeedbacks.length} feedback items classified under this category.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTheme(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#1E2638] text-xs font-bold hover:bg-[#252E44] text-text-secondary hover:text-text-primary transition-colors"
                >
                  Close Drill-down
                </button>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {selectedThemeFeedbacks.length === 0 ? (
                  <p className="text-center text-text-muted py-8 text-sm italic">
                    No matching verbatim quotes found in cache.
                  </p>
                ) : (
                  selectedThemeFeedbacks.map((fb) => (
                    <div key={fb.id} className="p-4 bg-[#111522]/80 border border-border/70 rounded-lg hover:border-primary/20 transition-all flex flex-col gap-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-bold font-mono">
                            {fb.channel}
                          </span>
                          {fb.sentiment && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded uppercase ${
                              fb.sentiment === 'POS' ? 'bg-success/15 text-success border border-success/20' :
                              fb.sentiment === 'NEG' ? 'bg-danger/15 text-danger border border-danger/20' :
                              'bg-slate-500/15 text-text-secondary border border-slate-500/20'
                            }`}>
                              {fb.sentiment}
                            </span>
                          )}
                        </div>
                        <span className="text-text-muted">
                          {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary leading-relaxed font-medium">
                        &ldquo;{fb.content}&rdquo;
                      </p>
                      <div className="flex justify-between items-center text-xs text-primary-light font-semibold mt-1">
                        <span>Workspace Record</span>
                        <Link href="/inbox" className="hover:underline flex items-center gap-0.5">
                          <span>Triage Item</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
