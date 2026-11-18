// Content for the landing page. Everything here describes what the
// product actually does today; keep it that way when editing.

export type SampleQuestion = {
  section: string;
  topic: string;
  text: string;
  options: string[];
  answer: number;
  working: string;
};

export const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    section: 'Quantitative',
    topic: 'Speed & distance',
    text: 'A train 150 m long passes a signal pole in 12 seconds. How long will it take to pass a platform 250 m long?',
    options: ['20 seconds', '28 seconds', '32 seconds', '36 seconds'],
    answer: 2,
    working: 'Speed = 150 ÷ 12 = 12.5 m/s. To clear the platform it covers 150 + 250 = 400 m, so 400 ÷ 12.5 = 32 s.',
  },
  {
    section: 'Logical reasoning',
    topic: 'Number series',
    text: 'What comes next in the series?  3, 7, 15, 31, …',
    options: ['47', '55', '62', '63'],
    answer: 3,
    working: 'Each term is double the previous one, plus 1: 31 × 2 + 1 = 63.',
  },
  {
    section: 'Verbal ability',
    topic: 'Vocabulary',
    text: 'Choose the word closest in meaning to CANDID.',
    options: ['Careful', 'Frank', 'Clever', 'Guarded'],
    answer: 1,
    working: 'Candid means open and honest: frank. “Guarded” is close to the opposite.',
  },
];

export const SECTIONS = [
  {
    no: 'I',
    name: 'Quantitative aptitude',
    blurb: 'Arithmetic that placement papers lean on, worked the fast way.',
    topics: ['Percentages', 'Profit & loss', 'Time & work', 'Speed & distance', 'Ratio & proportion', 'Averages', 'Interest', 'Number system'],
  },
  {
    no: 'II',
    name: 'Logical reasoning',
    blurb: 'Patterns, arrangements and deductions under a clock.',
    topics: ['Series', 'Coding–decoding', 'Blood relations', 'Directions', 'Syllogisms', 'Seating arrangement', 'Puzzles'],
  },
  {
    no: 'III',
    name: 'Verbal ability',
    blurb: 'Reading carefully and choosing the right word, quickly.',
    topics: ['Synonyms & antonyms', 'Reading comprehension', 'Sentence correction', 'Fill in the blanks', 'Para jumbles'],
  },
];

export const INSTRUCTIONS = [
  { title: 'Choose your paper', body: 'Pick a section, narrow it to the topics you want, set the difficulty and anything from 5 to 30 questions.' },
  { title: 'Settle in', body: 'Allow the camera and go full screen. The test starts when you do, not before.' },
  { title: 'Answer against the clock', body: 'Move between questions freely. The palette shows what you have answered and what is still open.' },
  { title: 'Submit, or run out of time', body: 'When the timer hits zero the paper is submitted for you, exactly as it is.' },
  { title: 'Read the review', body: 'Every question comes back with your answer, the right one and a worked solution.' },
];

export const FAQ = [
  {
    q: 'Is the demo test really free?',
    a: 'Yes. Ten quantitative questions, ten minutes, no account needed. You get a full review at the end.',
  },
  {
    q: 'Do I need a webcam?',
    a: 'For proctored tests, yes: the camera checks that you are at the desk. The free demo does not use it.',
  },
  {
    q: 'What happens if I switch tabs during a test?',
    a: 'Each switch, or leaving full screen, is recorded as a strike. On the third strike the test submits itself.',
  },
  {
    q: 'Who is this useful for?',
    a: 'Students preparing for campus placement aptitude rounds and the aptitude sections of competitive exams. If your paper has quant, reasoning and verbal, it fits.',
  },
  {
    q: 'Can my college run tests for a whole batch?',
    a: 'Yes. Admins can upload questions from an Excel sheet, schedule tests for specific sections, watch live proctoring and see results per student.',
  },
];
