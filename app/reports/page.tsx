'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard-layout';
import { 
  FileText, 
  Calendar, 
  Printer, 
  Plus, 
  Sparkles, 
  User, 
  AlertCircle,
  TrendingUp,
  ThumbsUp,
  AlertTriangle,
  Layout,
  Clock,
  X
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  contentJson: string; // JSON with markdownContent and stats
  createdAt: string;
  generatedBy: {
    name: string;
    email: string;
  };
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const isViewer = session?.user?.role === 'VIEWER';

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // New report form state
  const [title, setTitle] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [showGenForm, setShowGenForm] = useState(false);

  // Fetch reports list
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    setGenerating(true);
    setGenError('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, periodStart, periodEnd }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate report');

      // Update lists
      setReports(prev => [data, ...prev]);
      setSelectedReport(data);
      
      // Reset form
      setTitle('');
      setPeriodStart('');
      setPeriodEnd('');
      setShowGenForm(false);
    } catch (err: any) {
      setGenError(err.message || 'Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  // Parse stats and markdown out of Report contentJson
  const parsedContent = React.useMemo(() => {
    if (!selectedReport) return null;
    try {
      return JSON.parse(selectedReport.contentJson);
    } catch (e) {
      console.error('Failed to parse report JSON content:', e);
      return null;
    }
  }, [selectedReport]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      {/* Hide page wrappers when printing */}
      <style jsx global>{`
        @media print {
          aside, main > div > div:first-child, .no-print {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          .print-area {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            color: black !important;
          }
          .print-area * {
            color: black !important;
          }
          .print-card {
            border: 1px solid #ddd !important;
            background: #fff !important;
          }
        }
      `}</style>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 no-print">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
            Voice-of-Customer Reports
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Generate and export structured summaries of customer feedback trends and priorities.
          </p>
        </div>
        
        {!isViewer && (
          <button
            onClick={() => setShowGenForm(prev => !prev)}
            className="btn-gradient flex items-center gap-1.5 text-sm font-semibold"
          >
            {showGenForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showGenForm ? 'Close panel' : 'Generate Report'}</span>
          </button>
        )}
      </div>

      {/* Report Generation Form Panel */}
      {showGenForm && !isViewer && (
        <div className="glass-card p-6 border border-primary-light/30 no-print animate-in slide-in-from-top duration-300">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-light" />
            Synthesize New VoC Summary
          </h2>

          {genError && (
            <div className="bg-danger/10 border border-danger/25 text-danger px-4 py-3 rounded-lg text-sm flex items-start gap-2.5 mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{genError}</span>
            </div>
          )}

          <form onSubmit={handleCreateReport} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Report Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. July 2026 Feedback Summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                End Date
              </label>
              <input
                type="date"
                required
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
              />
            </div>

            <div className="md:col-span-4 flex justify-end pt-2 gap-3">
              <button
                type="button"
                onClick={() => setShowGenForm(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-[#1E2638] text-sm text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="btn-gradient px-4 py-2 text-sm flex items-center gap-1.5"
              >
                {generating && <Sparkles className="w-4 h-4 animate-pulse" />}
                <span>{generating ? 'Synthesizing Summary...' : 'Create Summary'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Reports Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Saved Reports Directory (Left Sidebar) */}
        <div className="lg:col-span-1 glass-card p-4 space-y-4 no-print w-full">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block border-b border-border/50 pb-2">
            Historical Digest List
          </span>
          
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-12 bg-slate-800 rounded w-full" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <p className="text-xs text-text-muted italic text-center py-6">No reports generated yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {reports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`w-full text-left p-3 rounded-lg text-xs font-medium transition-all group flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-primary text-white shadow-glow' 
                        : 'bg-[#121622]/60 border border-border/50 text-text-secondary hover:text-text-primary hover:bg-[#1E2638]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-text-secondary group-hover:text-primary-light'}`} />
                      <span className="font-semibold line-clamp-1">{report.title}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] opacity-75">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Report Viewer Pane (Right Main) */}
        <div className="lg:col-span-3 space-y-6 w-full">
          {generating && (
            <div className="glass-card p-12 text-center flex flex-col items-center no-print">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Synthesizing Feedback digest...</h3>
              <p className="text-xs text-text-secondary max-w-sm">
                Analyzing sentiment shifts, grouping top taxonomy metrics, and compiling representative customer quotes into a professional VoC summary. This may take 5-10 seconds.
              </p>
            </div>
          )}

          {!selectedReport && !generating ? (
            <div className="glass-card p-12 text-center text-text-secondary text-sm no-print">
              <FileText className="w-8 h-8 mx-auto mb-3 text-text-muted" />
              Select a report from the directory or create a new one to review insights.
            </div>
          ) : (
            selectedReport && !generating && parsedContent && (
              <div className="glass-card p-8 border-border border print-area flex flex-col gap-8">
                {/* Print/Export controls */}
                <div className="flex justify-between items-start border-b border-border/50 pb-4 no-print">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-primary-light uppercase tracking-wider">Digest Viewer</span>
                    <span className="text-[10px] text-text-muted">Generated by: {selectedReport.generatedBy.name} ({selectedReport.generatedBy.email})</span>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-lg bg-[#1E2638] border border-border text-text-primary hover:bg-[#252E44] transition-all text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Export to PDF</span>
                  </button>
                </div>

                {/* Report Meta Info */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-2xl font-bold font-display tracking-tight text-text-primary">
                    {selectedReport.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary bg-[#121622]/40 border border-border/40 px-4 py-2.5 rounded-lg w-fit">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        Period: {new Date(selectedReport.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to{' '}
                        {new Date(selectedReport.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Precomputed Stats Dashboard widgets (Render only if present in parsedContent) */}
                {parsedContent.stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#111522]/60 rounded-xl border border-border/50 flex flex-col print-card">
                      <span className="text-[10px] text-text-secondary uppercase font-semibold">Digest Volume</span>
                      <span className="text-2xl font-bold block mt-1">{parsedContent.stats.totalVolume} items</span>
                      <span className="text-[10px] text-text-muted mt-0.5">Ingested during selected range</span>
                    </div>
                    
                    <div className="p-4 bg-[#111522]/60 rounded-xl border border-border/50 flex flex-col print-card">
                      <span className="text-[10px] text-text-secondary uppercase font-semibold">Positive Sentiment</span>
                      <span className="text-2xl font-bold text-success block mt-1">
                        {Math.round((parsedContent.stats.posCount / (parsedContent.stats.totalVolume || 1)) * 100)}%
                      </span>
                      <span className="text-[10px] text-text-muted mt-0.5">{parsedContent.stats.posCount} positive items</span>
                    </div>

                    <div className="p-4 bg-[#111522]/60 rounded-xl border border-border/50 flex flex-col print-card">
                      <span className="text-[10px] text-text-secondary uppercase font-semibold">Critical Sentiment</span>
                      <span className="text-2xl font-bold text-danger block mt-1">
                        {Math.round((parsedContent.stats.negCount / (parsedContent.stats.totalVolume || 1)) * 100)}%
                      </span>
                      <span className="text-[10px] text-text-muted mt-0.5">{parsedContent.stats.negCount} negative items</span>
                    </div>
                  </div>
                )}

                {/* Markdown Narrative Rendering */}
                <div className="prose prose-invert max-w-none text-sm text-text-secondary leading-relaxed border-t border-border/40 pt-6 space-y-6">
                  {parsedContent.markdownContent.split('\n\n').map((block: string, bIdx: number) => {
                    const line = block.trim();
                    if (!line) return null;

                    // Headers H1
                    if (line.startsWith('# ')) {
                      return (
                        <h1 key={bIdx} className="text-2xl font-bold font-display border-b border-border/50 pb-2 text-text-primary mt-8 mb-4">
                          {line.replace('# ', '')}
                        </h1>
                      );
                    }
                    // Headers H2
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={bIdx} className="text-xl font-bold font-display text-text-primary mt-6 mb-3">
                          {line.replace('## ', '')}
                        </h2>
                      );
                    }
                    // Headers H3
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={bIdx} className="text-base font-bold font-display text-text-primary mt-4 mb-2">
                          {line.replace('### ', '')}
                        </h3>
                      );
                    }
                    // Blockquotes/Quotes
                    if (line.startsWith('> ')) {
                      return (
                        <blockquote key={bIdx} className="border-l-4 border-primary pl-4 py-1 italic bg-[#1E2536]/25 rounded-r my-4">
                          {line.replace(/^>\s*/, '').replace(/"/g, '')}
                        </blockquote>
                      );
                    }
                    // Bullet lists
                    if (line.startsWith('-') || line.startsWith('*')) {
                      return (
                        <ul key={bIdx} className="list-disc pl-5 space-y-2 my-2 font-medium">
                          {line.split('\n').map((li, lIdx) => (
                            <li key={lIdx}>{li.replace(/^[-*]\s*/, '')}</li>
                          ))}
                        </ul>
                      );
                    }

                    // Standard Paragraphs
                    return <p key={bIdx} className="font-medium text-text-secondary leading-relaxed">{line}</p>;
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
