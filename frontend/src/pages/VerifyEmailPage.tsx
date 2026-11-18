// src/pages/VerifyEmailPage.tsx
// ─────────────────────────────────────────────────────────────
// Email verification: reads the token from the URL, calls the verify
// API and shows the result. Expired links get a resend form.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmailApi, resendVerificationApi } from '@/api/authApi';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { AuthShell, AuthHeading, AuthNotice } from '@/components/layout/AuthShell';
import { CheckCircle2, XCircle, Loader2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';

type VerifyStatus = 'loading' | 'success' | 'error' | 'expired' | 'no-token';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      setMessage('No verification token found in the URL.');
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const res = await verifyEmailApi(token);
        setStatus('success');
        setMessage(res.message);
      } catch (err: unknown) {
        const errMsg =
          (err as { response?: { data?: { message?: string } } })
            ?.response?.data?.message || 'Verification failed.';

        if (errMsg.toLowerCase().includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setMessage(errMsg);
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail.trim() || resendCooldown > 0) return;

    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await resendVerificationApi(resendEmail.trim().toLowerCase());
      setResendMessage(res.message);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setResendMessage('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const buttonLink = 'inline-flex h-11 w-full items-center justify-center rounded-[10px] text-[15px]';

  return (
    <AuthShell>
      {/* ── Loading ───────────────────── */}
      {status === 'loading' && (
        <>
          <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Loader2 size={20} className="animate-spin" />
          </span>
          <AuthHeading title="Verifying your email">This takes a second or two.</AuthHeading>
        </>
      )}

      {/* ── Success ───────────────────── */}
      {status === 'success' && (
        <>
          <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ok/10 text-ok">
            <ShieldCheck size={20} />
          </span>
          <AuthHeading title="Email verified">{message}</AuthHeading>
          <AuthNotice tone="ok" icon={<CheckCircle2 size={16} className="text-ok" />} className="mb-6">
            Your account is active. You can sign in now.
          </AuthNotice>
          <Link to="/login" className={`btn-holo-cyan ${buttonLink}`}>
            Go to sign in
          </Link>
        </>
      )}

      {/* ── Error / no token ───────────── */}
      {(status === 'error' || status === 'no-token') && (
        <>
          <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-bad/10 text-bad">
            <XCircle size={20} />
          </span>
          <AuthHeading title="We couldn't verify your email">{message}</AuthHeading>
          <p className="mb-6 text-[14px] text-ink/60">
            If you already verified, just sign in. Otherwise, sign in and we&apos;ll offer to send a new link.
          </p>
          <Link to="/login" className={`btn-ghost-neon ${buttonLink}`}>
            Go to sign in
          </Link>
        </>
      )}

      {/* ── Expired (with resend) ─────── */}
      {status === 'expired' && (
        <>
          <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-warn/10 text-warn">
            <RefreshCw size={20} />
          </span>
          <AuthHeading title="This link has expired">{message}</AuthHeading>

          <div className="mb-5 space-y-4">
            <CyberInput
              label="Email"
              id="resend-email"
              name="resend-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              disabled={resendLoading}
              icon={<Mail size={15} />}
            />
            <HoloButton
              variant="cyan"
              size="lg"
              fullWidth
              loading={resendLoading}
              disabled={!resendEmail.trim() || resendCooldown > 0}
              onClick={handleResend}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send a new link'}
            </HoloButton>
          </div>

          {resendMessage && (
            <AuthNotice tone="ok" icon={<CheckCircle2 size={16} className="text-ok" />} className="mb-5">
              {resendMessage}
            </AuthNotice>
          )}

          <Link to="/login" className="text-[14px] font-medium text-brand hover:underline">
            Back to sign in
          </Link>
        </>
      )}
    </AuthShell>
  );
};

export default VerifyEmailPage;
