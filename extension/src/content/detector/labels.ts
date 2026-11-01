import type { LabelSource } from '../../lib/formTypes';
import { collapse, finalizeLabel, textWithoutControls } from './text';

export type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export interface ResolvedLabel {
  text: string;
  source: LabelSource;
  starred: boolean;
}

/** Text longer than this next to a field is probably a paragraph, not a label. */
const MAX_ADJACENT_LENGTH = 120;

function make(raw: string, source: LabelSource): ResolvedLabel | null {
  const { text, starred } = finalizeLabel(raw);
  return text ? { text, source, starred } : null;
}

function textOfIds(el: Element, idList: string | null): string {
  if (!idList) return '';
  const doc = el.ownerDocument;
  return collapse(
    idList
      .split(/\s+/)
      .map((id) => {
        const node = doc.getElementById(id);
        return node ? textWithoutControls(node) : '';
      })
      .join(' '),
  );
}

function fromLabelElements(el: Control): ResolvedLabel | null {
  for (const label of Array.from(el.labels ?? [])) {
    const found = make(textWithoutControls(label), label.contains(el) ? 'wrapping' : 'for');
    if (found) return found;
  }
  return null;
}

function fromAriaLabelledBy(el: Element): ResolvedLabel | null {
  return make(textOfIds(el, el.getAttribute('aria-labelledby')), 'aria-labelledby');
}

function fromAriaLabel(el: Element): ResolvedLabel | null {
  return make(el.getAttribute('aria-label') ?? '', 'aria-label');
}

function fromLegend(el: Element): ResolvedLabel | null {
  const legend = el.closest('fieldset')?.querySelector('legend');
  return legend ? make(textWithoutControls(legend), 'legend') : null;
}

function fromGroupAria(el: Element): ResolvedLabel | null {
  const group = el.closest('[role="radiogroup"], [role="group"]');
  if (!group) return null;
  return (
    make(textOfIds(group, group.getAttribute('aria-labelledby')), 'group-aria') ??
    make(group.getAttribute('aria-label') ?? '', 'group-aria')
  );
}

/** A neighbour that holds its own controls belongs to another field, so it is not our label. */
function holdsControls(el: Element): boolean {
  return el.matches('input, select, textarea, button') || el.querySelector('input, select, textarea') !== null;
}

/** Text immediately before the control, inside the same parent. */
function siblingText(start: Element): string {
  let node: Node | null = start.previousSibling;
  while (node) {
    if (node.nodeType === 3) {
      const t = collapse(node.textContent);
      if (t) return t.length <= MAX_ADJACENT_LENGTH ? t : '';
    } else if (node.nodeType === 1) {
      const el = node as Element;
      if (holdsControls(el)) return '';
      const t = textWithoutControls(el);
      if (t) return t.length <= MAX_ADJACENT_LENGTH ? t : '';
    }
    node = node.previousSibling;
  }
  return '';
}

/** Table layouts: label sits in the cell to the left of the control's cell. */
function previousCellText(start: Element): string {
  const prev = start.closest('td, th')?.previousElementSibling;
  if (!prev || holdsControls(prev)) return '';
  const t = textWithoutControls(prev);
  return t && t.length <= MAX_ADJACENT_LENGTH ? t : '';
}

function fromAdjacent(start: Element): ResolvedLabel | null {
  return make(siblingText(start) || previousCellText(start), 'adjacent');
}

function humanizeName(raw: string): string {
  return collapse(
    raw
      .replace(/\[\]/g, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-.[\]]+/g, ' '),
  ).toLowerCase();
}

/**
 * Finds the best human-readable label for a control (or the first control of a
 * radio / checkbox group, with isGroup = true).
 */
export function resolveLabel(el: Control, isGroup: boolean): ResolvedLabel {
  const attempts: Array<() => ResolvedLabel | null> = isGroup
    ? [
        () => fromLegend(el),
        () => fromGroupAria(el),
        () => fromAriaLabelledBy(el),
        () => fromAriaLabel(el),
        () => fromAdjacent(el.closest('label') ?? el),
      ]
    : [
        () => fromLabelElements(el),
        () => fromAriaLabelledBy(el),
        () => fromAriaLabel(el),
        () => fromAdjacent(el),
        () => fromLegend(el),
        () => make(el.getAttribute('placeholder') ?? '', 'placeholder'),
        () => make(el.getAttribute('title') ?? '', 'title'),
      ];

  for (const attempt of attempts) {
    const found = attempt();
    if (found) return found;
  }

  const fallback = humanizeName(el.name || el.id);
  return fallback
    ? { text: fallback, source: 'name', starred: false }
    : { text: '', source: 'none', starred: false };
}
