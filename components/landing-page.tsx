'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  TrendingUp, 
  Zap, 
  Shield, 
  Sparkles, 
  Layers, 
  Search, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Users, 
  BarChart3, 
  Lock, 
  Globe, 
  Activity, 
  Cpu,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'trends' | 'ask' | 'reports'>('inbox');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  const faqs = [
    {
      q: 'How does LOOP connect to existing customer support and feedback channels?',
      a: 'LOOP supports direct single feedback ingestion, bulk CSV spreadsheet imports, and API webhooks for support tickets, app store reviews, NPS surveys, and sales CRM notes.'
    },
    {
      q: 'How accurate is the automated taxonomy tagging and sentiment analysis?',
      a: 'Our hybrid classification engine achieves over 99% precision by combining vector embeddings with pre-tuned theme taxonomy trees tailored to SaaS and digital product teams.'
    },
    {
      q: 'Does LOOP store customer data securely?',
      a: 'Yes. All data is encrypted at rest and in transit (TLS 1.3, AES-256). Workspaces are strictly isolated, and enterprise accounts support SAML SSO and custom role-based access control (RBAC).'
    },
    {
      q: 'Can I export reports for executive leadership?',
      a: 'Absolutely. LOOP features a 1-click Voice of Customer (VoC) report synthesizer that compiles structured executive digests complete with sentiment trends, critical issues, and verbatim quote spotlights ready to print or export as PDF.'
    },
    {
      q: 'Can I try LOOP before purchasing?',
      a: 'Yes! We offer a full-featured 14-day free trial for all plans, complete with pre-loaded demo data so you can experience real-time feedback intelligence immediately.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-text-primary overflow-x-hidden font-sans selection:bg-primary/30 selection:text-white">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-primary/15 via-secondary/5 to-transparent blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-[800px] right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] pointer-events-none z-0" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-[#0A0D14]/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-display font-bold text-white text-xl shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
              L
            </div>
            <div>
              <span className="font-display font-bold text-2xl bg-gradient-to-r from-white via-slate-100 to-text-secondary bg-clip-text text-transparent">
                LOOP
              </span>
              <span className="text-[10px] block font-mono text-primary-light -mt-1 font-bold uppercase tracking-widest">
                Feedback Intel
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#preview" className="hover:text-white transition-colors">Platform</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Auth CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/login"
              className="btn-gradient text-sm flex items-center gap-1.5"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile menu toggle button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#161B26] text-text-secondary hover:text-white border border-border"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111622] border-b border-border p-6 space-y-4 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col gap-3 text-sm font-medium">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-white">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-white">How It Works</a>
              <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-white">Platform</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-white">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-white">FAQ</a>
            </nav>
            <div className="pt-4 border-t border-border flex flex-col gap-2.5">
              <Link href="/login" className="w-full text-center py-2.5 rounded-lg border border-border text-sm font-semibold">Sign In</Link>
              <Link href="/login" className="w-full btn-gradient text-center py-2.5 text-sm font-semibold">Launch Platform</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary-light text-xs font-semibold uppercase tracking-wider mb-8 shadow-inner animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Introducing LOOP 2.0 • Customer Sentiment Intelligence</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold font-display leading-[1.1] tracking-tight max-w-5xl mx-auto">
          Turn Raw Customer Feedback into{' '}
          <span className="bg-gradient-to-r from-primary-light via-indigo-300 to-secondary bg-clip-text text-transparent">
            Product Growth Strategy
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base md:text-xl text-text-secondary max-w-3xl mx-auto font-medium leading-relaxed">
          Ingest multi-channel support tickets, app reviews, and sales notes into unified VoC analytics, automated taxonomy classification, and instant grounded natural-language search.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl btn-gradient text-base font-semibold flex items-center justify-center gap-2 shadow-xl shadow-primary/25 hover:scale-[1.02] transition-transform"
          >
            <span>Start Free 14-Day Trial</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#preview"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#141926] border border-border hover:border-primary/40 text-text-primary text-base font-semibold transition-all hover:bg-[#1A2234]"
          >
            Explore Interactive Demo
          </a>
        </div>

        {/* Social Proof metrics */}
        <div className="mt-16 pt-10 border-t border-border/40 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-[#121622]/40 border border-border/30">
            <span className="text-2xl md:text-3xl font-bold font-display text-white block">10M+</span>
            <span className="text-xs text-text-muted mt-1 block">Feedback Records Analyzed</span>
          </div>
          <div className="p-4 rounded-xl bg-[#121622]/40 border border-border/30">
            <span className="text-2xl md:text-3xl font-bold font-display text-emerald-400 block">99.4%</span>
            <span className="text-xs text-text-muted mt-1 block">Taxonomy Precision</span>
          </div>
          <div className="p-4 rounded-xl bg-[#121622]/40 border border-border/30">
            <span className="text-2xl md:text-3xl font-bold font-display text-indigo-400 block">500+</span>
            <span className="text-xs text-text-muted mt-1 block">Product Teams Empowered</span>
          </div>
          <div className="p-4 rounded-xl bg-[#121622]/40 border border-border/30">
            <span className="text-2xl md:text-3xl font-bold font-display text-violet-400 block">&lt; 1s</span>
            <span className="text-xs text-text-muted mt-1 block">Grounded Vector Search</span>
          </div>
        </div>
      </section>

      {/* Interactive Product Preview Section */}
      <section id="preview" className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold font-display">Experience the Platform in Action</h2>
          <p className="text-sm text-text-secondary mt-2">Clean, responsive dashboard layout engineered for modern product managers & analysts.</p>
        </div>

        {/* Mockup Container */}
        <div className="glass-card border border-primary/30 p-2 md:p-6 shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-6 px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-text-muted ml-2 font-semibold">app.loopintel.com/dashboard</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'inbox' ? 'bg-primary text-white' : 'bg-[#141926] text-text-secondary hover:text-white'
                }`}
              >
                Feedback Triage
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'trends' ? 'bg-primary text-white' : 'bg-[#141926] text-text-secondary hover:text-white'
                }`}
              >
                Theme Trends
              </button>
              <button
                onClick={() => setActiveTab('ask')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'ask' ? 'bg-primary text-white' : 'bg-[#141926] text-text-secondary hover:text-white'
                }`}
              >
                Intelligence Search
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'reports' ? 'bg-primary text-white' : 'bg-[#141926] text-text-secondary hover:text-white'
                }`}
              >
                VoC Digests
              </button>
            </div>
          </div>

          {/* Interactive Screen Preview Content */}
          <div className="bg-[#0D111A] rounded-lg p-6 border border-border/60 min-h-[380px]">
            {activeTab === 'inbox' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-center text-xs text-text-secondary border-b border-border/50 pb-3">
                  <span className="font-semibold">Live Incoming Feed</span>
                  <span className="badge-new">Active Stream</span>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-[#141A28] rounded-lg border border-border flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold font-mono">SUPPORT</span>
                        <span className="sentiment-neg">NEGATIVE</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Billing Issue</span>
                      </div>
                      <p className="text-xs text-text-primary font-medium">&ldquo;Billing page keeps timing out when I try to download an invoice PDF.&rdquo;</p>
                    </div>
                    <span className="badge-new">NEW</span>
                  </div>

                  <div className="p-4 bg-[#141A28] rounded-lg border border-border flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold font-mono">APP STORE</span>
                        <span className="sentiment-pos">POSITIVE</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">UI Design</span>
                      </div>
                      <p className="text-xs text-text-primary font-medium">&ldquo;The new dashboard is gorgeous and finally fast. Huge improvement over last version!&rdquo;</p>
                    </div>
                    <span className="badge-reviewed">REVIEWED</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
                <div className="p-5 bg-[#141A28] rounded-lg border border-rose-500/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold uppercase">Spiking Issue</span>
                    <h4 className="text-sm font-bold mt-2">Billing & Subscriptions</h4>
                    <p className="text-xs text-text-muted mt-1">Invoice timeouts & double charge reports</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold font-display text-rose-400">+140%</span>
                    <span className="text-xs text-text-muted">42 items</span>
                  </div>
                </div>

                <div className="p-5 bg-[#141A28] rounded-lg border border-border flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase">Positive Shift</span>
                    <h4 className="text-sm font-bold mt-2">UI & UX Performance</h4>
                    <p className="text-xs text-text-muted mt-1">Dark mode feedback & dashboard speeds</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold font-display text-emerald-400">+85%</span>
                    <span className="text-xs text-text-muted">89 items</span>
                  </div>
                </div>

                <div className="p-5 bg-[#141A28] rounded-lg border border-border flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase">Feature Request</span>
                    <h4 className="text-sm font-bold mt-2">SSO & Compliance</h4>
                    <p className="text-xs text-text-muted mt-1">SAML SSO required for enterprise deals</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold font-display text-indigo-400">+60%</span>
                    <span className="text-xs text-text-muted">28 items</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ask' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-[#141A28] p-3 rounded-lg border border-border text-xs text-text-secondary flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary-light" />
                  <span className="font-semibold text-white">&ldquo;What onboarding issues are team members experiencing?&rdquo;</span>
                </div>
                <div className="p-4 bg-[#141A28]/80 border border-primary/20 rounded-lg text-xs space-y-2 leading-relaxed">
                  <p className="font-medium text-text-primary">
                    Based on verified feedback records, team onboarding friction centers primarily around workspace invitations. Users report that the invite button occasionally greys out, delaying team onboarding [Feedback #1].
                  </p>
                  <span className="text-[10px] text-text-muted block pt-2 border-t border-border/40 font-mono">Grounded in 3 direct support tickets</span>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="p-5 bg-[#141A28] rounded-lg border border-border space-y-3 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold font-display">Voice of the Customer Monthly Digest</h4>
                  <span className="text-xs text-primary-light font-semibold">1-Click PDF Export</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Executive summary synthesizing overall sentiment (+68% Positive), top friction areas (Billing timeouts & SSO requests), and direct verbatim quote spotlights for leadership review.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Cards Section */}
      <section id="features" className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-primary-light uppercase tracking-widest block mb-2">Core Capabilities</span>
          <h2 className="text-3xl md:text-5xl font-bold font-display">Everything You Need to Master VoC</h2>
          <p className="text-text-secondary text-sm md:text-base max-w-2xl mx-auto mt-3">
            Built from the ground up to replace fragmented spreadsheets and manual feedback tagging with automated intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card p-8 glass-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Multi-Channel Ingestion</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Seamlessly aggregate support tickets, App Store reviews, NPS surveys, sales notes, and raw CSV files into one unified triage inbox.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-8 glass-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Automated Taxonomy Tagging</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Automatically categorize incoming verbatim feedback into precise product theme trees and compute sentiment confidence scores.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-8 glass-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Spike & Issue Detection</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Identify sudden surges in customer friction points before they impact churn with automated weekly trend delta tracking.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-8 glass-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Grounded Search Engine</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Ask questions in plain English and receive evidence-grounded answers cited directly back to original feedback quotes.
              </p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="glass-card p-8 glass-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Executive VoC Digests</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Synthesize structured VoC reports for product leadership in seconds, complete with print-ready PDF layout styling.
              </p>
            </div>
          </div>

          {/* Card 6 */}
          <div className="glass-card p-8 glass-card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Enterprise Security & RBAC</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Workspace isolation, role-based permission tiers (Admin, Analyst, Viewer), SAML SSO readiness, and data encryption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-border/40">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-primary-light uppercase tracking-widest block mb-2">Simple Workflow</span>
          <h2 className="text-3xl md:text-5xl font-bold font-display">From Raw Data to Strategy in 3 Steps</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 relative">
            <span className="text-5xl font-extrabold font-display text-primary/30 block mb-4">01</span>
            <h3 className="text-lg font-bold mb-2">Connect & Ingest</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Upload raw CSV spreadsheets or connect feedback streams. LOOP normalizes all channels into unified records.
            </p>
          </div>

          <div className="glass-card p-8 relative">
            <span className="text-5xl font-extrabold font-display text-secondary/30 block mb-4">02</span>
            <h3 className="text-lg font-bold mb-2">Classify & Cluster</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Vector embeddings tag sentiment scores, map feedback to taxonomy themes, and detect emerging volume spikes.
            </p>
          </div>

          <div className="glass-card p-8 relative">
            <span className="text-5xl font-extrabold font-display text-emerald-500/30 block mb-4">03</span>
            <h3 className="text-lg font-bold mb-2">Analyze & Share</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Query natural-language insights or generate executive Voice-of-Customer PDF digests for team alignment.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-border/40">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-primary-light uppercase tracking-widest block mb-2">Transparent Pricing</span>
          <h2 className="text-3xl md:text-5xl font-bold font-display">Flexible Plans for Every Stage</h2>
          
          {/* Billing Toggle */}
          <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-[#121622] border border-border">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingPeriod === 'monthly' ? 'bg-primary text-white' : 'text-text-secondary'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingPeriod === 'annual' ? 'bg-primary text-white' : 'text-text-secondary'
              }`}
            >
              Annual Billing <span className="text-[10px] text-emerald-400 font-bold ml-1">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Starter Plan */}
          <div className="glass-card p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold">Starter</h3>
              <p className="text-xs text-text-muted mt-1">Perfect for early-stage startup teams</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-display">{billingPeriod === 'annual' ? '$39' : '$49'}</span>
                <span className="text-xs text-text-muted">/ month</span>
              </div>
              <ul className="mt-8 space-y-3 text-xs text-text-secondary">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 2,500 feedback items/mo</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3 Team seats included</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Multi-channel triage inbox</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> CSV Bulk import</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 w-full py-3 rounded-lg border border-border text-center text-xs font-semibold hover:bg-[#1E2638] transition-colors">
              Get Started
            </Link>
          </div>

          {/* Professional Plan (Featured) */}
          <div className="glass-card p-8 border-2 border-primary accent-glow flex flex-col justify-between relative bg-[#141A2A]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
              Most Popular
            </div>
            <div>
              <h3 className="text-xl font-bold">Professional</h3>
              <p className="text-xs text-text-muted mt-1">For growing product & customer teams</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-display">{billingPeriod === 'annual' ? '$119' : '$149'}</span>
                <span className="text-xs text-text-muted">/ month</span>
              </div>
              <ul className="mt-8 space-y-3 text-xs text-text-secondary">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 25,000 feedback items/mo</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 10 Team seats included</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Theme spike & trend alert engine</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Grounded Intelligence Search</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> VoC Executive PDF digests</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 w-full btn-gradient py-3 text-center text-xs font-semibold">
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-card p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold">Enterprise</h3>
              <p className="text-xs text-text-muted mt-1">Custom volume, compliance & SSO</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-display">Custom</span>
              </div>
              <ul className="mt-8 space-y-3 text-xs text-text-secondary">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited feedback volume</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited seats & custom RBAC</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> SAML SSO & SOC2 Compliance</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dedicated Account Manager</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 w-full py-3 rounded-lg border border-border text-center text-xs font-semibold hover:bg-[#1E2638] transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-20 px-6 max-w-4xl mx-auto border-t border-border/40">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-primary-light uppercase tracking-widest block mb-2">Got Questions?</span>
          <h2 className="text-3xl md:text-4xl font-bold font-display">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="glass-card p-6 cursor-pointer transition-colors hover:border-primary/40"
            >
              <div className="flex justify-between items-center gap-4">
                <h3 className="text-sm font-semibold text-text-primary">{faq.q}</h3>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-primary-light flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                )}
              </div>
              {openFaq === idx && (
                <p className="text-xs text-text-secondary mt-3 leading-relaxed border-t border-border/40 pt-3 animate-in fade-in duration-200">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Conversion Banner */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="glass-card p-12 md:p-16 border-2 border-primary/40 text-center relative overflow-hidden bg-gradient-to-b from-[#141928] to-[#0D111A]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full filter blur-[100px] pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-extrabold font-display max-w-3xl mx-auto">
            Ready to Understand What Your Customers Really Want?
          </h2>
          <p className="mt-4 text-sm md:text-base text-text-secondary max-w-xl mx-auto">
            Join hundreds of product leaders transforming raw feedback into actionable product roadmap decisions.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/signup" className="btn-gradient px-8 py-3.5 text-sm font-bold shadow-xl shadow-primary/20">
              Start Free Trial Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-12 px-6 bg-[#080B12] text-xs text-text-secondary">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-display font-bold text-white text-xs">
              L
            </div>
            <span className="font-bold text-white">LOOP Feedback Intelligence</span>
          </div>

          <div className="flex gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>

          <p>© {new Date().getFullYear()} LOOP Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
