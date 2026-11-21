export type OfficeAgent = { id: string; name: string; model: string; floor: number; desk: number; status: "idle" | "working" | "thinking" | "offline"; task: string };
export type OfficeState = { floor: number; layoutVersion: number; selectedAgentId?: string | null };
export type WorkspaceSnapshot = {
  schemaVersion: 1;
  capturedAt: string;
  workspace: { id: string; displayName: string; activeProjectKey: string | null; officeState: OfficeState };
  session: { id: string; resumeSummary: string; activeTask: string };
  agents: OfficeAgent[];
  projects: Array<{ key: string; title: string; status: string }>;
  exhibits: Array<{ key: string; floor: number; type: string; title: string; caption: string; assetPath?: string | null }>;
  recentEvents: Array<{ type: string; actor: string; summary: string; at: string }>;
};