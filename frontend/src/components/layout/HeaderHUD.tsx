'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import LanguageToggle from './LanguageToggle';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
  Ticket,
  Wallet,
  User as UserIcon,
  LogIn,
  LogOut,
  Search,
  Trophy,
  ChevronDown,
  Menu,
  Sun,
  Moon,
  HelpCircle,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SearchCommandDialog } from '@/components/search/SearchCommandDialog';
import MobileNavSheet from './MobileNavSheet';
import { HowItWorksModal } from './HowItWorksModal';
import { TicketLedgerDrawer } from './TicketLedgerDrawer';
import { useLearnerTickets } from '@/hooks/useLearnerTickets';

interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  authProvider: string;
  avatarUrl?: string | null;
}

function getFirstName(nameOrEmail?: string | null): string {
  if (!nameOrEmail) return '';
  const clean = nameOrEmail.trim();
  if (clean.includes(' ')) {
    return clean.split(/\s+/)[0];
  }
  if (clean.includes('@')) {
    return clean.split('@')[0];
  }
  return clean;
}

export default function HeaderHUD() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tHowItWorks = useTranslations('howItWorks');
  const locale = useLocale();
  const pathname = usePathname();
  const isRtl = locale === 'ar';

  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const { totalTickets } = useLearnerTickets();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isTicketsDrawerOpen, setIsTicketsDrawerOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setIsSearchOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('knzin:open-search', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('knzin:open-search', handleCustomOpen);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('knzin_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('knzin_auth_token');
    localStorage.removeItem('knzin_user');
    setUser(null);
    window.location.reload();
  };

  const handleGoogleLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    window.location.href = `${backendUrl}/auth/google/redirect`;
  };

  const isCoursesActive = pathname === '/' || pathname.startsWith('/courses');
  const isRaffleActive = pathname.startsWith('/raffle');
  const isDesignSystemActive = pathname.startsWith('/design-system');

  const firstName = user ? getFirstName(user.displayName || user.email) : '';

  return (
    <header
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`sticky top-0 z-40 w-full text-content-primary transition-colors duration-150 border-b ${
        isScrolled
          ? 'bg-surface/85 dark:bg-surface/85 border-border-subtle shadow-2xs'
          : 'bg-surface border-border-subtle'
      }`}
    >
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logical Start: Logo & Main Navigation */}
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-colors">
              <span className="text-white font-bold text-sm tracking-wider">K</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg tracking-tight text-content-primary group-hover:text-primary transition-colors">
                كَنزين
              </span>
              <span className="hidden sm:inline text-xs font-medium text-content-muted">
                KNZIN
              </span>
            </div>
          </Link>

          {/* Full Desktop Navigation (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-content-secondary">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isCoursesActive
                  ? 'bg-surface-secondary text-primary font-bold shadow-2xs'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/70'
              }`}
            >
              {t('courses')}
            </Link>

            <Link
              href="/raffle"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isRaffleActive
                  ? 'bg-surface-secondary text-primary font-bold shadow-2xs'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/70'
              }`}
            >
              {t('raffle')}
            </Link>

            <Link
              href="/affiliate"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/affiliate')
                  ? 'bg-surface-secondary text-primary font-bold shadow-2xs'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/70'
              }`}
            >
              {isRtl ? 'الشركاء' : 'Affiliate'}
            </Link>

            <Link
              href="/design-system"
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                isDesignSystemActive
                  ? 'bg-surface-secondary text-primary font-bold shadow-2xs'
                  : 'text-content-muted hover:text-content-primary hover:bg-surface-secondary/70'
              }`}
            >
              {t('designSystem')}
            </Link>

            {/* How It Works Desktop 1-Click Trigger */}
            <button
              type="button"
              onClick={() => setIsHowItWorksOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary hover:text-primary-hover hover:bg-primary/10 transition-colors text-xs font-semibold cursor-pointer border border-primary/20 bg-primary/5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{tHowItWorks('trigger')}</span>
            </button>

            {/* Global Search Bar (Accessible on all routes) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="ms-2 flex items-center justify-between gap-3 w-52 xl:w-64 px-3 py-1.5 rounded-xl bg-surface-secondary/70 hover:bg-surface-elevated border border-border-subtle hover:border-border text-content-muted hover:text-content-primary transition-all duration-150 text-xs font-normal group cursor-pointer shadow-2xs text-start"
              title={isRtl ? 'البحث الذكي في كَنزين (Ctrl + K)' : 'Smart Search in KNZiN (Ctrl + K)'}
              aria-label={t('searchPlaceholder')}
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-content-muted group-hover:text-primary shrink-0 transition-colors" />
                <span className="truncate text-[11px] sm:text-xs">
                  {t('searchPlaceholder')}
                </span>
              </div>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-content-muted bg-surface-primary border border-border-subtle rounded select-none shrink-0">
                {isMac ? '⌘' : 'Ctrl'} K
              </kbd>
            </button>
          </nav>
        </div>

        {/* Logical End: Language Toggle & Profile Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile How It Works 1-click shortcut (< 1024px) */}
          <button
            type="button"
            onClick={() => setIsHowItWorksOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-primary transition-colors cursor-pointer"
            aria-label={tHowItWorks('trigger')}
            title={tHowItWorks('trigger')}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Mobile / Tablet search trigger (< 1024px) */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-content-secondary hover:text-content-primary transition-colors cursor-pointer"
            aria-label={isRtl ? 'البحث الذكي' : 'Search'}
            title={isRtl ? 'البحث الذكي' : 'Search'}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Ticket Counter HUD — opens TicketLedgerDrawer without navigating */}
          <button
            type="button"
            onClick={() => setIsTicketsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-secondary text-xs font-medium transition-colors cursor-pointer"
            title={isRtl ? 'دفتر تذاكر السحب الترويجية' : 'Promotional Raffle Tickets Ledger'}
            aria-label={isRtl ? 'دفتر تذاكر السحب الترويجية' : 'Promotional Raffle Tickets Ledger'}
          >
            <Ticket className="w-3.5 h-3.5 text-accent" />
            <span>{totalTickets} <span className="hidden sm:inline text-content-muted">{tCommon('ticket')}</span></span>
          </button>

          {/* Desktop-only: Wallet Balance HUD (>= 1024px) */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-content-secondary text-xs font-medium"
            title={isRtl ? 'رصيد المحفظة' : 'Wallet Balance'}
          >
            <Wallet className="w-3.5 h-3.5 text-content-muted" />
            <span>0 {tCommon('currencyIqd')}</span>
          </div>

          {/* Desktop & Tablet Sign In entry button when unauthenticated */}
          {!user && (
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
            </Link>
          )}

          {/* Language Switcher */}
          <LanguageToggle />

          {/* Profile Dropdown (First Name Only + Theme Toggle Inside) */}
          <div className="hidden lg:flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-subtle text-xs font-semibold text-content-primary hover:bg-surface-elevated transition-colors outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer">
                <UserIcon className="w-3.5 h-3.5 text-content-muted" />
                <span className="max-w-[100px] truncate">
                  {user ? firstName : t('guestBadge')}
                </span>
                <ChevronDown className="w-3 h-3 text-content-muted" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-56">
                {user ? (
                  <>
                    <DropdownMenuLabel>
                      {isRtl ? 'حساب المتدرب' : 'Learner Account'}
                    </DropdownMenuLabel>
                    <div className="px-2.5 pb-2 text-[11px] text-content-muted truncate">
                      {user.displayName && (
                        <span className="font-semibold block text-content-primary truncate">
                          {user.displayName}
                        </span>
                      )}
                      <span className="truncate block">{user.email}</span>
                    </div>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 w-full">
                        <UserIcon className="w-4 h-4 text-primary" />
                        <span>{isRtl ? 'لوحة تدريبي ودوراتي' : 'My Learning Hub'}</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/raffle" className="flex items-center gap-2 w-full">
                        <Trophy className="w-4 h-4 text-accent" />
                        <span>{isRtl ? 'سحب الجوائز القانوني' : 'Raffle Transparency'}</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/affiliate" className="flex items-center gap-2 w-full">
                        <Users className="w-4 h-4 text-emerald-500" />
                        <span>{isRtl ? 'بوابة الشركاء والمسوّقين' : 'Affiliate Portal'}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>
                      {t('guestBadge')}
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login" className="flex items-center gap-2 text-primary font-semibold w-full cursor-pointer">
                        <LogIn className="w-4 h-4" />
                        <span>{isRtl ? 'تسجيل الدخول / حساب جديد' : 'Sign In / Register'}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleGoogleLogin}
                      className="flex items-center gap-2 text-content-secondary hover:text-content-primary cursor-pointer text-xs"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>{t('loginWithGoogle')}</span>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                {/* Theme Toggle inside Profile Dropdown (Moon when light, Sun when dark) */}
                <DropdownMenuItem
                  onClick={toggleTheme}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isDark ? (
                      <Sun className="w-4 h-4 text-accent" />
                    ) : (
                      <Moon className="w-4 h-4 text-blue-500" />
                    )}
                    <span>{t('theme')}</span>
                  </div>
                  <span className="text-[11px] text-content-muted font-normal">
                    {isDark ? t('themeDark') : t('themeLight')}
                  </span>
                </DropdownMenuItem>

                {user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 ms-0 me-2" />
                      <span>{t('logout')}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile & Tablet Hamburger Menu Trigger (< 1024px) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-content-secondary hover:text-content-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            aria-label={isRtl ? 'فتح القائمة الرئيسية' : 'Open main navigation menu'}
            title={isRtl ? 'القائمة الرئيسية' : 'Main menu'}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global In-Place Search Command Palette (Ctrl + K) */}
      <SearchCommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />

      {/* Mobile & Tablet Navigation Sheet Drawer */}
      <MobileNavSheet
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        user={user}
        onLogout={handleLogout}
        onGoogleLogin={handleGoogleLogin}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      {/* How It Works Onboarding Modal Dialog */}
      <HowItWorksModal
        open={isHowItWorksOpen}
        onOpenChange={setIsHowItWorksOpen}
      />

      {/* Ticket Ledger Sliding Drawer */}
      <TicketLedgerDrawer
        isOpen={isTicketsDrawerOpen}
        onClose={() => setIsTicketsDrawerOpen(false)}
      />
    </header>
  );
}
