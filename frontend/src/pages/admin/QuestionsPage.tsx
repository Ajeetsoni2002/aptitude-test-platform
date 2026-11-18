import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Filter,
  Plus,
  Search,
  SquarePen,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import AdminLayout from '@/components/AdminLayout';
import QuestionPreview from '@/components/QuestionPreview';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  AdminEmptyState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/AdminUI';
import {
  bulkDeleteQuestionsApi,
  deleteQuestionApi,
  getQuestionsAdminApi,
  updateQuestionApi,
  getAllTopicsApi,
  getSubtopicsForTopicApi,
} from '@/api/adminApi';
import { getAssetUrl, getOptionLetter } from '@/lib/question';
import { cn } from '@/lib/utils';
import type { Question } from '@/types';

const fieldLabel = 'mb-1.5 block text-[13px] font-medium text-ink';
const fieldInput = 'admin-input w-full px-3 py-2 text-sm';
const iconButton =
  'grid h-8 w-8 place-items-center rounded-lg text-ink/55 transition-colors hover:bg-ink/[0.06] hover:text-ink disabled:cursor-not-allowed disabled:opacity-40';

const QUESTION_TYPE_LABEL: Record<string, string> = {
  'text-only': 'Text only',
  'image-rich': 'Has images',
};

const FilterChip = ({ label, onRemove }: { label: ReactNode; onRemove: () => void }) => (
  <span className="admin-chip !pr-1">
    {label}
    <button
      type="button"
      onClick={onRemove}
      aria-label="Remove filter"
      className="grid h-5 w-5 place-items-center rounded-full text-ink/45 transition-colors hover:bg-ink/[0.08] hover:text-ink"
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

type EditState = {
  _id: string;
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  questionImage?: string;
  options: Array<{ text: string; image?: string }>;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
};

const DIFFICULTY_TONE: Record<Question['difficulty'], 'green' | 'amber' | 'red'> = {
  easy: 'green',
  medium: 'amber',
  hard: 'red',
};

const buildEditState = (question: Question): EditState => ({
  _id: question._id,
  topic: question.topic,
  subtopic: question.subtopic || '',
  difficulty: question.difficulty,
  questionText: question.questionText || '',
  questionImage: question.questionImage,
  options: question.options.map((option) => ({
    text: option.text || '',
    image: option.image,
  })),
  correctAnswer: question.correctAnswer || 'A',
  explanation: question.explanation || '',
});

const validateEdit = (state: EditState) => {
  const issues: string[] = [];
  if (!state.topic.trim()) issues.push('Topic is required.');
  if (!state.questionText.trim() && !state.questionImage) {
    issues.push('Question needs text or an image.');
  }
  state.options.forEach((option, index) => {
    if (!option.text.trim() && !option.image) {
      issues.push(`Option ${getOptionLetter(index)} needs text or an image.`);
    }
  });
  return issues;
};

const QuestionsPage = () => {
  const navigate = useNavigate();
  const observerTarget = useRef<HTMLDivElement>(null);

  // State management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questionType, setQuestionType] = useState('');

  // Dynamic filter data
  const [topics, setTopics] = useState<string[]>([]);
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [pageSize] = useState(50);

  // UI state
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Load all topics on mount
  useEffect(() => {
    const loadTopics = async () => {
      setTopicsLoading(true);
      try {
        const response = await getAllTopicsApi();
        if (response.success && response.data?.topics) {
          setTopics(response.data.topics);
        }
      } catch (error) {
        console.error('Failed to load topics:', error);
      } finally {
        setTopicsLoading(false);
      }
    };

    loadTopics();
  }, []);

  // Load subtopics when topic changes
  useEffect(() => {
    const loadSubtopics = async () => {
      if (!topic) {
        setSubtopics([]);
        setSubtopic('');
        return;
      }

      try {
        const response = await getSubtopicsForTopicApi(topic);
        if (response.success && response.data?.subtopics) {
          setSubtopics(response.data.subtopics);
        }
      } catch (error) {
        console.error('Failed to load subtopics:', error);
        setSubtopics([]);
      }
    };

    loadSubtopics();
  }, [topic]);

  // Fetch questions with current filters
  const fetchQuestions = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const response = await getQuestionsAdminApi(
          page,
          pageSize,
          topic,
          difficulty,
          questionType,
          subtopic
        );

        if (response.success && response.data) {
          const newQuestions = response.data.questions || [];

          if (page === 1) {
            setQuestions(newQuestions);
          } else {
            setQuestions((prev) => [...prev, ...newQuestions]);
          }

          setTotalPages(response.data.pagination.totalPages);
          setTotalQuestions(response.data.pagination.totalQuestions);
          setCurrentPage(page);
        }
      } catch (error) {
        setNotice({
          type: 'error',
          message: 'Question bank could not be loaded right now.',
        });
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    },
    [topic, subtopic, difficulty, questionType, pageSize]
  );

  // Load questions when filters change
  useEffect(() => {
    setCurrentPage(1);
    setQuestions([]);
    fetchQuestions(1);
  }, [topic, subtopic, difficulty, questionType]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          currentPage < totalPages &&
          questions.length > 0
        ) {
          fetchQuestions(currentPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [isLoading, currentPage, totalPages, questions.length, fetchQuestions]);

  const filteredQuestions = useMemo(() => {
    if (!search.trim()) return questions;

    const keyword = search.trim().toLowerCase();
    return questions.filter((question) => {
      const haystack = [
        question.topic,
        question.subtopic,
        question.questionText,
        question.explanation,
        ...question.options.map((option) => option.text),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [questions, search]);

  const imageCount = useMemo(
    () =>
      filteredQuestions.filter(
        (question) =>
          Boolean(question.questionImage) ||
          question.options.some((option) => Boolean(option.image))
      ).length,
    [filteredQuestions]
  );

  const bulkDeleteScopeLabel = useMemo(() => {
    if (!topic) {
      return 'Select a topic first. You can optionally narrow the delete scope with subtopic and difficulty.';
    }

    const segments = [topic];
    if (subtopic) segments.push(subtopic);
    if (difficulty) segments.push(`${difficulty} difficulty`);
    return `This will target ${segments.join(' / ')} across the question bank.`;
  }, [difficulty, subtopic, topic]);

  const bulkDeleteLoadedCount = useMemo(
    () =>
      questions.filter((question) => {
        if (!topic || question.topic !== topic) return false;
        if (subtopic && question.subtopic !== subtopic) return false;
        return true;
      }).length,
    [questions, subtopic, topic]
  );

  const clearFilters = () => {
    setSearch('');
    setTopic('');
    setSubtopic('');
    setDifficulty('');
    setQuestionType('');
    setCurrentPage(1);
  };

  const handleDelete = async (questionId: string) => {
    if (!window.confirm('Delete this question from the bank?')) return;
    setBusyId(questionId);
    setNotice(null);
    try {
      await deleteQuestionApi(questionId);
      setQuestions((current) => current.filter((question) => question._id !== questionId));
      setNotice({ type: 'success', message: 'Question removed from the bank.' });
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.message || 'Question could not be deleted.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!topic) {
      setNotice({ type: 'error', message: 'Select a topic before using bulk delete.' });
      return;
    }

    const scope = [topic, subtopic || null, difficulty ? `${difficulty} difficulty` : null]
      .filter(Boolean)
      .join(' / ');

    const confirmed = window.confirm(
      `Delete all questions in ${scope}? Questions already used in scheduled tests or past attempts will be protected. This action cannot be undone.`
    );

    if (!confirmed) return;

    setBulkDeleting(true);
    setNotice(null);

    try {
      const response = await bulkDeleteQuestionsApi({
        topic,
        ...(subtopic && { subtopic }),
        ...(difficulty && { difficulty }),
      });

      if (response.success) {
        setPreviewQuestion(null);
        setEditState(null);
        setNotice({ type: 'success', message: response.message });
        setCurrentPage(1);
        setQuestions([]);
        await fetchQuestions(1);
      } else {
        setNotice({
          type: 'error',
          message: response.message || 'Bulk delete could not be completed.',
        });
      }
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.message || 'Bulk delete could not be completed.',
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editState) return;
    const issues = validateEdit(editState);
    if (issues.length > 0) {
      setEditError(issues.join(' '));
      return;
    }

    setSavingEdit(true);
    setEditError('');
    try {
      const response = await updateQuestionApi(editState._id, {
        topic: editState.topic.trim(),
        subtopic: editState.subtopic.trim() || undefined,
        difficulty: editState.difficulty,
        questionText: editState.questionText.trim() || undefined,
        questionImage: editState.questionImage,
        options: editState.options.map((option) => ({
          text: option.text.trim() || undefined,
          image: option.image,
        })),
        correctAnswer: editState.correctAnswer,
        explanation: editState.explanation.trim() || undefined,
      });

      if (response.success && response.data) {
        setQuestions((current) =>
          current.map((question) => (question._id === editState._id ? response.data : question))
        );
        setEditState(null);
        setNotice({ type: 'success', message: 'Question updated successfully.' });
      } else {
        setEditError(response.message || 'Question could not be updated.');
      }
    } catch (error: any) {
      setEditError(error?.response?.data?.message || 'Question could not be updated.');
    } finally {
      setSavingEdit(false);
    }
  };


  const hasActiveFilters = Boolean(search.trim() || topic || subtopic || difficulty || questionType);

  return (
    <AdminLayout>
      <AdminPage>
        {previewQuestion && (
          <QuestionPreview
            questions={[previewQuestion]}
            onClose={() => setPreviewQuestion(null)}
            title="Question preview"
            subtitle="This is how the question appears to students."
          />
        )}

        <AdminPageHeader
          eyebrow="Content"
          title="Question bank"
          description="Every question tests can draw from. Search, filter by topic or difficulty, and fix mistakes in place."
          actions={
            <>
              <HoloButton
                variant="ghost"
                size="md"
                icon={<Upload size={16} />}
                onClick={() => navigate('/admin/upload')}
              >
                Upload Excel sheet
              </HoloButton>
              <HoloButton
                variant="cyan"
                size="md"
                icon={<Plus size={16} />}
                onClick={() => navigate('/admin/upload')}
              >
                Add question
              </HoloButton>
            </>
          }
        />

        <AdminPanel contentClassName="p-0 sm:p-0">
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row">
              <div className="relative xl:flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="admin-input w-full py-2 pl-9 pr-3 text-sm"
                  placeholder="Search question text, options, explanation or topic"
                  aria-label="Search questions"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:flex xl:flex-none">
                <select
                  value={topic}
                  onChange={(event) => {
                    setTopic(event.target.value);
                    setSubtopic('');
                  }}
                  disabled={topicsLoading}
                  aria-label="Topic"
                  className="admin-input admin-select w-full py-2 pl-3 text-sm disabled:opacity-50 xl:w-48"
                >
                  <option value="">All topics ({topics.length})</option>
                  {topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={subtopic}
                  onChange={(event) => setSubtopic(event.target.value)}
                  disabled={!topic || subtopics.length === 0}
                  aria-label="Subtopic"
                  className="admin-input admin-select w-full py-2 pl-3 text-sm disabled:opacity-50 xl:w-48"
                >
                  <option value="">All subtopics ({subtopics.length})</option>
                  {subtopics.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  aria-label="Difficulty"
                  className="admin-input admin-select w-full py-2 pl-3 text-sm xl:w-40"
                >
                  <option value="">Any difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <select
                  value={questionType}
                  onChange={(event) => setQuestionType(event.target.value)}
                  aria-label="Question type"
                  className="admin-input admin-select w-full py-2 pl-3 text-sm xl:w-40"
                >
                  <option value="">Any type</option>
                  <option value="text-only">Text only</option>
                  <option value="image-rich">Has images</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {hasActiveFilters ? (
                  <>
                    {search.trim() ? (
                      <FilterChip label={<>Text: &ldquo;{search.trim()}&rdquo;</>} onRemove={() => setSearch('')} />
                    ) : null}
                    {topic ? (
                      <FilterChip
                        label={topic}
                        onRemove={() => {
                          setTopic('');
                          setSubtopic('');
                        }}
                      />
                    ) : null}
                    {subtopic ? <FilterChip label={subtopic} onRemove={() => setSubtopic('')} /> : null}
                    {difficulty ? (
                      <FilterChip
                        label={<span className="capitalize">{difficulty}</span>}
                        onRemove={() => setDifficulty('')}
                      />
                    ) : null}
                    {questionType ? (
                      <FilterChip
                        label={QUESTION_TYPE_LABEL[questionType] ?? questionType}
                        onRemove={() => setQuestionType('')}
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-1 text-[13px] font-medium text-brand hover:underline"
                    >
                      Reset filters
                    </button>
                  </>
                ) : (
                  <span className="text-[13px] text-ink/50">No filters applied</span>
                )}
              </div>
              <p className="text-[13px] text-ink/55">
                <span className="font-medium text-ink tabular">{filteredQuestions.length}</span> shown of{' '}
                <span className="tabular">{totalQuestions}</span>
                <span className="mx-1.5 text-ink/30">·</span>
                <span className="tabular">{imageCount}</span> with images
              </p>
            </div>
          </div>

          <details className="group/bulk border-t border-line">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[13px] text-ink/60 transition-colors hover:text-ink sm:px-5 [&::-webkit-details-marker]:hidden">
              <ChevronRight className="h-4 w-4 transition-transform group-open/bulk:rotate-90" />
              <span className="font-medium">Delete questions in bulk</span>
              <span className="text-ink/45">
                {topic ? `${bulkDeleteLoadedCount} loaded questions in scope` : 'Pick a topic first'}
              </span>
            </summary>
            <div className="mx-4 mb-4 flex flex-col gap-4 rounded-[10px] border border-bad/25 bg-bad/[0.05] p-4 sm:mx-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1 text-[13px] leading-5">
                <p className="text-ink/80">{bulkDeleteScopeLabel}</p>
                <p className="text-ink/55">
                  {topic
                    ? `${bulkDeleteLoadedCount} total questions match this scope.`
                    : 'Choose a topic in the filters above to enable this.'}
                </p>
                <p className="text-ink/55">
                  Questions already used in a scheduled test or a past attempt are skipped automatically.
                </p>
              </div>
              <HoloButton
                variant="danger"
                size="md"
                icon={<Trash2 size={15} />}
                onClick={handleBulkDelete}
                disabled={!topic || bulkDeleting}
                className="shrink-0"
              >
                {bulkDeleting ? 'Deleting…' : 'Delete matching questions'}
              </HoloButton>
            </div>
          </details>
        </AdminPanel>

        {notice ? (
          <div
            role="status"
            className={cn(
              'flex items-start gap-2.5 rounded-[10px] border px-4 py-3 text-sm text-ink/80',
              notice.type === 'success' ? 'border-ok/30 bg-ok/[0.07]' : 'border-bad/30 bg-bad/[0.07]'
            )}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bad" />
            )}
            <span>{notice.message}</span>
          </div>
        ) : null}

        {isInitialLoad && isLoading ? (
          <AdminPanel>
            <LoadingSpinner size="lg" label="Loading questions…" className="min-h-[280px]" />
          </AdminPanel>
        ) : filteredQuestions.length === 0 && questions.length === 0 ? (
          <AdminEmptyState
            title="No questions yet"
            description="The bank is empty. Add a question by hand or upload an Excel sheet to get started."
            icon={<Filter className="h-5 w-5" />}
            action={
              <HoloButton
                variant="cyan"
                size="md"
                icon={<Plus size={16} />}
                onClick={() => navigate('/admin/upload')}
              >
                Add questions
              </HoloButton>
            }
          />
        ) : filteredQuestions.length === 0 ? (
          <AdminEmptyState
            title="Nothing matches these filters"
            description="Try a different search, or reset the filters to see the whole bank."
            icon={<Filter className="h-5 w-5" />}
            action={
              <HoloButton variant="ghost" size="md" icon={<X size={16} />} onClick={clearFilters}>
                Reset filters
              </HoloButton>
            }
          />
        ) : (
          <div>
            <AdminPanel contentClassName="p-0 sm:p-0">
              <div className="hidden grid-cols-[2.5rem_minmax(0,1fr)_11rem_6.5rem_7rem] gap-4 border-b border-line px-5 py-2.5 md:grid">
                <span className="label-caps">#</span>
                <span className="label-caps">Question</span>
                <span className="label-caps">Topic</span>
                <span className="label-caps">Difficulty</span>
                <span className="label-caps text-right">Actions</span>
              </div>
              <ul className="divide-y divide-line">
                {filteredQuestions.map((question, rowIndex) => (
                  <li
                    key={question._id}
                    className="grid gap-3 px-4 py-4 transition-colors hover:bg-ink/[0.02] sm:px-5 md:grid-cols-[2.5rem_minmax(0,1fr)_11rem_6.5rem_7rem] md:gap-4"
                  >
                    <span className="hidden pt-0.5 font-mono text-[12px] text-ink/45 md:block">
                      {rowIndex + 1}
                    </span>

                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-1.5 md:hidden">
                        <span className="font-mono text-[12px] text-ink/45">#{rowIndex + 1}</span>
                        <AdminStatusBadge tone="cyan">{question.topic}</AdminStatusBadge>
                        {question.subtopic ? (
                          <AdminStatusBadge tone="default">{question.subtopic}</AdminStatusBadge>
                        ) : null}
                        <AdminStatusBadge tone={DIFFICULTY_TONE[question.difficulty]} className="capitalize">
                          {question.difficulty}
                        </AdminStatusBadge>
                      </div>

                      {question.questionText ? (
                        <p className="line-clamp-4 whitespace-pre-line text-[15px] leading-6 text-ink">
                          {question.questionText}
                        </p>
                      ) : (
                        <p className="text-[14px] italic text-ink/50">Image-only question</p>
                      )}

                      {question.questionImage ? (
                        <img
                          src={getAssetUrl(question.questionImage)}
                          alt="Question figure"
                          loading="lazy"
                          className="block max-h-44 w-auto max-w-full rounded-[10px] border border-line bg-raised object-contain p-1"
                        />
                      ) : null}

                      <ol className="grid gap-1.5 sm:grid-cols-2">
                        {question.options.map((option, index) => {
                          const optionLetter = getOptionLetter(index);
                          const isCorrect = optionLetter === question.correctAnswer;
                          return (
                            <li
                              key={`${question._id}-${optionLetter}`}
                              className={cn(
                                'flex items-start gap-2.5 rounded-lg border px-2.5 py-1.5 text-[13px]',
                                isCorrect ? 'border-ok/30 bg-ok/[0.07]' : 'border-line bg-raised/50'
                              )}
                            >
                              <span
                                className={cn(
                                  'mt-px font-mono text-[12px] font-medium',
                                  isCorrect ? 'text-ok' : 'text-ink/45'
                                )}
                              >
                                {optionLetter}
                              </span>
                              <div className="min-w-0 flex-1 space-y-1.5">
                                {option.text ? (
                                  <p className="break-words leading-5 text-ink/80">{option.text}</p>
                                ) : null}
                                {option.image ? (
                                  <img
                                    src={getAssetUrl(option.image)}
                                    alt={`Option ${optionLetter}`}
                                    loading="lazy"
                                    className="block h-14 w-auto max-w-[160px] rounded-md border border-line bg-surface object-contain"
                                  />
                                ) : null}
                              </div>
                              {isCorrect ? (
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-label="Correct answer" />
                              ) : null}
                            </li>
                          );
                        })}
                      </ol>

                      {question.explanation ? (
                        <details className="group/exp text-[13px]">
                          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-ink/55 transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
                            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open/exp:rotate-90" />
                            Explanation
                          </summary>
                          <p className="mt-1.5 whitespace-pre-line pl-[18px] leading-6 text-ink/65">
                            {question.explanation}
                          </p>
                        </details>
                      ) : null}
                    </div>

                    <div className="hidden min-w-0 text-[13px] leading-5 md:block">
                      <p className="truncate font-medium text-ink" title={question.topic}>
                        {question.topic}
                      </p>
                      <p className="truncate text-ink/50" title={question.subtopic || undefined}>
                        {question.subtopic || 'No subtopic'}
                      </p>
                    </div>

                    <div className="hidden md:block">
                      <AdminStatusBadge tone={DIFFICULTY_TONE[question.difficulty]} className="capitalize">
                        {question.difficulty}
                      </AdminStatusBadge>
                    </div>

                    <div className="flex items-start gap-1 md:justify-end">
                      <button
                        type="button"
                        onClick={() => setPreviewQuestion(question)}
                        className={iconButton}
                        title="Preview as student"
                        aria-label="Preview as student"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditError('');
                          setEditState(buildEditState(question));
                        }}
                        className={iconButton}
                        title="Edit question"
                        aria-label="Edit question"
                      >
                        <SquarePen className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(question._id)}
                        disabled={busyId === question._id}
                        className={cn(iconButton, 'hover:bg-bad/10 hover:text-bad')}
                        title="Delete question"
                        aria-label="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </AdminPanel>

            {currentPage < totalPages && (
              <div className="mt-6 flex flex-col items-center gap-4">
                {isLoading && <LoadingSpinner size="sm" label="Loading more questions…" />}
              </div>
            )}

            <div ref={observerTarget} className="h-4" />
          </div>
        )}

        {createPortal(
        <AnimatePresence>
          {editState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-coal/40 px-4 py-6"
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-question-title"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-float"
              >
                <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
                  <div className="space-y-0.5">
                    <h2 id="edit-question-title" className="text-base font-semibold text-ink">
                      Edit question
                    </h2>
                    <p className="text-[13px] text-ink/55">
                      Change the wording, topic, options or answer. Existing images stay attached.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditState(null)}
                    className={iconButton}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:overflow-hidden">
                  <div className="space-y-7 p-5 sm:p-6 lg:overflow-y-auto">
                    <section className="space-y-3">
                      <h3 className="label-caps">Details</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label htmlFor="edit-topic" className={fieldLabel}>
                            Topic
                          </label>
                          <input
                            id="edit-topic"
                            value={editState.topic}
                            onChange={(event) =>
                              setEditState((current) =>
                                current ? { ...current, topic: event.target.value } : current
                              )
                            }
                            className={fieldInput}
                            placeholder="e.g. Quantitative aptitude"
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-subtopic" className={fieldLabel}>
                            Subtopic <span className="font-normal text-ink/45">(optional)</span>
                          </label>
                          <input
                            id="edit-subtopic"
                            value={editState.subtopic}
                            onChange={(event) =>
                              setEditState((current) =>
                                current ? { ...current, subtopic: event.target.value } : current
                              )
                            }
                            className={fieldInput}
                            placeholder="e.g. Percentages"
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-difficulty" className={fieldLabel}>
                            Difficulty
                          </label>
                          <select
                            id="edit-difficulty"
                            value={editState.difficulty}
                            onChange={(event) =>
                              setEditState((current) =>
                                current
                                  ? {
                                      ...current,
                                      difficulty: event.target.value as EditState['difficulty'],
                                    }
                                  : current
                              )
                            }
                            className={cn(fieldInput, 'admin-select')}
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="label-caps">Question</h3>
                      <div>
                        <label htmlFor="edit-question-text" className={fieldLabel}>
                          Question text
                        </label>
                        <textarea
                          id="edit-question-text"
                          value={editState.questionText}
                          onChange={(event) =>
                            setEditState((current) =>
                              current ? { ...current, questionText: event.target.value } : current
                            )
                          }
                          className={cn(fieldInput, 'min-h-[140px] resize-y leading-6')}
                          placeholder="Write the question as students should read it"
                        />
                        {editState.questionImage ? (
                          <p className="mt-1.5 text-[12px] text-ink/50">
                            This question has an image. It is kept as is and shown in the preview.
                          </p>
                        ) : null}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="label-caps">Options</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {editState.options.map((option, index) => (
                          <div key={`${editState._id}-${index}`}>
                            <label htmlFor={`edit-option-${index}`} className={fieldLabel}>
                              Option {getOptionLetter(index)}
                              {getOptionLetter(index) === editState.correctAnswer ? (
                                <span className="ml-2 text-[12px] font-normal text-ok">Correct answer</span>
                              ) : null}
                            </label>
                            <textarea
                              id={`edit-option-${index}`}
                              value={option.text}
                              onChange={(event) =>
                                setEditState((current) =>
                                  current
                                    ? {
                                        ...current,
                                        options: current.options.map((entry, entryIndex) =>
                                          entryIndex === index
                                            ? { ...entry, text: event.target.value }
                                            : entry
                                        ),
                                      }
                                    : current
                                )
                              }
                              className={cn(fieldInput, 'min-h-[80px] resize-y')}
                            />
                            {option.image ? (
                              <img
                                src={getAssetUrl(option.image)}
                                alt={`Option ${getOptionLetter(index)}`}
                                className="mt-2 h-20 w-full rounded-[10px] border border-line bg-raised object-contain p-1"
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="label-caps">Answer</h3>
                      <div className="grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)]">
                        <div>
                          <label htmlFor="edit-correct" className={fieldLabel}>
                            Correct option
                          </label>
                          <select
                            id="edit-correct"
                            value={editState.correctAnswer}
                            onChange={(event) =>
                              setEditState((current) =>
                                current
                                  ? {
                                      ...current,
                                      correctAnswer: event.target.value as EditState['correctAnswer'],
                                    }
                                  : current
                              )
                            }
                            className={cn(fieldInput, 'admin-select')}
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="edit-explanation" className={fieldLabel}>
                            Explanation <span className="font-normal text-ink/45">(optional)</span>
                          </label>
                          <textarea
                            id="edit-explanation"
                            value={editState.explanation}
                            onChange={(event) =>
                              setEditState((current) =>
                                current ? { ...current, explanation: event.target.value } : current
                              )
                            }
                            className={cn(fieldInput, 'min-h-[110px] resize-y leading-6')}
                            placeholder="Shown to students after the test"
                          />
                        </div>
                      </div>
                    </section>
                  </div>

                  <aside className="border-t border-line bg-raised p-5 sm:p-6 lg:overflow-y-auto lg:border-l lg:border-t-0">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="label-caps">Student preview</h3>
                      <AdminStatusBadge tone={DIFFICULTY_TONE[editState.difficulty]} className="capitalize">
                        {editState.difficulty}
                      </AdminStatusBadge>
                    </div>
                    <div className="space-y-2.5">
                      <div className="rounded-[12px] border border-line bg-surface p-4">
                        <p className="text-[12px] text-ink/50">
                          {editState.topic || 'No topic'}
                          {editState.subtopic ? ` / ${editState.subtopic}` : ''}
                        </p>
                        {editState.questionText ? (
                          <p className="mt-2 whitespace-pre-line text-[15px] leading-6 text-ink">
                            {editState.questionText}
                          </p>
                        ) : null}
                        {editState.questionImage ? (
                          <img
                            src={getAssetUrl(editState.questionImage)}
                            alt="Question figure"
                            className="mt-3 max-h-56 w-full rounded-[10px] border border-line bg-raised object-contain p-1"
                          />
                        ) : null}
                      </div>

                      {editState.options.map((option, index) => {
                        const optionLetter = getOptionLetter(index);
                        const isCorrect = optionLetter === editState.correctAnswer;
                        return (
                          <div
                            key={`${editState._id}-preview-${optionLetter}`}
                            className={cn('answer-option !cursor-default !p-3', isCorrect && 'correct')}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={cn(
                                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-[12px]',
                                  isCorrect ? 'border-ok bg-ok text-on-brand' : 'border-line text-ink/55'
                                )}
                              >
                                {optionLetter}
                              </span>
                              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                                {option.text ? (
                                  <p className="break-words text-sm leading-5 text-ink/80">{option.text}</p>
                                ) : null}
                                {option.image ? (
                                  <img
                                    src={getAssetUrl(option.image)}
                                    alt={`Option ${optionLetter}`}
                                    className="max-h-24 rounded-md border border-line bg-surface object-contain"
                                  />
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </aside>
                </div>

                <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-h-[20px] text-[13px]">
                    {editError ? (
                      <p className="flex items-start gap-2 text-bad">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{editError}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 sm:justify-end">
                    <HoloButton variant="ghost" size="md" onClick={() => setEditState(null)} className="flex-1 sm:flex-none">
                      Cancel
                    </HoloButton>
                    <HoloButton
                      variant="cyan"
                      size="md"
                      onClick={handleSaveEdit}
                      loading={savingEdit}
                      icon={<Check size={16} />}
                      className="flex-1 sm:flex-none"
                    >
                      Save changes
                    </HoloButton>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
          document.body
        )}
      </AdminPage>
    </AdminLayout>
  );
};

export default QuestionsPage;
