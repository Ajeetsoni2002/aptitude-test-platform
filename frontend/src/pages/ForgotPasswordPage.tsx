// src/pages/ForgotPasswordPage.tsx
// ─────────────────────────────────────────────────────────────
// Forgot password: asks for an email and sends a reset link.
// Always shows the same success message, so it can't be used to
// find out which emails have accounts.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '@/api/authApi';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { AuthShell, AuthHeading } from '@/components/layout/AuthShell';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const validate = (): boolean => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await forgotPasswordApi(email.trim().toLowerCase());
      setSuccess(true);
      setMessage(res.message);
    } catch {
      // Even on error, show generic success to prevent enumeration
      setSuccess(true);
      setMessage('If an account exists with this email, a password reset link has been sent.');
    } finally {
      setIsLoading(false);
    }
  };

  const backToLogin = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline">
      <ArrowLeft size={14} />
      Back to sign in
    </Link>
  );

  return (
    <AuthShell footer={success ? undefined : backToLogin}>
      {!success ? (
        <>
          <AuthHeading title="Reset your password">
            Enter the email you signed up with and we&apos;ll send you a link to choose a new password.
          </AuthHeading>

          <form onSubmit={handleSubmit} className="space-y-5">
            <CyberInput
              label="Email"
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              disabled={isLoading}
              error={emailError}
              icon={<Mail size={16} />}
            />

            <HoloButton type="submit" variant="cyan" size="lg" fullWidth loading={isLoading}>
              Send reset link
            </HoloButton>
          </form>
        </>
      ) : (
        /* Success state */
        <>
          <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ok/10 text-ok">
            <Mail size={20} />
          </span>
          <AuthHeading title="Check your email">{message}</AuthHeading>

          <ul className="mb-6 space-y-2 border-y border-line py-4 text-[14px] text-ink/65">
            <li>The link expires in <span className="font-medium text-ink">30 minutes</span>.</li>
            <li>Not in your inbox? Check the spam or promotions folder.</li>
          </ul>

          <Link
            to="/login"
            className="btn-holo-cyan inline-flex h-11 w-full items-center justify-center rounded-[10px] text-[15px]"
          >
            Back to sign in
          </Link>
        </>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordPage;
