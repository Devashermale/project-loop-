'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { 
  Send, 
  MessageSquare, 
  BookOpen, 
  RefreshCw, 
  CornerDownRight, 
  Info,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

interface Citation {
  id: string;
  content: string;
  channel: string;
  customerLabel: string | null;
  createdAt: string;
  sentiment: string | null;
}

interface QAInteraction {
  question: string;
  answer: string;
  citations: Citation[];
  timestamp: Date;
}

export default function AskLoopPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QAInteraction[]>([]);
  const [currentCitations, setCurrentCitations] = useState<Citation[]>([]);

  const suggestedQuestions = [
    'What onboarding issues are team members experiencing?',
    'What pricing or billing bugs have been reported recently?',
    'Are there any complaints about our mobile Safari responsive design?',
    'What compliance features like SSO do sales prospects ask for?'
  ];

  const handleSubmit = async (e: React.FormEvent, customQuestion?: string) => {
    if (e) e.preventDefault();
    
    const query = (customQuestion || question).trim();
    if (!query) return;

    setLoading(true);
    setQuestion('');

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Q&A request failed');

      const interaction: QAInteraction = {
        question: query,
        answer: data.answer,
        citations: data.citations || [],
        timestamp: new Date()
      };

      setHistory(prev => [interaction, ...prev]);
      setCurrentCitations(data.citations || []);
    } catch (err: any) {
      alert(err.message || 'Error occurred while contacting Ask LOOP');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sent: string | null) => {
    if (!sent) return 'text-slate-400 border-slate-500/20 bg-slate-500/10';
    switch (sent) {
      case 'POS': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
      case 'NEG': return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
      default: return 'text-slate-400 border-slate-500/20 bg-slate-500/10';
    }
  };

  return (
    <DashboardLayout>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
            Ask LOOP
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Query your customer feedback in plain English. Responses are grounded strictly in your database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Q&A Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question input card */}
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              What would you like to know?
            </h2>
            
            <form onSubmit={(e) => handleSubmit(e)} className="relative">
              <input
                type="text"
                disabled={loading}
                placeholder="Ask about onboarding, billing disputes, dark mode..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg pl-5 pr-14 py-3 text-sm text-text-primary focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:hover:bg-primary transition-all text-white"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Suggested quick questions */}
            <div className="mt-4">
              <span className="text-xs text-text-muted font-semibold block mb-2 uppercase tracking-wider">Suggested Queries</span>
              <div className="flex flex-wrap gap-2.5">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={(e) => handleSubmit(e, q)}
                    className="text-left text-xs bg-[#1A2234]/70 border border-border hover:border-primary-light hover:bg-[#1E2638] px-3.5 py-2 rounded-lg text-text-secondary hover:text-text-primary transition-all leading-relaxed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Q&A Output History list */}
          <div className="space-y-6">
            {loading && history.length === 0 && (
              <div className="glass-card p-8 flex flex-col justify-center items-center">
                <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-4" />
                <p className="text-sm text-text-secondary font-medium animate-pulse">
                  Retrieving semantically relevant feedback and generating answer...
                </p>
              </div>
            )}

            {history.length === 0 && !loading && (
              <div className="glass-card p-12 text-center text-text-secondary text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 text-text-muted" />
                No queries asked yet in this session. Ask a question above to begin.
              </div>
            )}

            {history.map((item, idx) => (
              <div key={idx} className="glass-card p-6 flex flex-col gap-4 animate-in fade-in duration-200">
                {/* Question */}
                <div className="flex items-start gap-2 border-b border-border/40 pb-3">
                  <CornerDownRight className="w-4.5 h-4.5 text-primary-light mt-0.5 flex-shrink-0" />
                  <span className="font-display font-semibold text-text-primary text-base">
                    {item.question}
                  </span>
                </div>

                {/* Answer narrative block */}
                <div className="text-sm text-text-secondary leading-relaxed space-y-4 font-medium pl-1">
                  {item.answer.split('\n\n').map((paragraph, pIdx) => {
                    // Check if bullet point
                    if (paragraph.startsWith('-') || paragraph.startsWith('*')) {
                      return (
                        <ul key={pIdx} className="list-disc pl-5 space-y-1.5">
                          {paragraph.split('\n').map((li, liIdx) => (
                            <li key={liIdx}>{li.replace(/^[-*]\s*/, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={pIdx}>{paragraph}</p>;
                  })}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-text-muted self-end">
                  {item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cited Evidence Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6 flex flex-col gap-4 sticky top-8">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Cited Grounding Evidence
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              These are the raw, verified customer feedback records used to ground the analysis, ensuring complete data accuracy.
            </p>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {currentCitations.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-muted border border-dashed border-border rounded-lg">
                  <Info className="w-6 h-6 mx-auto mb-2 text-text-muted" />
                  Ask a question to load references.
                </div>
              ) : (
                currentCitations.map((cit, cIdx) => (
                  <div 
                    key={cit.id} 
                    className="p-3 bg-[#111522]/80 border border-border/70 rounded-lg hover:border-accent/40 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.25 rounded font-mono">
                          #{cIdx + 1} {cit.channel}
                        </span>
                        {cit.sentiment && (
                          <span className={`px-1 rounded font-bold border ${getSentimentColor(cit.sentiment)}`}>
                            {cit.sentiment}
                          </span>
                        )}
                      </div>
                      <span className="text-text-muted">
                        {new Date(cit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-xs text-text-primary leading-normal italic">
                      &ldquo;{cit.content}&rdquo;
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-text-muted mt-1">
                      <span className="font-medium">{cit.customerLabel || 'Feedback Record'}</span>
                      <Link href="/inbox" className="text-accent hover:underline flex items-center gap-0.5 font-bold">
                        <span>Inspect</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
