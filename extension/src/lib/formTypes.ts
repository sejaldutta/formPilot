/**
 * Shapes produced by the form detector.
 * IMPORTANT: these describe the *structure* of a form only. They never contain
 * values the user has typed, so they are safe to show in the UI and (later)
 * to include in public form metadata sent to the backend.
 */

export type FieldKind =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'checkboxGroup'
  | 'file';

/** How the visible label was found. Useful while tuning the heuristics. */
export type LabelSource =
  | 'for'
  | 'wrapping'
  | 'aria-labelledby'
  | 'aria-label'
  | 'legend'
  | 'group-aria'
  | 'adjacent'
  | 'placeholder'
  | 'title'
  | 'name'
  | 'none';

export interface FieldOption {
  value: string;
  label: string;
}

export interface DetectedField {
  /** Stable id for this scan; also written to the element as data-fp-id. */
  id: string;
  name: string;
  htmlId: string;
  kind: FieldKind;
  /** Raw <input type>, when the control is an <input>. */
  inputType?: string;
  label: string;
  labelSource: LabelSource;
  required: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  placeholder?: string;
  /** autocomplete hint such as "given-name" or "tel" (ignored when on/off). */
  autocomplete?: string;
  /** For select, radio and checkbox groups. */
  options?: FieldOption[];
}

export interface DetectedForm {
  id: string;
  /** Index in document.forms, or -1 for controls that sit outside any <form>. */
  index: number;
  name: string;
  htmlId: string;
  /** Path of the form's action only (no query string, which may hold tokens). */
  actionPath: string;
  method: string;
  fields: DetectedField[];
}
