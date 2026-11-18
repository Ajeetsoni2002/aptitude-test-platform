// src/pages/ResetPasswordPage.tsx
// ─────────────────────────────────────────────────────────────
// Reset password: sets a new password using the token from the email link.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPasswordApi } from '@/api/authApi';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { AuthShell, AuthHeading, AuthNotice, PasswordMeter } from '@/components/layout/AuthShell';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validate = (): boolean => {
    let valid = true;
    setPasswordError('');
    setConfirmError('');

    const p = password;
    if (p.length < 8) {
      setPasswordError('Minimum 8 characters.');
      valid = false;
    } else if (!/[A-Z]/.test(p)) {
      setPasswordError('Must contain an uppercase letter.');
      valid = false;
    } else if (!/[a-z]/.test(p)) {
      setPasswordError('Must contain a lowercase letter.');
      valid = false;
    } else if (!/[0-9]/.test(p)) {
      setPasswordError('Must contain a number.');
      valid = false;
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p)) {
      setPasswordError('Must contain a special character.');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    if (!token) {
      setError('Reset token is missing from the URL.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await resetPasswordApi(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const pwStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  const buttonLink = 'btn-holo-cyan inline-flex h-11 w-full items-center justify-center rounded-[10px] text-[15px]';

  // No token in URL
  if (!token) {
    return (
      <AuthShell>
        <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-bad/10 text-bad">
          <XCircle size={20} />
        </span>
        <AuthHeading title="This link doesn't work">
          The reset link is missing its token, so we can&apos;t tell which account it belongs to. Ask for a new
          one and use the link from that email.
        </AuthHeading>
        <Link to="/forgot-password" className={buttonLink}>
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      footer={
        !success && (
          <Link to="/login" className="font-medium text-brand hover:underline">
            Back to sign in
          </Link>
        )
      }
    >
      {!success ? (
        <>
          <AuthHeading title="Choose a new password">
            Use at least 8 characters, with an uppercase letter, a number and a symbol.
          </AuthHeading>

          {error && (
            <AuthNotice tone="bad" icon={<AlertCircle size={16} />} className="mb-5">
              {error}
            </AuthNotice>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <CyberInput
                label="New password"
                id="new-password"
                name="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                  setError('');
                }}
                disabled={isLoading}
                error={passwordError}
                icon={<Lock size={15} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    className="text-ink/40 transition-colors hover:text-ink/70"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
              {password && (
                <PasswordMeter password={password} strength={pwStrength} label={strengthLabels[pwStrength]} />
              )}
            </div>

            <CyberInput
              label="Confirm password"
              id="confirm-password"
              name="confirmPassword"
              type={showConf ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Type it again"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmError('');
              }}
              disabled={isLoading}
              error={confirmError}
              icon={<Lock size={15} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConf((s) => !s)}
                  aria-label={showConf ? 'Hide password' : 'Show password'}
                  className="text-ink/40 transition-colors hover:text-ink/70"
                >
                  {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            <HoloButton type="submit" variant="cyan" size="lg" fullWidth loading={isLoading} className="!mt-6">
              Save new password
            </HoloButton>
          </form>
        </>
      ) : (
        /* Success state */
        <>
          <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ok/10 text-ok">
            <ShieldCheck size={20} />
          </span>
          <AuthHeading title="Password updated">
            Your password has been changed. Sign in with the new one.
          </AuthHeading>
          <Link to="/login" className={buttonLink}>
            Go to sign in
          </Link>
        </>
      )}
    </AuthShell>
  );
};

export default ResetPasswordPage;
