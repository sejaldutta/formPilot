import type { DetectedField, FieldKind, FieldOption } from '../../lib/formTypes';
import { collapse, finalizeLabel, textWithoutControls } from './text';
import { resolveLabel, type Control } from './labels';

/** Input types we never read or fill. Passwords are excluded on purpose. */
const SKIPPED_INPUT_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'password']);

const INPUT_KINDS: Record<string, FieldKind> = {
  email: 'email',
  tel: 'tel',
  number: 'number',
  date: 'date',
  file: 'file',
  radio: 'radio',
  checkbox: 'checkbox',
};

const PLACEHOLDER_OPTION = /^[-\u2013\s]*(select|choose|please select)\b/i;

const isInput = (el: Control): el is HTMLInputElement => el.tagName === 'INPUT';
const isSelect = (el: Control): el is HTMLSelectElement => el.tagName === 'SELECT';

function inputTypeOf(el: HTMLInputElement): string {
  return (el.getAttribute('type') ?? 'text').toLowerCase();
}

function isVisible(el: Element): boolean {
  const probe = el as unknown as { checkVisibility?: (options?: object) => boolean };
  return typeof probe.checkVisibility === 'function'
    ? probe.checkVisibility({ checkVisibilityCSS: true, visibilityProperty: true })
    : true;
}

/** Should this control be offered to the user at all? */
export function isCandidate(el: Control): boolean {
  if (el.disabled) return false;

  if (isInput(el)) {
    const type = inputTypeOf(el);
    if (SKIPPED_INPUT_TYPES.has(type)) return false;
    // Custom-styled radios and checkboxes are often visually hidden; keep them.
    if (type === 'radio' || type === 'checkbox') return true;
    if (el.readOnly) return false;
  } else if (el.tagName === 'TEXTAREA' && (el as HTMLTextAreaElement).readOnly) {
    return false;
  }

  return isVisible(el);
}

function kindOf(el: Control): FieldKind {
  if (el.tagName === 'TEXTAREA') return 'textarea';
  if (isSelect(el)) return el.multiple ? 'multiselect' : 'select';
  return INPUT_KINDS[inputTypeOf(el as HTMLInputElement)] ?? 'text';
}

function isRequired(el: Control): boolean {
  return el.required || el.getAttribute('aria-required') === 'true';
}

function selectOptions(el: HTMLSelectElement): FieldOption[] {
  return Array.from(el.options)
    .map((o) => ({ value: o.value, label: collapse(o.textContent) }))
    .filter((o) => o.value !== '' && !(o.value === o.label && PLACEHOLDER_OPTION.test(o.label)));
}

function nextSiblingText(el: Element): string {
  const node = el.nextSibling;
  if (!node) return '';
  if (node.nodeType === 3) return collapse(node.textContent);
  if (node.nodeType === 1 && !(node as Element).matches('input, select, textarea, button')) {
    return textWithoutControls(node);
  }
  return '';
}

function groupOption(el: HTMLInputElement): FieldOption {
  let label = '';
  for (const l of Array.from(el.labels ?? [])) {
    label = finalizeLabel(textWithoutControls(l)).text;
    if (label) break;
  }
  if (!label) label = finalizeLabel(nextSiblingText(el)).text;
  return { value: el.value, label: label || el.value };
}

/**
 * Builds one DetectedField from one control, or from all controls of a
 * radio / checkbox group. Tags every element with data-fp-id so the same
 * field can be found again for highlighting and (later) autofill.
 */
export function buildField(elements: Control[], id: string): DetectedField {
  const first = elements[0];
  let kind = kindOf(first);
  if (kind === 'checkbox' && elements.length > 1) kind = 'checkboxGroup';
  const isGroup = kind === 'radio' || kind === 'checkboxGroup';

  const label = resolveLabel(first, isGroup);
  elements.forEach((el) => el.setAttribute('data-fp-id', id));

  const field: DetectedField = {
    id,
    name: first.name,
    htmlId: first.id,
    kind,
    label: label.text,
    labelSource: label.source,
    required: label.starred || elements.some(isRequired),
  };

  if (isInput(first)) field.inputType = inputTypeOf(first);

  if (!isGroup) {
    const maxLength = first.getAttribute('maxlength');
    if (maxLength && /^\d+$/.test(maxLength)) field.maxLength = Number(maxLength);
    const minLength = first.getAttribute('minlength');
    if (minLength && /^\d+$/.test(minLength)) field.minLength = Number(minLength);
    const pattern = first.getAttribute('pattern');
    if (pattern) field.pattern = pattern;
    const placeholder = first.getAttribute('placeholder');
    if (placeholder) field.placeholder = collapse(placeholder);
    const autocomplete = first.getAttribute('autocomplete');
    if (autocomplete && autocomplete !== 'on' && autocomplete !== 'off') {
      field.autocomplete = autocomplete;
    }
  }

  if (isSelect(first)) {
    field.options = selectOptions(first);
  } else if (isGroup) {
    field.options = (elements as HTMLInputElement[]).map(groupOption);
  }

  return field;
}
