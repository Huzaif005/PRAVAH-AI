# GridMind AI — Explicit 6-Stage AI Workspace & Decision Flow

Upgrade all GridMind AI dashboard workspaces to follow an explicit, transparent 6-stage operational workflow (**Input → Validation → Execution → Results → Evidence → User Decision**) powered by server-side Gemini analysis with deterministic physics fallback, realistic operational states (loading, error, empty, success, retry), strict input preservation on failure, and a shared operator decision audit ledger.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and product choices reflect your confirmed preferences and govern how every workspace in GridMind AI executes and records operator decisions:

- **Confirmed Scope — All Dashboard Workspaces**: The explicit 6-stage journey will be integrated across **Overview Dispatch**, **Demand Forecast**, **Microgrid Simulator**, **Decision Lab**, **Alerts & Events**, **Reports Generator**, and **Settings Policy Governance**.
- **Confirmed Execution Engine — Live Gemini API with Deterministic Fallback**: A server-side `/api/workspace/analyze` route using `gemini-3.8-flash` (structured JSON schema output) will evaluate grid telemetry, constraints, and operator parameters to return structured results and physical/tariff evidence. If the API is unreachable or an operator triggers a fault test, the workspace preserves all inputs, surfaces a clear retry banner, and offers an instant deterministic solver fallback.
- **Confirmed Decision Actions — Approve, Schedule, or Reject with Audit Log**: Every analysis concludes with an explicit operator decision bar (**Approve & Dispatch**, **Schedule Window**, or **Reject Recommendation**) plus an optional operator note. Decisions are recorded in a shared cross-screen Decision Audit Ledger visible in the workspace and synced with Alerts & Events and Reports.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms static or implicit dashboard panels into structured, step-by-step operational workspaces where operators configure parameters (**Input**), verify safety and physical bounds before execution (**Validation**), run live AI + physics solver evaluations (**Execution**), inspect quantified impactdeltas (**Results**), verify underlying telemetry citations and tariff math (**Evidence**), and commit an auditable action (**User Decision**).
- **Target Audience / Persona**: Microgrid operators, industrial facility energy managers, and sustainability auditors who require verifiable evidence, zero data loss during network or PLC interruptions, and unambiguous primary actions.
- **Key Value**: Eliminates black-box AI recommendations by pairing every generated dispatch or forecast with inspectable telemetry evidence, deterministic boundary validation, non-destructive retry flows, and a permanent decision audit trail.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Stage 1 — Input**: Operators adjust clearly labeled controls (e.g., load growth, solar irradiance, BESS reserve floor, tariff window, or report scope). Every control displays its unit, operational purpose, and current delta from baseline.
  2. **Stage 2 — Validation**: Real-time pre-flight checks validate inputs against physical microgrid constraints (e.g., BESS SoC floor vs. ceiling, transformer thermal limits, valid OPC-UA endpoints, or required date ranges). Invalid states highlight the exact field with actionable remediation instructions and disable execution until resolved.
  3. **Stage 3 — Execution**: Clicking the primary action button triggers a structured multi-step execution progress bar (*Validating physical constraints → Querying SCADA telemetry → Synthesizing Gemini optimization & evidence*). Operators can also simulate transient SCADA/network timeouts to test error recovery.
  4. **Stage 4 — Results**: Displays high-contrast, tabular-numeral (`tabular-nums`) KPI deltas comparing Baseline vs. Proposed Outcomes (Net Cost Impact, Peak Demand Shaved, Carbon Offset, and Grid Stability Margin).
  5. **Stage 5 — Evidence**: An inspectable evidence drawer/ledger directly beneath Results detailing the exact causal factors—weather correlation, Time-of-Use tariff rate multipliers, BESS cycle degradation math, and solver confidence intervals.
  6. **Stage 6 — User Decision**: A dedicated decision bar where the operator selects **Approve & Dispatch**, **Schedule for Window**, or **Reject / Hold**, attaches an optional operator rationale, and commits the entry to the shared Decision Audit Ledger.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Precision Industrial Control & Editorial Telemetry—preserving the existing dark slate atmospheric minimalism and high-craft dark UI.
  - *Color Palette & Mood*: Retains the approved design system (`--color-surface: #0b1326`, `--color-surface-container: #171f33`, `--color-primary: #4cd7f6`, `--color-secondary: #4edea3`, `--color-tertiary: #ffb95f`, `--color-error: #ffb4ab`).
  - *Typography & Hierarchy*: `Plus Jakarta Sans` for workspace headers, `Public Sans` for readable evidence narratives and form labels, and `JetBrains Mono` (`tabular-nums`) for all stage numbers (`01`–`06`), telemetry values, and timestamps.
  - *Component Styling & Layout*: Single-elevation hairline ledgers (`1px solid` subtle borders, `4px`–`6px` radii) with zero nested card bloat, zero decorative gradients, and an explicit 6-step horizontal pipeline stepper at the top of active workspaces.

- **Interactive Feedback & Motion**:
  - **Loading State**: Deterministic step-by-step solver progress indicator with elapsed millisecond counter and non-blocking parameter summary.
  - **Error & Retry State**: Inline error banner with exact failure reason, **Retry Execution** button, and **Run Deterministic Fallback** action—preserving 100% of user form inputs and slider positions.
  - **Empty State**: Clear zero-state guidance when filters return no records or before a custom scenario is executed, with a one-click **Load Baseline Preset** button.
  - **Success & Decision State**: Confirmation banner with timestamped Audit ID, status transition, and immediate insertion into the shared Decision Audit Ledger.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unified 6-Stage Pipeline Component Architecture**
  - *Chosen Approach*: Build a reusable, composable 6-stage Workspace Pipeline Banner and Evidence/Decision dock shared across all dashboard screens, tailored to each screen's specific domain controls.
  - *Why*: Ensures visual consistency, predictable muscle memory for operators, and clear stage progression (`01 INPUT` → `02 VALIDATION` → `03 EXECUTION` → `04 RESULTS` → `05 EVIDENCE` → `06 DECISION`) without duplicating boilerplate UI.
  - *Alternatives Considered*: Separate ad-hoc layouts per screen (rejected because it obscures the user journey and creates inconsistent error/retry handling).

