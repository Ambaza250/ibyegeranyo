'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

const socialLinks = [['YouTube', 'https://www.youtube.com/@Aimechristian01'], ['TikTok', 'https://www.tiktok.com/@aimechristian01']] as const;

export function Footer() {
  const { t } = useI18n();
  const columns = [[t('explore'), [['/', t('home')], ['/documentaries', t('documentaries')], ['/about', t('about')], ['/pricing', t('pricing')]]], [t('account'), [['/login', t('login')], ['/register', t('register')], ['/account', t('account')]]], [t('legal'), [['/privacy', t('privacy')], ['/terms', t('terms')]]]] as const;
  return <footer className="border-t border-border bg-background-secondary"><div className="container py-14 md:py-18"><div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)] lg:gap-12"><div><Link href="/" className="inline-flex items-center gap-3"><span className="grid size-10 place-items-center rounded-md border border-primary/50 bg-primary font-bold">A</span><span><strong className="block">Aime Christian</strong><small className="text-text-muted">Ibyegeranyo.com</small></span></Link><p className="mt-5 max-w-sm text-sm leading-7 text-text-muted">{t('footerDescription')}</p><div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">{socialLinks.map(([name, href]) => href ? <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white">{name}</a> : <span key={name} className="text-text-muted/60" title="Social link not configured">{name}</span>)}</div></div>{columns.map(([heading, links]) => <div key={heading}><h2 className="text-sm font-semibold uppercase tracking-[.16em] text-sand">{heading}</h2><ul className="mt-5 space-y-3">{links.map(([href, label]) => <li key={href}><Link href={href} className="text-sm text-text-muted transition-colors hover:text-white">{label}</Link></li>)}</ul></div>)}</div><div className="mt-12 border-t border-border pt-7 text-sm text-text-muted"><p>© {new Date().getFullYear()} Aime Christian Documentaries.</p></div></div></footer>;
}
