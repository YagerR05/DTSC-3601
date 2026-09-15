/** Live Modal-hosted FastAPI service backing the Doppelganger and Team
 * Builder tabs (Homework_4_Pokedex_API). Public API, no secret involved -
 * see that project's README for the pipelines themselves. */
export const ML_API_BASE = "https://yagerr05--pokedex-doppelganger-fastapi-app.modal.run";

export class MlApiError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${ML_API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const detail =
      typeof payload?.detail === "string"
        ? payload.detail
        : Array.isArray(payload?.detail)
          ? payload.detail.map((e: { msg?: string }) => e.msg).join("; ")
          : `Request failed (${res.status})`;
    throw new MlApiError(res.status, detail);
  }
  return res.json();
}

export type StatQuery = {
  hp: number;
  attack: number;
  defense: number;
  sp_attack: number;
  sp_defense: number;
  speed: number;
  k: number;
};

export type DoppelgangerMatch = {
  id: number;
  name: string;
  pokedex_number: number;
  generation: number;
  type1: string;
  type2: string | null;
  is_legendary: boolean;
  base_total: number;
  distance: number;
};

export type DoppelgangerResponse = {
  query: StatQuery;
  matches: DoppelgangerMatch[];
};

export function findDoppelganger(query: StatQuery) {
  return postJson<DoppelgangerResponse>("/doppelganger", query);
}

export type TeamMember = {
  id: number;
  name: string;
  type1: string;
  type2: string | null;
  is_legendary: boolean;
};

export type TeamRecommendation = {
  id: number;
  name: string;
  pokedex_number: number;
  type1: string;
  type2: string | null;
  base_total: number;
  fit_score: number;
};

export type TeamResponse = {
  team: TeamMember[];
  recommendations: TeamRecommendation[];
};

export function recommendTeam(team: number[], k: number) {
  return postJson<TeamResponse>("/team/recommend", { team, k });
}
