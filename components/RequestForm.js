'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { submitCareRequest } from '@/app/actions/public';
import { CARE_TYPES, CONTACT_METHODS, URGENCY_LEVELS, labelFor } from '@/lib/constants';
import { contactDetailProblem } from '@/lib/validate';

function RequiredMark() {
  return <span className="required" aria-hidden="true">*</span>;
}

const EMPTY = {
  name: '',
  careType: '',
  description: '',
  contactMethod: '',
  contactDetail: '',
  urgency: '',
};

const STEPS = [
  {
    key: 'name',
    title: 'Name',
    required: false,
    hint: 'Skip this step if you want the request to be anonymous.',
    empty: 'Enter a name, or skip this step.',
  },
  {
    key: 'careType',
    title: 'Type Of Care',
    required: true,
    empty: 'Choose a type of care.',
  },
  {
    key: 'description',
    title: 'What Is Your Request?',
    required: true,
    hint: 'Share only what the team needs. Leave out anything you would rather say in person.',
    empty: 'Please enter a short description.',
  },
  {
    key: 'contactMethod',
    title: 'Preferred Contact Method',
    required: true,
    empty: 'Choose how the team should reach you.',
  },
  {
    key: 'contactDetail',
    title: 'How Should We Reach You?',
    required: true,
    empty: 'Enter how we should reach you.',
  },
  {
    key: 'urgency',
    title: 'Urgency',
    required: true,
    empty: '',
  },
];

function problemFor(step, values) {
  if (step.key === 'contactDetail') {
    return contactDetailProblem(values.contactMethod, values.contactDetail);
  }
  const text = String(values[step.key] ?? '').trim();
  if (text) return '';
  return step.empty;
}

function skipsContactDetail(method) {
  return method === 'in_person' || method === 'none';
}

function contactDetailHint(method) {
  if (method === 'email') return 'Enter a valid email address.';
  if (method === 'text') return 'Enter a 10-digit number for text messages.';
  return 'Enter a 10-digit phone number.';
}

function stepsFor(values) {
  if (skipsContactDetail(values.contactMethod)) {
    return STEPS.filter((item) => item.key !== 'contactDetail');
  }
  return STEPS;
}

function detailFor(method, defaults) {
  if (!defaults) return '';
  if (method === 'email') return defaults.email || '';
  if (method === 'phone' || method === 'text') return defaults.phone || '';
  return '';
}

function answerFor(step, values) {
  const raw = String(values[step.key] ?? '').trim();
  if (step.key === 'name') return raw || 'Name not given';
  if (step.key === 'careType') return labelFor(CARE_TYPES, raw);
  if (step.key === 'contactMethod') return labelFor(CONTACT_METHODS, raw);
  if (step.key === 'urgency') return labelFor(URGENCY_LEVELS, raw);
  return raw;
}

function startingValues(defaults) {
  const next = { ...EMPTY };
  if (!defaults) return next;
  next.name = defaults.name || '';
  if (defaults.phone) {
    next.contactMethod = 'phone';
    next.contactDetail = defaults.phone;
  } else if (defaults.email) {
    next.contactMethod = 'email';
    next.contactDetail = defaults.email;
  }
  return next;
}

