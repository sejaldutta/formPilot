import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectForms } from '../form-detector';
import type { DetectedField, DetectedForm } from '../../../lib/formTypes';

function scan(file: string): DetectedForm[] {
  const path = resolve(process.cwd(), '../tests/fixtures/html-forms', file);
  const doc = new DOMParser().parseFromString(readFileSync(path, 'utf8'), 'text/html');
  return detectForms(doc);
}

function find(form: DetectedForm, name: string): DetectedField {
  const field = form.fields.find((f) => f.name === name);
  if (!field) throw new Error(`No field named "${name}"`);
  return field;
}

describe('sample form (clean markup)', () => {
  const [form] = scan('index.html');

  it('finds one form with six logical fields', () => {
    expect(scan('index.html')).toHaveLength(1);
    expect(form.fields).toHaveLength(6);
  });

  it('reads a <label for> and the required flag', () => {
    const f = find(form, 'applicant_name');
    expect(f.label).toBe('Full name (as per Aadhaar)');
    expect(f.labelSource).toBe('for');
    expect(f.required).toBe(true);
    expect(f.kind).toBe('text');
  });

  it('detects dates and dropdown options without the placeholder entry', () => {
    expect(find(form, 'dob').kind).toBe('date');
    const state = find(form, 'state');
    expect(state.kind).toBe('select');
    expect(state.options?.map((o) => o.value)).toEqual(['Jharkhand', 'Bihar', 'West Bengal']);
  });

  it('merges radios into one field labelled by the fieldset legend', () => {
    const gender = find(form, 'gender');
    expect(gender.kind).toBe('radio');
    expect(gender.label).toBe('Gender');
    expect(gender.labelSource).toBe('legend');
    expect(gender.options).toEqual([
      { value: 'F', label: 'Female' },
      { value: 'M', label: 'Male' },
      { value: 'O', label: 'Other' },
    ]);
  });

  it('captures constraints and wrapping labels', () => {
    const pin = find(form, 'pin');
    expect(pin.maxLength).toBe(6);
    expect(pin.pattern).toBe('[0-9]{6}');
    const decl = find(form, 'decl');
    expect(decl.kind).toBe('checkbox');
    expect(decl.label).toBe('I declare the above is true');
    expect(decl.labelSource).toBe('wrapping');
  });
});

describe('messy portal form (tables, aria, no <form>)', () => {
  const forms = scan('messy-table-form.html');
  const main = forms[0];
  const page = forms[1];

  it('returns the real form plus a pseudo-form for controls outside any <form>', () => {
    expect(forms).toHaveLength(2);
    expect(main.index).toBe(0);
    expect(page.index).toBe(-1);
  });

  it('keeps only the path of the form action (query string may hold tokens)', () => {
    expect(main.actionPath).toBe('/apply/submit');
    expect(main.method).toBe('post');
  });

  it('skips hidden, password, button and disabled controls', () => {
    const names = [...main.fields, ...page.fields].map((f) => f.name);
    expect(names).not.toContain('csrf');
    expect(names).not.toContain('pw');
    expect(names).not.toContain('locked');
  });

  it('finds labels from the neighbouring table cell and strips * and :', () => {
    const mobile = find(main, 'mobile');
    expect(mobile.label).toBe('Applicant Mobile No.');
    expect(mobile.labelSource).toBe('adjacent');
    expect(mobile.required).toBe(true);
    expect(mobile.kind).toBe('tel');
    expect(mobile.maxLength).toBe(10);
    expect(find(main, 'email').label).toBe('Email ID');
    expect(find(main, 'email').autocomplete).toBe('email');
  });

  it('finds labels from preceding sibling text and aria attributes', () => {
    expect(find(main, 'fatherName').label).toBe("Father's Name");
    expect(find(main, 'aadhaar').label).toBe('Aadhaar Number');
    expect(find(main, 'aadhaar').labelSource).toBe('aria-label');
    expect(find(main, 'address').label).toBe('Permanent Address');
    expect(find(main, 'address').labelSource).toBe('aria-labelledby');
  });

  it('turns same-name checkboxes into one group, and falls back to the placeholder', () => {
    const lang = find(page, 'lang');
    expect(lang.kind).toBe('checkboxGroup');
    expect(lang.label).toBe('Languages known');
    expect(lang.options?.map((o) => o.label)).toEqual(['Hindi', 'English']);
    expect(find(page, 'cert_no').label).toBe('Certificate number');
    expect(find(page, 'cert_no').labelSource).toBe('placeholder');
  });

  it('gives every field a unique id', () => {
    const ids = forms.flatMap((f) => f.fields.map((x) => x.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