- **Decision 2: Server-Side Gemini 3.8 Flash with Deterministic Physics Fallback**
  - *Chosen Approach*: Route workspace execution requests through an Express backend endpoint (`/api/workspace/analyze`) calling `gemini-3.8-flash` with a strict `responseSchema` for structured results and evidence citations, backed by a deterministic engineering calculation engine if the API key is absent or network faults occur.
  - *Why*: Guarantees fast, structured, domain-accurate telemetry reasoning while ensuring the app remains 100% functional and testable under offline or fault-injection conditions.
  - *Alternatives Considered*: Client-side LLM calls (prohibited by security rules) or mock-only responses (lacks dynamic AI synthesis).

- **Decision 3: Non-Destructive Input State & Shared Decision Ledger**
  - *Chosen Approach*: Decouple draft input state from execution request state in React, and maintain a centralized `DecisionAuditLog` state in the root application that feeds Overview, Alerts & Events, and Reports.
  - *Why*: If an execution fails or is rejected by the operator, all sliders, text inputs, and checkboxes remain untouched so the operator can retry or tweak parameters without re-entering data.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Application Root State (App)                          │
│  • Active Workspace Screen         • Shared Decision Audit Ledger            │
│  • Global Search & Filter Query    • Cross-Screen Dispatched Strategies      │
└───────────────────┬──────────────────────────────────────┬───────────────────┘
                    │                                      │
                    ▼                                      ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────────┐
│   6-Stage Workspace Pipeline Engine   │  │   Express Server (/api/workspace) │
│  [01 Input] ──► [02 Validation]       │  │  • POST /api/workspace/analyze    │
│      │               │                │  │  • @google/genai (gemini-3.8-flash│
│      ▼               ▼                │  │    with structured JSON schema)   │
│  [03 Execution (Loading/Error/Retry)] │◄─┼──► Deterministic Physics Solver   │
│      │                                │  │    Fallback on API/Network Error  │
│      ▼                                │  └───────────────────────────────────┘
│  [04 Results] ──► [05 Evidence]       │
│      │                                │
│      ▼                                │
│  [06 Decision: Approve/Schedule/Reject│
└───────────────────┬───────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Dashboard Workspaces (All 7 Screens)                     │
│  • Overview (Dispatch Workspace)      • Demand Forecast (24h AI Horizon)     │
│  • Microgrid Simulator (Stress Test)  • Decision Lab (Strategy Matrix)       │
│  • Alerts & Events (Triage & Audit)   • Reports (Audit Synthesis & Export)   │
│  • Settings (PLC Governance Policy)                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **`WorkspaceStage`**: `'input' | 'validating' | 'executing' | 'results' | 'error' | 'empty' | 'decided'`
- **`ValidationIssue`**: `{ field: string; message: string; remediation: string; severity: 'error' | 'warning' }`
- **`WorkspaceAnalysisResponse`**:
  - `summary`: Concise executive outcome headline
  - `metrics`: Array of `{ label: string; baseline: string; projected: string; delta: string; status: 'optimal' | 'warning' | 'critical' }`
  - `evidence`: Array of `{ source: string; parameter: string; observation: string; confidence: string }`
  - `recommendedAction`: Default action title and target schedule window
  - `engineSource`: `'gemini-3.8-flash' | 'deterministic-solver'`
- **`DecisionAuditEntry`**:
  - `id`: Timestamped audit identifier
  - `workspace`: Screen name where decision was made
  - `decision`: `'APPROVED' | 'SCHEDULED' | 'REJECTED'`
  - `scheduleWindow`: Target execution window (if scheduled)
  - `operatorNote`: Rationale entered by the user
  - `inputSnapshot`: Summary of input parameters used
  - `impactSummary`: Quantified cost/MW/carbon impact
  - `timestamp`: Formatted time string

### Interactive Component & State Mapping

- **Stage Progress Indicator (`WorkspacePipelineBar`)**: Displays the 6 numbered stages (`01 Input` through `06 Decision`) and highlights the current active stage, validation status, and execution engine badge.
- **Input & Validation Layer**: Every slider, numeric field, and selector validates immediately on change and before submission. Any out-of-range combination (e.g., Solar generation = 0% + Grid Import Cap < Critical Load, or invalid OPC-UA URI) halts execution, marks Stage `02 Validation` in amber/red, and explains how to fix the input.
- **Execution & Fault Recovery Controls**: Includes a primary action button (e.g., **Run AI Dispatch Analysis**, **Generate 24h Forecast**, **Simulate Stress Scenario**) and a subtle **Simulate Network Fault** toggle so operators can verify non-destructive error handling, input preservation, **Retry Execution**, and **Use Deterministic Fallback**.
- **Evidence & Decision Bar**: Renders structured causal evidence rows alongside the **Approve & Dispatch**, **Schedule Window**, and **Reject Recommendation** controls. Submitting a decision appends a `DecisionAuditEntry` to the shared ledger, updates the active status banner, and allows immediate inspection in the Audit Trail table.
