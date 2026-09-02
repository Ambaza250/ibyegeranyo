'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';

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
    { href: '/', label: 'Home' },
    { href: '/documentaries', label: 'Documentaries' },
    { href: '/about', label: 'About' },
    { href: '/pricing', label: 'Pricing' },
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
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
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
                        {user.subscriptionStatus === 'active' ? 'Active' :
                         user.subscriptionStatus === 'pending' ? 'Pending' : 'Free'}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-text-muted hover:text-white transition-colors"
                      title="Logout"
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
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="btn-primary text-sm"
                    >
                      Register
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-white"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden glass border-t border-border">
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
            <div className="pt-4 border-t border-border space-y-3">
              {user ? (
                <>
                  <div className="text-sm text-text-secondary">{user.fullName}</div>
                  <Link href="/account" onClick={() => setIsOpen(false)} className="block text-sm text-text-muted hover:text-white">My account</Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-text-muted hover:text-white"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block text-sm font-medium text-text-secondary hover:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="block btn-primary text-sm text-center"
                  >
                    Register
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
