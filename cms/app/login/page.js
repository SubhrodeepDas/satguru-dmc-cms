'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      const next = searchParams.get('next') || '/admin';
      router.push(next);
      router.refresh();
    } catch {
      setError('Could not reach the server');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-brand/10 blur-3xl" />

      <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl shadow-panel p-8 w-full max-w-sm">
        <div className="flex justify-center">
          <div className="admin-logo border border-gray-100 shadow-sm rounded-2xl p-4 mb-5">
            <img
              src="/satguru-logo.gif"
              alt="Satguru Travel"
              className="w-24 h-auto select-none"
            />
          </div>
        </div>
        <h1 className="text-xl font-bold text-brand-dark mb-1 text-center">Satguru DMC</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Sign in to manage site content</p>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-brand text-white rounded-xl py-2.5 font-medium hover:bg-brand-light transition disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
