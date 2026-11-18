// frontend/src/pages/admin/AdminSettingsPage.tsx
// Admin Settings — proctoring, test rules, platform config, maintenance

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  AdminPage,
  AdminPanel,
  AdminToggle,
  AdminStatusBadge,
} from '@/components/admin/AdminUI';
import type { AdminTone } from '@/components/admin/AdminUI';
import HoloButton from '@/components/ui/HoloButton';
import {
  Save, RotateCcw, CheckCircle2, AlertTriangle, Info, Minus, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Settings shape ────────────────────────────────────────────
interface PlatformSettings {
  // Proctoring
  proctoringEnabled: boolean;
  faceDetectionRequired: boolean;
  tabSwitchWarnings: boolean;
  maxTabSwitches: number;
  fullscreenRequired: boolean;

  // Test rules
  defaultTimeLimit: number;
  defaultQuestionCount: number;
  maxAttemptsPerTest: number;
  showResultsImmediately: boolean;
  allowTestReview: boolean;
  shuffleQuestions: boolean;

  // Notifications
  notifyOnTestComplete: boolean;
  notifyOnNewStudent: boolean;
  emailNotifications: boolean;

  // Platform
  maintenanceMode: boolean;
  registrationOpen: boolean;
  demoModeEnabled: boolean;
  leaderboardPublic: boolean;
}

const DEFAULTS: PlatformSettings = {
  proctoringEnabled: true,
  faceDetectionRequired: false,
  tabSwitchWarnings: true,
  maxTabSwitches: 3,
  fullscreenRequired: true,

  defaultTimeLimit: 60,
  defaultQuestionCount: 20,
  maxAttemptsPerTest: 1,
  showResultsImmediately: true,
  allowTestReview: true,
  shuffleQuestions: true,

  notifyOnTestComplete: true,
  notifyOnNewStudent: false,
  emailNotifications: false,

  maintenanceMode: false,
  registrationOpen: true,
  demoModeEnabled: true,
  leaderboardPublic: true,
};

const STORAGE_KEY = 'aetherexam_admin_settings';

const loadSettings = (): PlatformSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
};

