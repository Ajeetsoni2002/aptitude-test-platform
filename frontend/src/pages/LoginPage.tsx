// src/pages/LoginPage.tsx
// Sign-in form, with a forgot-password link and a resend option for
// accounts whose email is not verified yet.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { resendVerificationApi } from '@/api/authApi';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { AuthShell, AuthHeading, AuthNotice } from '@/components/layout/AuthShell';
import { Mail, Lock, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';

const LoginPage = () => {
  const navigate  = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({ email: '', password: '' });
  const [showPass, setShowPass]   = useState(false);

  // Unverified email state
  const [showUnverified, setShowUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    setShowUnverified(false);
    setResendMessage('');
    clearError();
  };

  const validate = (): boolean => {
    const errors = { email: '', password: '' };
    let valid    = true;
    if (!formData.email.trim()) {
      errors.email = 'Email is required.'; valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Enter a valid email address.'; valid = false;
    }
    if (!formData.password) {
      errors.password = 'Password is required.'; valid = false;
    }
    setFormErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login({ email: formData.email.trim(), password: formData.password });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      // Check if 403 (unverified email)
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setShowUnverified(true);
      }
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await resendVerificationApi(formData.email.trim().toLowerCase());
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

  return (
    <AuthShell
      footer={
        <>
          New to Nexus?{' '}
          <Link to="/register" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <AuthHeading title="Sign in">Welcome back. Pick up where you left off.</AuthHeading>

      {/* API error */}
      {error && (
        <AuthNotice tone="bad" icon={<AlertCircle size={16} />} className="mb-5">
          {error}
        </AuthNotice>
      )}

      {/* Unverified email: resend option */}
      {showUnverified && (
        <AuthNotice tone="warn" className="mb-5">
          <p>Didn&apos;t get the verification email, or the link expired?</p>
          <button
            onClick={handleResendVerification}
            disabled={resendLoading || resendCooldown > 0}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:underline
              disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          >
            <RefreshCw size={13} className={resendLoading ? 'animate-spin' : ''} />
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : resendLoading
                ? 'Sending…'
                : 'Resend verification email'}
          </button>
          {resendMessage && <p className="mt-1.5 text-[13px] text-ink/60">{resendMessage}</p>}
        </AuthNotice>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <CyberInput
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          error={formErrors.email}
          icon={<Mail size={16} />}
        />

        <div>
          <div className="relative">
            <CyberInput
              label="Password"
              id="password"
              name="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              error={formErrors.password}
              icon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="text-ink/40 transition-colors hover:text-ink/70"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            <Link
              to="/forgot-password"
              className="absolute right-0 top-0 text-[13px] font-medium text-brand hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <HoloButton type="submit" variant="cyan" size="lg" fullWidth loading={isLoading} className="mt-1">
          Sign in
        </HoloButton>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
