// src/pages/RegisterPage.tsx
// ─────────────────────────────────────────────────────────────
// Registration page. After sign-up it shows a "check your email" screen
// with an option to resend the verification link.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { resendVerificationApi } from '@/api/authApi';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { AuthShell, AuthHeading, AuthNotice, PasswordMeter } from '@/components/layout/AuthShell';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, RefreshCw, GraduationCap, BookOpen, Users } from 'lucide-react';

const RegisterPage = () => {
  const { register, isLoading, error, clearError, registrationSuccess, registrationEmail, clearRegistration } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    collegeName: '',
    branch: '',
    section: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    collegeName: '',
    branch: '',
    section: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  // Resend verification state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    clearError();
  };

  const validate = (): boolean => {
    const errors = {
      name: '',
      email: '',
      collegeName: '',
      branch: '',
      section: '',
      password: '',
      confirmPassword: '',
    };
    let valid = true;

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name required (min 2 chars).';
      valid = false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Valid email required.';
      valid = false;
    }
    if (!formData.collegeName.trim() || formData.collegeName.trim().length < 2) {
      errors.collegeName = 'College name is required.';
      valid = false;
    }
    if (!formData.branch.trim() || formData.branch.trim().length < 2) {
      errors.branch = 'Branch is required.';
      valid = false;
    }
    if (!formData.section.trim()) {
      errors.section = 'Section is required.';
      valid = false;
    }

    // Strong password validation
    const p = formData.password;
    if (p.length < 8) {
      errors.password = 'Minimum 8 characters.';
      valid = false;
    } else if (!/[A-Z]/.test(p)) {
      errors.password = 'Must contain an uppercase letter.';
      valid = false;
    } else if (!/[a-z]/.test(p)) {
      errors.password = 'Must contain a lowercase letter.';
      valid = false;
    } else if (!/[0-9]/.test(p)) {
      errors.password = 'Must contain a number.';
      valid = false;
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p)) {
      errors.password = 'Must contain a special character.';
      valid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        collegeName: formData.collegeName.trim(),
        branch: formData.branch.trim(),
        section: formData.section.trim(),
      });
      // registrationSuccess will be set by the store
    } catch {
      // store handles visible error state
    }
  };

  const handleResendVerification = async () => {
    if (!registrationEmail || resendCooldown > 0) return;

    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await resendVerificationApi(registrationEmail);
      setResendMessage(res.message);
      // Start 60s cooldown
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
      setResendMessage('Failed to resend email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const pwStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  // ─── Post-Signup Success Screen ─────────────────────────────
  if (registrationSuccess) {
    return (
      <AuthShell
        footer={
          <Link to="/login" onClick={() => clearRegistration()} className="font-medium text-brand hover:underline">
            Go to sign in
          </Link>
        }
      >
        <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ok/10 text-ok">
          <Mail size={20} />
        </span>
        <AuthHeading title="Check your email">
          We sent a verification link to{' '}
          <span className="font-medium text-ink">{registrationEmail}</span>. Open it to activate your account.
        </AuthHeading>

        <ul className="mb-6 space-y-2 border-y border-line py-4 text-[14px] text-ink/65">
          <li>The link expires in <span className="font-medium text-ink">30 minutes</span>.</li>
          <li>Not in your inbox? Check the spam or promotions folder.</li>
        </ul>

        <div>
          <button
            onClick={handleResendVerification}
            disabled={resendLoading || resendCooldown > 0}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand hover:underline
              disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          >
            <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : resendLoading
                ? 'Sending…'
                : 'Resend verification email'}
          </button>
          {resendMessage && <p className="mt-2 text-[13px] text-ink/60">{resendMessage}</p>}
        </div>
      </AuthShell>
    );
  }

  // ─── Registration Form ──────────────────────────────────────
  return (
    <AuthShell
      wide
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <AuthHeading title="Create your account">
        Free to join. We&apos;ll email you a link to verify your address.
      </AuthHeading>

      {error && (
        <AuthNotice tone="bad" icon={<AlertCircle size={16} />} className="mb-5">
          {error}
        </AuthNotice>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <CyberInput
          label="Full name"
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Ananya Sharma"
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading}
          error={formErrors.name}
          icon={<User size={15} />}
        />

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
          icon={<Mail size={15} />}
        />

        <CyberInput
          label="College"
          id="collegeName"
          name="collegeName"
          type="text"
          autoComplete="organization"
          placeholder="Your college"
          value={formData.collegeName}
          onChange={handleChange}
          disabled={isLoading}
          error={formErrors.collegeName}
          icon={<GraduationCap size={15} />}
        />

        <div className="grid grid-cols-2 gap-4">
          <CyberInput
            label="Branch"
            id="branch"
            name="branch"
            type="text"
            placeholder="CSE"
            value={formData.branch}
            onChange={handleChange}
            disabled={isLoading}
            error={formErrors.branch}
            icon={<BookOpen size={15} />}
          />

          <CyberInput
            label="Section"
            id="section"
            name="section"
            type="text"
            placeholder="A"
            value={formData.section}
            onChange={handleChange}
            disabled={isLoading}
            error={formErrors.section}
            icon={<Users size={15} />}
          />
        </div>

        <div className="border-t border-line pt-4">
          <CyberInput
            label="Password"
            id="password"
            name="password"
            type={showPass ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            error={formErrors.password}
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
          {formData.password && (
            <PasswordMeter
              password={formData.password}
              strength={pwStrength}
              label={strengthLabels[pwStrength]}
            />
          )}
        </div>

        <CyberInput
          label="Confirm password"
          id="confirmPassword"
          name="confirmPassword"
          type={showConf ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Type it again"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={isLoading}
          error={formErrors.confirmPassword}
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
          Create account
        </HoloButton>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
