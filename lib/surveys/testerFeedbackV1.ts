export type QuestionType = 'rating_1_7' | 'text' | 'single_choice' | 'multi_choice' | 'boolean';

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  description?: string;
  required?: boolean;
  options?: string[];
  maxSelected?: number;
  placeholder?: string;
};

export type Section = { id: string; title: string; description?: string; questions: Question[] };

export const SURVEY_KEY = 'tester_feedback_v1';

export const sections: Section[] = [
  {
    id: 'capture',
    title: 'Quick intro',
    description:
      'Complete this questionnaire in full and we’ll send you a £10 Costa voucher. To claim it, please provide an email address.',
    questions: [
      { id: 'participant_name', type: 'text', prompt: 'Your name', required: true, placeholder: 'e.g. Alex Smith' },
      { id: 'claim_voucher', type: 'boolean', prompt: 'I want to claim the £10 Costa voucher', required: true },
      {
        id: 'participant_email',
        type: 'text',
        prompt: 'Email address (for voucher + follow-up)',
        description: 'Required if you want the voucher.',
        required: false,
        placeholder: 'name@example.com',
      },
      { id: 'consent', type: 'boolean', prompt: 'I agree my feedback may be stored and used to improve the product.', required: true },
      { id: 'follow_up_ok', type: 'boolean', prompt: 'Can we follow up with you if needed?', required: true },
    ],
  },
  {
    id: 'overall',
    title: 'Overall',
    questions: [
      { id: 'overall_understood', type: 'rating_1_7', prompt: 'I immediately understood what FLASH is for.', required: true },
      { id: 'overall_polished', type: 'rating_1_7', prompt: 'The app feels polished and trustworthy.', required: true },
      { id: 'overall_navigation', type: 'rating_1_7', prompt: 'Navigation is clear (Home / Study / Papers / Profile).', required: true },
      { id: 'overall_fast', type: 'rating_1_7', prompt: 'The app feels fast and responsive.', required: true },
      {
        id: 'overall_loved_pick',
        type: 'single_choice',
        prompt: 'What did you love most?',
        required: true,
        options: ['Design/UX', 'AI card generation', 'Studying (Leitner)', 'Topic discovery', 'Speed', 'Other'],
      },
      {
        id: 'overall_change_first_pick',
        type: 'single_choice',
        prompt: 'What would you change first?',
        required: true,
        options: ['Fix bugs', 'Improve performance', 'Make navigation clearer', 'Improve AI quality', 'Simplify onboarding', 'Improve study experience', 'Other'],
      },
    ],
  },
  {
    id: 'auth',
    title: 'Login / Sign up / Password reset',
    questions: [
      { id: 'auth_signup_easy', type: 'rating_1_7', prompt: 'Sign up was straightforward.', required: true },
      { id: 'auth_terms_clear', type: 'rating_1_7', prompt: 'Terms & Privacy agreement step was clear.', required: true },
      { id: 'auth_login_errors', type: 'rating_1_7', prompt: 'Login errors were clear and helpful.', required: true },
      { id: 'auth_forgot_password', type: 'rating_1_7', prompt: 'Forgot password flow worked as expected.', required: true },
      {
        id: 'auth_issues_level',
        type: 'single_choice',
        prompt: 'Did you have any login/sign up/password reset issues?',
        required: true,
        options: ['No issues', 'Minor issue', 'Major issue', 'Blocking issue', 'Didn’t try'],
      },
    ],
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    questions: [
      { id: 'onboarding_clear', type: 'rating_1_7', prompt: 'Onboarding flow was clear (Welcome → exam type → subjects).', required: true },
      { id: 'onboarding_subject_search', type: 'rating_1_7', prompt: 'Subject selection/search was easy.', required: true },
      {
        id: 'onboarding_matches_reality',
        type: 'rating_1_7',
        prompt: '“Search a topic → AI generates cards → you study with spaced repetition” matched reality.',
        required: true,
      },
      {
        id: 'onboarding_confusing_level',
        type: 'single_choice',
        prompt: 'How confusing was onboarding?',
        required: true,
        options: ['Not confusing', 'A little confusing', 'Confusing', 'Very confusing', 'Didn’t do onboarding', 'Other'],
      },
    ],
  },
  {
    id: 'home_study',
    title: 'Home + Study',
    questions: [
      { id: 'home_next_steps', type: 'rating_1_7', prompt: 'Home helped me understand what to do today.', required: true },
      { id: 'home_cards_due', type: 'rating_1_7', prompt: 'Cards Due reminders were helpful (not annoying).', required: true },
      { id: 'study_bank_understand', type: 'rating_1_7', prompt: 'I understand Card Bank vs Study Bank.', required: true },
      { id: 'study_leitner_fair', type: 'rating_1_7', prompt: 'Leitner boxes + Cards Due feel fair and motivating.', required: true },
      { id: 'study_smooth', type: 'rating_1_7', prompt: 'Study sessions were smooth (no lag/freezes).', required: true },
      {
        id: 'study_confusing_pick',
        type: 'single_choice',
        prompt: 'Was anything confusing about studying?',
        required: true,
        options: ['Nothing confusing', 'Card Bank vs Study Bank', 'Leitner boxes / cards due', 'What to do next', 'UI/buttons', 'Other'],
      },
    ],
  },
  {
    id: 'create_cards',
    title: 'Create flashcards',
    questions: [
      { id: 'create_choice_clear', type: 'rating_1_7', prompt: 'Creating cards is clear (AI / Manual / From Image).', required: true },
      { id: 'create_ai_types', type: 'rating_1_7', prompt: 'AI card types were clear (MCQ / Short Answer / Essay / Acronym).', required: true },
      {
        id: 'create_ai_quality_pick',
        type: 'single_choice',
        prompt: 'Overall AI card quality',
        required: true,
        options: ['Excellent', 'Good', 'OK', 'Poor', 'Failed to generate', 'Other'],
      },
    ],
  },
  {
    id: 'wrap',
    title: 'Finish',
    questions: [
      { id: 'overall_satisfaction_1_10', type: 'single_choice', prompt: 'Overall satisfaction (1–10)', required: true, options: ['1','2','3','4','5','6','7','8','9','10'] },
      { id: 'nps_0_10', type: 'single_choice', prompt: 'Likelihood to recommend (0–10)', required: true, options: ['0','1','2','3','4','5','6','7','8','9','10'] },
      {
        id: 'top_improvements',
        type: 'multi_choice',
        prompt: 'Which areas need improvement? (pick up to 3)',
        required: true,
        maxSelected: 3,
        options: ['Onboarding', 'Navigation', 'Topic discovery/search', 'AI card quality', 'Studying (Leitner)', 'Performance/speed', 'Bugs/crashes', 'Pricing/paywall', 'Other'],
      },
    ],
  },
];

