import React, { useState } from 'react';
import { ScreenId, UserSession } from '../types';

interface LandingPageProps {
  onLaunchDashboard: (targetScreen?: ScreenId, reportId?: string) => void;
  currentUser?: UserSession | null;
  onSignOut?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchDashboard,
  currentUser,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'curve' | 'factors'>('curve');
  const [heroMode, setHeroMode] = useState<'split' | 'panoramic'>('split');
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F3EEE5] text-[#29251F] font-sans-ui selection:bg-[#754536]/15 selection:text-[#754536]">
      {/* MINIMAL TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#F3EEE5]/95 backdrop-blur-md border-b border-[#DDD5C9]">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Wordmark */}
          <div className="flex items-baseline gap-3">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left cursor-pointer group flex items-center gap-2.5"
            >
              <span className="w-3 h-3 rounded-full bg-[#754536] group-hover:scale-110 transition-transform" />
              <span className="font-serif-editorial text-2xl font-medium tracking-tight text-[#29251F]">
                PRAVAAH
              </span>
              <span className="hidden sm:inline-block font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#716A61]">
                · Microgrid Intelligence
              </span>
            </button>
          </div>

          {/* Minimal Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-[14px] text-[#716A61]"
          >
            <button
              type="button"
              onClick={() => onLaunchDashboard('overview')}
              className="hover:text-[#29251F] transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => onLaunchDashboard('demand-forecast')}
              className="hover:text-[#29251F] transition-colors cursor-pointer"
            >
              24h Forecast
            </button>
            <button
              type="button"
              onClick={() => onLaunchDashboard('microgrid-simulator')}
              className="hover:text-[#29251F] transition-colors cursor-pointer"
            >
              Simulator
            </button>
            <button
              type="button"
              onClick={() => onLaunchDashboard('workspace')}
              className="hover:text-[#29251F] transition-colors cursor-pointer"
            >
              AI Workspace
            </button>
          </nav>

          {/* Primary Auth & Session Controls */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-mono-meta text-xs px-3 py-1.5 rounded-[6px] bg-[#FCFAF6] border border-[#DDD5C9] text-[#29251F]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium">{currentUser.fullName}</span>
                </div>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="font-mono-meta text-xs text-[#A43E35] hover:underline px-2 py-1.5 cursor-pointer font-medium"
                    title="Sign out of current operator session"
                  >
                    Sign out
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onLaunchDashboard('overview')}
                  className="h-10 px-4 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-white text-[14px] font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Dashboard →
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onLaunchDashboard('login')}
                  className="text-[14px] font-medium text-[#29251F] hover:text-[#754536] transition-colors px-3 py-2 cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => onLaunchDashboard('workspace')}
                  className="h-10 px-4 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-white text-[14px] font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Get started →
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-10 px-3 rounded-[6px] border border-[#DDD5C9] bg-[#FCFAF6] text-[#29251F] font-mono-meta text-xs uppercase tracking-wider cursor-pointer"
          >
            {mobileMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FCFAF6] border-b border-[#DDD5C9] px-5 py-5 space-y-4 shadow-lg">
            <div className="flex flex-col space-y-2.5 text-[15px] text-[#29251F]">
              <button
                type="button"
                onClick={() => {
                  onLaunchDashboard('overview');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-1 hover:text-[#754536]"
              >
                Overview Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  onLaunchDashboard('demand-forecast');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-1 hover:text-[#754536]"
              >
                24h Demand Forecast
              </button>
              <button
                type="button"
                onClick={() => {
                  onLaunchDashboard('microgrid-simulator');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-1 hover:text-[#754536]"
              >
                Microgrid Stress Simulator
              </button>
              <button
                type="button"
                onClick={() => {
                  onLaunchDashboard('workspace');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-1 hover:text-[#754536]"
              >
                AI Workspace
              </button>
            </div>

            <div className="pt-3 border-t border-[#DDD5C9] flex flex-col gap-2">
              {currentUser ? (
                <>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-[#716A61]">Logged in as:</span>
                    <span className="font-semibold text-[#29251F]">{currentUser.fullName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLaunchDashboard('overview');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full h-11 rounded-[6px] bg-[#754536] text-white font-medium text-sm"
                  >
                    Open Dashboard
                  </button>
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        onSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full h-10 rounded-[6px] border border-[#A43E35]/40 text-[#A43E35] font-medium text-xs"
                    >
                      Sign out
                    </button>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLaunchDashboard('login');
                      setMobileMenuOpen(false);
                    }}
                    className="h-11 rounded-[6px] border border-[#DDD5C9] bg-white text-sm font-medium"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLaunchDashboard('workspace');
                      setMobileMenuOpen(false);
                    }}
                    className="h-11 rounded-[6px] bg-[#754536] text-white text-sm font-medium"
                  >
                    Get started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION — VIVID RENEWABLE DIGITAL TWIN BACKGROUND */}
        <section className="relative min-h-[700px] lg:min-h-[780px] border-b border-[#DDD5C9] overflow-hidden flex flex-col justify-between">
          {/* Panoramic Image Backdrop */}
          <div
            className="absolute inset-0 bg-cover bg-center sm:bg-[center_right_18%] transition-all duration-700 ease-out"
            style={{
              backgroundImage: "url('/gridmind-hero-bg.jpg')",
              filter: heroMode === 'panoramic' ? 'saturate(1.22) contrast(1.08)' : 'saturate(1.15) contrast(1.04)',
            }}
          />

          {/* Gradient Light Overlays */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
              heroMode === 'panoramic'
                ? 'bg-gradient-to-t from-[#F3EEE5] via-transparent to-black/20 opacity-60'
                : 'bg-gradient-to-r from-[#F3EEE5]/88 via-[#F3EEE5]/60 to-transparent'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F3EEE5]/35 via-transparent to-[#F3EEE5] pointer-events-none" />

          {/* Interactive Digital Twin Hotspots Pinned Over Assets */}
          {/* Wind Turbine Array */}
          <div className="absolute top-20 sm:top-24 right-4 sm:right-12 lg:right-24 z-30 group">
            <button
              type="button"
              onClick={() => setActiveHotspot(activeHotspot === 'wind' ? null : 'wind')}
              className="glass-pill px-3.5 py-1.5 rounded-full flex items-center gap-2 hover:scale-105 transition-all cursor-pointer shadow-lg border border-emerald-400/60"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 beacon-pulse-emerald" />
              <span className="font-mono-meta text-[11px] font-semibold text-emerald-950">
                Wind Turbines · 24.5 kW
              </span>
            </button>
            {activeHotspot === 'wind' && (
              <div className="absolute top-full mt-2 right-0 w-64 glass-editorial-panel rounded-lg p-3 text-xs shadow-xl z-40">
                <div className="font-semibold text-[#29251F]">North Ridge Turbine Cluster</div>
                <div className="text-[#716A61] mt-1 font-mono-meta">6.8 m/s wind · 12.4° blade pitch · Basal infeed</div>
              </div>
            )}
          </div>

          {/* Solar PV Array */}
          <div className="absolute top-[44%] sm:top-[42%] right-4 sm:right-10 lg:right-16 z-30 group">
            <button
              type="button"
              onClick={() => setActiveHotspot(activeHotspot === 'solar' ? null : 'solar')}
              className="glass-pill px-3.5 py-1.5 rounded-full flex items-center gap-2 hover:scale-105 transition-all cursor-pointer shadow-lg border border-amber-400/60"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 beacon-pulse-amber" />
              <span className="font-mono-meta text-[11px] font-semibold text-amber-950">
                Solar PV Array · 88.6 kW
              </span>
            </button>
            {activeHotspot === 'solar' && (
              <div className="absolute top-full mt-2 right-0 w-64 glass-editorial-panel rounded-lg p-3 text-xs shadow-xl z-40">
                <div className="font-semibold text-[#29251F]">Ridge Photovoltaic Bank</div>
                <div className="text-[#716A61] mt-1 font-mono-meta">845 W/m² irradiance · 33°C · Recharging BESS</div>
              </div>
            )}
          </div>

          {/* Holographic Dispatch Wave */}
          <div className="absolute bottom-20 sm:bottom-24 right-6 sm:right-1/4 lg:right-[34%] z-30 hidden sm:block animate-wave-float">
            <div className="glass-pill px-4 py-2 rounded-full flex items-center gap-3 shadow-xl border border-emerald-400/60 bg-white/95">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <div className="flex items-center gap-2">
                <span className="font-mono-meta text-[11px] font-semibold text-[#29251F]">
                  Smart Dispatch Wave
                </span>
                <span className="font-mono-meta text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                  Renewable Storage Mode
                </span>
              </div>
            </div>
          </div>

          {/* Foreground Hero Content — Minimal Text & High Clarity */}
          <div className="max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-14 pt-8 pb-14 lg:pt-12 lg:pb-20 relative z-20">
            {/* Minimal Header Strip & View Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3.5 mb-6 border-b border-[#DDD5C9]/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#754536] animate-pulse" />
                <span className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536] font-semibold">
                  LIVE DIGITAL TWIN · NORTH CAMPUS FEEDER #04
                </span>
              </div>

              {/* View Switcher Pill */}
              <div className="flex items-center glass-pill p-1 rounded-full border border-white/70">
                <button
                  type="button"
                  onClick={() => setHeroMode('split')}
                  className={`px-3 py-1 rounded-full font-mono-meta text-[11px] transition-all cursor-pointer ${
                    heroMode === 'split'
                      ? 'bg-[#754536] text-white shadow-sm font-semibold'
                      : 'text-[#716A61] hover:text-[#29251F]'
                  }`}
                >
                  ☷ Split Mode
                </button>
                <button
                  type="button"
                  onClick={() => setHeroMode('panoramic')}
                  className={`px-3 py-1 rounded-full font-mono-meta text-[11px] transition-all cursor-pointer ${
                    heroMode === 'panoramic'
                      ? 'bg-[#754536] text-white shadow-sm font-semibold'
                      : 'text-[#716A61] hover:text-[#29251F]'
                  }`}
                >
                  ✦ Panoramic View
                </button>
              </div>
            </div>

            {/* Asymmetric Composition */}
            <div
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start transition-all duration-500 ${
                heroMode === 'panoramic' ? 'max-w-2xl' : ''
              }`}
            >
              {/* Left Column: Minimal Glassmorphic Card */}
              <div
                className={`glass-editorial-panel rounded-[16px] p-6 sm:p-8 z-10 ${
                  heroMode === 'panoramic' ? 'lg:col-span-12' : 'lg:col-span-7'
                }`}
              >
                <div className="flex items-center gap-2 text-[#754536] font-mono-meta text-xs uppercase tracking-wider mb-2">
                  <span>Physical Constraints</span>
                  <span>·</span>
                  <span>Demand Forecasting</span>
                </div>

                <h1 className="font-serif-editorial font-normal text-[36px] sm:text-[50px] lg:text-[62px] leading-[1.05] tracking-[-0.025em] text-[#29251F]">
                  Smart Energy Microgrid &amp; Demand Forecasting
                </h1>

                <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.6] text-[#716A61] max-w-[50ch]">
                  Predictive 24-hour load forecasting, physical constraint validation, and dynamic storage dispatch.
                </p>

                {/* Primary Actions */}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onLaunchDashboard('workspace')}
                    className="h-11 px-6 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-white text-[14px] font-medium transition-colors cursor-pointer shadow-md"
                  >
                    Launch AI Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => onLaunchDashboard('demand-forecast')}
                    className="h-11 px-4 rounded-[6px] border border-[#DDD5C9] bg-white/85 hover:bg-white text-[14px] font-medium text-[#29251F] transition-colors cursor-pointer"
                  >
                    24h Load Horizon →
                  </button>
                </div>

                {/* Live Microgrid Benchmark Strip */}
                <div className="mt-7 pt-4 border-t border-[#DDD5C9]/60 grid grid-cols-3 gap-3">
                  <div>
                    <span className="font-mono-meta text-[10px] uppercase tracking-wider text-[#716A61] block">
                      Feeder Cap
                    </span>
                    <span className="text-[14px] font-semibold text-[#29251F] mt-0.5 block">
                      160 kW Soft
                    </span>
                  </div>
                  <div>
                    <span className="font-mono-meta text-[10px] uppercase tracking-wider text-[#716A61] block">
                      BESS Reserve
                    </span>
                    <span className="text-[14px] font-semibold text-emerald-700 mt-0.5 block">
                      82% SoC Floor
                    </span>
                  </div>
                  <div>
                    <span className="font-mono-meta text-[10px] uppercase tracking-wider text-[#716A61] block">
                      Active Mode
                    </span>
                    <span className="text-[14px] font-semibold text-amber-700 mt-0.5 block">
                      Storage Mode
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Clean Telemetry Preview Card (Hidden in Panoramic Mode) */}
              {heroMode === 'split' && (
                <div className="lg:col-span-5 lg:-ml-4 relative z-20">
                  <div className="bg-[#FCFAF6]/95 backdrop-blur-md border border-white/90 rounded-[12px] shadow-[0_20px_50px_rgba(41,37,31,0.12)] overflow-hidden">
                    {/* Window Header */}
                    <div className="px-5 py-3 bg-[#FFFFFF] border-b border-[#DDD5C9] flex items-center justify-between">
                      <div>
                        <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#754536] font-medium">
                          ANL-2026-104
                        </span>
                        <h2 className="text-[13px] font-semibold text-[#29251F]">
                          North Campus Feeder #04
                        </h2>
                      </div>
                      <div className="flex items-center gap-1 bg-[#F3EEE5] p-0.5 rounded-[6px] border border-[#DDD5C9]">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('curve')}
                          className={`px-2 py-0.5 rounded-[4px] font-mono-meta text-[10px] cursor-pointer transition-colors ${
                            previewTab === 'curve'
                              ? 'bg-[#FFFFFF] text-[#29251F] font-semibold shadow-xs'
                              : 'text-[#716A61]'
                          }`}
                        >
                          Load curve
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('factors')}
                          className={`px-2 py-0.5 rounded-[4px] font-mono-meta text-[10px] cursor-pointer transition-colors ${
                            previewTab === 'factors'
                              ? 'bg-[#FFFFFF] text-[#29251F] font-semibold shadow-xs'
                              : 'text-[#716A61]'
                          }`}
                        >
                          Factors
                        </button>
                      </div>
                    </div>

                    {/* Window Body */}
                    <div className="p-4 space-y-4">
                      {/* Metric Strip */}
                      <div className="grid grid-cols-3 border border-[#DDD5C9] rounded-[8px] bg-[#FFFFFF] divide-x divide-[#DDD5C9]">
                        <div className="p-2.5">
                          <span className="font-mono-meta text-[10px] text-[#716A61] block">
                            Peak Demand
                          </span>
                          <span className="font-serif-editorial text-lg font-semibold text-[#A43E35] tabular-nums block">
                            186.2 kW
                          </span>
                        </div>
                        <div className="p-2.5">
                          <span className="font-mono-meta text-[10px] text-[#716A61] block">
                            Mitigated
                          </span>
                          <span className="font-serif-editorial text-lg font-semibold text-[#35674A] tabular-nums block">
                            148.0 kW
                          </span>
                        </div>
                        <div className="p-2.5">
                          <span className="font-mono-meta text-[10px] text-[#716A61] block">
                            Uncertainty
                          </span>
                          <span className="font-mono-meta text-xs font-semibold text-[#29251F] tabular-nums mt-1 block">
                            ±6.4 kW
                          </span>
                        </div>
                      </div>

                      {/* Tab Content */}
                      {previewTab === 'curve' ? (
                        <div className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[8px] p-3">
                          <div className="flex items-center justify-between font-mono-meta text-[10px] text-[#716A61] mb-2">
                            <span>24-Hour Load Trajectory</span>
                            <span className="text-[#35674A]">● 38.2 kW BESS Shave</span>
                          </div>
                          <svg
                            viewBox="0 0 470 140"
                            className="w-full h-auto overflow-visible select-none"
                          >
                            <line x1="25" y1="55" x2="445" y2="55" stroke="#A43E35" strokeWidth="1" strokeDasharray="3 3" />
                            <text x="445" y="50" textAnchor="end" className="fill-[#A43E35] text-[9px] font-mono-meta">
                              160 kW Cap
                            </text>
                            <path
                              d="M 30,110 C 85,112 135,92 195,78 C 255,70 310,58 355,28 C 385,32 415,80 445,102"
                              fill="none"
                              stroke="#716A61"
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                            />
                            <path
                              d="M 30,110 C 85,112 135,96 195,86 C 255,76 310,68 355,60 C 385,64 415,84 445,100"
                              fill="none"
                              stroke="#754536"
                              strokeWidth="2.2"
                            />
                            <circle cx="355" cy="28" r="3" fill="#A43E35" />
                            <circle cx="355" cy="60" r="3.5" fill="#754536" />
                            <g className="fill-[#716A61] text-[9px] font-mono-meta" textAnchor="middle">
                              <text x="35" y="132">00:00</text>
                              <text x="140" y="132">08:00</text>
                              <text x="235" y="132">13:00</text>
                              <text x="355" y="132" className="fill-[#29251F] font-semibold">19:00</text>
                              <text x="435" y="132">23:00</text>
                            </g>
                          </svg>
                        </div>
                      ) : (
                        <div className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[8px] divide-y divide-[#DDD5C9] text-xs">
                          <div className="p-2.5 flex justify-between items-center">
                            <span className="font-medium text-[#29251F]">HVAC &amp; EV Coincidence</span>
                            <span className="font-mono-meta text-[#A43E35] font-semibold">+28.4 kW</span>
                          </div>
                          <div className="p-2.5 flex justify-between items-center">
                            <span className="font-medium text-[#29251F]">BESS Shaving Discharge</span>
                            <span className="font-mono-meta text-[#35674A] font-semibold">-38.2 kW</span>
                          </div>
                          <div className="p-2.5 flex justify-between items-center">
                            <span className="font-medium text-[#29251F]">Solar PV Self-Consumption</span>
                            <span className="font-mono-meta text-[#315B85] font-semibold">-24.0 kW</span>
                          </div>
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-mono-meta text-[11px] text-[#35674A]">
                          ● Schedule Approved
                        </span>
                        <button
                          type="button"
                          onClick={() => onLaunchDashboard('overview')}
                          className="font-medium text-[#754536] hover:underline cursor-pointer"
                        >
                          Open Dashboard →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 1: THREE CORE CAPABILITIES (MINIMAL & SLEEK) */}
        <section className="py-14 sm:py-18 bg-[#FCFAF6] border-b border-[#DDD5C9]">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1 */}
              <div className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[10px] p-6 flex flex-col justify-between hover:border-[#754536]/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between font-mono-meta text-xs text-[#754536] mb-3">
                    <span>01 / PREDICT</span>
                    <span className="text-[#716A61]">±6.4 kW accuracy</span>
                  </div>
                  <h3 className="font-serif-editorial text-[22px] text-[#29251F] mb-2">
                    24h Demand Horizon
                  </h3>
                  <p className="text-[14px] text-[#716A61] leading-relaxed">
                    Gradient Boosting model forecasting 15-minute load intervals with weather &amp; temperature integration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchDashboard('demand-forecast')}
                  className="mt-5 text-xs font-semibold text-[#754536] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View 24h Horizon →
                </button>
              </div>

              {/* Pillar 2 */}
              <div className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[10px] p-6 flex flex-col justify-between hover:border-[#754536]/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between font-mono-meta text-xs text-[#754536] mb-3">
                    <span>02 / TRANSITION</span>
                    <span className="text-emerald-700">Auto-switching</span>
                  </div>
                  <h3 className="font-serif-editorial text-[22px] text-[#29251F] mb-2">
                    Dynamic Dispatch Controller
                  </h3>
                  <p className="text-[14px] text-[#716A61] leading-relaxed">
                    Auto-switches to Renewable Storage Mode when demand exceeds 160 kW or during peak evening hours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchDashboard('microgrid-simulator')}
                  className="mt-5 text-xs font-semibold text-[#754536] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Test in Simulator →
                </button>
              </div>

              {/* Pillar 3 */}
              <div className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[10px] p-6 flex flex-col justify-between hover:border-[#754536]/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between font-mono-meta text-xs text-[#754536] mb-3">
                    <span>03 / AUDIT</span>
                    <span className="text-[#315B85]">Physical Guardrails</span>
                  </div>
                  <h3 className="font-serif-editorial text-[22px] text-[#29251F] mb-2">
                    Deterministic Validation
                  </h3>
                  <p className="text-[14px] text-[#716A61] leading-relaxed">
                    Transformer thermal ceilings, BESS reserve floors, and operator audit trail with cryptographic logging.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchDashboard('workspace')}
                  className="mt-5 text-xs font-semibold text-[#754536] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Open AI Workspace →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: LIVE TELEMETRY STATUS STRIP */}
        <section className="py-12 bg-[#F3EEE5] border-b border-[#DDD5C9]">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDD5C9] mb-5">
              <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#716A61]">
                Live Substation Status · North Campus District #04
              </span>
              <span className="flex items-center gap-1.5 font-mono-meta text-[11px] text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Telemetry Stream Connected
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[8px] p-4">
                <span className="font-mono-meta text-[11px] text-[#716A61] block">Solar PV Generation</span>
                <span className="text-xl font-semibold text-[#29251F] mt-1 block">88.6 kW</span>
                <span className="text-xs text-amber-700 font-mono-meta">845 W/m² Irradiance</span>
              </div>
              <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[8px] p-4">
                <span className="font-mono-meta text-[11px] text-[#716A61] block">Wind Turbine Infeed</span>
                <span className="text-xl font-semibold text-[#29251F] mt-1 block">24.5 kW</span>
                <span className="text-xs text-emerald-700 font-mono-meta">6.8 m/s baseload</span>
              </div>
              <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[8px] p-4">
                <span className="font-mono-meta text-[11px] text-[#716A61] block">Net Feeder Demand</span>
                <span className="text-xl font-semibold text-[#29251F] mt-1 block">148.0 kW</span>
                <span className="text-xs text-emerald-700 font-mono-meta">Under 160 kW Cap</span>
              </div>
              <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[8px] p-4">
                <span className="font-mono-meta text-[11px] text-[#716A61] block">BESS Storage Bank</span>
                <span className="text-xl font-semibold text-[#29251F] mt-1 block">82% SoC</span>
                <span className="text-xs text-[#754536] font-mono-meta">Discharging 38.2 kW</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: DIRECT ACCESS CTA */}
        <section className="py-12 bg-[#FCFAF6] border-b border-[#DDD5C9]">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-serif-editorial text-[26px] sm:text-[32px] text-[#29251F]">
                {currentUser
                  ? `Welcome, ${currentUser.fullName}. Ready to run load studies?`
                  : 'Ready to evaluate the smart microgrid engine?'}
              </h2>
              <p className="text-sm text-[#716A61] mt-1">
                Zero configuration required. Pre-loaded with North Campus feeder telemetry.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => onLaunchDashboard('overview')}
                    className="h-11 px-6 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    Open Dashboard
                  </button>
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="h-11 px-4 rounded-[6px] border border-[#DDD5C9] bg-white hover:bg-[#F3EEE5] text-[#A43E35] text-sm font-medium transition-colors cursor-pointer"
                    >
                      Sign out
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onLaunchDashboard('login')}
                    className="h-11 px-5 rounded-[6px] border border-[#DDD5C9] bg-white hover:bg-[#F3EEE5] text-[#29251F] text-sm font-medium transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => onLaunchDashboard('workspace')}
                    className="h-11 px-6 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    Launch Workspace
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* MINIMAL FOOTER */}
      <footer className="bg-[#F3EEE5] py-8">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#716A61]">
          <div className="flex items-center gap-2">
            <span className="font-serif-editorial text-base font-semibold text-[#29251F]">PRAVAAH</span>
            <span>· Smart Energy Microgrid &amp; Demand Forecasting</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => onLaunchDashboard('overview')}
              className="hover:text-[#29251F] cursor-pointer"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => onLaunchDashboard('demand-forecast')}
              className="hover:text-[#29251F] cursor-pointer"
            >
              Forecast
            </button>
            <button
              type="button"
              onClick={() => onLaunchDashboard('microgrid-simulator')}
              className="hover:text-[#29251F] cursor-pointer"
            >
              Simulator
            </button>
            <button
              type="button"
              onClick={() => onLaunchDashboard('workspace')}
              className="hover:text-[#29251F] cursor-pointer"
            >
              Workspace
            </button>
            {currentUser ? (
              <button
                type="button"
                onClick={onSignOut}
                className="text-[#A43E35] hover:underline cursor-pointer font-medium"
              >
                Sign out ({currentUser.fullName.split(' ')[0]})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onLaunchDashboard('login')}
                className="hover:text-[#29251F] cursor-pointer"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
