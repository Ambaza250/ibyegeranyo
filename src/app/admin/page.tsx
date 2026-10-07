'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { ArrowDownLeft, Film, Users, Wallet, type LucideIcon } from 'lucide-react';

type Payment = {
  id: string;
  phone: string;
  plan: string;
  amount: number;
  documentaryId: string | null;
  proofUrl: string | null;
  createdAt: string;
  method?: string;
  gatewayStatus?: string | null;
  needsReview?: string | null;
  receivedAmount?: number | null;
  status?: string;
};

const methodLabels: Record<string, string> = {
  manual: 'Manual (screenshot)',
  mobile_money: 'MTN MoMo',
  airtel_money: 'Airtel Money',
  card: 'Card',
};

const statusBadges: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'badge-warning' },
  confirmed: { label: 'Confirmed', className: 'badge-success' },
  failed: { label: 'Failed', className: 'badge-danger' },
  rejected: { label: 'Rejected', className: 'badge-danger' },
};

type Doc = {
  id: string;
  title: string;
  category: string;
  status: string;
  featured: boolean;
  trailerUrl: string | null;
  thumbnailUrl: string | null;
};

type AssetKind = 'documentary' | 'trailer' | 'thumbnail';
type UploadState = { phase: 'preparing' | 'uploading' | 'saving'; progress: number };

interface Stats {
  totalDocumentaries: number;
  activeSubscribers: number;
  pendingPayments: number;
  approvedPaymentsBalance: number;
}

type StatCard = {
  label: string;
  value: number | null;
  icon: LucideIcon;
  accent: string;
  hint?: string;
};

function uploadToR2(url: string, file: File, onProgress: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.setRequestHeader('Content-Type', file.type);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error('R2 blocked the browser upload before it started. Configure the R2 bucket CORS policy for this site origin, then retry.'));
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`R2 upload failed (${request.status}): ${request.responseText || 'Unknown error'}`));
    request.send(file);
  });
}

