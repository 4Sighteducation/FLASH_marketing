/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useMemo, useState } from 'react';

type QuestionType = 'rating_1_7' | 'text' | 'single_choice' | 'boolean';
type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  description?: string;
  required?: boolean;
  options?: string[];
};
type Section = { id: string; title: string; description?: string; questions: Question[] };

const SURVEY_KEY = 'tester_feedback_v1';

// This is intentionally short enough to complete, but still “comprehensive” across the key app journeys.
// Everything here is required to qualify as “completed in full” for the voucher.
const sections: Section[] = [
  {
    id: 'capture',
    title: 'Quick intro',
    description:
      'Complete this questionnaire in full and we’ll send you a £10 Costa voucher. To claim it, please provide an email address.',
    questions: [
      { id: 'participant_name', type: 'text', prompt: 'Your name', required: true },
      { id: 'claim_voucher', type: 'boolean', prompt: 'I want to claim the £10 Costa voucher', required: true },
      {
        id: 'participant_email',
        type: 'text',
        prompt: 'Email address (for voucher + follow-up)',
        description: 'Required if you want the voucher.',
        required: false, // conditional (claim_voucher === true)
      },
      {
        id: 'consent',
        type: 'boolean',
        prompt: 'I agree my feedback may be stored and used to improve the product.',
        required: true,
      },
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
      { id: 'overall_loved', type: 'text', prompt: 'One thing you loved', required: true },
      { id: 'overall_change_first', type: 'text', prompt: 'One thing you would change first', required: true },
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
      { id: 'auth_issues', type: 'text', prompt: 'Any auth issues? Steps + severity (Low/Medium/High/Blocking)', required: true },
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
      { id: 'onboarding_confusing', type: 'text', prompt: 'Where did you hesitate or feel unsure?', required: true },
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
      { id: 'study_confusing', type: 'text', prompt: 'Most confusing part of studying (and why)', required: true },
    ],
  },
  {
    id: 'create_cards',
    title: 'Create flashcards',
    questions: [
      {
        id: 'create_choice_clear',
        type: 'rating_1_7',
        prompt: 'Creating cards is clear (AI Generated / Create Manually / From Image).',
        required: true,
      },
      { id: 'create_ai_types', type: 'rating_1_7', prompt: 'AI card types were clear (MCQ / Short Answer / Essay / Acronym).', required: true },
      { id: 'create_ai_quality', type: 'text', prompt: 'AI quality: what was great / what was wrong? (examples)', required: true },
    ],
  },
  {
    id: 'wrap',
    title: 'Finish',
    questions: [
      { id: 'overall_satisfaction_1_10', type: 'single_choice', prompt: 'Overall satisfaction (1–10)', required: true, options: ['1','2','3','4','5','6','7','8','9','10'] },
      { id: 'nps_0_10', type: 'single_choice', prompt: 'Likelihood to recommend (0–10)', required: true, options: ['0','1','2','3','4','5','6','7','8','9','10'] },
      { id: 'top_3_improvements', type: 'text', prompt: 'Top 3 improvements (ranked)', required: true },
    ],
  },
];

type Answers = Record<string, any>;
const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
      <div
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: 'linear-gradient(90deg,#00E5FF,#FF4FD8)',
          borderRadius: 999,
          transition: 'width 200ms ease',
        }}
      />
    </div>
  );
}

