'use client';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      setError(error.message || 'Unable to create an account.');
      setLoading(false);
    } else if (data.user) {
      // If email confirmation is enabled, they need to check email.
      // If auto-confirm is enabled, they might be logged in directly.
      if (data.session) {
        setMessage('Registration successful! Redirecting...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);
      } else {
        setMessage('Registration successful! Please check your email to confirm your account.');
        setLoading(false);
      }
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fafc] px-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-[#d3e0eb] bg-white p-7 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="text-2xl text-blue">≈</div>
          <span className="font-bold">Wayan's Pool Care</span>
        </div>
        <h1 className="mt-8 text-2xl font-bold">Create Account</h1>
        <p className="mt-2 text-sm text-[#5d7390]">Wayan's registration page.</p>
        <label className="mt-6 block text-sm font-bold">
          Email
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-[#c5d5e3] px-3 font-normal" />
        </label>
        <label className="mt-4 block text-sm font-bold">
          Password
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-[#c5d5e3] px-3 font-normal" />
        </label>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        {message && <p role="status" className="mt-4 text-sm text-green-600">{message}</p>}
        <button disabled={loading} className="focus-ring mt-6 min-h-12 w-full rounded-lg bg-blue font-bold text-white disabled:opacity-60">
          {loading ? 'Creating Account…' : 'Register'}
        </button>
      </form>
    </main>
  );
}
