/** Scrolls to a detected field and briefly outlines it so the user can verify the match. */
export function highlightField(fieldId: string): boolean {
  const elements = document.querySelectorAll<HTMLElement>(`[data-fp-id="${fieldId}"]`);
  if (elements.length === 0) return false;

  elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

  elements.forEach((el) => {
    // Radios and checkboxes are often visually hidden, so outline their label instead.
    const target = el.closest<HTMLElement>('label') ?? el;
    const previous = { outline: target.style.outline, offset: target.style.outlineOffset };
    target.style.outline = '3px solid #e07a1f';
    target.style.outlineOffset = '2px';
    window.setTimeout(() => {
      target.style.outline = previous.outline;
      target.style.outlineOffset = previous.offset;
    }, 1800);
  });
  return true;
}
