import { useMemo, useRef, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import HoloButton from '@/components/ui/HoloButton';
import QuestionPreview from '@/components/QuestionPreview';
import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/AdminUI';
import {
  confirmBulkQuestionsApi,
  createManualQuestionApi,
  downloadBulkTemplateApi,
  previewBulkQuestionsApi,
} from '@/api/adminApi';
import { cn } from '@/lib/utils';
import { getOptionLetter } from '@/lib/question';
import type { Question } from '@/types';
import type { BulkUploadResult } from '@/api/adminApi';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FolderArchive,
  Image as ImageIcon,
  PenLine,
  RotateCcw,
  Upload,
} from 'lucide-react';

const fieldLabel = 'mb-1.5 block text-[13px] font-medium text-ink';
const fieldHint = 'mt-1.5 text-[12px] leading-5 text-ink/50';
const fieldInput = 'admin-input w-full px-3 py-2 text-sm';

const TEMPLATE_COLUMNS: Array<{ name: string; required: string; note: string }> = [
  { name: 'topic', required: 'Yes', note: 'For example "Quantitative Aptitude".' },
  { name: 'subtopic', required: 'No', note: 'For example "Percentages".' },
  { name: 'difficulty', required: 'Yes', note: 'easy, medium or hard.' },
  { name: 'question', required: 'Text or image', note: 'The question as students will read it.' },
  { name: 'question_image', required: 'Text or image', note: 'An image URL, or a file name from your .zip.' },
  { name: 'A, B, C, D', required: 'Text or image', note: 'The four answer options.' },
  { name: 'A_image … D_image', required: 'No', note: 'An image for that option: URL or .zip file name.' },
  { name: 'answer', required: 'Yes', note: 'The correct option: A, B, C or D.' },
  { name: 'explanation', required: 'No', note: 'Shown to students after the test.' },
];

const Notice = ({ tone, children }: { tone: 'ok' | 'bad'; children: string }) => (
  <div
    role="status"
    className={cn(
      'flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-sm text-ink/80',
      tone === 'ok' ? 'border-ok/30 bg-ok/[0.07]' : 'border-bad/30 bg-bad/[0.07]'
    )}
  >
    {tone === 'ok' ? (
      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" />
    ) : (
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-bad" />
    )}
    <span>{children}</span>
  </div>
);

type Tab = 'manual' | 'bulk';
type AnswerLetter = 'A' | 'B' | 'C' | 'D';
type OptionState = { text: string; imageFile: File | null; imagePreview: string };
type ManualState = {
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  questionImageFile: File | null;
  questionImagePreview: string;
  options: OptionState[];
  correctAnswer: AnswerLetter;
  explanation: string;
};

const emptyOption = (): OptionState => ({ text: '', imageFile: null, imagePreview: '' });
const initialManual = (): ManualState => ({
  topic: '',
  subtopic: '',
  difficulty: 'easy',
  questionText: '',
  questionImageFile: null,
  questionImagePreview: '',
  options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
  correctAnswer: 'A',
  explanation: '',
});

const revokeUrl = (url?: string) => {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
};

const validateManual = (form: ManualState) => {
  const issues: string[] = [];
  if (!form.topic.trim()) issues.push('Topic is required.');
  if (!form.questionText.trim() && !form.questionImageFile) issues.push('Question must have text or image.');
  form.options.forEach((option, index) => {
    if (!option.text.trim() && !option.imageFile) issues.push(`Option ${getOptionLetter(index)} must have text or image.`);
  });
  return issues;
};

const buildManualPreview = (form: ManualState): Question => ({
  _id: 'manual-preview',
  topic: form.topic.trim(),
  subtopic: form.subtopic.trim(),
  difficulty: form.difficulty,
  questionText: form.questionText.trim() || undefined,
  questionImage: form.questionImagePreview || undefined,
  options: form.options.map((option) => ({
    text: option.text.trim() || undefined,
    image: option.imagePreview || undefined,
  })),
  correctAnswer: form.correctAnswer,
  explanation: form.explanation.trim() || undefined,
});

