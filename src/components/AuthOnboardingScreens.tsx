import React, { useState } from 'react';
import { ScreenId, UserSession } from '../types';

interface AuthScreenProps {
  mode: 'login' | 'signup';
  onNavigate: (screen: ScreenId) => void;
  onSignIn?: (user: UserSession) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ mode, onNavigate, onSignIn }) => {
  const [authView, setAuthView] = useState<'login' | 'signup' | 'recovery'>(mode);
  const [fullName, setFullName] = useState('Elena Vance');
  const [organization, setOrganization] = useState('North Campus Energy District');
  const [email, setEmail] = useState('e.vance@northcampus-grid.org');
  const [password, setPassword] = useState('Pravaah#2026');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  const validateFields = () => {
    let valid = true;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Enter a valid operator or institutional email address.');
      valid = false;
    } else {
      setEmailError(null);
    }

    if (authView !== 'recovery') {
      if (!password || password.length < 8) {
        setPasswordError('Password must be at least 8 characters long.');
        valid = false;
      } else {
        setPasswordError(null);
      }
    }

    if (authView === 'signup') {
      if (!fullName.trim()) {
        setNameError('Operator full name is required.');
        valid = false;
      } else {
        setNameError(null);
      }
    }

    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (authView === 'recovery') {
        setRecoverySent(true);
      } else {
        const userObj: UserSession = {
          fullName: authView === 'signup' ? fullName : (fullName || 'Elena Vance'),
          email: email.trim(),
          role: 'Lead Grid Architect',
          organization: organization.trim() || 'North Campus Energy District',
          token: 'jwt_mock_token_gridmind_2026',
        };
        if (onSignIn) {
          onSignIn(userObj);
        } else {
          onNavigate('overview');
        }
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#F3EEE5] text-[#29251F] flex flex-col justify-between bg-energy-watermark relative">
      {/* Top Bar */}
      <header className="border-b border-[#DDD5C9] bg-[#F3EEE5]/90 backdrop-blur-sm relative z-10">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 h-16 flex items-center justify-between">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#754536]" />
            <span className="font-serif-editorial text-[20px] tracking-tight text-[#29251F]">
              PRAVAAH
            </span>
            <span className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#716A61] hidden sm:inline">
              · SMART ENERGY INTELLIGENCE
            </span>
          </button>

          <div className="flex items-center gap-4 text-[13px]">
            <button
              onClick={() => onNavigate('landing')}
              className="text-[#716A61] hover:text-[#29251F] cursor-pointer"
            >
              ← Return to publication
            </button>
            <button
              onClick={() => onNavigate('overview')}
              className="h-9 px-3.5 rounded-[6px] border border-[#DDD5C9] bg-[#FCFAF6] hover:bg-[#FFFFFF] text-[#29251F] font-medium cursor-pointer"
            >
              Explore demo app
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Editorial Auth Container */}
      <main className="max-w-[1100px] w-full mx-auto px-5 sm:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left 5 Columns: Minimal Editorial Context */}
        <div className="lg:col-span-5 space-y-5 pr-0 lg:pr-4">
          <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
            {authView === 'login'
              ? 'OPERATOR AUTHENTICATION'
              : authView === 'signup'
              ? 'OPERATOR PROVISIONING'
              : 'CREDENTIAL RECOVERY'}
          </div>
          <h1 className="font-serif-editorial text-[32px] sm:text-[42px] leading-[1.1] text-[#29251F]">
            {authView === 'login'
              ? 'Operator Sign In'
              : authView === 'signup'
              ? 'Create Account'
              : 'Reset Password'}
          </h1>
          <p className="text-[14px] leading-relaxed text-[#716A61]">
            Access the dispatch intelligence desk, load studies, and PLC schedule approval.
          </p>

          <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[8px] p-4 space-y-2">
            <div className="flex items-center gap-2 font-mono-meta text-[11px] text-[#29251F] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>NORTH CAMPUS FEEDER #04</span>
            </div>
            <p className="text-xs text-[#716A61]">
              Pre-loaded demo operator profile for instant evaluation.
            </p>
          </div>
        </div>

        {/* Right 7 Columns: Paper Form Surface */}
        <div className="lg:col-span-7">
          <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-9 shadow-sm space-y-6">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between border-b border-[#DDD5C9] pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setRecoverySent(false);
                  }}
                  className={`h-9 px-3.5 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer ${
                    authView === 'login'
                      ? 'bg-[#29251F] text-[#FCFAF6]'
                      : 'text-[#716A61] hover:text-[#29251F]'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('signup');
                    setRecoverySent(false);
                  }}
                  className={`h-9 px-3.5 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer ${
                    authView === 'signup'
                      ? 'bg-[#29251F] text-[#FCFAF6]'
                      : 'text-[#716A61] hover:text-[#29251F]'
                  }`}
                >
                  Create account
                </button>
              </div>
              <span className="font-mono-meta text-[11px] text-[#716A61]">
                TLS 1.3 · RBAC
              </span>
            </div>

            {authView === 'recovery' && recoverySent ? (
              <div className="bg-[#FFFFFF] border border-[#35674A] rounded-[8px] p-5 space-y-4">
                <div className="font-mono-meta text-[11px] uppercase tracking-[0.12em] text-[#35674A]">
                  RECOVERY DISPATCHED
                </div>
                <h2 className="font-serif-editorial text-[24px] text-[#29251F]">
                  Check your institutional inbox
                </h2>
                <p className="text-[14px] text-[#716A61] leading-[1.6]">
                  We sent a single-use cryptographic reset link to{' '}
                  <strong className="text-[#29251F]">{email}</strong>. The link expires in 15 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setRecoverySent(false);
                  }}
                  className="h-10 px-4 rounded-[6px] bg-[#754536] text-[#FFFFFF] text-[13px] font-medium cursor-pointer"
                >
                  Return to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {authView === 'signup' && (
                  <>
                    <div>
                      <label
                        htmlFor="auth-full-name"
                        className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                      >
                        Full name & engineering title
                      </label>
                      <input
                        id="auth-full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (nameError) setNameError(null);
                        }}
                        aria-invalid={!!nameError}
                        className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F] focus:outline-none focus:border-[#754536]"
                      />
                      {nameError && (
                        <p className="mt-1 text-[12px] text-[#A43E35]" role="alert">
                          {nameError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="auth-organization"
                        className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                      >
                        Microgrid facility or utility organization
                      </label>
                      <input
                        id="auth-organization"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F] focus:outline-none focus:border-[#754536]"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                  >
                    Work email address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'auth-email-error' : undefined}
                    className={`w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border text-[14px] text-[#29251F] focus:outline-none ${
                      emailError
                        ? 'border-[#A43E35]'
                        : 'border-[#DDD5C9] focus:border-[#754536]'
                    }`}
                  />
                  {emailError && (
                    <p
                      id="auth-email-error"
                      className="mt-1 text-[12px] text-[#A43E35]"
                      role="alert"
                    >
                      {emailError}
                    </p>
                  )}
                </div>

                {authView !== 'recovery' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="auth-password"
                        className="text-[13px] font-medium text-[#29251F]"
                      >
                        Password
                      </label>
                      {authView === 'login' && (
                        <button
                          type="button"
                          onClick={() => setAuthView('recovery')}
                          className="text-[12px] text-[#754536] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError(null);
                        }}
                        aria-invalid={!!passwordError}
                        aria-describedby={
                          passwordError ? 'auth-password-error' : undefined
                        }
                        className={`w-full h-11 pl-3.5 pr-16 rounded-[6px] bg-[#FFFFFF] border text-[14px] text-[#29251F] focus:outline-none ${
                          passwordError
                            ? 'border-[#A43E35]'
                            : 'border-[#DDD5C9] focus:border-[#754536]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 font-mono-meta text-[11px] uppercase tracking-wider text-[#716A61] hover:text-[#29251F] cursor-pointer"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passwordError && (
                      <p
                        id="auth-password-error"
                        className="mt-1 text-[12px] text-[#A43E35]"
                        role="alert"
                      >
                        {passwordError}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-[6px] bg-[#754536] hover:bg-[#61372B] disabled:opacity-60 text-[#FFFFFF] text-[14px] font-medium transition-colors cursor-pointer"
                  >
                    {isSubmitting
                      ? 'Verifying credentials...'
                      : authView === 'login'
                      ? 'Sign in to workspace'
                      : authView === 'signup'
                      ? 'Continue to 3-step onboarding →'
                      : 'Send recovery link'}
                  </button>

                  {authView !== 'recovery' && (
                    <button
                      type="button"
                      onClick={() => {
                        const demoUser: UserSession = {
                          fullName: 'Elena Vance',
                          email: 'e.vance@northcampus-grid.org',
                          role: 'Lead Grid Architect',
                          organization: 'North Campus Energy District',
                          token: 'jwt_mock_token_gridmind_2026',
                        };
                        if (onSignIn) {
                          onSignIn(demoUser);
                        } else {
                          onNavigate('overview');
                        }
                      }}
                      className="w-full h-11 rounded-[6px] border border-[#DDD5C9] bg-white hover:bg-[#F3EEE5] text-[#29251F] text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Instant Demo Sign In (Elena Vance)</span>
                    </button>
                  )}

                  {authView === 'recovery' && (
                    <button
                      type="button"
                      onClick={() => setAuthView('login')}
                      className="w-full h-10 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] text-[#29251F] text-[13px] cursor-pointer"
                    >
                      Cancel & return to sign in
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="border-t border-[#DDD5C9] py-5 text-center font-mono-meta text-[11px] text-[#716A61]">
        PRAVAAH SMART ENERGY SYSTEMS · ILLUSTRATIVE DEMO ENVIRONMENT
      </footer>
    </div>
  );
};

interface OnboardingScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [facilityName, setFacilityName] = useState('North Campus Interconnect #04');
  const [feederRatingKw, setFeederRatingKw] = useState(160);
  const [bessCapacityKwh, setBessCapacityKwh] = useState(250);
  const [reserveFloorPct, setReserveFloorPct] = useState(20);
  const [tariffStructure, setTariffStructure] = useState(
    '17:00 – 21:00 Peak TOU ($0.42/kWh)'
  );
  const [requireHumanApproval, setRequireHumanApproval] = useState(true);

  return (
    <div className="min-h-screen bg-[#F3EEE5] text-[#29251F] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[#DDD5C9] bg-[#F3EEE5]">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#754536]" />
            <span className="font-serif-editorial text-[20px] text-[#29251F]">
              PRAVAAH
            </span>
            <span className="text-[#DDD5C9]">/</span>
            <span className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
              WORKSPACE ONBOARDING
            </span>
          </div>

          <button
            onClick={() => onNavigate('workspace')}
            className="text-[13px] font-mono-meta text-[#716A61] hover:text-[#29251F] cursor-pointer"
          >
            Skip setup → Open AI workspace
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[820px] w-full mx-auto px-5 sm:px-8 py-10 space-y-8">
        {/* Progress Indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono-meta text-[11px] uppercase tracking-[0.14em]">
            <span className="text-[#754536]">STEP 0{step} OF 03</span>
            <span className="text-[#716A61]">
              {step === 1
                ? 'SUBSTATION FEEDER BOUNDARIES'
                : step === 2
                ? 'BATTERY STORAGE & TARIFF SCHEDULE'
                : 'HUMAN GOVERNANCE & LAUNCH'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-colors ${
                  s <= step ? 'bg-[#754536]' : 'bg-[#DDD5C9]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Card */}
        <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-10 space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <h1 className="font-serif-editorial text-[30px] sm:text-[36px] leading-[1.12] text-[#29251F]">
                  Define your primary substation feeder
                </h1>
                <p className="text-[15px] text-[#716A61] leading-[1.6]">
                  Configure the physical transformer limit that anchors every peak-shaving study in your workspace.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                <div>
                  <label
                    htmlFor="onboard-facility"
                    className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                  >
                    Substation zone or interconnect identifier
                  </label>
                  <input
                    id="onboard-facility"
                    type="text"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F] focus:outline-none focus:border-[#754536]"
                  />
                  <p className="mt-1.5 text-[12px] text-[#716A61]">
                    <strong>Why this matters:</strong> Tags each editorial report and audit log entry with the exact physical meter boundary.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="onboard-feeder-cap"
                    className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                  >
                    Continuous transformer feeder limit (kW)
                  </label>
                  <input
                    id="onboard-feeder-cap"
                    type="number"
                    min={50}
                    max={1000}
                    value={feederRatingKw}
                    onChange={(e) => setFeederRatingKw(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[14px] text-[#29251F] focus:outline-none focus:border-[#754536]"
                  />
                  <p className="mt-1.5 text-[12px] text-[#716A61]">
                    <strong>Why this matters:</strong> The synthesis engine flags any hour where unmitigated demand exceeds this thermal rating.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <h1 className="font-serif-editorial text-[30px] sm:text-[36px] leading-[1.12] text-[#29251F]">
                  Calibrate storage reserve & tariff window
                </h1>
                <p className="text-[15px] text-[#716A61] leading-[1.6]">
                  Set your minimum battery state-of-charge (SoC) floor and primary time-of-use tariff schedule.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="onboard-bess-kwh"
                      className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                    >
                      Usable BESS capacity (kWh)
                    </label>
                    <input
                      id="onboard-bess-kwh"
                      type="number"
                      value={bessCapacityKwh}
                      onChange={(e) => setBessCapacityKwh(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[14px] text-[#29251F]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-reserve-floor"
                      className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                    >
                      Emergency SoC reserve floor (%)
                    </label>
                    <input
                      id="onboard-reserve-floor"
                      type="number"
                      min={10}
                      max={50}
                      value={reserveFloorPct}
                      onChange={(e) => setReserveFloorPct(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[14px] text-[#29251F]"
                    />
                  </div>
                </div>
                <p className="text-[12px] text-[#716A61]">
                  <strong>Why this matters:</strong> Prevents automated peak-shaving schedules from depleting backup reserves required for critical loads.
                </p>

                <div>
                  <label
                    htmlFor="onboard-tariff"
                    className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                  >
                    Primary utility peak tariff window
                  </label>
                  <select
                    id="onboard-tariff"
                    value={tariffStructure}
                    onChange={(e) => setTariffStructure(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F]"
                  >
                    <option value="17:00 – 21:00 Peak TOU ($0.42/kWh)">
                      17:00 – 21:00 Peak TOU ($0.42/kWh)
                    </option>
                    <option value="16:00 – 21:00 Critical Peak ($0.58/kWh)">
                      16:00 – 21:00 Critical Peak ($0.58/kWh)
                    </option>
                    <option value="14:00 – 20:00 Industrial Demand Ratchet">
                      14:00 – 20:00 Industrial Demand Ratchet
                    </option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <h1 className="font-serif-editorial text-[30px] sm:text-[36px] leading-[1.12] text-[#29251F]">
                  Review baseline & human sign-off policy
                </h1>
                <p className="text-[15px] text-[#716A61] leading-[1.6]">
                  Confirm your default workspace parameters before entering the AI dispatch study environment.
                </p>
              </div>

              <div className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[8px] p-5 space-y-3 font-mono-meta text-[12px]">
                <div className="flex justify-between py-1 border-b border-[#DDD5C9]">
                  <span className="text-[#716A61]">INTERCONNECT ZONE:</span>
                  <span className="text-[#29251F]">{facilityName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DDD5C9]">
                  <span className="text-[#716A61]">CONTINUOUS FEEDER CAP:</span>
                  <span className="text-[#29251F]">{feederRatingKw} kW</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DDD5C9]">
                  <span className="text-[#716A61]">BESS CAPACITY & FLOOR:</span>
                  <span className="text-[#29251F]">
                    {bessCapacityKwh} kWh (Min {reserveFloorPct}% SoC)
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#716A61]">DEFAULT TARIFF WINDOW:</span>
                  <span className="text-[#29251F]">{tariffStructure}</span>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-[8px] bg-[#F3EEE5] border border-[#DDD5C9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireHumanApproval}
                  onChange={(e) => setRequireHumanApproval(e.target.checked)}
                  className="mt-1 accent-[#754536]"
                />
                <span className="text-[13px] leading-[1.55] text-[#29251F]">
                  <strong>Enforce human-in-the-loop sign-off:</strong> Require explicit operator confirmation before any synthesized battery schedule is marked Approved.
                </span>
              </label>
            </>
          )}

          {/* Footer Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[#DDD5C9]">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="h-11 px-4 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] text-[#29251F] text-[13px] font-medium cursor-pointer"
                >
                  ← Previous step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('overview')}
                  className="h-11 px-4 rounded-[6px] text-[#716A61] hover:text-[#29251F] text-[13px] cursor-pointer"
                >
                  Skip for now
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                  className="h-11 px-6 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-[14px] font-medium transition-colors cursor-pointer"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('workspace')}
                  className="h-11 px-6 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-[14px] font-medium transition-colors cursor-pointer"
                >
                  Launch AI workspace →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#DDD5C9] py-5 text-center font-mono-meta text-[11px] text-[#716A61]">
        STEP {step} OF 3 · PARAMETERS CAN BE MODIFIED ANYTIME IN /APP/SETTINGS
      </footer>
    </div>
  );
};
