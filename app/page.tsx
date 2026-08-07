import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import DashboardLayout from '@/components/dashboard-layout';
import LandingPage from '@/components/landing-page';
import { 
  VolumeOverTimeChart, 
  SentimentBreakdownChart, 
  TopThemesChart 
} from '@/components/charts';
import { 
  MessageSquare, 
  ThumbsUp, 
  AlertTriangle, 
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default async function Page() {
  const session = await getServerSession(authOptions);

  // If user is not authenticated, display the public landing page!
  if (!session?.user) {
    return <LandingPage />;
  }

  const { workspaceId } = session.user;

  // 1. Fetch KPI Statistics
  const totalVolume = await db.feedback.count({
    where: { workspaceId },
  });

  const posCount = await db.feedback.count({
    where: { workspaceId, sentiment: 'POS' },
  });

  const neuCount = await db.feedback.count({
    where: { workspaceId, sentiment: 'NEU' },
  });

  const negCount = await db.feedback.count({
    where: { workspaceId, sentiment: 'NEG' },
  });

  const totalClassified = posCount + neuCount + negCount || 1;
  const positivePercentage = Math.round((posCount / totalClassified) * 100);
  const negativePercentage = Math.round((negCount / totalClassified) * 100);

  // New feedback this week
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyVolume = await db.feedback.count({
    where: {
      workspaceId,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  // 2. Fetch Top Themes Data
  const themes = await db.theme.findMany({
    where: { workspaceId },
    include: {
      _count: {
        select: { feedback: true },
      },
    },
    orderBy: {
      feedback: {
        _count: 'desc',
      },
    },
    take: 5,
  });

  const topThemesData = themes.map(t => ({
    name: t.name,
    count: t._count.feedback,
    color: t.color || '#6366F1',
  }));

  // 3. Fetch Volume Over Time (last 15 days)
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  fifteenDaysAgo.setHours(0, 0, 0, 0);

  const feedbacksLast15Days = await db.feedback.findMany({
    where: {
      workspaceId,
      createdAt: { gte: fifteenDaysAgo },
    },
    select: { createdAt: true },
  });

  // Group by day in JS
  const dateMap: Record<string, number> = {};
  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dateMap[key] = 0;
  }

  feedbacksLast15Days.forEach(fb => {
    const key = fb.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dateMap[key] !== undefined) {
      dateMap[key]++;
    }
  });

  const volumeChartData = Object.entries(dateMap).map(([date, count]) => ({
    date,
    count,
  }));

  // 4. Donut Chart Data
  const sentimentChartData = [
    { name: 'Positive', value: posCount, color: '#10B981' },
    { name: 'Neutral', value: neuCount, color: '#6B7280' },
    { name: 'Negative', value: negCount, color: '#EF4444' },
  ];

  // Latest feedback preview
  const recentFeedback = await db.feedback.findMany({
    where: { workspaceId },
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: {
      themes: {
        include: { theme: true },
      },
    },
  });

  return (
    <DashboardLayout>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
            Feedback Intelligence
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time analytics, theme classifications, and AI summaries for your product.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-card px-4 py-2 rounded-lg border border-border text-sm text-text-secondary">
          <Calendar className="w-4 h-4 text-primary" />
          <span>Last 15 Days</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="glass-card p-6 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Total Ingested</span>
            <span className="text-3xl font-bold font-display mt-1.5 block">{totalVolume}</span>
            <span className="text-xs text-text-muted mt-1 block">Feedback items overall</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-6 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Positive Sentiment</span>
            <span className="text-3xl font-bold font-display text-success mt-1.5 block">{positivePercentage}%</span>
            <span className="text-xs text-text-muted mt-1 block">{posCount} positive comments</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
            <ThumbsUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-6 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Critical Issues</span>
            <span className="text-3xl font-bold font-display text-danger mt-1.5 block">{negativePercentage}%</span>
            <span className="text-xs text-text-muted mt-1 block">{negCount} negative comments</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-6 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Ingested This Week</span>
            <span className="text-3xl font-bold font-display text-primary-light mt-1.5 block">+{weeklyVolume}</span>
            <span className="text-xs text-text-muted mt-1 block">Last 7 days volume</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {totalVolume === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1E2638] flex items-center justify-center text-primary-light mx-auto mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No feedback data found</h3>
          <p className="text-text-secondary max-w-md mx-auto mb-6 text-sm">
            Welcome to LOOP! Get started by ingesting single entries or doing a bulk CSV import in the inbox.
          </p>
          <Link href="/inbox" className="btn-gradient inline-flex items-center gap-2">
            <span>Triage Inbox</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Volume */}
            <div className="glass-card p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                Feedback Ingestion Trends
              </h2>
              <VolumeOverTimeChart data={volumeChartData} />
            </div>

            {/* Chart 2: Sentiment */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                Sentiment Breakdown
              </h2>
              <SentimentBreakdownChart data={sentimentChartData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 3: Top Themes */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                Top Classified Themes
              </h2>
              {topThemesData.length === 0 ? (
                <div className="h-64 flex flex-col justify-center items-center text-text-muted text-sm">
                  No taxonomy mapped yet. Processing entries.
                </div>
              ) : (
                <TopThemesChart data={topThemesData} />
              )}
            </div>

            {/* Recent activity log */}
            <div className="glass-card p-6 lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Recent Customer Activity
                </h2>
                <Link href="/inbox" className="text-primary-light text-xs font-semibold hover:underline flex items-center gap-1">
                  <span>View Full Inbox</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-4 flex-1">
                {recentFeedback.map((fb) => (
                  <div key={fb.id} className="p-4 bg-[#111522]/60 hover:bg-[#151B2B] rounded-lg border border-border/60 transition-colors flex flex-col gap-2.5">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          fb.channel === 'SUPPORT' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          fb.channel === 'APP_STORE' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          fb.channel === 'NPS' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {fb.channel}
                        </span>
                        
                        {fb.sentiment && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            fb.sentiment === 'POS' ? 'bg-success/15 text-success border border-success/20' :
                            fb.sentiment === 'NEG' ? 'bg-danger/15 text-danger border border-danger/20' :
                            'bg-slate-500/15 text-text-secondary border border-slate-500/20'
                          }`}>
                            {fb.sentiment}
                          </span>
                        )}
                        
                        {fb.customerLabel && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-medium">
                            {fb.customerLabel}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-muted font-medium">
                        {fb.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      &ldquo;{fb.content}&rdquo;
                    </p>
                    {fb.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {fb.themes.map((ft) => (
                          <span 
                            key={ft.theme.id} 
                            className="text-[9px] px-1.5 py-0.25 rounded-full font-medium"
                            style={{ 
                              color: ft.theme.color || '#6366F1', 
                              backgroundColor: `${ft.theme.color || '#6366F1'}15`,
                              border: `1px solid ${ft.theme.color || '#6366F1'}25`
                            }}
                          >
                            {ft.theme.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
