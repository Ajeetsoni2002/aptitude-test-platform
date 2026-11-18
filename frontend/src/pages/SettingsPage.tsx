// src/pages/SettingsPage.tsx
import { useState } from 'react';
import type { ReactNode } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { Key, LogOut, Moon, Sun, RefreshCw, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Toggle component
const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <div className="flex items-center justify-between gap-4 py-3.5 border-b border-line last:border-0">
    <span className="text-sm text-ink/80">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors"
      style={{ background: checked ? 'rgb(var(--brand))' : 'rgb(var(--ink) / .15)' }}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-snow shadow-soft transition-[left] duration-200',
          checked ? 'left-[22px]' : 'left-0.5'
        )}
      />
    </button>
  </div>
);

// Accent swatches, stored as token names
const ACCENTS = [
  { name: 'Blue',  color: 'brand' },
  { name: 'Plum',  color: 'plum' },
  { name: 'Clay',  color: 'clay' },
  { name: 'Green', color: 'green' },
];

// One settings row: label + description on the left, controls on the right
const Section = ({ title, description, children, className }: {
  title: string; description: string; children: ReactNode; className?: string;
}) => (
  <NeonCard padding="p-5 md:p-6" hover={false} className={cn('animate-fade-up', className)}>
    <div className="grid md:grid-cols-[minmax(0,260px)_1fr] gap-4 md:gap-10">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="text-[13px] text-ink/60 mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  </NeonCard>
);

const SettingsPage = () => {
  const { logout, user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate         = useNavigate();

  const [notifications, setNotifications] = useState({
    testResults:   true,
    weeklyReport:  true,
    achievements:  false,
    reminders:     true,
  });
  const [apiKey, setApiKey] = useState('nxs_•••••••••••••••••••••••••••••');
  const [accent, setAccent] = useState('brand');
  const [saved,  setSaved]  = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">Settings</h1>
          <p className="text-[15px] text-ink/60 mt-1">Appearance, notifications and account security.</p>
        </div>
        <HoloButton variant="cyan" size="md" loading={false} onClick={handleSave} icon={saved ? <Check size={15} /> : undefined}>
          {saved ? 'Saved' : 'Save changes'}
        </HoloButton>
      </header>

      <div className="space-y-4">
        {/* Appearance */}
        <Section title="Appearance" description="Theme changes apply straight away on this device.">
          <p className="text-[13px] font-medium text-ink/75 mb-2.5">Theme</p>
          <div className="grid grid-cols-2 gap-3 max-w-md" role="radiogroup" aria-label="Theme">
            {[
              { value: 'light', label: 'Light', icon: <Sun size={15} /> },
              { value: 'dark', label: 'Dark', icon: <Moon size={15} /> },
            ].map((t) => {
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  role="radio"
                  aria-checked={active}
                  onClick={(e) => setTheme(t.value as 'light' | 'dark', e)}
                  className={cn(
                    'text-left rounded-[12px] border p-2.5 transition-colors',
                    active ? 'border-brand ring-1 ring-brand' : 'border-line hover:border-ink/30'
                  )}
                >
                  {/* Mini preview of the theme */}
                  <span
                    className={cn(
                      'block h-16 rounded-lg border p-2.5',
                      t.value === 'light' ? 'bg-snow border-coal/10' : 'bg-coal border-snow/10'
                    )}
                  >
                    <span className={cn('block h-1.5 w-10 rounded-full', t.value === 'light' ? 'bg-coal/70' : 'bg-snow/80')} />
                    <span className={cn('block h-1.5 w-16 rounded-full mt-1.5', t.value === 'light' ? 'bg-coal/15' : 'bg-snow/20')} />
                    <span className={cn('block h-1.5 w-12 rounded-full mt-1.5', t.value === 'light' ? 'bg-coal/15' : 'bg-snow/20')} />
                  </span>
                  <span className="flex items-center justify-between mt-2.5 px-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      {t.icon}
                      {t.label}
                    </span>
                    {active && <Check size={15} className="text-brand" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-5 mt-5 border-t border-line">
            <p className="text-[13px] font-medium text-ink/75 mb-2.5">Accent colour</p>
            <div className="flex gap-4">
              {ACCENTS.map((a) => {
                const active = accent === a.color;
                return (
                  <button
                    key={a.name}
                    onClick={() => setAccent(a.color)}
                    aria-pressed={active}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center transition-shadow',
                        active && 'ring-2 ring-offset-2 ring-offset-surface'
                      )}
                      style={{
                        background: `rgb(var(--${a.color}))`,
                        ['--tw-ring-color' as string]: `rgb(var(--${a.color}))`,
                      }}
                    >
                      {active && <Check size={15} className="text-on-brand" />}
                    </span>
                    <span className={cn('text-xs', active ? 'text-ink' : 'text-ink/55')}>{a.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" description="Choose what we let you know about.">
          <div className="-my-3.5">
            <Toggle checked={notifications.testResults}  onChange={() => setNotifications((n) => ({ ...n, testResults:  !n.testResults  }))} label="Test results" />
            <Toggle checked={notifications.weeklyReport} onChange={() => setNotifications((n) => ({ ...n, weeklyReport: !n.weeklyReport }))} label="Weekly progress summary" />
            <Toggle checked={notifications.achievements} onChange={() => setNotifications((n) => ({ ...n, achievements: !n.achievements }))} label="Milestones and streaks" />
            <Toggle checked={notifications.reminders}    onChange={() => setNotifications((n) => ({ ...n, reminders:    !n.reminders    }))} label="Study reminders" />
          </div>
        </Section>

        {/* API */}
        <Section title="API access" description="A personal key for reading your Nexus data from your own scripts. Keep it private.">
          <div className="space-y-3 max-w-md">
            <CyberInput
              label="API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              icon={<Key size={14} />}
              className="font-mono text-sm"
            />
            <HoloButton variant="ghost" size="sm" icon={<RefreshCw size={14} />}>Regenerate key</HoloButton>
          </div>
        </Section>

        {/* Security */}
        <Section title="Security" description="How your account is protected.">
          <dl className="divide-y divide-line -my-3">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-ink/80">Signed in as</dt>
              <dd className="text-sm text-ink font-medium truncate">{user?.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-ink/80">Two-step verification</dt>
              <dd className="text-xs font-medium px-2 py-0.5 rounded-full bg-warn/10 text-warn">Coming soon</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-ink/80">Active sessions</dt>
              <dd className="text-xs font-medium px-2 py-0.5 rounded-full bg-ok/10 text-ok">1 active</dd>
            </div>
          </dl>
        </Section>

        {/* Sign out */}
        <Section title="Sign out" description="Sign out of Nexus on this device." className="!border-bad/25">
          <HoloButton
            variant="danger"
            size="md"
            icon={<LogOut size={15} />}
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
          >
            Sign out
          </HoloButton>
        </Section>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