export function RequestForm({ defaults = null }) {
  const [state, action, pending] = useActionState(submitCareRequest, { errors: {}, values: {} });
  const [values, setValues] = useState(() => startingValues(defaults));
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [stepError, setStepError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [dismissed, setDismissed] = useState({});
  const [trackedState, setTrackedState] = useState(state);
  const headingRef = useRef(null);
  const confirmReview = useRef(false);
  const errorRef = useRef(null);
  const skipFocus = useRef(true);
  const errors = state.errors || {};

  if (state !== trackedState) {
    setTrackedState(state);
    setDismissed({});
    if (state.values && Object.keys(state.values).length > 0) {
      setValues((current) => ({ ...current, ...state.values }));
    }
    const merged = { ...values, ...(state.values || {}) };
    const next = stepsFor(merged).findIndex((item) => state.errors?.[item.key]);
    if (next >= 0) {
      setEditing(true);
      setIndex(next);
    }
  }

  const questions = stepsFor(values);
  const steps = [...questions, { key: 'review', title: 'Review', required: false }];
  if (index > steps.length - 1) setIndex(steps.length - 1);
  const step = steps[Math.min(index, steps.length - 1)];
  const reviewing = step.key === 'review';
  const filled = String(values[step.key] ?? '').trim().length > 0;
  const blocked = step.required && !filled;
  const message = blocked ? '' : (stepError || (dismissed[step.key] ? '' : errors[step.key]) || '');

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index]);

  useEffect(() => {
    if (message) errorRef.current?.focus();
  }, [message, attempt, index]);

  function setField(name, value) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (name === 'contactMethod' && skipsContactDetail(value)) next.contactDetail = '';
      else if (name === 'contactMethod') {
        const previous = detailFor(current.contactMethod, defaults);
        if (!current.contactDetail || current.contactDetail === previous) next.contactDetail = detailFor(value, defaults);
      }
      return next;
    });
    setStepError('');
    setDismissed((current) => ({ ...current, [name]: true }));
  }

  function showProblem(problem) {
    setStepError(problem);
    setAttempt((current) => current + 1);
  }

  function reviewIndex(nextValues = values) {
    return stepsFor(nextValues).length;
  }

  function finishEdit(nextValues = values) {
    const upcoming = stepsFor(nextValues);
    const missing = upcoming.findIndex((item, itemIndex) => (
      itemIndex > index && item.required && !String(nextValues[item.key] ?? '').trim()
    ));
    if (missing >= 0) {
      setIndex(missing);
      return;
    }
    setEditing(false);
    setIndex(upcoming.length);
  }

  function continueStep() {
    if (step.required && !String(values[step.key] ?? '').trim()) return;
    const problem = problemFor(step, values);
    if (problem) {
      showProblem(problem);
      return;
    }
    setStepError('');
    if (editing) {
      finishEdit();
      return;
    }
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function skipStep() {
    if (step.required) return;
    const nextValues = { ...values, [step.key]: '' };
    setValues(nextValues);
    setStepError('');
    setDismissed((current) => ({ ...current, [step.key]: true }));
    if (editing) {
      finishEdit(nextValues);
      return;
    }
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function backStep() {
    setStepError('');
    if (editing) {
      setEditing(false);
      setIndex(reviewIndex());
      return;
    }
    setIndex((current) => Math.max(current - 1, 0));
  }

  function editStep(key) {
    const next = questions.findIndex((item) => item.key === key);
    if (next < 0) return;
    setStepError('');
    setEditing(true);
    setIndex(next);
  }

  function onSubmit(event) {
    if (!reviewing || !confirmReview.current) {
      event.preventDefault();
      confirmReview.current = false;
      if (!reviewing) continueStep();
      return;
    }
    confirmReview.current = false;
  }

  const hint = step.key === 'contactDetail' ? contactDetailHint(values.contactMethod) : step.hint;
  const describedBy = [
    hint ? `${step.key}-hint` : '',
    message ? `${step.key}-error` : '',
  ].filter(Boolean).join(' ');

  return (
    <form action={action} aria-busy={pending} className="builder-step" onSubmit={onSubmit}>
      <div
        className="builder-progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
        aria-valuetext={`Step ${index + 1} of ${steps.length}`}
      >
        <span style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>

      <h2 id="step-title" className="builder-title" tabIndex={-1} ref={headingRef}>
        <span className="eyebrow">Step {index + 1} of {steps.length}</span>
        <span className="builder-question">
          {step.title}
          {step.required ? <RequiredMark /> : null}
        </span>
      </h2>

      {reviewing ? <p className="hint">Check each answer. Edit a step if something needs to change.</p> : null}
      {hint && !reviewing ? <p className="hint" id={`${step.key}-hint`}>{hint}</p> : null}

      {reviewing ? (
        <dl className="request-summary">
          {questions.map((item) => (
            <div key={item.key}>
              <dt>{item.title}</dt>
              <dd>{answerFor(item, values)}</dd>
              <button className="text-button edit-step" type="button" aria-label={`Edit ${item.title}`} onClick={() => editStep(item.key)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 16.8V20h3.2L18.4 8.8l-3.2-3.2L4 16.8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M13.6 7.2l3.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </dl>
      ) : step.key === 'urgency' ? (
        <fieldset className="field" aria-labelledby="step-title" aria-describedby={describedBy || undefined} aria-invalid={Boolean(message)}>
          <legend className="sr-only">{step.title}</legend>
          <div className="choice-list">
            {URGENCY_LEVELS.map((level) => (
              <label className="choice" key={level.value}>
                <input
                  type="radio"
                  name="urgency"
                  value={level.value}
                  checked={values.urgency === level.value}
                  onChange={() => setField('urgency', level.value)}
                />
                <span>{level.label}</span>
                <small>{level.hint}</small>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <div className="field">
          <StepControl
            step={step}
            value={values[step.key]}
            describedBy={describedBy}
            invalid={Boolean(message)}
            contactMethod={values.contactMethod}
            onChange={(value) => setField(step.key, value)}
          />
        </div>
      )}

      {message ? (
        <p className="field-error" id={`${step.key}-error`} tabIndex={-1} ref={errorRef}>{message}</p>
      ) : null}
      {reviewing && errors.form ? (
        <p className="banner error" role="alert">{errors.form}</p>
      ) : null}

      <div className="builder-actions">
        {reviewing ? (
          <button key="send-request" className="button block" type="submit" disabled={pending} onClick={() => { confirmReview.current = true; }}>
            {pending ? 'Sending…' : 'Continue'}
          </button>
        ) : (
          <button key="continue-step" className="button block" type="button" onClick={continueStep} disabled={blocked}>Continue</button>
        )}
        {step.required || reviewing ? null : (
          <button className="button secondary block" type="button" onClick={skipStep}>Skip</button>
        )}
        {index > 0 ? (
          <button className="button secondary block" type="button" onClick={backStep}>Back</button>
        ) : null}
      </div>

      {STEPS.filter((item) => item.key !== step.key).map((item) => (
        <input key={item.key} type="hidden" name={item.key} value={values[item.key]} />
      ))}
    </form>
  );
}

function StepControl({ step, value, describedBy, invalid, contactMethod, onChange }) {
  if (step.key === 'careType' || step.key === 'contactMethod') {
    const options = step.key === 'careType' ? CARE_TYPES : CONTACT_METHODS;
    return (
      <select
        id={step.key}
        name={step.key}
        aria-labelledby="step-title"
        aria-invalid={invalid}
        aria-describedby={describedBy || undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose one</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  if (step.key === 'description') {
    return (
      <textarea
        id="description"
        name="description"
        rows={6}
        maxLength={2000}
        aria-labelledby="step-title"
        aria-invalid={invalid}
        aria-describedby={describedBy || undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  const contactField = step.key === 'contactDetail';
  const inputType = contactField && contactMethod === 'email' ? 'email' : contactField ? 'tel' : 'text';
  const autoComplete = step.key === 'name' ? 'name' : contactField && contactMethod === 'email' ? 'email' : contactField ? 'tel' : 'on';

  return (
    <input
      id={step.key}
      name={step.key}
      type={inputType}
      maxLength={step.key === 'name' ? 120 : 200}
      autoComplete={autoComplete}
      aria-labelledby="step-title"
      aria-invalid={invalid}
      aria-describedby={describedBy || undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