function Rating1to7({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(36px, 1fr))',
        gap: 10,
        width: '100%',
        maxWidth: 520,
        marginTop: 8,
      }}
    >
      {Array.from({ length: 7 }).map((_, i) => {
        const n = i + 1;
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              height: 44,
              borderRadius: 999,
              border: active ? '2px solid rgba(0,229,255,1)' : '1px solid rgba(148,163,184,0.35)',
              background: active ? 'rgba(0,245,255,0.12)' : 'rgba(255,255,255,0.03)',
              color: active ? '#00E5FF' : '#CBD5E1',
              fontWeight: 900,
              cursor: 'pointer',
            }}
            aria-pressed={active}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceRow({ options, value, onChange }: { options: string[]; value?: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '10px 12px',
              borderRadius: 999,
              border: active ? '2px solid rgba(0,229,255,1)' : '1px solid rgba(148,163,184,0.35)',
              background: active ? 'rgba(0,245,255,0.12)' : 'rgba(255,255,255,0.03)',
              color: active ? '#00E5FF' : '#CBD5E1',
              fontWeight: 900,
              fontSize: 12,
              cursor: 'pointer',
            }}
            aria-pressed={active}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function BooleanRow({ value, onChange }: { value?: boolean; onChange: (v: boolean) => void }) {
  return (
    <ChoiceRow
      options={['Yes', 'No']}
      value={typeof value === 'boolean' ? (value ? 'Yes' : 'No') : undefined}
      onChange={(v) => onChange(v === 'Yes')}
    />
  );
}

function isMissingRequired(q: Question, answers: Answers): boolean {
  if (!q.required) return false;
  const v = answers[q.id];
  if (q.type === 'text') return !v || String(v).trim().length === 0;
  if (q.type === 'rating_1_7') return typeof v !== 'number' || v < 1 || v > 7;
  if (q.type === 'boolean') return typeof v !== 'boolean';
  if (q.type === 'single_choice') return !v;
  return !v;
}

function Modal({
  open,
  title,
  body,
  onClose,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'grid',
        placeItems: 'center',
        padding: 18,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.14)',
          background: '#0B1020',
          padding: 18,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid rgba(148,163,184,0.35)',
              background: 'rgba(255,255,255,0.03)',
              color: '#E2E8F0',
              borderRadius: 12,
              padding: '8px 10px',
              cursor: 'pointer',
              fontWeight: 900,
            }}
          >
            Close
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{body}</div>
      </div>
    </div>
  );
}

