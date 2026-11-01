const CONTROL_SELECTOR = 'input, select, textarea, button, script, style';

/** Collapse whitespace (including non-breaking spaces) and trim. */
export function collapse(value: string | null | undefined): string {
  return (value ?? '').replace(/[\s\u00a0]+/g, ' ').trim();
}

/**
 * Visible text of a node, ignoring any form controls nested inside it.
 * This matters for <label><input> Female</label> and for labels wrapping a <select>.
 */
export function textWithoutControls(node: Node): string {
  if (node.nodeType === 3) return collapse(node.textContent);
  if (node.nodeType !== 1) return '';
  const clone = (node as Element).cloneNode(true) as Element;
  clone.querySelectorAll(CONTROL_SELECTOR).forEach((n) => n.remove());
  return collapse(clone.textContent);
}

/** Strips "*" and ":" decorations; reports whether the text carried a required marker. */
export function finalizeLabel(raw: string): { text: string; starred: boolean } {
  const collapsed = collapse(raw);
  const starred = /^\*/.test(collapsed) || /\*\s*:?$/.test(collapsed);
  const text = collapsed.replace(/^[\s*]+/, '').replace(/[\s*:\uFF1A]+$/, '');
  return { text, starred };
}