const saveSettings = (settings: PlatformSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

// ── Number input ──────────────────────────────────────────────
const NumberInput = ({
  label, description, value, min, max, step = 1, unit,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  tone?: 'cyan' | 'violet' | 'amber' | 'green' | 'magenta';
}) => {
  const stepButton =
    'grid h-9 w-9 place-items-center text-ink/60 transition-colors hover:bg-ink/[0.05] hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent';

  return (
    <div className="admin-panel flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {description && <p className="text-[13px] leading-5 text-ink/55">{description}</p>}
      </div>
      <div className="flex flex-shrink-0 items-center self-start overflow-hidden rounded-[10px] border border-line bg-surface sm:self-auto">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className={stepButton}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Minus size={15} />
        </button>
        <div className="min-w-[76px] border-x border-line px-3 py-1.5 text-center font-mono text-[15px] text-ink" aria-live="polite">
          {value}{unit ? <span className="ml-1 text-[12px] text-ink/50">{unit}</span> : null}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className={stepButton}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
};

// ── Section layout: heading on the left, controls on the right ─
const SettingsSection = ({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description: string;
  badge?: ReactNode;
  children: ReactNode;
}) => (
  <section className="grid gap-4 border-t border-line pt-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="text-[13px] leading-5 text-ink/55">{description}</p>
      {badge ? <div className="pt-1">{badge}</div> : null}
    </div>
    <div className="space-y-2.5">{children}</div>
  </section>
);

// ── Main Component ────────────────────────────────────────────
const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<PlatformSettings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const stored = loadSettings();
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(stored));
  }, [settings]);

  const update = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
    setSaved(false);
  };

  const summary: { label: string; value: string; active: boolean; tone?: AdminTone }[] = [
    { label: 'Proctoring', value: settings.proctoringEnabled ? 'On' : 'Off', active: settings.proctoringEnabled },
    { label: 'Default time', value: `${settings.defaultTimeLimit} min`, active: true },
    { label: 'Default questions', value: `${settings.defaultQuestionCount}`, active: true },
    { label: 'Max attempts', value: `${settings.maxAttemptsPerTest}`, active: true },
    { label: 'Registration', value: settings.registrationOpen ? 'Open' : 'Closed', active: settings.registrationOpen },
    { label: 'Tab switch limit', value: `${settings.maxTabSwitches}`, active: settings.tabSwitchWarnings },
    { label: 'Demo mode', value: settings.demoModeEnabled ? 'On' : 'Off', active: settings.demoModeEnabled },
    {
      label: 'System',
      value: settings.maintenanceMode ? 'Maintenance' : 'Online',
      active: !settings.maintenanceMode,
      tone: settings.maintenanceMode ? 'red' : undefined,
    },
  ];

  return (
    <AdminLayout>
      <AdminPage>
        {/* ── Toolbar ────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="flex max-w-2xl items-start gap-2.5 text-[13px] leading-5 text-ink/60">
            <Info size={15} className="mt-0.5 flex-shrink-0 text-brand" />
            These settings are saved in this browser only. They aren't sent to the server yet, so other admins won't see them.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {hasChanges && (
              <AdminStatusBadge tone="amber">Unsaved changes</AdminStatusBadge>
            )}
            {saved && (
              <AdminStatusBadge tone="green">Saved</AdminStatusBadge>
            )}
            <HoloButton
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleReset}
            >
              Reset to defaults
            </HoloButton>
            <HoloButton
              variant="cyan"
              size="sm"
              icon={saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              onClick={handleSave}
            >
              {saved ? 'Saved' : 'Save settings'}
            </HoloButton>
          </div>
        </div>

        {/* ── Current setup ──────────────────────────────────── */}
        <AdminPanel title="Current setup" contentClassName="p-0 sm:p-0">
          <dl className="grid grid-cols-2 sm:grid-cols-4">
            {summary.map((item, i) => (
              <div
                key={item.label}
                className={cn(
                  'border-line px-5 py-3.5',
                  i % 2 === 1 && 'border-l',
                  i >= 2 && 'border-t',
                  'sm:border-l sm:border-t-0',
                  i % 4 === 0 && 'sm:border-l-0',
                  i >= 4 && 'sm:border-t'
                )}
              >
                <dt className="label-caps">{item.label}</dt>
                <dd
                  className={cn(
                    'mt-1 text-sm font-medium',
                    item.tone === 'red' ? 'text-bad' : item.active ? 'text-ink' : 'text-ink/45'
                  )}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </AdminPanel>

        {/* ── Proctoring Settings ────────────────────────────── */}
        <SettingsSection
          title="Proctoring"
          description="How closely students are watched during a scheduled test."
          badge={
            <AdminStatusBadge tone={settings.proctoringEnabled ? 'green' : 'default'}>
              {settings.proctoringEnabled ? 'On' : 'Off'}
            </AdminStatusBadge>
          }
        >
          <AdminToggle
            checked={settings.proctoringEnabled}
            onChange={(v) => update('proctoringEnabled', v)}
            label="Turn on proctoring"
            description="Main switch for every monitoring feature below."
          />
          <AdminToggle
            checked={settings.faceDetectionRequired}
            onChange={(v) => update('faceDetectionRequired', v)}
            label="Require a visible face"
            description="Students must keep their face in view of the webcam for the whole test."
          />
          <AdminToggle
            checked={settings.tabSwitchWarnings}
            onChange={(v) => update('tabSwitchWarnings', v)}
            label="Warn on tab switch"
            description="Show a warning when a student leaves the test tab or window."
          />
          <AdminToggle
            checked={settings.fullscreenRequired}
            onChange={(v) => update('fullscreenRequired', v)}
            label="Require fullscreen"
            description="Leaving fullscreen triggers a warning or submits the test."
          />
          <NumberInput
            label="Tab switches allowed"
            description="The test submits itself after this many switches."
            value={settings.maxTabSwitches}
            min={1}
            max={10}
            onChange={(v) => update('maxTabSwitches', v)}
          />

          {settings.proctoringEnabled && (
            <p className="flex items-start gap-2.5 rounded-[10px] bg-warn/10 px-4 py-3 text-[13px] leading-5 text-ink/70">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-warn" />
              Students will be asked for camera permission before any scheduled test starts.
            </p>
          )}
        </SettingsSection>

        {/* ── Test Rules ─────────────────────────────────────── */}
        <SettingsSection
          title="Test defaults"
          description="Starting values for new tests. Each test can override them."
        >
          <NumberInput
            label="Time limit"
            description="Default length of a new test."
            value={settings.defaultTimeLimit}
            min={5}
            max={300}
            step={5}
            unit="min"
            onChange={(v) => update('defaultTimeLimit', v)}
          />
          <NumberInput
            label="Number of questions"
            description="Default question count for a new test."
            value={settings.defaultQuestionCount}
            min={5}
            max={100}
            step={5}
            onChange={(v) => update('defaultQuestionCount', v)}
          />
          <NumberInput
            label="Attempts per test"
            description="How many times a student can take the same scheduled test."
            value={settings.maxAttemptsPerTest}
            min={1}
            max={10}
            onChange={(v) => update('maxAttemptsPerTest', v)}
          />
          <AdminToggle
            checked={settings.shuffleQuestions}
            onChange={(v) => update('shuffleQuestions', v)}
            label="Shuffle questions"
            description="Each student gets the questions in a different order."
          />
          <AdminToggle
            checked={settings.showResultsImmediately}
            onChange={(v) => update('showResultsImmediately', v)}
            label="Show results right away"
            description="Students see their score and breakdown as soon as they submit."
          />
          <AdminToggle
            checked={settings.allowTestReview}
            onChange={(v) => update('allowTestReview', v)}
            label="Allow solution review"
            description="Students can see correct answers and explanations after the test."
          />
        </SettingsSection>

        {/* ── Notifications ──────────────────────────────────── */}
        <SettingsSection
          title="Notifications"
          description="Which events send you a notification."
        >
          <AdminToggle
            checked={settings.notifyOnTestComplete}
            onChange={(v) => update('notifyOnTestComplete', v)}
            label="A student finishes a test"
            description="In-app notification when a scheduled test is submitted."
          />
          <AdminToggle
            checked={settings.notifyOnNewStudent}
            onChange={(v) => update('notifyOnNewStudent', v)}
            label="A new student signs up"
            description="In-app notification for each new registration."
          />
          <AdminToggle
            checked={settings.emailNotifications}
            onChange={(v) => update('emailNotifications', v)}
            label="Email me as well"
            description="Send important alerts by email. Needs an email service to be set up."
          />
        </SettingsSection>

        {/* ── Platform Controls ──────────────────────────────── */}
        <SettingsSection
          title="Access"
          description="Who can sign up and what students can see."
        >
          <AdminToggle
            checked={settings.registrationOpen}
            onChange={(v) => update('registrationOpen', v)}
            label="Open registration"
            description="New students can create accounts. Turn off to stop new sign-ups."
          />
          <AdminToggle
            checked={settings.leaderboardPublic}
            onChange={(v) => update('leaderboardPublic', v)}
            label="Public leaderboard"
            description="Students can see the full leaderboard with everyone's rank."
          />
          <AdminToggle
            checked={settings.demoModeEnabled}
            onChange={(v) => update('demoModeEnabled', v)}
            label="Demo test"
            description="Visitors can try a demo test from the landing page without an account."
          />
        </SettingsSection>

        {/* ── Maintenance Mode ───────────────────────────────── */}
        <SettingsSection
          title="Maintenance"
          description="Students see a maintenance page and can't use the platform. Admins can still sign in."
          badge={
            <AdminStatusBadge tone={settings.maintenanceMode ? 'red' : 'green'}>
              {settings.maintenanceMode ? 'Maintenance on' : 'Online'}
            </AdminStatusBadge>
          }
        >
          <AdminToggle
            checked={settings.maintenanceMode}
            onChange={(v) => update('maintenanceMode', v)}
            label="Turn on maintenance mode"
            description="Blocks all student access straight away."
            tone="red"
          />
          {settings.maintenanceMode && (
            <p className="flex items-start gap-2.5 rounded-[10px] border border-bad/25 bg-bad/10 px-4 py-3 text-[13px] leading-5 text-bad">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              Maintenance mode is on, so students can't get in right now. Remember to turn it off when you're done.
            </p>
          )}
        </SettingsSection>

        {/* ── Save Footer ────────────────────────────────────── */}
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface px-4 py-3 shadow-lift sm:px-5">
          <div className="flex items-center gap-2.5 text-sm">
            {hasChanges ? (
              <>
                <span className="h-2 w-2 rounded-full bg-warn" />
                <p className="text-ink/70">You have unsaved changes.</p>
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={16} className="text-ok" />
                <p className="text-ok">Settings saved.</p>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-ok" />
                <p className="text-ink/55">Everything is saved.</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <HoloButton variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={handleReset}>
              Reset
            </HoloButton>
            <HoloButton
              variant="cyan"
              size="sm"
              icon={saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              onClick={handleSave}
            >
              {saved ? 'Saved' : 'Save'}
            </HoloButton>
          </div>
        </div>
      </AdminPage>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
