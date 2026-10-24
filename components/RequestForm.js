'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { submitCareRequest } from '@/app/actions/public';
import { CARE_TYPES, CONTACT_METHODS, URGENCY_LEVELS } from '@/lib/constants';

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
    empty: 'Choose an urgency.',
  },
];

function problemFor(step, values) {
  const text = String(values[step.key] ?? '').trim();
  if (text) return '';
  return step.empty;
}

function skipsContactDetail(method) {
  return method === 'in_person' || method === 'none';
}

function contactDetailHint(method) {
  if (method === 'email') return 'Enter an email address.';
  if (method === 'text') return 'Enter a number for text messages.';
  return 'Enter a phone number.';
}

function stepsFor(values) {
  if (skipsContactDetail(values.contactMethod)) {
    return STEPS.filter((item) => item.key !== 'contactDetail');
  }
  return STEPS;
}

export function RequestForm() {
  const [state, action, pending] = useActionState(submitCareRequest, { errors: {}, values: {} });
  const [values, setValues] = useState(EMPTY);
  const [index, setIndex] = useState(0);
  const [stepError, setStepError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [dismissed, setDismissed] = useState({});
  const [trackedState, setTrackedState] = useState(state);
  const headingRef = useRef(null);
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
    if (next >= 0) setIndex(next);
  }

  const steps = stepsFor(values);
  if (index > steps.length - 1) setIndex(steps.length - 1);
  const step = steps[Math.min(index, steps.length - 1)];
  const message = stepError || (dismissed[step.key] ? '' : errors[step.key]) || '';

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
      return next;
    });
    setStepError('');
    setDismissed((current) => ({ ...current, [name]: true }));
  }

  function showProblem(problem) {
    setStepError(problem);
    setAttempt((current) => current + 1);
  }

  function continueStep() {
    const problem = problemFor(step, values);
    if (problem) {
      showProblem(problem);
      return;
    }
    setStepError('');
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function skipStep() {
    if (step.required) return;
    setValues((current) => ({ ...current, [step.key]: '' }));
    setStepError('');
    setDismissed((current) => ({ ...current, [step.key]: true }));
    setIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function backStep() {
    setStepError('');
    setIndex((current) => Math.max(current - 1, 0));
  }

  function onSubmit(event) {
    if (index < steps.length - 1) {
      event.preventDefault();
      continueStep();
      return;
    }
    const problem = problemFor(step, values);
    if (problem) {
      event.preventDefault();
      showProblem(problem);
    }
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

      {hint ? <p className="hint" id={`${step.key}-hint`}>{hint}</p> : null}

      {step.key === 'urgency' ? (
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

      <div className="builder-actions">
        {index === steps.length - 1 ? (
          <button className="button block" type="submit" disabled={pending}>
            {pending ? 'Sending…' : 'Submit request'}
          </button>
        ) : (
          <button className="button block" type="button" onClick={continueStep}>Continue</button>
        )}
        {step.required ? null : (
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
