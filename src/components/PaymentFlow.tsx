'use client';

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, LoaderCircle, Trash2, Upload } from 'lucide-react';
import { PLANS, type Plan, type PlanType } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

export function PaymentFlow({ initialPlan = 'monthly', documentaryId }: { initialPlan?: PlanType; documentaryId?: string }) {
  const { t } = useI18n();
  const [plan, setPlan] = useState<PlanType>(initialPlan);
  const [paymentId, setPaymentId] = useState<string>();
  const [approvedPlan, setApprovedPlan] = useState<Plan>();
  const [file, setFile] = useState<File>();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => PLANS.find((item) => item.id === plan)!, [plan]);
  const preview = file ? URL.createObjectURL(file) : undefined;
  const paymentPlan = approvedPlan || selected;

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
      setApprovedPlan(data.plan);
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
  const ussd = `*182*8*1*886470*${paymentPlan.price}`;
  if (message) return <div className="glass rounded-xl p-8 text-center"><CheckCircle2 className="mx-auto mb-4 text-green-500" size={44}/><h2 className="text-xl font-semibold">{t('waiting')}</h2><p className="mt-2 text-text-muted">{message}</p></div>;
  return <div className="glass rounded-xl p-8 md:p-10 space-y-10">
    <div className="space-y-4"><p className="text-gold text-sm font-semibold">{paymentId ? 'STEP 2 OF 3' : 'STEP 1 OF 3'}</p><h2 className="font-[family-name:var(--font-fraunces)] text-3xl">{paymentId ? t('payMomo') : t('chooseAccess')}</h2></div>
    {!paymentId ? <><div className="grid gap-7 sm:grid-cols-2">{PLANS.filter((item) => !documentaryId || item.id === 'single').map((item) => <button type="button" key={item.id} onClick={() => setPlan(item.id)} className={`min-h-52 rounded-xl border p-6 text-left transition-all hover:-translate-y-0.5 md:p-8 ${plan === item.id ? 'border-primary bg-primary/10 shadow-[0_12px_32px_rgba(229,9,20,.12)]' : 'border-border bg-surface hover:border-border-hover'}`}><span className="block text-lg font-semibold">{t(item.name)}</span><span className="mt-5 block text-2xl font-bold text-white">{item.price.toLocaleString()} <small className="text-sm font-medium text-text-muted">RWF</small></span><span className="mt-6 block text-sm leading-6 text-text-muted">{t(item.description)}</span><span className="mt-6 inline-flex rounded-full border border-border px-3 py-1 text-xs text-text-secondary">{item.duration} {t('days')}</span></button>)}</div><button onClick={createPayment} disabled={busy} className="btn-primary mx-auto flex w-full max-w-sm items-center justify-center text-center disabled:opacity-60">{busy ? 'Creating payment…' : `Continue with ${selected.price.toLocaleString()} RWF`}</button></> : <>
      <div className="rounded-lg bg-gold/10 border border-gold/30 p-8 text-sm text-text-secondary space-y-5"><p><strong className="text-gold">Plan:</strong> {t(paymentPlan.name)}<br/><strong className="text-gold">Amount:</strong> {paymentPlan.price.toLocaleString()} RWF</p><p>MTN MoMo USSD: <code className="select-all rounded bg-black/30 px-2 py-1 text-white">{ussd}</code><br/><span className="text-xs">Registered to Aime Christian</span></p><a href={`tel:${ussd}`} className="btn-primary mx-auto flex w-fit">{t('payNow')}</a><p className="text-xs leading-5">Use the code on your MTN phone, then upload a clear screenshot. Payment is not automatic; access begins only after administrator verification.</p></div>
      <input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e: ChangeEvent<HTMLInputElement>) => choose(e.target.files?.[0])}/>
      {file && preview ? <div className="relative overflow-hidden rounded-lg border border-border"><img className="max-h-64 w-full object-contain bg-black" src={preview} alt="Payment proof preview"/><button type="button" onClick={() => setFile(undefined)} className="absolute right-2 top-2 rounded bg-black/70 p-2" aria-label="Remove payment proof"><Trash2 size={18}/></button></div> : <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e: DragEvent) => { e.preventDefault(); choose(e.dataTransfer.files[0]); }} className="mt-4 w-full rounded-lg border border-dashed border-border-hover p-10 text-center text-text-muted hover:border-primary"><ImagePlus className="mx-auto mb-2"/>Choose or drop a payment screenshot<br/><span className="text-xs">JPEG, PNG, WebP or GIF · max 10 MB</span></button>}
      {file && <button onClick={submitProof} disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? <span className="inline-flex items-center gap-2"><LoaderCircle className="animate-spin" size={18}/> Uploading proof…</span> : <span className="inline-flex items-center gap-2"><Upload size={18}/>{t('uploadProof')}</span>}</button>}
    </>}
    {error && <p role="alert" className="rounded bg-primary/10 p-3 text-sm text-red-300">{error}</p>}
  </div>;
}
