/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScreenId, AnalysisRecord, DecisionAuditEntry, UserSession } from './types';
import { INITIAL_ANALYSES } from './services/editorialAnalysisData';
import { ApiClient } from './services/apiClient';
import { LandingPage } from './components/LandingPage';
import { DashboardLayout } from './components/DashboardLayout';
import { OverviewScreen } from './components/OverviewScreen';
import { EditorialWorkspaceScreen } from './components/EditorialWorkspaceScreen';
import { EditorialResultsScreen } from './components/EditorialResultsScreen';
import { EditorialHistoryScreen } from './components/EditorialHistoryScreen';
import { AuthScreen, OnboardingScreen } from './components/AuthOnboardingScreens';
import { DemandForecastScreen } from './components/DemandForecastScreen';
import { SimulatorScreen } from './components/SimulatorScreen';
import { DecisionLabScreen } from './components/DecisionLabScreen';
import { AlertsEventsScreen } from './components/AlertsEventsScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { SettingsScreen } from './components/SettingsScreen';

const INITIAL_AUDIT_LOG: DecisionAuditEntry[] = [
  {
    id: 'AUD-8412',
    workspace: 'Editorial Report (ANL-2026-104)',
    screenId: 'results',
    decision: 'APPROVED',
    scheduleWindow: '17:00 – 21:00 Peak TOU ($0.42/kWh)',
    operatorNote:
      'Verified transformer thermal headroom and 20% BESS reserve floor before peak window.',
    inputSnapshot: 'North Campus · Interconnect #04 · Cap 160 kW',
    impactSummary: 'Peak 186.4 kW → 148.2 kW (−$342/day)',
    recommendedAction: 'Pre-charge BESS 11:00–15:30; discharge 38.2 kW 17:15–20:30',
    engineSource: 'gemini-3.8-flash',
    timestamp: '14:22 UTC',
  },
  {
    id: 'AUD-8390',
    workspace: 'AI Workspace (ANL-2026-103)',
    screenId: 'workspace',
    decision: 'SCHEDULED',
    scheduleWindow: '16:00 – 21:00 Critical Peak ($0.58/kWh)',
    operatorNote:
      'Flagged for facility engineer review prior to Lab Wing B chiller stage-down.',
    inputSnapshot: 'East Science Complex · Feeder #02 · Cap 175 kW',
    impactSummary: 'Peak 214.0 kW → 168.5 kW (−$485/day)',
    recommendedAction: 'Stage BESS 45.5 kW + 1.5°C HVAC deadband shift',
    engineSource: 'gemini-3.8-flash',
    timestamp: '11:05 UTC',
  },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('landing');
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>(INITIAL_ANALYSES);
  const [activeReportId, setActiveReportId] = useState<string>('ANL-2026-104');
  const [editingAnalysis, setEditingAnalysis] = useState<AnalysisRecord | null>(
    null
  );
  const [auditLog, setAuditLog] =
    useState<DecisionAuditEntry[]>(INITIAL_AUDIT_LOG);

  // Operator session persistence
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('gridmind_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSignIn = (user: UserSession) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('gridmind_user_session', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save session to localStorage', e);
    }
    setActiveScreen('overview');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('gridmind_user_session');
    } catch (e) {
      console.warn('Failed to clear session from localStorage', e);
    }
    setActiveScreen('landing');
  };

  // Sync initial state from backend API on mount
  useEffect(() => {
    ApiClient.getAnalyses().then((data) => {
      if (data && data.length > 0) setAnalyses(data);
    });
    ApiClient.getAuditLog().then((data) => {
      if (data && data.length > 0) setAuditLog(data);
    });
  }, []);

  const handleNavigate = (screen: ScreenId, reportId?: string) => {
    if (reportId) {
      setActiveReportId(reportId);
    }
    if (screen !== 'workspace') {
      setEditingAnalysis(null);
    }
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordDecision = (entry: DecisionAuditEntry) => {
    setAuditLog((prev) => [entry, ...prev]);
    ApiClient.recordDecision(entry).catch(() => {});
  };

  const handleSaveAnalysis = (record: AnalysisRecord) => {
    setAnalyses((prev) => {
      const exists = prev.some((a) => a.id === record.id);
      if (exists) {
        return prev.map((a) => (a.id === record.id ? record : a));
      }
      return [record, ...prev];
    });
    setActiveReportId(record.id);
    ApiClient.createAnalysis(record).catch(() => {});
  };

  const handleEditInWorkspace = (record: AnalysisRecord) => {
    setEditingAnalysis(record);
    setActiveScreen('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateAnalysis = (record: AnalysisRecord) => {
    const newId = `ANL-2026-${Math.floor(105 + Math.random() * 890)}`;
    const copy: AnalysisRecord = {
      ...record,
      id: newId,
      title: `${record.title} (Copy)`,
      createdAt: `Today · ${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })} UTC`,
      status: 'Draft',
      humanDecision: undefined,
    };
    setAnalyses((prev) => [copy, ...prev]);
    ApiClient.createAnalysis(copy).catch(() => {});
  };

  const handleDeleteAnalysis = (id: string) => {
    setAnalyses((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      if (activeReportId === id && remaining.length > 0) {
        setActiveReportId(remaining[0].id);
      }
      return remaining;
    });
    ApiClient.deleteAnalysis(id).catch(() => {});
  };

  // Public & Auth Flows
  if (activeScreen === 'landing') {
    return (
      <LandingPage
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onLaunchDashboard={(target, reportId) =>
          handleNavigate(target || 'overview', reportId)
        }
      />
    );
  }

  if (activeScreen === 'login' || activeScreen === 'signup') {
    return (
      <AuthScreen
        mode={activeScreen}
        onNavigate={handleNavigate}
        onSignIn={handleSignIn}
      />
    );
  }

  if (activeScreen === 'onboarding') {
    return <OnboardingScreen onNavigate={handleNavigate} />;
  }

  // Shared Application Shell (/app/*)
  return (
    <DashboardLayout
      activeScreen={activeScreen}
      activeReportId={activeReportId}
      onNavigate={handleNavigate}
      currentUser={currentUser}
      onSignOut={handleSignOut}
    >
      {activeScreen === 'overview' && (
        <OverviewScreen
          onNavigate={handleNavigate}
          analyses={analyses}
          auditLog={auditLog}
          onRecordDecision={handleRecordDecision}
          onSelectAnalysisForEdit={handleEditInWorkspace}
        />
      )}

      {activeScreen === 'workspace' && (
        <EditorialWorkspaceScreen
          initialRecord={editingAnalysis}
          onSaveAnalysis={handleSaveAnalysis}
          onRecordDecision={handleRecordDecision}
          onNavigate={handleNavigate}
        />
      )}

      {activeScreen === 'results' && (
        <EditorialResultsScreen
          analyses={analyses}
          activeReportId={activeReportId}
          onSelectReportId={setActiveReportId}
          onUpdateAnalysis={handleSaveAnalysis}
          onEditInWorkspace={handleEditInWorkspace}
          onRecordDecision={handleRecordDecision}
          onNavigate={handleNavigate}
        />
      )}

      {activeScreen === 'history' && (
        <EditorialHistoryScreen
          analyses={analyses}
          onNavigate={handleNavigate}
          onEditInWorkspace={handleEditInWorkspace}
          onDuplicateAnalysis={handleDuplicateAnalysis}
          onDeleteAnalysis={handleDeleteAnalysis}
        />
      )}

      {activeScreen === 'settings' && (
        <SettingsScreen
          onNavigate={handleNavigate}
          onRecordDecision={handleRecordDecision}
        />
      )}

      {activeScreen === 'demand-forecast' && (
        <DemandForecastScreen
          auditLog={auditLog}
          onRecordDecision={handleRecordDecision}
        />
      )}

      {activeScreen === 'microgrid-simulator' && (
        <SimulatorScreen
          onNavigate={handleNavigate}
          auditLog={auditLog}
          onRecordDecision={handleRecordDecision}
        />
      )}

      {activeScreen === 'decision-lab' && (
        <DecisionLabScreen
          onNavigate={handleNavigate}
          auditLog={auditLog}
          onRecordDecision={handleRecordDecision}
        />
      )}

      {activeScreen === 'alerts-and-events' && (
        <AlertsEventsScreen
          onNavigate={handleNavigate}
          auditLog={auditLog}
          onRecordDecision={handleRecordDecision}
        />
      )}

      {activeScreen === 'reports' && (
        <ReportsScreen
          auditLog={auditLog}
          onRecordDecision={handleRecordDecision}
        />
      )}
    </DashboardLayout>
  );
}
