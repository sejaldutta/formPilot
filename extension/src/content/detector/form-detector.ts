import type { DetectedForm } from '../../lib/formTypes';
import { buildField, isCandidate } from './field-parser';
import type { Control } from './labels';

function groupKey(el: Control): string | null {
  if (el.tagName !== 'INPUT' || !el.name) return null;
  const type = (el.getAttribute('type') ?? '').toLowerCase();
  return type === 'radio' || type === 'checkbox' ? `${type}:${el.name}` : null;
}

/** Radios (and checkboxes) sharing a name become one field; order follows the page. */
function groupControls(controls: Control[]): Control[][] {
  const groups: Control[][] = [];
  const byKey = new Map<string, Control[]>();
  for (const el of controls) {
    const key = groupKey(el);
    if (!key) {
      groups.push([el]);
      continue;
    }
    let group = byKey.get(key);
    if (!group) {
      group = [];
      byKey.set(key, group);
      groups.push(group);
    }
    group.push(el);
  }
  return groups;
}

function describe(form: HTMLFormElement | null, index: number, controls: Control[]): DetectedForm {
  const formId = form ? `f${index}` : 'page';
  return {
    id: formId,
    index,
    name: form?.getAttribute('name') ?? '',
    htmlId: form?.id ?? '',
    actionPath: (form?.getAttribute('action') ?? '').split(/[?#]/)[0],
    method: (form?.getAttribute('method') ?? 'get').toLowerCase(),
    fields: groupControls(controls).map((group, n) => buildField(group, `fp-${formId}-${n + 1}`)),
  };
}

/**
 * Finds every form on the page and the fields inside it. Controls that are not
 * inside any <form> (common on older portals) are returned as a final
 * pseudo-form with index -1.
 */
export function detectForms(root: Document = document): DetectedForm[] {
  const candidates = Array.from(root.querySelectorAll<Control>('input, select, textarea')).filter(
    isCandidate,
  );

  const buckets = new Map<HTMLFormElement | null, Control[]>();
  for (const el of candidates) {
    const list = buckets.get(el.form) ?? [];
    list.push(el);
    buckets.set(el.form, list);
  }

  const result: DetectedForm[] = [];
  Array.from(root.forms).forEach((form, index) => {
    const controls = buckets.get(form);
    if (controls?.length) result.push(describe(form, index, controls));
  });

  const orphans = buckets.get(null);
  if (orphans?.length) result.push(describe(null, -1, orphans));

  return result;
}