export default function AdminPage() {
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [stats, setStats] = useState<Stats | undefined>();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [modal, setModal] = useState<string>();

  const load = async () => {
    const me = await fetch('/api/admin/me');
    if (!me.ok) {
      setLoading(false);
      return;
    }
    setAdmin(true);
    const [s, p, d] = await Promise.all([
      fetch('/api/admin/dashboard'),
      fetch('/api/admin/payments'),
      fetch('/api/admin/documentaries'),
    ]);
    if (s.ok) setStats(await s.json());
    if (p.ok) setPayments((await p.json()).payments);
    if (d.ok) setDocs((await d.json()).documentaries);
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    });
    return () => window.clearTimeout(timer);
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error);
    setAdmin(true);
    await load();
  }

  async function paymentAction(paymentId: string, action: string) {
    const response = await fetch('/api/admin/payments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, action }),
    });
    if (!response.ok) return setError((await response.json()).error);
    await load();
  }

  async function upload(event: FormEvent<HTMLFormElement>, kind: AssetKind) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!(file instanceof File)) return setError('Choose a file first.');
    setUploadState({ phase: 'preparing', progress: 0 });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    try {
      const documentaryId = kind === 'documentary' ? undefined : String(form.get('documentaryId'));
      const authorization = await fetch('/api/admin/r2-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          documentaryId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      const signed = await authorization.json();
      if (!authorization.ok) throw new Error(signed.error || 'Unable to authorize R2 upload');
      setUploadState({ phase: 'uploading', progress: 0 });
      await uploadToR2(signed.uploadUrl, file, (progress) => setUploadState({ phase: 'uploading', progress }));
      const payload =
        kind === 'documentary'
          ? {
              kind,
              key: signed.key,
              contentType: file.type,
              size: file.size,
              title: String(form.get('title')),
              summary: String(form.get('summary')),
              category: String(form.get('category')),
              rating: String(form.get('rating') || ''),
              releaseDate: String(form.get('releaseDate') || ''),
              featured: form.get('featured') === 'true',
            }
          : { kind, key: signed.key, contentType: file.type, size: file.size, documentaryId };
      setUploadState({ phase: 'saving', progress: 100 });
      const finalize = await fetch('/api/admin/documentaries/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await finalize.json();
      if (!finalize.ok) throw new Error(result.error || 'Unable to save the uploaded file');
      alert(result.message);
      event.currentTarget.reset();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setUploadState(null);
    }
  }

  if (loading) {
    return (
      <div className="container pt-32 pb-16">
        <div className="skeleton h-72" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="container max-w-md pt-32 pb-16">
        <form onSubmit={login} className="glass rounded-xl p-7 space-y-5">
          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl">Admin sign in</h1>
          <label className="block text-sm">
            Username
            <input name="username" required className="input mt-1" />
          </label>
          <label className="block text-sm">
            Password
            <input name="password" type="password" required className="input mt-1" />
          </label>
          {error && <p role="alert" className="text-red-300">{error}</p>}
          <button className="btn-primary w-full">Sign in</button>
        </form>
      </div>
    );
  }

  const overviewCards: StatCard[] = [
    { label: 'Documentaries', value: stats?.totalDocumentaries ?? null, icon: Film, accent: 'text-gold', hint: 'Published library' },
    { label: 'Active subscribers', value: stats?.activeSubscribers ?? null, icon: Users, accent: 'text-emerald-400', hint: 'Currently active' },
    { label: 'Pending payments', value: stats?.pendingPayments ?? null, icon: ArrowDownLeft, accent: 'text-amber-300', hint: 'Awaiting review' },
    { label: 'Approved balance', value: stats?.approvedPaymentsBalance ?? null, icon: Wallet, accent: 'text-emerald-300', hint: 'Confirmed revenue' },
  ];

  return (
    <div className="container pt-32 pb-16">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <nav className="flex flex-1 flex-wrap gap-2 overflow-x-auto">
          {['overview', 'payments', 'documentaries', 'upload', 'trailer', 'thumbnail'].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                tab === item ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <button
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' });
            location.reload();
          }}
          className="btn-secondary ml-auto"
        >
          Logout
        </button>
      </div>

      {error && <p role="alert" className="mt-4 text-red-300">{error}</p>}

      {tab === 'overview' && (
        <section className="mt-8">
          <div className="mb-6">
            <p className="eyebrow">Dashboard</p>
            <h1 className="font-[family-name:var(--font-fraunces)] text-4xl">Overview</h1>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overviewCards.map(({ label, value, icon: Icon, accent, hint }) => (
              <div
                key={label}
                className="glass rounded-2xl p-5 transition hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-sm">{label}</span>
                  <span className={`rounded-xl bg-white/[0.04] p-2 ${accent}`}>
                    <Icon size={18} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold">{value ?? '—'}</p>
                {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'payments' && (
        <section className="mt-8">
          <div className="mb-6">
            <p className="eyebrow">Transactions</p>
            <h1 className="font-[family-name:var(--font-fraunces)] text-4xl">Payments</h1>
          </div>
          {payments.length === 0 ? (
            <p className="mt-6 text-text-muted">No payments found.</p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="text-text-muted">
                  <tr className="border-b border-border bg-white/[0.02]">
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Method</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Submitted</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => {
                    const displayAmount = payment.receivedAmount ?? payment.amount;
                    const statusKey = (payment.status as keyof typeof statusBadges) || 'pending';
                    const badge = statusBadges[statusKey] || statusBadges.pending;
                    return (
                      <tr
                        key={payment.id}
                        className={`border-b border-border last:border-b-0 transition hover:bg-white/[0.02] ${
                          index % 2 ? 'bg-white/[0.01]' : ''
                        }`}
                      >
                        <td className="px-5 py-4">{payment.phone}</td>
                        <td className="px-5 py-4 capitalize">{payment.plan}</td>
                        <td className="px-5 py-4">
                          {displayAmount.toLocaleString()} RWF
                          {payment.receivedAmount !== null &&
                            payment.receivedAmount !== payment.amount && (
                              <span className="block text-xs text-text-muted">
                                Expected {payment.amount.toLocaleString()} RWF
                              </span>
                            )}
                        </td>
                        <td className="px-5 py-4">
                          {methodLabels[payment.method || 'manual'] || payment.method}
                          {payment.gatewayStatus && (
                            <span className="block text-xs text-text-muted">
                              {payment.gatewayStatus}
                            </span>
                          )}
                          {payment.needsReview && (
                            <span className="block text-xs text-red-300">
                              {payment.needsReview}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`badge ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="flex flex-wrap items-center gap-2 px-5 py-4">
                          {payment.proofUrl && (
                            <button
                              onClick={() => setModal(payment.proofUrl || undefined)}
                              className="underline"
                            >
                              View proof
                            </button>
                          )}
                          {payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => paymentAction(payment.id, 'confirm')}
                                className="text-emerald-400"
                              >
                                {payment.method && payment.method !== 'manual'
                                  ? 'Re-verify'
                                  : 'Confirm'}
                              </button>
                              <button
                                onClick={() => paymentAction(payment.id, 'reject')}
                                className="text-red-300"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'documentaries' && (
        <section className="mt-8">
          <div className="mb-6">
            <p className="eyebrow">Catalog</p>
            <h1 className="font-[family-name:var(--font-fraunces)] text-4xl">Documentaries</h1>
          </div>
          {docs.length === 0 ? (
            <p className="mt-6 text-text-muted">No documentaries found.</p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="text-text-muted">
                  <tr className="border-b border-border bg-white/[0.02]">
                    <th className="px-5 py-3 font-medium">Title</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Featured</th>
                    <th className="px-5 py-3 font-medium">Trailer</th>
                    <th className="px-5 py-3 font-medium">Thumbnail</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc, index) => (
                    <tr
                      key={doc.id}
                      className={`border-b border-border last:border-b-0 transition hover:bg-white/[0.02] ${
                        index % 2 ? 'bg-white/[0.01]' : ''
                      }`}
                    >
                      <td className="px-5 py-4">{doc.title}</td>
                      <td className="px-5 py-4">{doc.category}</td>
                      <td className="px-5 py-4 capitalize">{doc.status}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={async () => {
                            await fetch('/api/admin/documentaries', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: doc.id, featured: !doc.featured }),
                            });
                            void load();
                          }}
                          className="rounded-full px-3 py-1 text-xs transition hover:bg-white/10"
                        >
                          {doc.featured ? 'Featured' : 'Mark featured'}
                        </button>
                      </td>
                      <td className="px-5 py-4">{doc.trailerUrl ? 'Ready' : '—'}</td>
                      <td className="px-5 py-4">{doc.thumbnailUrl ? 'Ready' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'upload' && (
        <AssetForm kind="documentary" docs={docs} uploadState={uploadState} error={error} onSubmit={upload} />
      )}
      {tab === 'trailer' && (
        <AssetForm kind="trailer" docs={docs} uploadState={uploadState} error={error} onSubmit={upload} />
      )}
      {tab === 'thumbnail' && (
        <AssetForm kind="thumbnail" docs={docs} uploadState={uploadState} error={error} onSubmit={upload} />
      )}

      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setModal(undefined)}
        >
          <img src={modal} alt="Payment proof" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}

function AssetForm({
  kind,
  docs,
  uploadState,
  error,
  onSubmit,
}: {
  kind: AssetKind;
  docs: Doc[];
  uploadState: UploadState | null;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>, kind: AssetKind) => void;
}) {
  const [name, setName] = useState('');
  const uploading = uploadState !== null;
  const existing = kind !== 'documentary';
  const title =
    kind === 'documentary'
      ? 'Upload documentary'
      : kind === 'trailer'
        ? 'Add trailer'
        : 'Upload thumbnail';
  const image = kind === 'thumbnail';
  const status =
    uploadState?.phase === 'preparing'
      ? 'Preparing secure R2 upload…'
      : uploadState?.phase === 'saving'
        ? 'Saving documentary details…'
        : `Uploading directly to R2: ${uploadState?.progress ?? 0}%`;

  return (
    <form
      onSubmit={(event) => onSubmit(event, kind)}
      className="glass mt-8 max-w-2xl rounded-2xl p-6 space-y-4"
    >
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl">{title}</h1>
      {existing && (
        <label className="block text-sm">
          Documentary
          <select name="documentaryId" required className="input mt-1">
            {docs.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {!existing && (
        <>
          <label className="block text-sm">
            Title
            <input name="title" required className="input mt-1" />
          </label>
          <label className="block text-sm">
            Summary
            <textarea name="summary" required className="input mt-1" rows={4} />
          </label>
          <label className="block text-sm">
            Category
            <input name="category" required className="input mt-1" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Rating
              <input
                name="rating"
                type="number"
                min="0"
                max="10"
                step=".1"
                className="input mt-1"
              />
            </label>
            <label className="text-sm">
              Release date
              <input name="releaseDate" type="date" className="input mt-1" />
            </label>
          </div>
          <label className="flex gap-2 text-sm">
            <input name="featured" type="checkbox" value="true" /> Featured
          </label>
        </>
      )}
      <label className="block text-sm">
        {image ? 'Thumbnail image' : 'Video file'}
        <input
          name="file"
          type="file"
          accept={
            image
              ? 'image/jpeg,image/png,image/webp'
              : 'video/mp4,video/webm,video/quicktime,video/x-msvideo'
          }
          required
          disabled={uploading}
          className="input mt-1"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setName(event.target.files?.[0]?.name || '')
          }
        />
        {name && <span className="block text-xs text-text-muted">Selected: {name}</span>}
      </label>
      {uploading ? (
        <div className="space-y-1 text-xs text-gold">
          <p>{status}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${uploadState?.progress ?? 0}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">
          The file is uploaded directly to Cloudflare R2, then its reference is saved.
        </p>
      )}
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={uploading}>
        {uploading ? 'Uploading…' : title}
      </button>
    </form>
  );
}
