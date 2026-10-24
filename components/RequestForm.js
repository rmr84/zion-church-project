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

export function RequestForm() {
  const [state, action, pending] = useActionState(submitCareRequest, { errors: {}, values: {} });
  const [values, setValues] = useState(EMPTY);
  const summaryRef = useRef(null);
  const errors = state.errors || {};
  const errorEntries = Object.entries(errors);

  useEffect(() => {
    if (errorEntries.length > 0) summaryRef.current?.focus();
  }, [state, errorEntries.length]);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <form action={action} aria-busy={pending} className="stack">
      {errorEntries.length > 0 ? (
        <div id="form-errors" className="banner error" role="alert" tabIndex={-1} ref={summaryRef}>
          <p>Please fix the following:</p>
          <ul>
            {errorEntries.map(([key, message]) => (
              <li key={key}><a href={`#${key}`}>{message}</a></li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="name">Name</label>
        <p className="hint" id="name-hint">Leave this blank if you want the request to be anonymous.</p>
        <input
          id="name"
          name="name"
          maxLength={120}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-hint name-error' : 'name-hint'}
          value={values.name}
          onChange={(event) => setField('name', event.target.value)}
        />
        {errors.name ? <p className="field-error" id="name-error">{errors.name}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="careType">Type Of Care<RequiredMark /></label>
        <select
          id="careType"
          name="careType"
          required
          aria-invalid={Boolean(errors.careType)}
          value={values.careType}
          onChange={(event) => setField('careType', event.target.value)}
        >
          <option value="">Choose one</option>
          {CARE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        {errors.careType ? <p className="field-error" id="careType-error">{errors.careType}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="description">What Is Your Request?<RequiredMark /></label>
        <p className="hint" id="description-hint">
          Share only what the team needs. Leave out anything you would rather say in person.
        </p>
        <textarea
          id="description"
          name="description"
          required
          rows={6}
          maxLength={2000}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'description-hint description-error' : 'description-hint'}
          value={values.description}
          onChange={(event) => setField('description', event.target.value)}
        />
        {errors.description ? <p className="field-error" id="description-error">{errors.description}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="contactMethod">Preferred Contact Method<RequiredMark /></label>
        <select
          id="contactMethod"
          name="contactMethod"
          required
          aria-invalid={Boolean(errors.contactMethod)}
          value={values.contactMethod}
          onChange={(event) => setField('contactMethod', event.target.value)}
        >
          <option value="">Choose one</option>
          {CONTACT_METHODS.map((method) => (
            <option key={method.value} value={method.value}>{method.label}</option>
          ))}
        </select>
        {errors.contactMethod ? <p className="field-error" id="contactMethod-error">{errors.contactMethod}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="contactDetail">How Should We Reach You?</label>
        <p className="hint" id="contactDetail-hint">Optional. A phone number or email, if you want one on file.</p>
        <input
          id="contactDetail"
          name="contactDetail"
          maxLength={200}
          autoComplete="on"
          aria-invalid={Boolean(errors.contactDetail)}
          aria-describedby={errors.contactDetail ? 'contactDetail-hint contactDetail-error' : 'contactDetail-hint'}
          value={values.contactDetail}
          onChange={(event) => setField('contactDetail', event.target.value)}
        />
        {errors.contactDetail ? <p className="field-error" id="contactDetail-error">{errors.contactDetail}</p> : null}
      </div>

      <fieldset id="urgency" className="field">
        <legend>Urgency<RequiredMark /></legend>
        <div className="choice-list">
          {URGENCY_LEVELS.map((level) => (
            <label className="choice" key={level.value}>
              <input
                type="radio"
                name="urgency"
                value={level.value}
                required
                checked={values.urgency === level.value}
                onChange={() => setField('urgency', level.value)}
              />
              <span>{level.label}</span>
              <small>{level.hint}</small>
            </label>
          ))}
        </div>
        {errors.urgency ? <p className="field-error" id="urgency-error">{errors.urgency}</p> : null}
      </fieldset>

      <button className="button block" type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Submit request'}
      </button>
    </form>
  );
}
