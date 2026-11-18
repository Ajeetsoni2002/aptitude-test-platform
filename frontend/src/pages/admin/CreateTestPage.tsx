import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AdminLayout from '@/components/AdminLayout';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DateTimePickerPopup from '@/components/ui/DateTimePickerPopup';
import SectionStudentPicker from '@/components/ui/SectionStudentPicker';
import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/AdminUI';
import { downloadBulkTemplateApi, getAllUsersApi, type BulkUploadResult } from '@/api/adminApi';
import { createFullLengthTestApi, getAllScheduledTestsApi } from '@/api/scheduledApi';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FolderArchive,
  Lock,
  Send,
  X,
} from 'lucide-react';

const fieldLabel = 'mb-1.5 block text-[13px] font-medium text-ink';
const fieldHint = 'mt-1.5 text-[12px] leading-5 text-ink/50';
const fieldInput = 'admin-input w-full px-3 py-2 text-sm';

const STATUS_TONE = { locked: 'amber', live: 'green', completed: 'default' } as const;
const STATUS_LABEL = { locked: 'Scheduled', live: 'Live', completed: 'Completed' } as const;

const QuickPickButton = () => (
  <button
    type="button"
    className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-brand transition-colors hover:bg-brand/10"
  >
    <Calendar size={12} />
    <span>Pick on calendar</span>
  </button>
);

const StepTitle = ({ step, children }: { step: number; children: ReactNode }) => (
  <span className="flex items-center gap-2.5">
    <span className="grid h-6 w-6 place-items-center rounded-full border border-line bg-raised font-mono text-[12px] font-normal text-ink/60">
      {step}
    </span>
    {children}
  </span>
);

interface StudentOption {
  id: string;
  name: string;
  email: string;
  avatar: string;
  branch?: string;
  section?: string;
}

interface ScheduledTestCard {
  id: string;
  title: string;
  students: number;
  questionCount: number;
  startTime: Date;
  endTime: Date;
  status: TestStatus;
}

type TestStatus = 'locked' | 'live' | 'completed';

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getStatus = (startTime: Date | string, endTime: Date | string): TestStatus => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now < start) return 'locked';
  if (now < end) return 'live';
  return 'completed';
};

