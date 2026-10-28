import React, { useState } from 'react';
import { ScreenId, UserSession } from '../types';

interface DashboardLayoutProps {
  activeScreen: ScreenId;
  activeReportId?: string;
  onNavigate: (screen: ScreenId, reportId?: string) => void;
  currentUser?: UserSession | null;
  onSignOut?: () => void;
  children: React.ReactNode;
}

interface NavItem {
  id: ScreenId;
  label: string;
  routeHint: string;
  group: 'core' | 'tools' | 'account';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', routeHint: 'overview', group: 'core' },
  { id: 'workspace', label: 'AI workspace', routeHint: 'workspace', group: 'core' },
  { id: 'results', label: 'Editorial report', routeHint: 'results', group: 'core' },
  { id: 'history', label: 'Analysis history', routeHint: 'history', group: 'core' },
  { id: 'settings', label: 'Settings', routeHint: 'settings', group: 'core' },

  { id: 'microgrid-simulator', label: 'Stress simulator', routeHint: 'simulator', group: 'tools' },
  { id: 'decision-lab', label: 'Policy matrix', routeHint: 'matrix', group: 'tools' },
  { id: 'demand-forecast', label: '24h load horizon', routeHint: 'forecast', group: 'tools' },

  { id: 'onboarding', label: 'Onboarding steps', routeHint: 'onboarding', group: 'account' },
  { id: 'login', label: 'Sign in or Sign up', routeHint: 'login', group: 'account' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeScreen,
  activeReportId = 'ANL-2026-104',
  onNavigate,
  currentUser,
  onSignOut,
  children,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const currentNav =
    NAV_ITEMS.find((i) => i.id === activeScreen) || NAV_ITEMS[0];

  const handleNavClick = (id: ScreenId) => {
    onNavigate(id, id === 'results' ? activeReportId : undefined);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F3EEE5] text-[#29251F] font-sans-ui flex flex-col lg:flex-row bg-energy-watermark">
      {/* DESKTOP SIDEBAR (248px) */}
      <aside
        aria-label="Application Sidebar"
        className="hidden lg:flex lg:w-[248px] lg:shrink-0 bg-[#FCFAF6] border-r border-[#DDD5C9] flex-col justify-between sticky top-0 h-screen"
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Brand Wordmark */}
          <div className="pb-4 border-b border-[#DDD5C9] flex items-baseline justify-between">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="text-left cursor-pointer group"
            >
              <span className="font-serif-editorial text-xl font-medium text-[#29251F] group-hover:text-[#754536] transition-colors">
                PRAVAAH
              </span>
              <span className="block font-mono-meta text-[10px] uppercase tracking-[0.14em] text-[#716A61] mt-0.5">
                Editorial Shell
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="font-mono-meta text-[11px] text-[#716A61] hover:text-[#29251F] cursor-pointer"
              title="Return to public landing page"
            >
              Home
            </button>
          </div>

          {/* Primary Action Button */}
          <div>
            <button
              type="button"
              onClick={() => handleNavClick('workspace')}
              className="w-full h-11 px-4 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-[14px] font-medium transition-colors duration-150 flex items-center justify-between cursor-pointer"
            >
              <span>New analysis</span>
              <span className="font-mono-meta text-xs">+</span>
            </button>
          </div>

          {/* Core Application Navigation */}
          <nav aria-label="Core Workspace Views" className="space-y-5">
            <div>
              <span className="px-2.5 font-mono-meta text-[10px] uppercase tracking-[0.14em] text-[#716A61] block mb-2">
                Core application
              </span>
              <div className="space-y-1">
                {NAV_ITEMS.filter((i) => i.group === 'core').map((item) => {
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full px-3 py-2 rounded-[6px] text-left text-[14px] flex items-center justify-between transition-colors duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-[#FFFFFF] text-[#754536] font-semibold border border-[#DDD5C9]'
                          : 'text-[#29251F] hover:bg-[#F3EEE5]/70'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Domain Engineering Modules */}
            <div>
              <span className="px-2.5 font-mono-meta text-[10px] uppercase tracking-[0.14em] text-[#716A61] block mb-2">
                Telemetry modules
              </span>
              <div className="space-y-1">
                {NAV_ITEMS.filter((i) => i.group === 'tools').map((item) => {
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full px-3 py-2 rounded-[6px] text-left text-[14px] flex items-center justify-between transition-colors duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-[#FFFFFF] text-[#754536] font-semibold border border-[#DDD5C9]'
                          : 'text-[#716A61] hover:text-[#29251F] hover:bg-[#F3EEE5]/70'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Onboarding & Auth Flows */}
            <div>
              <span className="px-2.5 font-mono-meta text-[10px] uppercase tracking-[0.14em] text-[#716A61] block mb-2">
                Access &amp; setup flows
              </span>
              <div className="space-y-1">
                {NAV_ITEMS.filter((i) => i.group === 'account').map((item) => {
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full px-3 py-2 rounded-[6px] text-left text-[13px] flex items-center justify-between transition-colors duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-[#FFFFFF] text-[#754536] font-semibold border border-[#DDD5C9]'
                          : 'text-[#716A61] hover:text-[#29251F] hover:bg-[#F3EEE5]/70'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer: Operator Context & Sign Out */}
        <div className="p-4 border-t border-[#DDD5C9] bg-[#FFFFFF]">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#29251F] truncate">
                {currentUser?.fullName || 'Elena Vance'}
              </div>
              <div className="font-mono-meta text-[11px] text-[#716A61] truncate">
                {currentUser?.role || 'Lead Grid Architect'}
              </div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="font-mono-meta text-[11px] text-[#A43E35] hover:underline cursor-pointer shrink-0 font-medium ml-2"
                title="Sign out of operator session"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT SHELL */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 h-16 bg-[#FCFAF6]/95 backdrop-blur-xs border-b border-[#DDD5C9] px-5 sm:px-8 lg:px-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              aria-label="Toggle navigation drawer"
              aria-expanded={mobileDrawerOpen}
              className="lg:hidden h-10 px-3 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] text-xs font-mono-meta uppercase tracking-wider text-[#29251F] cursor-pointer"
            >
              {mobileDrawerOpen ? 'Close' : 'Menu'}
            </button>

            <div className="flex items-center gap-2 truncate">
              <span className="text-base font-semibold text-[#29251F] truncate">
                {currentNav.label}
              </span>
            </div>
          </div>

          {/* Right Context Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 font-mono-meta text-[11px] px-2.5 py-1 rounded-[4px] bg-[#F3EEE5] border border-[#DDD5C9] text-[#716A61]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'Operator'}</span>
            </div>

            <button
              type="button"
              onClick={() => handleNavClick('workspace')}
              className="h-9 px-3.5 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-xs font-medium transition-colors cursor-pointer"
            >
              + Analysis
            </button>

            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="hidden md:inline-block h-9 px-3 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] hover:bg-[#F3EEE5] text-xs font-medium text-[#29251F] transition-colors cursor-pointer"
            >
              Landing
            </button>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="h-9 px-3 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] hover:bg-[#F3EEE5] text-xs font-medium text-[#A43E35] transition-colors cursor-pointer"
                title="Sign out of operator session"
              >
                Sign out
              </button>
            )}
          </div>
        </header>

        {/* MOBILE / TABLET COLLAPSIBLE NAVIGATION DRAWER */}
        {mobileDrawerOpen && (
          <div className="lg:hidden bg-[#FCFAF6] border-b border-[#DDD5C9] px-5 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`px-3 py-2.5 rounded-[6px] text-left text-sm flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#FFFFFF] text-[#754536] font-semibold border border-[#DDD5C9]'
                        : 'text-[#29251F] hover:bg-[#F3EEE5]'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-3 border-t border-[#DDD5C9] flex items-center justify-between">
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="text-xs font-medium text-[#754536] cursor-pointer"
              >
                ← Back to landing
              </button>
              {onSignOut ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-xs font-semibold text-[#A43E35] hover:underline cursor-pointer"
                >
                  Sign out
                </button>
              ) : (
                <span className="font-mono-meta text-[11px] text-[#716A61]">
                  North Campus · Feeder #04
                </span>
              )}
            </div>
          </div>
        )}

        {/* RESPONSIVE PAGE CONTENT CONTAINER */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-7 lg:px-14 py-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
};
