'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard-layout';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Upload, 
  Zap, 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle,
  FileSpreadsheet,
  Info
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  customerLabel: string | null;
  sentiment: string | null;
  sentimentScore: number | null;
  status: string;
  createdAt: string;
  themes: {
    theme: {
      id: string;
      name: string;
      color: string | null;
    };
  }[];
}

interface Theme {
  id: string;
  name: string;
}

export default function InboxPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'VIEWER';
  const isViewer = userRole === 'VIEWER';

  // State for feedbacks
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('ALL');
  const [sentiment, setSentiment] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [themeId, setThemeId] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected feedback for inspection details
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [reclassifying, setReclassifying] = useState(false);

  // Modals state
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Single Ingestion Form
  const [singleContent, setSingleContent] = useState('');
  const [singleChannel, setSingleChannel] = useState('SUPPORT');
  const [singleLabel, setSingleLabel] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Bulk Ingestion Form
  const [csvText, setCsvText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState('');

  // Ingestion Simulation List (Appendix A)
  const simulationSamples = [
    { content: "Onboarding took forever — I couldn't figure out how to invite my team.", channel: "SUPPORT" },
    { content: "The new dashboard is gorgeous and finally fast. Huge improvement.", channel: "APP_STORE" },
    { content: "It does the job, but the mobile experience needs work.", channel: "NPS" },
    { content: "Prospect wants SSO before they'll sign — third time this month.", channel: "SALES" },
    { content: "Love the new export feature, saved me an hour today.", channel: "COMMUNITY" },
    { content: "Billing page keeps timing out when I try to download an invoice.", channel: "SUPPORT" }
  ];

  // Fetch Feedbacks Function
  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        channel,
        sentiment,
        status,
        themeId,
        startDate,
        endDate
      });

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch feedback');
      const data = await res.json();
      
      setFeedbacks(data.feedbacks || []);
      setTotalItems(data.pagination?.total || 0);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, channel, sentiment, status, themeId, startDate, endDate]);

  // Fetch Themes List
  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch('/api/themes');
        if (res.ok) {
          const data = await res.json();
          setThemes(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchThemes();
  }, []);

  // Fetch feedbacks whenever filters change
  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Handle Status Update
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/feedback/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error('Status update failed');
      
      // Update local state
      setFeedbacks(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      if (selectedItem?.id === id) {
        setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Handle Manual Re-classification
  const handleReclassify = async (id: string) => {
    setReclassifying(true);
    try {
      const res = await fetch('/api/feedback/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Re-classification failed');
      const updated = await res.json();

      setFeedbacks(prev => prev.map(item => item.id === id ? updated : item));
      setSelectedItem(updated);
    } catch (err) {
      alert('Failed to re-classify feedback item');
    } finally {
      setReclassifying(false);
    }
  };

  // Handle Single Ingestion Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: singleContent, channel: singleChannel }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ingestion failed');

      setSingleContent('');
      setShowSingleModal(false);
      fetchFeedbacks();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred during ingestion');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Bulk CSV Submit
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkLoading(true);
    setBulkResult('');

    try {
      const res = await fetch('/api/feedback/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk ingestion failed');

      setCsvText('');
      setBulkResult(`Success: Ingested and queued ${data.count} items.`);
      fetchFeedbacks();
      setTimeout(() => {
        setShowBulkModal(false);
        setBulkResult('');
      }, 2000);
    } catch (err: any) {
      setBulkResult(`Error: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // Trigger simulated ingestion
  const handleSimulate = async () => {
    if (isViewer) return;
    const randomSample = simulationSamples[Math.floor(Math.random() * simulationSamples.length)];
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(randomSample),
      });

      if (res.ok) {
        fetchFeedbacks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'NEW': return 'badge-new';
      case 'REVIEWED': return 'badge-reviewed';
      default: return 'badge-actioned';
    }
  };

  const getSentimentBadge = (sent: string | null) => {
    if (!sent) return 'sentiment-neu';
    switch (sent) {
      case 'POS': return 'sentiment-pos';
      case 'NEG': return 'sentiment-neg';
      default: return 'sentiment-neu';
    }
  };

  return (
    <DashboardLayout>
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
            Feedback Triage
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Search, filter, and triage incoming multi-channel customer comments.
          </p>
        </div>
        
        {!isViewer && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSimulate}
              className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all text-sm font-semibold flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Simulate Channel</span>
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 rounded-lg bg-[#1E2638] border border-border text-text-primary hover:bg-[#252E44] transition-all text-sm font-semibold flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4 text-text-secondary" />
              <span>Bulk CSV</span>
            </button>
            <button
              onClick={() => setShowSingleModal(true)}
              className="btn-gradient flex items-center gap-1.5 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Feedback</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Full-text Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search feedback content..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Channel Filter */}
        <div>
          <select
            value={channel}
            onChange={(e) => { setChannel(e.target.value); setPage(1); }}
            className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Channels</option>
            <option value="SUPPORT">Support Tickets</option>
            <option value="APP_STORE">App Store Reviews</option>
            <option value="NPS">NPS Surveys</option>
            <option value="SALES">Sales Notes</option>
            <option value="COMMUNITY">Community Posts</option>
          </select>
        </div>

        {/* Sentiment Filter */}
        <div>
          <select
            value={sentiment}
            onChange={(e) => { setSentiment(e.target.value); setPage(1); }}
            className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Sentiment</option>
            <option value="POS">Positive</option>
            <option value="NEU">Neutral</option>
            <option value="NEG">Negative</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ACTIONED">Actioned</option>
          </select>
        </div>

        {/* Themes Filter */}
        <div>
          <select
            value={themeId}
            onChange={(e) => { setThemeId(e.target.value); setPage(1); }}
            className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Themes</option>
            {themes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Inbox layout with side-drawer inspector */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Table Container */}
        <div className="flex-1 w-full glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#182030]/40 text-xs font-semibold uppercase text-text-secondary tracking-wider">
                  <th className="py-4 px-6">Channel</th>
                  <th className="py-4 px-6 w-1/2">Feedback Details</th>
                  <th className="py-4 px-6">Sentiment</th>
                  <th className="py-4 px-6">Triage Status</th>
                  <th className="py-4 px-6 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-16" /></td>
                      <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-3/4" /></td>
                      <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-12" /></td>
                      <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-20" /></td>
                      <td className="py-4 px-6 text-right"><div className="h-4 bg-slate-800 rounded w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-text-secondary text-sm">
                      <Info className="w-8 h-8 mx-auto mb-3 text-text-muted" />
                      No matching feedback found. Adjust your search keywords or filters.
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((fb) => (
                    <tr 
                      key={fb.id} 
                      onClick={() => setSelectedItem(fb)}
                      className={`cursor-pointer transition-colors text-sm hover:bg-[#1E2638]/45 ${selectedItem?.id === fb.id ? 'bg-[#1E2638]' : ''}`}
                    >
                      <td className="py-4 px-6 font-semibold text-xs text-text-secondary">
                        {fb.channel}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5">
                          <p className="line-clamp-2 text-text-primary pr-4 leading-relaxed">
                            {fb.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {fb.customerLabel && (
                              <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.25 rounded font-mono">
                                {fb.customerLabel}
                              </span>
                            )}
                            {fb.themes.map((ft) => (
                              <span 
                                key={ft.theme.id}
                                className="text-[9px] px-1.5 py-0.25 rounded-full font-medium"
                                style={{ 
                                  color: ft.theme.color || '#6366F1', 
                                  backgroundColor: `${ft.theme.color || '#6366F1'}15`,
                                  border: `1px solid ${ft.theme.color || '#6366F1'}20`
                                }}
                              >
                                {ft.theme.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={getSentimentBadge(fb.sentiment)}>
                          {fb.sentiment || 'NEU'}
                        </span>
                      </td>
                      <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                        <select
                          disabled={isViewer}
                          value={fb.status}
                          onChange={(e) => handleStatusChange(fb.id, e.target.value)}
                          className={`cursor-pointer text-xs font-bold border-none rounded px-2.5 py-1 focus:outline-none select-none uppercase tracking-wider ${
                            fb.status === 'NEW' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            fb.status === 'REVIEWED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          <option value="NEW" className="bg-[#161B26]">New</option>
                          <option value="REVIEWED" className="bg-[#161B26]">Reviewed</option>
                          <option value="ACTIONED" className="bg-[#161B26]">Actioned</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-right text-xs text-text-muted">
                        {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-[#182030]/20 text-xs">
            <span className="text-text-secondary font-medium">
              Showing {feedbacks.length} of {totalItems} items
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage(prev => prev - 1)}
                className="p-1.5 rounded bg-[#111622] border border-border disabled:opacity-40 hover:bg-[#1E2638] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage(prev => prev + 1)}
                className="p-1.5 rounded bg-[#111622] border border-border disabled:opacity-40 hover:bg-[#1E2638] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Inspector details */}
        {selectedItem && (
          <div className="w-full lg:w-96 glass-card p-6 border-l border-border/80 sticky top-8 flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Feedback Inspector</h3>
                <span className="text-xs text-text-muted font-mono block mt-0.5">ID: {selectedItem.id.slice(0, 8)}...</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded hover:bg-[#1E2638] text-text-secondary hover:text-text-primary transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core feedback details */}
            <div className="bg-[#111522]/80 border border-border/60 p-4 rounded-lg">
              <span className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold mb-2">Customer Feedback</span>
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line font-medium">
                &ldquo;{selectedItem.content}&rdquo;
              </p>
            </div>

            {/* Classification results */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold mb-2">Intelligence Outputs</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#111522]/60 p-3 rounded-lg border border-border/50 text-center">
                    <span className="text-[10px] text-text-muted block uppercase font-medium">Sentiment</span>
                    <span className={`inline-block mt-1 font-bold text-xs uppercase ${getSentimentBadge(selectedItem.sentiment)}`}>
                      {selectedItem.sentiment || 'NEU'}
                    </span>
                  </div>
                  <div className="bg-[#111522]/60 p-3 rounded-lg border border-border/50 text-center">
                    <span className="text-[10px] text-text-muted block uppercase font-medium">Confidence Score</span>
                    <span className="text-sm font-semibold font-mono block mt-1">
                      {selectedItem.sentimentScore !== null ? selectedItem.sentimentScore.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedItem.customerLabel && (
                <div>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold mb-1">Feature Area</span>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {selectedItem.customerLabel}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold mb-2">Classified Themes</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.themes.length === 0 ? (
                    <span className="text-xs text-text-muted italic">No themes associated.</span>
                  ) : (
                    selectedItem.themes.map((ft) => (
                      <span
                        key={ft.theme.id}
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{
                          color: ft.theme.color || '#6366F1',
                          backgroundColor: `${ft.theme.color || '#6366F1'}15`,
                          border: `1px solid ${ft.theme.color || '#6366F1'}35`
                        }}
                      >
                        {ft.theme.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Actions panel */}
            {!isViewer && (
              <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
                <button
                  disabled={reclassifying}
                  onClick={() => handleReclassify(selectedItem.id)}
                  className="w-full py-2.5 rounded-lg border border-primary/30 text-primary-light hover:text-white hover:bg-primary/10 transition-all font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reclassifying ? 'animate-spin' : ''}`} />
                  <span>{reclassifying ? 'Re-analyzing Feedback...' : 'Re-analyze Item'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SINGLE INGESTION MODAL */}
      {showSingleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowSingleModal(false)}
              className="absolute right-6 top-6 p-1.5 rounded hover:bg-[#1E2638] text-text-secondary hover:text-text-primary transition-all"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
              Ingest Customer Feedback
            </h2>

            {formError && (
              <div className="bg-danger/10 border border-danger/25 text-danger px-4 py-3 rounded-lg text-sm flex items-start gap-2.5 mb-4">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Feedback Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste support conversation transcript, app store comment, sales note..."
                  value={singleContent}
                  onChange={(e) => setSingleContent(e.target.value)}
                  className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Ingestion Channel
                </label>
                <select
                  value={singleChannel}
                  onChange={(e) => setSingleChannel(e.target.value)}
                  className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none cursor-pointer"
                >
                  <option value="SUPPORT">Support Ticket</option>
                  <option value="APP_STORE">App Store Review</option>
                  <option value="NPS">NPS Survey</option>
                  <option value="SALES">Sales Note</option>
                  <option value="COMMUNITY">Community Post</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-[#1E2638] text-sm text-text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-gradient px-4 py-2 text-sm flex items-center gap-1.5"
                >
                  {formLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{formLoading ? 'Ingesting & Tagging...' : 'Submit & Classify'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK CSV MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-xl p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowBulkModal(false)}
              className="absolute right-6 top-6 p-1.5 rounded hover:bg-[#1E2638] text-text-secondary hover:text-text-primary transition-all"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
              <FileSpreadsheet className="w-5 h-5 text-success" />
              Bulk CSV Ingestion
            </h2>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Paste raw CSV spreadsheet rows. Columns should at least include: <code className="bg-slate-800 text-slate-300 px-1 py-0.5 rounded">content</code> and <code className="bg-slate-800 text-slate-300 px-1 py-0.5 rounded">channel</code>.
            </p>

            {bulkResult && (
              <div className={`px-4 py-3 rounded-lg text-sm flex items-start gap-2.5 mb-4 ${
                bulkResult.startsWith('Error') ? 'bg-danger/10 border border-danger/25 text-danger' : 'bg-success/10 border border-success/25 text-success'
              }`}>
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{bulkResult}</span>
              </div>
            )}

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  CSV text data
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder={`content,channel,customer_label\n"This app crashes on login","APP_STORE","Mobile UI Bug"\n"Requested SAML single sign on security capabilities","SALES","SSO Feature Request"`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg px-4 py-2.5 text-sm text-text-primary font-mono focus:outline-none transition-colors no-scrollbar"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-[#1E2638] text-sm text-text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading}
                  className="btn-gradient px-4 py-2 text-sm flex items-center gap-1.5"
                >
                  {bulkLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{bulkLoading ? 'Ingesting Batch...' : 'Queue CSV Import'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
