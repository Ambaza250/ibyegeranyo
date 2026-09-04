'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { void error; return <div className="container py-20 text-center"><h1 className="font-[family-name:var(--font-fraunces)] text-4xl">Unable to load this page</h1><p className="mx-auto mt-4 max-w-md text-text-muted">Please check your connection and try again.</p><button onClick={reset} className="btn-primary mt-7">Try again</button></div>; }