const CreateTestPage = () => {
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(180);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [workbook, setWorkbook] = useState<File | null>(null);
  const [imagesZip, setImagesZip] = useState<File | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [scheduledTests, setScheduledTests] = useState<ScheduledTestCard[]>([]);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [studentLoadError, setStudentLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const workbookRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startDate && startTime) {
      const d = new Date(`${startDate}T${startTime}`);
      if (!Number.isNaN(d.getTime())) setStartDateTime(d);
    } else {
      setStartDateTime(null);
    }
  }, [startDate, startTime]);

  useEffect(() => {
    if (endDate && endTime) {
      const d = new Date(`${endDate}T${endTime}`);
      if (!Number.isNaN(d.getTime())) setEndDateTime(d);
    } else {
      setEndDateTime(null);
    }
  }, [endDate, endTime]);

  const handleStartPickerChange = (d: Date) => {
    setStartDateTime(d);
    setStartDate(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    setStartTime(d.toTimeString().substring(0, 5));
  };

  const handleEndPickerChange = (d: Date) => {
    setEndDateTime(d);
    setEndDate(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    setEndTime(d.toTimeString().substring(0, 5));
  };

  useEffect(() => {
    const load = async () => {
      setLoadingUsers(true);
      setStudentLoadError('');

      const [usersResult, testsResult] = await Promise.allSettled([
        getAllUsersApi(1, 1000),
        getAllScheduledTestsApi(),
      ]);

      if (usersResult.status === 'fulfilled') {
        const usersRes = usersResult.value;
        if (usersRes.success && usersRes.data) {
          const availableUsers = Array.isArray(usersRes.data.users) ? usersRes.data.users : [];
          setStudents(
            (availableUsers as User[])
              .filter((user) => String(user.role ?? '').trim().toLowerCase() === 'student')
              .map((user) => {
                const displayName = user.name?.trim() || user.email || 'Student';
                return {
                  id: user._id,
                  name: displayName,
                  email: user.email || 'No email available',
                  avatar: getInitials(displayName),
                  branch: user.branch,
                  section: user.section,
                };
              })
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        } else {
          setStudents([]);
          setStudentLoadError(usersRes.message || 'Failed to load students.');
        }
      } else {
        console.error('Failed to load students for create-test', usersResult.reason);
        setStudents([]);
        setStudentLoadError('Failed to load students. Please refresh and try again.');
      }

      if (testsResult.status === 'fulfilled') {
        const testsRes = testsResult.value;
        if (testsRes.success && testsRes.data) {
          const scheduledTestItems = Array.isArray(testsRes.data) ? testsRes.data : [];
          setScheduledTests(
            scheduledTestItems.map((test: any) => ({
              id: test._id,
              title: test.title,
              students: Array.isArray(test.assignedStudents) ? test.assignedStudents.length : 0,
              questionCount: test.questionCount,
              startTime: new Date(test.startTime),
              endTime: new Date(test.endTime),
              status: test.status,
            }))
          );
        } else {
          setScheduledTests([]);
        }
      } else {
        console.error('Failed to load scheduled tests for create-test', testsResult.reason);
        setScheduledTests([]);
      }

      setLoadingUsers(false);
    };

    load();
  }, []);

  const invalidRows = useMemo(
    () => uploadResult?.rows.filter((row) => row.status === 'invalid') || [],
    [uploadResult]
  );

  const windowRange = useMemo(() => {
    if (!startDateTime || !endDateTime) return null;
    return { start: startDateTime, end: endDateTime };
  }, [startDateTime, endDateTime]);

  const setWorkbookFile = (file: File | null) => {
    if (!file) {
      setWorkbook(null);
      setUploadResult(null);
      return;
    }
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setError('Upload a valid workbook in .xlsx or .csv format.');
      return;
    }
    setWorkbook(file);
    setUploadResult(null);
    setError('');
    setSuccess('');
  };

  const setZipFile = (file: File | null) => {
    if (!file) {
      setImagesZip(null);
      return;
    }
    if (!/\.zip$/i.test(file.name)) {
      setError('Image bundle must be a .zip file.');
      return;
    }
    setImagesZip(file);
    setError('');
  };

  const downloadTemplate = async () => {
    try {
      const blob = await downloadBulkTemplateApi();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'question-bulk-upload-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError('Template download failed.');
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return setError('Test title is required.');
    if (!windowRange) return setError('Please set valid start and end date/time values.');
    if (windowRange.end <= windowRange.start) return setError('End time must be after the start time.');
    if (timeLimit * 60_000 > windowRange.end.getTime() - windowRange.start.getTime()) {
      return setError('Duration cannot be longer than the scheduled access window.');
    }
    if (!workbook) return setError('Upload a workbook before creating the test.');
    if (selectedStudents.length === 0) return setError('Please select at least one student.');

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('timeLimit', String(timeLimit));
      formData.append('startTime', windowRange.start.toISOString());
      formData.append('endTime', windowRange.end.toISOString());
      formData.append('assignedStudents', JSON.stringify(selectedStudents));
      formData.append('maxAttempts', String(maxAttempts));
      formData.append('file', workbook);
      if (imagesZip) formData.append('imagesZip', imagesZip);

      const response = await createFullLengthTestApi(formData);
      if (!response.success || !response.data) {
        setError(response.message || 'Failed to create test.');
        return;
      }

      const createdUploadResult = response.data.uploadResult as BulkUploadResult;
      const test = response.data.test;
      setUploadResult(createdUploadResult);
      setScheduledTests((prev) => [
        {
          id: test._id,
          title: test.title,
          students: test.assignedStudents.length,
          questionCount: test.questionCount,
          startTime: new Date(test.startTime),
          endTime: new Date(test.endTime),
          status: getStatus(test.startTime, test.endTime),
        },
        ...prev,
      ]);
      setSuccess(
        `${createdUploadResult.summary.savedRows} questions uploaded and assigned to ${selectedStudents.length} student${selectedStudents.length === 1 ? '' : 's'}.`
      );
      setTitle('');
      setTimeLimit(180);
      setMaxAttempts(1);
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setStartDateTime(null);
      setEndDateTime(null);
      setWorkbook(null);
      setImagesZip(null);
      setSelectedStudents([]);
    } catch (submitError: any) {
      const responseData = submitError?.response?.data;
      const failedUploadResult = responseData?.data?.uploadResult as BulkUploadResult | undefined;
      if (failedUploadResult) setUploadResult(failedUploadResult);
      setError(responseData?.message || submitError.message || 'Error occurred while creating the test.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader
          eyebrow="Exams"
          title="Create a test"
          description="Upload the questions, set when students can take it, and choose who gets it. Everything is saved in one go when you press Create test."
        />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5">
            <AdminPanel title={<StepTitle step={1}>Basics</StepTitle>}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="test-title" className={fieldLabel}>
                    Test title
                  </label>
                  <input
                    id="test-title"
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setError('');
                    }}
                    placeholder="e.g. Placement mock test 3"
                    className={fieldInput}
                  />
                  <p className={fieldHint}>Students see this name on their dashboard and in the notification.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="test-duration" className={fieldLabel}>
                      Duration (minutes)
                    </label>
                    <input
                      id="test-duration"
                      type="number"
                      min={1}
                      max={999}
                      value={timeLimit}
                      onChange={(event) => setTimeLimit(Math.max(1, Number(event.target.value)))}
                      className={cn(fieldInput, 'tabular')}
                      placeholder="Duration in minutes"
                    />
                    <p className={fieldHint}>How long each attempt lasts once a student starts.</p>
                  </div>
                  <div>
                    <label htmlFor="test-attempts" className={fieldLabel}>
                      Attempts per student
                    </label>
                    <input
                      id="test-attempts"
                      type="number"
                      min={1}
                      max={999}
                      value={maxAttempts}
                      onChange={(event) => setMaxAttempts(Math.max(1, Number(event.target.value)))}
                      className={cn(fieldInput, 'tabular')}
                      placeholder="Max attempts per student"
                    />
                    <p className={fieldHint}>Usually 1. Raise it to allow retakes.</p>
                  </div>
                </div>
              </div>
            </AdminPanel>

            <AdminPanel
              title={<StepTitle step={2}>Questions</StepTitle>}
              description="Upload an Excel sheet in the question template format. Every valid row becomes a question in this test."
              actions={
                <HoloButton variant="ghost" size="sm" onClick={downloadTemplate} icon={<Download size={14} />}>
                  Download template
                </HoloButton>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className={fieldLabel}>Question sheet</span>
                  <div
                    className="admin-dropzone relative flex min-h-[132px] cursor-pointer flex-col justify-center p-5 text-center"
                    data-active={workbook ? 'true' : undefined}
                  >
                    <input
                      ref={workbookRef}
                      type="file"
                      accept=".xlsx,.csv"
                      className="hidden"
                      onChange={(event) => setWorkbookFile(event.target.files?.[0] ?? null)}
                    />
                    <div onClick={() => !workbook && workbookRef.current?.click()} className="flex h-full flex-col justify-center gap-2">
                      <FileSpreadsheet size={22} className={cn('mx-auto', workbook ? 'text-brand' : 'text-ink/35')} />
                      <p className={cn('truncate px-4 text-sm', workbook ? 'font-medium text-ink' : 'text-ink/70')}>{workbook ? workbook.name : 'Choose a file'}</p>
                      <p className="text-[12px] text-ink/50">.xlsx or .csv, required</p>
                    </div>
                    {workbook && (
                      <button onClick={(e) => { e.stopPropagation(); setWorkbookFile(null); if (workbookRef.current) workbookRef.current.value = ''; }} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-ink/50 hover:bg-ink/[0.06] hover:text-ink" aria-label="Remove file">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className={fieldLabel}>Images <span className="font-normal text-ink/45">(optional)</span></span>
                  <div
                    className="admin-dropzone relative flex min-h-[132px] cursor-pointer flex-col justify-center p-5 text-center"
                    data-active={imagesZip ? 'true' : undefined}
                  >
                    <input
                      ref={zipRef}
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(event) => setZipFile(event.target.files?.[0] ?? null)}
                    />
                    <div onClick={() => !imagesZip && zipRef.current?.click()} className="flex h-full flex-col justify-center gap-2">
                      <FolderArchive size={22} className={cn('mx-auto', imagesZip ? 'text-brand' : 'text-ink/35')} />
                      <p className={cn('truncate px-4 text-sm', imagesZip ? 'font-medium text-ink' : 'text-ink/70')}>{imagesZip ? imagesZip.name : 'Choose a .zip'}</p>
                      <p className="text-[12px] text-ink/50">Only if the sheet names image files</p>
                    </div>
                    {imagesZip && (
                      <button onClick={(e) => { e.stopPropagation(); setZipFile(null); if (zipRef.current) zipRef.current.value = ''; }} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-ink/50 hover:bg-ink/[0.06] hover:text-ink" aria-label="Remove file">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {uploadResult && (
                <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-[10px] border border-line">
                  {[
                    { label: 'Rows', value: uploadResult.summary.totalRows, cls: 'text-ink' },
                    { label: 'Valid', value: uploadResult.summary.validRows, cls: 'text-ok' },
                    { label: 'Invalid', value: uploadResult.summary.invalidRows, cls: uploadResult.summary.invalidRows > 0 ? 'text-bad' : 'text-ink' },
                  ].map((item) => (
                    <div key={item.label} className="px-4 py-3">
                      <dt className="text-[12px] text-ink/55">{item.label}</dt>
                      <dd className={cn('mt-1 font-display text-2xl font-medium leading-none tabular', item.cls)}>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {invalidRows.length > 0 && (
                <div className="mt-4 rounded-[10px] border border-bad/25 bg-bad/[0.05] p-4">
                  <p className="mb-2 text-[13px] font-medium text-ink">Rows that need fixing</p>
                  <ul className="space-y-1">
                    {invalidRows.slice(0, 6).map((row) => (
                      <li key={row.rowNumber} className="text-[13px] leading-5 text-ink/75">
                        <span className="font-mono text-[12px] text-bad">Row {row.rowNumber}</span>
                        <span className="text-ink/30"> · </span>
                        {row.issues[0]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AdminPanel>

            <AdminPanel
              title={<StepTitle step={3}>Schedule</StepTitle>}
              description="Students can only start the test between these two times."
              className="!overflow-visible z-10"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className={fieldLabel}>Opens at</span>
                  <div className="flex gap-2">
                    <input type="date" aria-label="Start date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={fieldInput} />
                    <input type="time" aria-label="Start time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={fieldInput} />
                  </div>
                  <div className="mt-1.5">
                    <DateTimePickerPopup
                      value={startDateTime}
                      onChange={handleStartPickerChange}
                      accentColor="cyan"
                      trigger={<QuickPickButton />}
                    />
                  </div>
                </div>

                <div>
                  <span className={fieldLabel}>Closes at</span>
                  <div className="flex gap-2">
                    <input type="date" aria-label="End date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={fieldInput} />
                    <input type="time" aria-label="End time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={fieldInput} />
                  </div>
                  <div className="mt-1.5">
                    <DateTimePickerPopup
                      value={endDateTime}
                      onChange={handleEndPickerChange}
                      minDate={startDateTime || new Date()}
                      accentColor="cyan"
                      trigger={<QuickPickButton />}
                    />
                  </div>
                </div>
              </div>
              {windowRange && (
                <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-line bg-raised px-4 py-3 text-[13px] leading-5 text-ink/65">
                  <Clock size={15} className="mt-0.5 shrink-0 text-ink/45" />
                  <p>
                    Students can start between{' '}
                    <span className="font-medium text-ink">{windowRange.start.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {' '}and{' '}
                    <span className="font-medium text-ink">{windowRange.end.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>.
                  </p>
                </div>
              )}
            </AdminPanel>

            <AdminPanel
              title={<StepTitle step={4}>Students</StepTitle>}
              description="Pick whole sections, or choose students one by one."
            >
              {loadingUsers ? (
                <LoadingSpinner size="sm" label="Loading students…" className="py-8" />
              ) : studentLoadError ? (
                <div className="flex items-start gap-2.5 rounded-[10px] border border-bad/30 bg-bad/[0.07] px-4 py-3 text-sm text-ink/80">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-bad" />
                  <p>{studentLoadError}</p>
                </div>
              ) : students.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-ink/20 bg-raised px-4 py-8 text-center">
                  <p className="text-sm text-ink/75">No student accounts yet.</p>
                  <p className="mt-1 text-[13px] text-ink/50">Students appear here once they sign up or an account is restored.</p>
                </div>
              ) : (
                <SectionStudentPicker
                  students={students}
                  selectedIds={selectedStudents}
                  onChange={setSelectedStudents}
                />
              )}
            </AdminPanel>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-[10px] border border-bad/30 bg-bad/[0.07] px-4 py-3">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-bad" />
                <p className="text-sm text-ink/80">{error}</p>
              </div>
            )}
            {success && (
              <div role="status" className="flex items-start gap-2.5 rounded-[10px] border border-ok/30 bg-ok/[0.07] px-4 py-3">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-ok" />
                <p className="text-sm font-medium text-ink">{success}</p>
              </div>
            )}
            <HoloButton variant="cyan" size="xl" fullWidth loading={submitting} onClick={handleCreate} icon={<Send size={17} />}>
              Create test
            </HoloButton>
          </div>

          <div className="space-y-5">
            <AdminPanel title="Summary" contentClassName="p-0 sm:p-0">
              <dl className="divide-y divide-line">
                {[
                  ['Title', title || '—'],
                  ['Question sheet', workbook?.name || 'Not chosen'],
                  ['Duration', `${timeLimit} min`],
                  ['Attempts', `${maxAttempts} per student`],
                  ['Students', `${selectedStudents.length} selected`],
                  ['Questions', uploadResult ? `${uploadResult.summary.validRows} ready` : 'Counted when you create'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 px-5 py-2.5">
                    <dt className="shrink-0 text-[13px] text-ink/55">{label}</dt>
                    <dd className="break-all text-right text-[13px] font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </AdminPanel>

            <AdminPanel title="Good to know">
              <ul className="space-y-4 text-[13px] leading-5">
                <li className="flex gap-3">
                  <Bell size={15} className="mt-0.5 shrink-0 text-ink/45" />
                  <div>
                    <p className="font-medium text-ink">Students are notified</p>
                    <p className="text-ink/55">Everyone you select gets an in-app notification when the test is created.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Lock size={15} className="mt-0.5 shrink-0 text-ink/45" />
                  <div>
                    <p className="font-medium text-ink">Locked outside the window</p>
                    <p className="text-ink/55">The Start button only works between the open and close times.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Clock size={15} className="mt-0.5 shrink-0 text-ink/45" />
                  <div>
                    <p className="font-medium text-ink">Duration must fit</p>
                    <p className="text-ink/55">The duration can&apos;t be longer than the time between open and close.</p>
                  </div>
                </li>
              </ul>
            </AdminPanel>

            <AdminPanel title="Scheduled tests" contentClassName="p-0 sm:p-0">
              {scheduledTests.length === 0 ? (
                <p className="px-5 py-4 text-[13px] text-ink/55">Tests you create will show up here.</p>
              ) : (
                <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
                  {scheduledTests.map((test) => (
                    <li key={test.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 text-[13px] font-medium leading-snug text-ink">{test.title}</p>
                        <AdminStatusBadge tone={STATUS_TONE[test.status] ?? 'default'} className="!px-2 !text-[11px]">
                          {STATUS_LABEL[test.status] ?? test.status}
                        </AdminStatusBadge>
                      </div>
                      <p className="mt-1 text-[12px] text-ink/55">
                        {test.questionCount} questions · {test.students} students
                      </p>
                      <p className="mt-0.5 text-[12px] leading-5 text-ink/50 tabular">
                        {test.startTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        <br />to{" "}
                        {test.endTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </AdminPanel>
          </div>
        </div>
      </AdminPage>
    </AdminLayout>
  );
};

export default CreateTestPage;
