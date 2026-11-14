'use client';

import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
        <main style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', padding: '24px' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              border: '1px dashed #cbd5e1',
              borderRadius: '24px',
              background: '#ffffff',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <h1 style={{ margin: 0, fontSize: '24px' }}>Something went wrong</h1>
            <p style={{ marginTop: '12px', color: '#475569', lineHeight: 1.6 }}>
              The store could not finish loading. Please try again, or come back in a moment.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: '24px',
                border: 0,
                borderRadius: '999px',
                background: '#020617',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                padding: '12px 24px',
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
