import { useState } from 'react';
import { sendToActiveTab, type DetectFormsResponse } from '../../lib/messaging';
import { APP_NAME } from '../../lib/constants';
import FieldRow from '../components/FieldRow';

type Scan =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; data: DetectFormsResponse }
  | { kind: 'error'; message: string };

export default function App() {
  const [scan, setScan] = useState<Scan>({ kind: 'idle' });

  async function scanPage() {
    setScan({ kind: 'loading' });
    try {
      const data = await sendToActiveTab({ type: 'DETECT_FORMS' });
      setScan({ kind: 'done', data });
    } catch (err) {
      setScan({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    }
  }

  async function showField(fieldId: string) {
    try {
      await sendToActiveTab({ type: 'HIGHLIGHT_FIELD', fieldId });
    } catch {
      // The page may have navigated away; scanning again will refresh the list.
    }
  }

  return (
    <main className="panel">
      <header className="panel__header">
        <h1>{APP_NAME}</h1>
        <p>You review every value. You submit the form.</p>
      </header>

      <button className="btn" onClick={scanPage} disabled={scan.kind === 'loading'}>
        {scan.kind === 'loading' ? 'Scanning page' : 'Scan this page'}
      </button>

      {scan.kind === 'error' && (
        <p className="error" role="alert">
          {scan.message}
        </p>
      )}

      {scan.kind === 'done' && (
        <section className="results" aria-live="polite">
          <p className="results__page">{scan.data.title || scan.data.url}</p>

          {scan.data.forms.length === 0 ? (
            <p className="empty">No form fields found. Open a page with a form and scan again.</p>
          ) : (
            scan.data.forms.map((form) => (
              <div key={form.id} className="form">
                <h2>
                  {form.index === -1
                    ? 'Fields outside a form'
                    : `Form ${form.index + 1}${form.name || form.htmlId ? `: ${form.name || form.htmlId}` : ''}`}
                  <span className="form__count">
                    {form.fields.length} {form.fields.length === 1 ? 'field' : 'fields'}
                  </span>
                </h2>
                <ul className="fields">
                  {form.fields.map((field) => (
                    <FieldRow key={field.id} field={field} onSelect={showField} />
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      )}
    </main>
  );
}
