import { useState } from 'react';
import { sendToActiveTab, type PingResponse } from '../../lib/messaging';
import { APP_NAME } from '../../lib/constants';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; data: PingResponse }
  | { kind: 'error'; message: string };

export default function App() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function checkPage() {
    setStatus({ kind: 'loading' });
    try {
      const data = await sendToActiveTab({ type: 'PING' });
      setStatus({ kind: 'ok', data });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    }
  }

  return (
    <main className="panel">
      <header className="panel__header">
        <h1>{APP_NAME}</h1>
        <p>You review every value. You submit the form.</p>
      </header>

      <button className="btn" onClick={checkPage} disabled={status.kind === 'loading'}>
        {status.kind === 'loading' ? 'Checking page' : 'Check this page'}
      </button>

      {status.kind === 'ok' && (
        <dl className="result" aria-live="polite">
          <dt>Page</dt>
          <dd>{status.data.title || status.data.url}</dd>
          <dt>Forms found</dt>
          <dd>{status.data.formCount}</dd>
          <dt>Input fields</dt>
          <dd>{status.data.fieldCount}</dd>
        </dl>
      )}

      {status.kind === 'error' && (
        <p className="error" role="alert">
          {status.message}
        </p>
      )}
    </main>
  );
}
