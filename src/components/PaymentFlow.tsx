'use client';

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, LoaderCircle, Trash2, Upload } from 'lucide-react';
import { PLANS, type PlanType } from '@/lib/types';

export function PaymentFlow({ initialPlan = 'monthly', documentaryId }: { initialPlan?: PlanType; documentaryId?: string }) {
  const [plan, setPlan] = useState<PlanType>(initialPlan);
  const [paymentId, setPaymentId] = useState<string>();
  const [file, setFile] = useState<File>();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => PLANS.find((item) => item.id === plan)!, [plan]);
  const preview = file ? URL.createObjectURL(file) : undefined;

  function choose(candidate?: File) {
    setError(undefined);
    if (!candidate) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(candidate.type) || candidate.size > 10 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, WebP, or GIF image under 10 MB.'); return;
    }
    setFile(candidate);
  }
  async function createPayment() {
    setBusy(true); setError(undefined);
    try {
      const response = await fetch('/api/payments/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, documentaryId: plan === 'single' ? documentaryId : undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create your payment.');
      setPaymentId(data.paymentId);
    } catch (err) { setError(err instanceof Error ? err.message : 'A network error occurred.'); } finally { setBusy(false); }
  }
  async function submitProof() {
    if (!file || !paymentId) return;
    setBusy(true); setError(undefined);
    try {
      const form = new FormData(); form.append('file', file); form.append('paymentId', paymentId);
      const response = await fetch('/api/payments/upload-proof', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to upload payment proof. Please try again.');
      setMessage('Payment proof submitted successfully. An administrator will verify it before access is granted.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to upload payment proof.'); } finally { setBusy(false); }
  }
  if (message) return <div className="glass rounded-xl p-8 text-center"><CheckCircle2 className="mx-auto mb-4 text-green-500" size={44}/><h2 className="text-xl font-semibold">Payment submitted — waiting for verification</h2><p className="mt-2 text-text-muted">{message}</p></div>;
  return <div className="glass rounded-xl p-6 md:p-8 space-y-6">
    <div><p className="text-gold text-sm font-semibold">STEP {paymentId ? '2' : '1'} OF 2</p><h2 className="font-[family-name:var(--font-fraunces)] text-3xl">{paymentId ? 'Pay with MTN MoMo' : 'Choose your access'}</h2></div>
    {!paymentId ? <><div className="grid gap-3 sm:grid-cols-2">{PLANS.filter((item) => !documentaryId || item.id === 'single').map((item) => <button type="button" key={item.id} onClick={() => setPlan(item.id)} className={`rounded-lg border p-4 text-left ${plan === item.id ? 'border-primary bg-primary/10' : 'border-border'}`}><span className="block font-semibold">{item.name}</span><span className="text-text-muted text-sm">{item.price.toLocaleString()} RWF · {item.duration} days</span></button>)}</div><button onClick={createPayment} disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? 'Creating payment…' : `Continue with ${selected.price.toLocaleString()} RWF`}</button></> : <>
      <div className="rounded-lg bg-gold/10 border border-gold/30 p-4 text-sm text-text-secondary"><strong className="text-gold">MTN MoMo instructions</strong><br/>Send <strong>{selected.price.toLocaleString()} RWF</strong> to the official number provided by Aime Christian, then upload a clear screenshot of the completed transaction. Your access is activated only after manual verification.</div>
      <input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e: ChangeEvent<HTMLInputElement>) => choose(e.target.files?.[0])}/>
      {file && preview ? <div className="relative overflow-hidden rounded-lg border border-border"><img className="max-h-64 w-full object-contain bg-black" src={preview} alt="Payment proof preview"/><button type="button" onClick={() => setFile(undefined)} className="absolute right-2 top-2 rounded bg-black/70 p-2" aria-label="Remove payment proof"><Trash2 size={18}/></button></div> : <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e: DragEvent) => { e.preventDefault(); choose(e.dataTransfer.files[0]); }} className="w-full rounded-lg border border-dashed border-border-hover p-10 text-center text-text-muted hover:border-primary"><ImagePlus className="mx-auto mb-2"/>Choose or drop a payment screenshot<br/><span className="text-xs">JPEG, PNG, WebP or GIF · max 10 MB</span></button>}
      {file && <button onClick={submitProof} disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? <span className="inline-flex items-center gap-2"><LoaderCircle className="animate-spin" size={18}/> Uploading proof…</span> : <span className="inline-flex items-center gap-2"><Upload size={18}/> Submit payment proof</span>}</button>}
    </>}
    {error && <p role="alert" className="rounded bg-primary/10 p-3 text-sm text-red-300">{error}</p>}
  </div>;
}