export default function TesterFeedbackPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = sections[step]!;
  const totalSteps = sections.length;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const setAnswer = (id: string, value: any) => setAnswers((p) => ({ ...p, [id]: value }));

  const stepMissing = useMemo(() => {
    const missing: string[] = [];
    for (const q of current.questions) {
      const voucherEmailMissing = q.id === 'participant_email' && answers.claim_voucher === true && !looksLikeEmail(answers.participant_email || '');
      if (voucherEmailMissing) missing.push(q.id);
      else if (isMissingRequired(q, answers)) missing.push(q.id);
    }
    return new Set(missing);
  }, [current.questions, answers]);

  const canNext = stepMissing.size === 0;

  const onNext = () => {
    if (!canNext) return;
    setStep((s) => Math.min(totalSteps - 1, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onBack = () => {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    // Enforce "complete in full": every required question must be answered.
    for (const sec of sections) {
      for (const q of sec.questions) {
        const voucherEmailMissing = q.id === 'participant_email' && answers.claim_voucher === true && !looksLikeEmail(answers.participant_email || '');
        if (voucherEmailMissing || isMissingRequired(q, answers)) {
          setError('Please complete all questions before submitting (voucher requires full completion).');
          return;
        }
      }
    }
    if (answers.consent !== true) {
      setError('Consent is required to submit.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/tester-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ survey_key: SURVEY_KEY, answers }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to submit');
      setSuccess({ id: json?.id });
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 16,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', padding: 18, color: '#fff' }}>
      <Modal
        open={!!success}
        title="Thanks — completed!"
        onClose={() => setSuccess(null)}
        body={
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ margin: 0, color: '#E2E8F0', fontWeight: 800 }}>
              Your response has been submitted successfully.
            </p>
            <p style={{ margin: 0, color: '#94A3B8', fontWeight: 700 }}>
              Reference: <span style={{ color: '#00E5FF', fontWeight: 900 }}>#{success?.id}</span>
            </p>
            {answers.claim_voucher === true ? (
              <p style={{ margin: 0, color: '#E2E8F0', fontWeight: 800 }}>
                Voucher: we’ll email your £10 Costa voucher to{' '}
                <span style={{ color: '#00E5FF' }}>{answers.participant_email}</span>.
              </p>
            ) : (
              <p style={{ margin: 0, color: '#94A3B8', fontWeight: 700 }}>
                Voucher: not requested.
              </p>
            )}
          </div>
        }
      />

      <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <img src="/costa-coffee-logo.png" alt="Costa Coffee" style={{ height: 42, width: 'auto' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontWeight: 900 }}>FLASH Tester Feedback</div>
              <div style={{ color: '#94A3B8', fontWeight: 800 }}>
                Step {step + 1} of {totalSteps}
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <ProgressBar value={progress} />
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{current.title}</div>
          {current.description ? (
            <div style={{ marginTop: 8, color: '#94A3B8', fontWeight: 700, lineHeight: 1.5 }}>{current.description}</div>
          ) : null}
        </div>

        {error ? (
          <div style={{ ...cardStyle, borderColor: 'rgba(255,0,110,0.6)' }}>
            <div style={{ fontWeight: 900, color: '#FF4FD8' }}>{error}</div>
          </div>
        ) : null}

        {current.questions.map((q) => {
          const v = answers[q.id];
          const missing = stepMissing.has(q.id);
          return (
            <div key={q.id} style={{ ...cardStyle, borderColor: missing ? 'rgba(255,0,110,0.8)' : 'rgba(255,255,255,0.12)' }}>
              <div style={{ fontWeight: 900 }}>
                {q.prompt} {q.required ? <span style={{ color: '#FF4FD8' }}>*</span> : null}
              </div>
              {q.description ? <div style={{ marginTop: 6, color: '#94A3B8', fontWeight: 700 }}>{q.description}</div> : null}

              <div style={{ marginTop: 12 }}>
                {q.type === 'rating_1_7' ? (
                  <Rating1to7 value={typeof v === 'number' ? v : undefined} onChange={(n) => setAnswer(q.id, n)} />
                ) : q.type === 'text' ? (
                  <textarea
                    value={typeof v === 'string' ? v : ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Type your answer…"
                    style={{
                      width: '100%',
                      minHeight: 90,
                      borderRadius: 14,
                      border: '1px solid rgba(148,163,184,0.35)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      padding: 12,
                      fontWeight: 700,
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                ) : q.type === 'single_choice' ? (
                  <ChoiceRow options={q.options || []} value={typeof v === 'string' ? v : undefined} onChange={(x) => setAnswer(q.id, x)} />
                ) : q.type === 'boolean' ? (
                  <BooleanRow value={typeof v === 'boolean' ? v : undefined} onChange={(b) => setAnswer(q.id, b)} />
                ) : null}
              </div>
            </div>
          );
        })}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
          <button
            type="button"
            onClick={onBack}
            disabled={step === 0 || submitting}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.35)',
              background: 'rgba(255,255,255,0.03)',
              color: '#E2E8F0',
              fontWeight: 900,
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.5 : 1,
              minWidth: 120,
            }}
          >
            Back
          </button>

          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={onNext}
              disabled={!canNext || submitting}
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                border: '0',
                background: canNext ? 'linear-gradient(90deg,#00E5FF,#FF4FD8)' : 'rgba(148,163,184,0.25)',
                color: '#0B1020',
                fontWeight: 900,
                cursor: canNext ? 'pointer' : 'not-allowed',
                minWidth: 160,
              }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                border: '0',
                background: 'linear-gradient(90deg,#00E5FF,#FF4FD8)',
                color: '#0B1020',
                fontWeight: 900,
                cursor: 'pointer',
                minWidth: 200,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>

        <div style={{ color: '#94A3B8', fontWeight: 700, fontSize: 12, marginTop: 10 }}>
          Tip: Include steps to reproduce + severity (Low/Medium/High/Blocking) where relevant.
        </div>
      </div>
    </div>
  );
}

