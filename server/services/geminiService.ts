import { GoogleGenAI, Type } from '@google/genai';
import type { WorkspaceAnalysisRequest, WorkspaceAnalysisResponse } from '../types/backendTypes.ts';
import { PhysicsSolver } from './physicsSolver.ts';

const apiKey = process.env.GEMINI_API_KEY;
const isConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');

const ai = isConfigured
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'gridmind-backend',
        },
      },
    })
  : null;

export class GeminiService {
  /**
   * Run Gemini 3.8 Flash optimization synthesis on operator workspace inputs.
   */
  static async analyzeWorkspace(req: WorkspaceAnalysisRequest): Promise<WorkspaceAnalysisResponse> {
    if (req.simulateFault) {
      throw new Error(
        'SCADA Telemetry Gateway timeout on OPC-UA Node #04 (HTTP 503). All workspace inputs have been preserved—retry execution or run the deterministic physics solver.'
      );
    }

    if (!ai) {
      return PhysicsSolver.solveWorkspaceAnalysis(req);
    }

    try {
      const prompt = [
        `You are the PRAVAAH Smart Microgrid Optimization Engine.`,
        `Analyze the following operator workspace configuration and produce quantified operational results and verifiable physical/tariff evidence.`,
        `Workspace: ${req.workspaceName} (${req.screenId})`,
        `Input Summary: ${req.inputSummary}`,
        `Parameters JSON: ${JSON.stringify(req.parameters)}`,
        `Return concise, high-precision engineering numbers with units (kW, kWh, $, %, °C, Tons CO2e).`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Concise 1-2 sentence executive engineering summary with numbers.',
              },
              recommendedAction: {
                type: Type.STRING,
                description: 'Primary prescriptive dispatch or governance action title.',
              },
              recommendedWindow: {
                type: Type.STRING,
                description: 'Recommended execution time window.',
              },
              metrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    baseline: { type: Type.STRING },
                    projected: { type: Type.STRING },
                    delta: { type: Type.STRING },
                    status: { type: Type.STRING },
                  },
                  required: ['label', 'baseline', 'projected', 'delta', 'status'],
                },
              },
              evidence: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    parameter: { type: Type.STRING },
                    observation: { type: Type.STRING },
                    confidence: { type: Type.STRING },
                  },
                  required: ['source', 'parameter', 'observation', 'confidence'],
                },
              },
            },
            required: ['summary', 'recommendedAction', 'recommendedWindow', 'metrics', 'evidence'],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        return PhysicsSolver.solveWorkspaceAnalysis(req);
      }

      const parsed = JSON.parse(rawText);
      const now = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      return {
        summary: parsed.summary,
        recommendedAction: parsed.recommendedAction,
        recommendedWindow: parsed.recommendedWindow,
        metrics: (parsed.metrics || []).slice(0, 4).map((m: Record<string, string>) => ({
          label: m.label || 'Metric',
          baseline: m.baseline || '-',
          projected: m.projected || '-',
          delta: m.delta || '-',
          status:
            m.status === 'critical' || m.status === 'warning' ? m.status : 'optimal',
        })),
        evidence: (parsed.evidence || []).slice(0, 3).map((ev: Record<string, string>) => ({
          source: ev.source || 'Telemetry Bus',
          parameter: ev.parameter || 'Nominal',
          observation: ev.observation || '',
          confidence: ev.confidence || '98.4%',
        })),
        engineSource: 'gemini-3.8-flash',
        timestamp: now,
      };
    } catch (_error) {
      return PhysicsSolver.solveWorkspaceAnalysis(req);
    }
  }
}
