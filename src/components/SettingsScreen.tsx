import React, { useState, useMemo } from 'react';
import { ScreenId, DecisionAuditEntry } from '../types';

interface SettingsScreenProps {
  onNavigate?: (screen: ScreenId) => void;
  onRecordDecision?: (entry: DecisionAuditEntry) => void;
}

interface SettingsState {
  // 1. Profile
  operatorName: string;
  operatorTitle: string;
  operatorEmail: string;
  substationCallsign: string;
  // 2. Preferences
  defaultModel: 'gemini-3.8-flash' | 'deterministic-solver';
  defaultFeederCapKw: number;
  defaultReserveFloorPct: number;
  timezoneDisplay: string;
  // 3. Security
  requireDualSignoffOverKw: number;
  sessionTimeoutMinutes: number;
  enforceImmutableAuditNote: boolean;
  // 4. Integrations
  scadaEndpointUrl: string;
  weatherFeedEnabled: boolean;
  utilityTariffSyncEnabled: boolean;
  // 5. Data Controls
  telemetryRetentionDays: string;
  includeIllustrativeTagOnExports: boolean;
}

const INITIAL_SETTINGS: SettingsState = {
  operatorName: 'Elena Vance',
  operatorTitle: 'Lead Grid Architect',
  operatorEmail: 'e.vance@northcampus-grid.org',
  substationCallsign: 'NC-FEEDER-04',
  defaultModel: 'gemini-3.8-flash',
  defaultFeederCapKw: 160,
  defaultReserveFloorPct: 20,
  timezoneDisplay: 'UTC-05:00 (Eastern Operational Standard)',
  requireDualSignoffOverKw: 50,
  sessionTimeoutMinutes: 60,
  enforceImmutableAuditNote: true,
  scadaEndpointUrl: 'wss://scada-gateway.northcampus.internal:8443/dnp3',
  weatherFeedEnabled: true,
  utilityTariffSyncEnabled: true,
  telemetryRetentionDays: '365 days (Compliance Standard)',
  includeIllustrativeTagOnExports: true,
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onRecordDecision,
}) => {
  const [savedSettings, setSavedSettings] =
    useState<SettingsState>(INITIAL_SETTINGS);
  const [draft, setDraft] = useState<SettingsState>(INITIAL_SETTINGS);
  const [activeSection, setActiveSection] = useState<
    'all' | 'profile' | 'preferences' | 'security' | 'integrations' | 'data'
  >('all');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Inline validation checks
  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!draft.operatorName.trim()) {
      errs.operatorName = 'Operator name is required for audit sign-offs.';
    }
    if (
      !draft.operatorEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.operatorEmail.trim())
    ) {
      errs.operatorEmail = 'Enter a valid institutional email address.';
    }
    if (draft.defaultFeederCapKw < 40 || draft.defaultFeederCapKw > 1000) {
      errs.defaultFeederCapKw =
        'Default feeder cap must be between 40 kW and 1,000 kW.';
    }
    if (
      draft.defaultReserveFloorPct < 10 ||
      draft.defaultReserveFloorPct > 60
    ) {
      errs.defaultReserveFloorPct =
        'BESS reserve floor must remain between 10% and 60% SoC.';
    }
    return errs;
  }, [draft]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(savedSettings);
  }, [draft, savedSettings]);

  const hasErrors = Object.keys(validationErrors).length > 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;

    setSavedSettings(draft);
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (onRecordDecision) {
      onRecordDecision({
        id: `CFG-${Math.floor(1000 + Math.random() * 9000)}`,
        workspace: 'Workspace Settings',
        screenId: 'settings',
        decision: 'APPROVED',
        scheduleWindow: 'Immediate Workspace Policy',
        operatorNote: `Updated workspace defaults (Cap ${draft.defaultFeederCapKw} kW, Reserve floor ${draft.defaultReserveFloorPct}%).`,
        inputSnapshot: `${draft.operatorName} · ${draft.substationCallsign}`,
        impactSummary: `Default engine: ${draft.defaultModel}`,
        recommendedAction: 'Apply updated physical & governance bounds',
        engineSource: draft.defaultModel,
        timestamp: nowTime,
      });
    }

    setSaveToast(
      `Saved configuration changes at ${nowTime}. Governance ledger updated.`
    );
    setTimeout(() => {
      setSaveToast(null);
    }, 4500);
  };

  const handleDiscard = () => {
    setDraft(savedSettings);
    setSaveToast('Discarded unsaved edits and restored active configuration.');
    setTimeout(() => {
      setSaveToast(null);
    }, 3500);
  };

  const showSec = (
    sec: 'profile' | 'preferences' | 'security' | 'integrations' | 'data'
  ) => activeSection === 'all' || activeSection === sec;

  return (
    <div className="space-y-8 pb-20">
      {/* SAVE CONFIRMATION TOAST */}
      {saveToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#29251F] text-[#FCFAF6] border border-[#35674A] rounded-[8px] px-4 py-3 shadow-lg flex items-center gap-3"
        >
          <span className="w-2 h-2 rounded-full bg-[#35674A]" />
          <span className="text-[13px]">{saveToast}</span>
        </div>
      )}

      {/* UNSAVED CHANGES STICKY BANNER */}
      {hasUnsavedChanges && (
        <div
          role="region"
          aria-label="Unsaved changes notification"
          className="sticky top-16 z-30 bg-[#29251F] text-[#FCFAF6] border border-[#754536] rounded-[8px] p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#754536] shrink-0" />
            <div>
              <div className="text-[14px] font-medium">
                You have unsaved configuration changes
              </div>
              <div className="text-[12px] text-[#B6BFA6]">
                {hasErrors
                  ? 'Please resolve inline validation errors before saving.'
                  : 'Review your modifications and save to apply across future workspace studies.'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDiscard}
              className="h-9 px-3.5 rounded-[6px] border border-[#DDD5C9]/30 text-[#FCFAF6] hover:bg-[#FFFFFF]/10 text-[13px] cursor-pointer"
            >
              Discard changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={hasErrors}
              className="h-9 px-4 rounded-[6px] bg-[#754536] hover:bg-[#61372B] disabled:opacity-40 text-[#FFFFFF] text-[13px] font-medium cursor-pointer"
            >
              Save settings
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DDD5C9]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
              05 / WORKSPACE & GOVERNANCE CONFIGURATION
            </span>
          </div>
          <h1 className="font-serif-editorial text-[32px] sm:text-[40px] leading-[1.12] text-[#29251F]">
            Settings & system controls
          </h1>
          <p className="text-[15px] text-[#716A61] mt-1.5 max-w-2xl">
            Manage operator attribution, default physical transformer limits, security sign-off rules, SCADA telemetry endpoints, and data retention policies.
          </p>
        </div>

        {/* Section Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All sections' },
              { id: 'profile', label: 'Profile' },
              { id: 'preferences', label: 'Preferences' },
              { id: 'security', label: 'Security' },
              { id: 'integrations', label: 'Integrations' },
              { id: 'data', label: 'Data controls' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`h-9 px-3 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-[#29251F] text-[#FCFAF6]'
                  : 'bg-[#FCFAF6] border border-[#DDD5C9] text-[#716A61] hover:text-[#29251F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8" noValidate>
        {/* SECTION 1: PROFILE */}
        {showSec('profile') && (
          <section className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-2">
              <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
                01 / PROFILE
              </div>
              <h2 className="font-serif-editorial text-[24px] text-[#29251F]">
                Operator identity
              </h2>
              <p className="text-[13px] text-[#716A61] leading-[1.6]">
                Used to attribute human-in-the-loop dispatch approvals and exported editorial dossiers.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="set-operator-name"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Full name
                </label>
                <input
                  id="set-operator-name"
                  type="text"
                  value={draft.operatorName}
                  onChange={(e) =>
                    setDraft({ ...draft, operatorName: e.target.value })
                  }
                  aria-invalid={!!validationErrors.operatorName}
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F]"
                />
                {validationErrors.operatorName && (
                  <p className="mt-1 text-[12px] text-[#A43E35]" role="alert">
                    {validationErrors.operatorName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="set-operator-title"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Operational role / title
                </label>
                <input
                  id="set-operator-title"
                  type="text"
                  value={draft.operatorTitle}
                  onChange={(e) =>
                    setDraft({ ...draft, operatorTitle: e.target.value })
                  }
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F]"
                />
              </div>

              <div>
                <label
                  htmlFor="set-operator-email"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Institutional email
                </label>
                <input
                  id="set-operator-email"
                  type="email"
                  value={draft.operatorEmail}
                  onChange={(e) =>
                    setDraft({ ...draft, operatorEmail: e.target.value })
                  }
                  aria-invalid={!!validationErrors.operatorEmail}
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F]"
                />
                {validationErrors.operatorEmail && (
                  <p className="mt-1 text-[12px] text-[#A43E35]" role="alert">
                    {validationErrors.operatorEmail}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="set-callsign"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Primary substation callsign
                </label>
                <input
                  id="set-callsign"
                  type="text"
                  value={draft.substationCallsign}
                  onChange={(e) =>
                    setDraft({ ...draft, substationCallsign: e.target.value })
                  }
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[14px] text-[#29251F]"
                />
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: PREFERENCES */}
        {showSec('preferences') && (
          <section className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-2">
              <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
                02 / PREFERENCES
              </div>
              <h2 className="font-serif-editorial text-[24px] text-[#29251F]">
                Workspace & physics defaults
              </h2>
              <p className="text-[13px] text-[#716A61] leading-[1.6]">
                Pre-populate new AI workspace studies with your standard transformer rating and battery reserve floor.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="set-default-model"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Default synthesis engine
                </label>
                <select
                  id="set-default-model"
                  value={draft.defaultModel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      defaultModel: e.target.value as
                        | 'gemini-3.8-flash'
                        | 'deterministic-solver',
                    })
                  }
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F]"
                >
                  <option value="gemini-3.8-flash">
                    Gemini 3.8 Flash + Physics Solver
                  </option>
                  <option value="deterministic-solver">
                    Deterministic Load Solver Only
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="set-timezone"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Telemetry timestamp reference
                </label>
                <select
                  id="set-timezone"
                  value={draft.timezoneDisplay}
                  onChange={(e) =>
                    setDraft({ ...draft, timezoneDisplay: e.target.value })
                  }
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F]"
                >
                  <option value="UTC-05:00 (Eastern Operational Standard)">
                    UTC-05:00 (Eastern Operational Standard)
                  </option>
                  <option value="UTC+00:00 (ISO Co-ordinated Universal Time)">
                    UTC+00:00 (ISO Co-ordinated Universal Time)
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="set-feeder-cap"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Default feeder continuous cap (kW)
                </label>
                <input
                  id="set-feeder-cap"
                  type="number"
                  min={40}
                  max={1000}
                  value={draft.defaultFeederCapKw}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      defaultFeederCapKw: Number(e.target.value),
                    })
                  }
                  aria-invalid={!!validationErrors.defaultFeederCapKw}
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[14px] text-[#29251F]"
                />
                {validationErrors.defaultFeederCapKw && (
                  <p className="mt-1 text-[12px] text-[#A43E35]" role="alert">
                    {validationErrors.defaultFeederCapKw}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="set-reserve-floor"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Default BESS emergency reserve floor (%)
                </label>
                <input
                  id="set-reserve-floor"
                  type="number"
                  min={10}
                  max={60}
                  value={draft.defaultReserveFloorPct}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      defaultReserveFloorPct: Number(e.target.value),
                    })
                  }
                  aria-invalid={!!validationErrors.defaultReserveFloorPct}
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[14px] text-[#29251F]"
                />
                {validationErrors.defaultReserveFloorPct && (
                  <p className="mt-1 text-[12px] text-[#A43E35]" role="alert">
                    {validationErrors.defaultReserveFloorPct}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: SECURITY */}
        {showSec('security') && (
          <section className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-2">
              <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
                03 / SECURITY & GOVERNANCE
              </div>
              <h2 className="font-serif-editorial text-[24px] text-[#29251F]">
                Dispatch authorization controls
              </h2>
              <p className="text-[13px] text-[#716A61] leading-[1.6]">
                Enforce human verification thresholds before high-power battery schedules can be committed.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="set-dual-signoff"
                    className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                  >
                    Secondary review threshold (BESS dispatch kW)
                  </label>
                  <input
                    id="set-dual-signoff"
                    type="number"
                    value={draft.requireDualSignoffOverKw}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        requireDualSignoffOverKw: Number(e.target.value),
                      })
                    }
                    className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[14px] text-[#29251F]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-session-timeout"
                    className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                  >
                    Idle operator session timeout (minutes)
                  </label>
                  <input
                    id="set-session-timeout"
                    type="number"
                    value={draft.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sessionTimeoutMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[14px] text-[#29251F]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-[8px] bg-[#FFFFFF] border border-[#DDD5C9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.enforceImmutableAuditNote}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      enforceImmutableAuditNote: e.target.checked,
                    })
                  }
                  className="mt-1 accent-[#754536]"
                />
                <span className="text-[13px] text-[#29251F] leading-[1.55]">
                  <strong>Require written operator rationale on all decisions:</strong> Prevent blank approvals or holds when signing off on an editorial report.
                </span>
              </label>
            </div>
          </section>
        )}

        {/* SECTION 4: INTEGRATIONS */}
        {showSec('integrations') && (
          <section className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-2">
              <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
                04 / INTEGRATIONS
              </div>
              <h2 className="font-serif-editorial text-[24px] text-[#29251F]">
                Telemetry & tariff feeds
              </h2>
              <p className="text-[13px] text-[#716A61] leading-[1.6]">
                Configure external gateway endpoints used for feeder load ingestion and solar irradiance curves.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div>
                <label
                  htmlFor="set-scada-url"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  SCADA / DNP3 gateway endpoint (read-only telemetry)
                </label>
                <input
                  id="set-scada-url"
                  type="text"
                  value={draft.scadaEndpointUrl}
                  onChange={(e) =>
                    setDraft({ ...draft, scadaEndpointUrl: e.target.value })
                  }
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] font-mono-meta text-[13px] text-[#29251F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-4 rounded-[8px] bg-[#FFFFFF] border border-[#DDD5C9] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.weatherFeedEnabled}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        weatherFeedEnabled: e.target.checked,
                      })
                    }
                    className="mt-1 accent-[#754536]"
                  />
                  <span className="text-[13px] text-[#29251F]">
                    <strong className="block">Solar irradiance feed</strong>
                    <span className="text-[#716A61] text-[12px]">
                      Ingest 15-min cloud-cover attenuation into PV forecasts.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-[8px] bg-[#FFFFFF] border border-[#DDD5C9] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.utilityTariffSyncEnabled}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        utilityTariffSyncEnabled: e.target.checked,
                      })
                    }
                    className="mt-1 accent-[#754536]"
                  />
                  <span className="text-[13px] text-[#29251F]">
                    <strong className="block">Utility TOU tariff sync</strong>
                    <span className="text-[#716A61] text-[12px]">
                      Automatically flag Critical Peak Pricing (CPP) alerts.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: DATA CONTROLS */}
        {showSec('data') && (
          <section className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-2">
              <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
                05 / DATA CONTROLS
              </div>
              <h2 className="font-serif-editorial text-[24px] text-[#29251F]">
                Retention & transparency labels
              </h2>
              <p className="text-[13px] text-[#716A61] leading-[1.6]">
                Control archive retention windows and ensure illustrative demo studies are explicitly labeled in exports.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div>
                <label
                  htmlFor="set-retention"
                  className="block text-[13px] font-medium text-[#29251F] mb-1.5"
                >
                  Analysis dossier & audit log retention window
                </label>
                <select
                  id="set-retention"
                  value={draft.telemetryRetentionDays}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      telemetryRetentionDays: e.target.value,
                    })
                  }
                  className="w-full h-11 px-3.5 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F]"
                >
                  <option value="90 days (Standard Operational)">
                    90 days (Standard Operational)
                  </option>
                  <option value="365 days (Compliance Standard)">
                    365 days (Compliance Standard)
                  </option>
                  <option value="7 years (NERC / Institutional Archive)">
                    7 years (NERC / Institutional Archive)
                  </option>
                </select>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-[8px] bg-[#FFFFFF] border border-[#DDD5C9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.includeIllustrativeTagOnExports}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      includeIllustrativeTagOnExports: e.target.checked,
                    })
                  }
                  className="mt-1 accent-[#754536]"
                />
                <span className="text-[13px] text-[#29251F] leading-[1.55]">
                  <strong>Stamp exported reports with Illustrative Demo provenance when using sample telemetry:</strong> Ensures downstream stakeholders never mistake simulated benchmarks for live utility billing records.
                </span>
              </label>
            </div>
          </section>
        )}

        {/* FORM FOOTER */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDD5C9]">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges}
            className="h-11 px-4 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] disabled:opacity-40 text-[#29251F] text-[13px] font-medium cursor-pointer"
          >
            Reset to saved
          </button>
          <button
            type="submit"
            disabled={!hasUnsavedChanges || hasErrors}
            className="h-11 px-6 rounded-[6px] bg-[#754536] hover:bg-[#61372B] disabled:opacity-40 text-[#FFFFFF] text-[14px] font-medium transition-colors cursor-pointer"
          >
            Save configuration
          </button>
        </div>
      </form>
    </div>
  );
};
export default SettingsScreen;
