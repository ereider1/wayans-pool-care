'use client';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let emailToUse = identifier.trim();

    // Resolve username to email if it doesn't look like an email address
    if (!emailToUse.includes('@')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailToUse.toLowerCase())
        .maybeSingle();

      if (profileError || !profile?.email) {
        setError('Unable to sign in with those credentials.');
        setLoading(false);
        return;
      }
      emailToUse = profile.email;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
    if (signInError) {
      setError('Unable to sign in with those credentials.');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    if (error) {
      setError(error.message || 'Unable to sign in with Google.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fafc] px-5">
      <div className="w-full max-w-md rounded-2xl border border-[#d3e0eb] bg-white p-7 shadow-soft">
        <form onSubmit={submit}>
          <div className="flex items-center gap-3">
            <div className="text-2xl text-blue">≈</div>
            <span className="font-bold">Wayan's Pool Care</span>
          </div>
          <h1 className="mt-8 text-2xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-[#5d7390]">Private access.</p>
          <label className="mt-6 block text-sm font-bold">
            Email or Username
            <input required type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-[#c5d5e3] px-3 font-normal" placeholder="e.g. wayan or email" />
          </label>
          <label className="mt-4 block text-sm font-bold">
            Password
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-[#c5d5e3] px-3 font-normal" />
          </label>
          {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="focus-ring mt-6 min-h-12 w-full rounded-lg bg-blue font-bold text-white disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="my-6 flex items-center justify-between">
          <hr className="w-full border-[#d3e0eb]" />
          <span className="px-3 text-xs text-[#5d7390] uppercase tracking-wider">or</span>
          <hr className="w-full border-[#d3e0eb]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#c5d5e3] bg-white font-bold hover:bg-[#f7fafc] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.258-3.133C18.332 1.917 15.535 1 12.24 1c-6.077 0-11 4.923-11 11s4.923 11 11 11c6.34 0 10.56-4.46 10.56-10.75 0-.724-.075-1.275-.165-1.965H12.24z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </main>
  );
}
