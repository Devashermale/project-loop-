'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AlertCircle, Lock, Mail, User, Building, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, workspaceName }),
      });

      const data = await regRes.json();

      if (!regRes.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Automatically sign in the user
      const loginRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push('/login?error=Registration successful. Please log in.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative">
      {/* Background radial effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 my-8">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary items-center justify-center font-display font-bold text-white text-2xl shadow-lg shadow-primary/20 mb-3">
            L
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
            Create your Workspace
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Sign up to get started with LOOP AI analysis
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold mb-6">Create Account</h2>

          {error && (
            <div className="bg-danger/10 border border-danger/25 text-danger px-4 py-3 rounded-lg text-sm flex items-start gap-2.5 mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="workspaceName" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Workspace / Company Name
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="workspaceName"
                  type="text"
                  required
                  placeholder="Acme Corp"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="•••••••• (Min 6 characters)"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111622] border border-border focus:border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient flex items-center justify-center gap-2 py-2.5 mt-2"
            >
              <span>{loading ? 'Creating workspace...' : 'Register Workspace'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-light hover:underline font-semibold">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
