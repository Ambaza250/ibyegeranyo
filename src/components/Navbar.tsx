'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface User {
  id: string;
  fullName: string;
  phone: string;
  subscriptionStatus: string;
  selectedPlan: string | null;
  expiresAt: string | null;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // User not logged in
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // The session is an external source; this runs once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch {
      console.error('Logout failed');
    }
  };

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/documentaries', label: t('documentaries') },
    { href: '/about', label: t('about') },
    { href: '/pricing', label: t('pricing') },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // The admin workspace has its own navigation. Rendering the public fixed
  // navbar there overlays the dashboard tabs and prevents them being clicked.
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-[#080B12] shadow-[0_6px_24px_rgba(0,0,0,.26)]">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center border border-primary/50">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-semibold leading-tight">Aime Christian</div>
              <div className="text-text-muted text-xs">Ibyegeranyo.com</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            <div className="inline-flex items-center rounded-full border border-border bg-surface p-2 text-lg shadow-inner" aria-label={t('language')}>
              {(['en', 'rw'] as const).map((item) => <button key={item} onClick={() => setLocale(item)} className={`min-w-22 rounded-full px-6 py-3 font-bold transition-all ${locale === item ? 'bg-gold text-background shadow-sm' : 'text-text-muted hover:bg-surface-hover hover:text-white'}`} aria-pressed={locale === item}>{item.toUpperCase()}</button>)}
            </div>
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Link href="/account" className="text-sm text-text-secondary hover:text-white">{user.fullName}</Link>
                      <div className={`text-xs ${
                        user.subscriptionStatus === 'active' ? 'text-green-500' :
                        user.subscriptionStatus === 'pending' ? 'text-yellow-500' :
                        'text-text-muted'
                      }`}>
                        {user.subscriptionStatus === 'active' ? t('active') : user.subscriptionStatus === 'pending' ? t('pending') : t('free')}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-text-muted hover:text-white transition-colors"
                      title={t('logout')}
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-text-secondary hover:text-white transition-colors"
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/register"
                      className="btn-primary text-sm"
                    >
                      {t('register')}
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden min-h-11 min-w-11 p-2 text-text-secondary hover:text-white"
            aria-label={isOpen ? 'Close menu' : 'Open menu'} aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-[#080B12]">
          <div className="container py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="inline-flex rounded-xl border border-border bg-surface p-2">{(['en', 'rw'] as const).map((item) => <button key={item} onClick={() => setLocale(item)} className={`min-h-12 min-w-20 rounded-lg px-5 text-base font-bold transition-colors ${locale === item ? 'bg-gold text-background' : 'text-text-muted hover:text-white'}`} aria-pressed={locale === item}>{item.toUpperCase()}</button>)}</div>
            <div className="pt-4 border-t border-border space-y-3">
              {user ? (
                <>
                  <div className="text-sm text-text-secondary">{user.fullName}</div>
                  <Link href="/account" onClick={() => setIsOpen(false)} className="block text-sm text-text-muted hover:text-white">{t('account')}</Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-text-muted hover:text-white"
                  >
                    <LogOut size={16} />
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block text-sm font-medium text-text-secondary hover:text-white"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="block btn-primary text-sm text-center"
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