const buildManualFormData = (form: ManualState) => {
  const formData = new FormData();
  formData.append('topic', form.topic.trim());
  formData.append('subtopic', form.subtopic.trim());
  formData.append('difficulty', form.difficulty);
  formData.append('questionText', form.questionText.trim());
  formData.append('correctAnswer', form.correctAnswer);
  formData.append('explanation', form.explanation.trim());
  if (form.questionImageFile) formData.append('questionImage', form.questionImageFile);
  form.options.forEach((option, index) => {
    const letter = getOptionLetter(index);
    formData.append(`option${letter}_text`, option.text.trim());
    if (option.imageFile) formData.append(`option${letter}_image`, option.imageFile);
  });
  return formData;
};

const UploadQuestionsPage = () => {
  const [tab, setTab] = useState<Tab>('manual');
  const [manual, setManual] = useState<ManualState>(initialManual);
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState('');
  const [savingManual, setSavingManual] = useState(false);
  const [showManualPreview, setShowManualPreview] = useState(false);
  const [workbook, setWorkbook] = useState<File | null>(null);
  const [imagesZip, setImagesZip] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<BulkUploadResult | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [previewingBulk, setPreviewingBulk] = useState(false);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const workbookRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const manualIssues = useMemo(() => validateManual(manual), [manual]);
  const bulkQuestions = bulkPreview?.rows.filter((row) => row.question).map((row) => row.question as Question) || [];

  const setQuestionImage = (file: File | null) => {
    setManual((prev) => {
      revokeUrl(prev.questionImagePreview);
      return { ...prev, questionImageFile: file, questionImagePreview: file ? URL.createObjectURL(file) : '' };
    });
  };

  const setOptionImage = (index: number, file: File | null) => {
    setManual((prev) => {
      const options = [...prev.options];
      revokeUrl(options[index].imagePreview);
      options[index] = { ...options[index], imageFile: file, imagePreview: file ? URL.createObjectURL(file) : '' };
      return { ...prev, options };
    });
  };

  const resetManual = () => {
    revokeUrl(manual.questionImagePreview);
    manual.options.forEach((option) => revokeUrl(option.imagePreview));
    setManual(initialManual());
  };

  const saveManual = async () => {
    setSavingManual(true);
    setManualError('');
    try {
      const response = await createManualQuestionApi(buildManualFormData(manual));
      if (response.success) {
        setManualSuccess('Question saved successfully.');
        setShowManualPreview(false);
        resetManual();
      } else {
        setManualError(response.message || 'Failed to save question.');
      }
    } catch (error: any) {
      const issues = error?.response?.data?.data?.issues as string[] | undefined;
      setManualError(issues?.join(' ') || error?.response?.data?.message || 'Failed to save question.');
    } finally {
      setSavingManual(false);
    }
  };

  const previewBulk = async () => {
    if (!workbook) {
      setBulkError('Select a .xlsx or .csv workbook first.');
      return;
    }
    setPreviewingBulk(true);
    setBulkError('');
    try {
      const response = await previewBulkQuestionsApi(workbook, imagesZip);
      if (response.success && response.data) setBulkPreview(response.data);
    } catch (error: any) {
      setBulkError(error?.response?.data?.message || 'Failed to parse workbook.');
      if (error?.response?.data?.data) setBulkPreview(error.response.data.data);
    } finally {
      setPreviewingBulk(false);
    }
  };

  const confirmBulk = async () => {
    if (!workbook) return;
    setConfirmingBulk(true);
    setBulkError('');
    try {
      const response = await confirmBulkQuestionsApi(workbook, imagesZip);
      if (response.success && response.data) {
        setBulkPreview(response.data);
        setBulkSuccess(`${response.data.summary.savedRows} questions uploaded successfully.`);
        setShowBulkModal(false);
        setWorkbook(null);
        setImagesZip(null);
      }
    } catch (error: any) {
      setBulkError(error?.response?.data?.message || 'Upload failed.');
      if (error?.response?.data?.data) setBulkPreview(error.response.data.data);
    } finally {
      setConfirmingBulk(false);
    }
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
      setBulkError('Template download failed.');
    }
  };


  return (
    <AdminLayout>
      {showManualPreview && (
        <QuestionPreview
          questions={[buildManualPreview(manual)]}
          onClose={() => setShowManualPreview(false)}
          onConfirm={saveManual}
          isLoading={savingManual}
          title="Check the question"
          subtitle="This is how students will see it. Save it if everything looks right."
          confirmLabel="Save question"
        />
      )}
      {showBulkModal && bulkQuestions.length > 0 && (
        <QuestionPreview
          questions={bulkQuestions}
          onClose={() => setShowBulkModal(false)}
          onConfirm={bulkPreview?.summary.invalidRows === 0 ? confirmBulk : undefined}
          isLoading={confirmingBulk}
          title="Preview the sheet"
          subtitle="These are the questions read from your file, shown the way students will see them."
          confirmLabel="Upload questions"
        />
      )}
      <AdminPage>
        <AdminPageHeader
          eyebrow="Content"
          title="Add questions"
          description="Write a single question by hand, or upload many at once from an Excel sheet."
        />

        <div
          role="tablist"
          aria-label="How to add questions"
          className="inline-flex gap-1 rounded-[10px] border border-line bg-raised p-1"
        >
          {(['manual', 'bulk'] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              data-active={tab === item}
              onClick={() => setTab(item)}
              className="admin-tab"
            >
              {item === 'manual' ? <PenLine size={15} /> : <FileSpreadsheet size={15} />}
              {item === 'manual' ? 'Write one question' : 'Upload Excel sheet'}
            </button>
          ))}
        </div>

        {tab === 'manual' && (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-5">
              <AdminPanel title="Details" description="Where the question sits in the bank.">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label htmlFor="manual-topic" className={fieldLabel}>
                      Topic
                    </label>
                    <input
                      id="manual-topic"
                      value={manual.topic}
                      onChange={(event) => setManual((prev) => ({ ...prev, topic: event.target.value }))}
                      className={fieldInput}
                      placeholder="e.g. Quantitative Aptitude"
                    />
                  </div>
                  <div>
                    <label htmlFor="manual-subtopic" className={fieldLabel}>
                      Subtopic <span className="font-normal text-ink/45">(optional)</span>
                    </label>
                    <input
                      id="manual-subtopic"
                      value={manual.subtopic}
                      onChange={(event) => setManual((prev) => ({ ...prev, subtopic: event.target.value }))}
                      className={fieldInput}
                      placeholder="e.g. Percentages"
                    />
                  </div>
                  <div>
                    <label htmlFor="manual-difficulty" className={fieldLabel}>
                      Difficulty
                    </label>
                    <select
                      id="manual-difficulty"
                      value={manual.difficulty}
                      onChange={(event) => setManual((prev) => ({ ...prev, difficulty: event.target.value as ManualState['difficulty'] }))}
                      className={cn(fieldInput, 'admin-select capitalize')}
                    >
                      {['easy', 'medium', 'hard'].map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </AdminPanel>

              <AdminPanel title="Question" description="Add text, an image, or both.">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
                  <div>
                    <label htmlFor="manual-question" className={fieldLabel}>
                      Question text
                    </label>
                    <textarea
                      id="manual-question"
                      value={manual.questionText}
                      onChange={(event) => setManual((prev) => ({ ...prev, questionText: event.target.value }))}
                      className={cn(fieldInput, 'min-h-[150px] resize-y leading-6')}
                      placeholder="Write the question as students should read it"
                    />
                  </div>
                  <div>
                    <span className={fieldLabel}>Image <span className="font-normal text-ink/45">(optional)</span></span>
                    <label className="admin-dropzone flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center">
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => setQuestionImage(event.target.files?.[0] ?? null)} />
                      {manual.questionImagePreview ? (
                        <img src={manual.questionImagePreview} alt="Question preview" className="max-h-28 rounded-md object-contain" />
                      ) : (
                        <ImageIcon size={22} className="text-ink/35" />
                      )}
                      <span className="max-w-full truncate text-[12px] text-ink/55">
                        {manual.questionImageFile ? manual.questionImageFile.name : 'Choose an image'}
                      </span>
                    </label>
                  </div>
                </div>
              </AdminPanel>

              <AdminPanel title="Options" description="All four options are required. Each needs text or an image.">
                <div className="space-y-4">
                  {manual.options.map((option, index) => {
                    const letter = getOptionLetter(index);
                    return (
                      <div key={letter} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem] md:items-end">
                        <div>
                          <label htmlFor={`manual-option-${letter}`} className={fieldLabel}>
                            Option {letter}
                            {manual.correctAnswer === letter ? (
                              <span className="ml-2 text-[12px] font-normal text-ok">Correct answer</span>
                            ) : null}
                          </label>
                          <input
                            id={`manual-option-${letter}`}
                            value={option.text}
                            onChange={(event) => setManual((prev) => { const options = [...prev.options]; options[index] = { ...options[index], text: event.target.value }; return { ...prev, options }; })}
                            className={fieldInput}
                            placeholder={`Option ${letter} text`}
                          />
                        </div>
                        <label className="admin-dropzone flex h-[38px] cursor-pointer items-center gap-2.5 !rounded-[10px] px-3">
                          <input type="file" accept="image/*" className="hidden" onChange={(event) => setOptionImage(index, event.target.files?.[0] ?? null)} />
                          {option.imagePreview ? (
                            <img src={option.imagePreview} alt={`Option ${letter} preview`} className="h-7 w-7 shrink-0 rounded object-contain" />
                          ) : (
                            <ImageIcon size={16} className="shrink-0 text-ink/40" />
                          )}
                          <span className="truncate text-[12px] text-ink/55">
                            {option.imageFile ? option.imageFile.name : `Image for ${letter} (optional)`}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </AdminPanel>

              <AdminPanel title="Answer">
                <div className="grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)]">
                  <div>
                    <label htmlFor="manual-answer" className={fieldLabel}>
                      Correct option
                    </label>
                    <select
                      id="manual-answer"
                      value={manual.correctAnswer}
                      onChange={(event) => setManual((prev) => ({ ...prev, correctAnswer: event.target.value as AnswerLetter }))}
                      className={cn(fieldInput, 'admin-select')}
                    >
                      {['A', 'B', 'C', 'D'].map((letter) => <option key={letter} value={letter}>{letter}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="manual-explanation" className={fieldLabel}>
                      Explanation <span className="font-normal text-ink/45">(optional)</span>
                    </label>
                    <textarea
                      id="manual-explanation"
                      value={manual.explanation}
                      onChange={(event) => setManual((prev) => ({ ...prev, explanation: event.target.value }))}
                      className={cn(fieldInput, 'min-h-[110px] resize-y leading-6')}
                      placeholder="Why the answer is correct"
                    />
                    <p className={fieldHint}>Students see this when they review their answers.</p>
                  </div>
                </div>
              </AdminPanel>
            </div>

            <AdminPanel title="Before you save" className="lg:sticky lg:top-6">
              <div className="space-y-2">
                {manualIssues.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-ok">
                    <CheckCircle2 size={16} />
                    Everything required is filled in.
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] text-ink/55">Still needed:</p>
                    <ul className="space-y-1.5">
                      {manualIssues.map((issue) => (
                        <li key={issue} className="flex items-start gap-2 text-[13px] leading-5 text-ink/75">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <div className="mt-5 space-y-2">
                <HoloButton variant="cyan" size="lg" fullWidth disabled={manualIssues.length > 0} onClick={() => { setManualError(''); setManualSuccess(''); setShowManualPreview(true); }} icon={<Eye size={16} />}>Preview and save</HoloButton>
                <HoloButton variant="ghost" size="md" fullWidth onClick={resetManual} icon={<RotateCcw size={15} />}>Clear the form</HoloButton>
              </div>
              {(manualError || manualSuccess) && (
                <div className="mt-4 space-y-2">
                  {manualError && <Notice tone="bad">{manualError}</Notice>}
                  {manualSuccess && <Notice tone="ok">{manualSuccess}</Notice>}
                </div>
              )}
            </AdminPanel>
          </div>
        )}

        {tab === 'bulk' && (
          <div className="space-y-5">
            <AdminPanel
              title="How the sheet works"
              description="One question per row. Start from the template so the column names match."
              actions={
                <HoloButton variant="ghost" size="sm" onClick={downloadTemplate} icon={<Download size={14} />}>
                  Download template
                </HoloButton>
              }
              contentClassName="p-0 sm:p-0"
            >
              <div className="grid gap-0 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <ol className="space-y-4 p-5 text-[14px] leading-6 text-ink/75 sm:p-6">
                  {[
                    ['Fill in the template', 'Keep the header row as it is. Each row becomes one question with four options.'],
                    ['Add images if you need them', 'In an image column, paste a direct image URL, or type a file name such as q12.png and put that file in a .zip.'],
                    ['Upload and check', 'We read the file and list any rows with problems. Nothing is saved until you upload.'],
                  ].map(([heading, body], index) => (
                    <li key={heading} className="flex gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-raised font-mono text-[12px] text-ink/60">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-ink">{heading}</p>
                        <p className="text-[13px] text-ink/60">{body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="overflow-x-auto border-t border-line lg:border-l lg:border-t-0">
                  <table className="admin-table min-w-[480px] text-[13px]">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Required</th>
                        <th>What to put in it</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TEMPLATE_COLUMNS.map((column) => (
                        <tr key={column.name}>
                          <td className="whitespace-nowrap font-mono text-[12px] !text-ink">{column.name}</td>
                          <td className="whitespace-nowrap !text-ink/60">{column.required}</td>
                          <td className="!text-ink/70">{column.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </AdminPanel>

            <AdminPanel title="Upload files" description="The sheet is required. The .zip is only needed if your sheet refers to image files by name.">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className={fieldLabel}>Question sheet</span>
                  <label className="admin-dropzone block cursor-pointer p-6 text-center" data-active={workbook ? 'true' : undefined}>
                    <input ref={workbookRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={(event) => { setWorkbook(event.target.files?.[0] ?? null); setBulkPreview(null); setBulkSuccess(''); setBulkError(''); }} />
                    <div className="space-y-2" onClick={() => workbookRef.current?.click()}>
                      <FileSpreadsheet size={24} className={cn('mx-auto', workbook ? 'text-brand' : 'text-ink/35')} />
                      <p className={cn('truncate text-sm', workbook ? 'font-medium text-ink' : 'text-ink/70')}>{workbook ? workbook.name : 'Choose a file'}</p>
                      <p className="text-[12px] text-ink/50">.xlsx or .csv</p>
                    </div>
                  </label>
                </div>
                <div>
                  <span className={fieldLabel}>Images <span className="font-normal text-ink/45">(optional)</span></span>
                  <label className="admin-dropzone block cursor-pointer p-6 text-center" data-active={imagesZip ? 'true' : undefined}>
                    <input ref={zipRef} type="file" accept=".zip" className="hidden" onChange={(event) => { setImagesZip(event.target.files?.[0] ?? null); setBulkPreview(null); }} />
                    <div className="space-y-2" onClick={() => zipRef.current?.click()}>
                      <FolderArchive size={24} className={cn('mx-auto', imagesZip ? 'text-brand' : 'text-ink/35')} />
                      <p className={cn('truncate text-sm', imagesZip ? 'font-medium text-ink' : 'text-ink/70')}>{imagesZip ? imagesZip.name : 'Choose a .zip'}</p>
                      <p className="text-[12px] text-ink/50">PNG, JPG, WebP, GIF, BMP or SVG files</p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-5">
                <HoloButton variant="cyan" size="md" onClick={previewBulk} loading={previewingBulk} disabled={!workbook} icon={<Eye size={16} />}>Check the file</HoloButton>
                <HoloButton variant="ghost" size="md" disabled={!bulkPreview || bulkQuestions.length === 0} onClick={() => setShowBulkModal(true)}>Preview as student</HoloButton>
                <HoloButton variant="violet" size="md" disabled={!bulkPreview || bulkPreview.summary.invalidRows > 0 || confirmingBulk} onClick={confirmBulk} icon={<Upload size={15} />}>Upload questions</HoloButton>
                <p className="w-full text-[12px] text-ink/50 sm:ml-2 sm:w-auto">
                  Upload is enabled once the file has been checked and every row is valid.
                </p>
              </div>
              {(bulkError || bulkSuccess) && (
                <div className="mt-4 space-y-2">
                  {bulkError && <Notice tone="bad">{bulkError}</Notice>}
                  {bulkSuccess && <Notice tone="ok">{bulkSuccess}</Notice>}
                </div>
              )}
            </AdminPanel>

            {bulkPreview && (
              <AdminPanel
                title="What we found in the file"
                description={bulkPreview.summary.invalidRows > 0 ? 'Fix the rows marked invalid in your sheet, then choose the file again and re-check it.' : 'Every row is valid.'}
                contentClassName="p-0 sm:p-0"
              >
                <dl className="grid grid-cols-3 divide-x divide-line border-b border-line">
                  {[
                    { label: 'Rows', value: bulkPreview.summary.totalRows, cls: 'text-ink' },
                    { label: 'Valid', value: bulkPreview.summary.validRows, cls: 'text-ok' },
                    { label: 'Invalid', value: bulkPreview.summary.invalidRows, cls: bulkPreview.summary.invalidRows > 0 ? 'text-bad' : 'text-ink' },
                  ].map((item) => (
                    <div key={item.label} className="px-5 py-4 sm:px-6">
                      <dt className="text-[13px] text-ink/55">{item.label}</dt>
                      <dd className={cn('mt-1 font-display text-[28px] font-medium leading-none tabular', item.cls)}>{item.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="overflow-x-auto">
                  <table className="admin-table min-w-[760px] text-sm">
                    <thead>
                      <tr>
                        <th className="w-16">Row</th>
                        <th>Topic</th>
                        <th>Difficulty</th>
                        <th>Question</th>
                        <th className="w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.rows.map((row) => (
                        <tr key={row.rowNumber} className="align-top">
                          <td className="font-mono text-[12px] !text-ink/55">{row.rowNumber}</td>
                          <td>{row.question?.topic || '—'}</td>
                          <td className="capitalize">{row.question?.difficulty || '—'}</td>
                          <td className="max-w-[420px]">
                            <span className="line-clamp-2">{row.question?.questionText || (row.question?.questionImage ? 'Image-based question' : '—')}</span>
                            {row.issues.length > 0 && (
                              <ul className="mt-1.5 space-y-0.5">
                                {row.issues.map((issue) => (
                                  <li key={issue} className="text-[12px] leading-5 text-bad">{issue}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td>
                            <AdminStatusBadge tone={row.status === 'valid' ? 'green' : 'red'} className="gap-1 capitalize">
                              {row.status === 'valid' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                              {row.status}
                            </AdminStatusBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AdminPanel>
            )}
          </div>
        )}
      </AdminPage>
    </AdminLayout>
  );
};

export default UploadQuestionsPage;
