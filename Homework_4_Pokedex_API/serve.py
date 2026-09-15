"""FastAPI service for the Pokedex ML pipelines: Doppelganger (stat
similarity, KNN) and Team Builder (teammate recommendation, random forest).

Local dev:
    uv run uvicorn serve:app --reload
    -> http://localhost:8000/docs
"""

from pathlib import Path
from typing import Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from pipeline_def import STAT_COLUMNS  # noqa: F401 - required so joblib can unpickle the doppelganger bundle
from team_pipeline_def import ATTACK_TYPES  # noqa: F401 - required so joblib can unpickle the team-builder bundle

ROOT = Path(__file__).parent


def load_bundle(filename: str):
    try:
        return joblib.load(ROOT / filename), None
    except Exception as exc:  # noqa: BLE001 - any load failure should surface as 503, not crash the app
        return None, str(exc)


# Both loaded once at import time - never re-loaded or re-fit per request.
_doppelganger, _doppelganger_error = load_bundle("doppelganger.joblib")
_team_builder, _team_builder_error = load_bundle("team_builder.joblib")

app = FastAPI(title="Pokedex ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def require(bundle, error, name):
    if bundle is None:
        raise HTTPException(status_code=503, detail=f"{name} artifact not loaded: {error}")
    return bundle


@app.get("/")
def root():
    return {
        "service": "Pokedex ML API",
        "docs": "/docs",
        "pipelines": {
            "doppelganger": "ok" if _doppelganger is not None else "artifact not loaded",
            "team_builder": "ok" if _team_builder is not None else "artifact not loaded",
        },
        "endpoints": {
            "GET /health": "liveness check",
            "GET /info": "doppelganger artifact metadata",
            "POST /doppelganger": "stat query -> nearest-match Pokemon",
            "GET /team/info": "team-builder artifact metadata",
            "POST /team/recommend": "partial team -> recommended teammates",
        },
    }


@app.get("/health")
def health():
    if _doppelganger is None or _team_builder is None:
        detail = _doppelganger_error or _team_builder_error
        raise HTTPException(status_code=503, detail=f"Model artifact not loaded: {detail}")
    return {"status": "ok"}


# ---------------------------------------------------------------- doppelganger

class StatQuery(BaseModel):
    hp: int = Field(..., ge=1, le=255, description="Base HP, 1-255")
    attack: int = Field(..., ge=1, le=255, description="Base Attack, 1-255")
    defense: int = Field(..., ge=1, le=255, description="Base Defense, 1-255")
    sp_attack: int = Field(..., ge=1, le=255, description="Base Sp. Attack, 1-255")
    sp_defense: int = Field(..., ge=1, le=255, description="Base Sp. Defense, 1-255")
    speed: int = Field(..., ge=1, le=255, description="Base Speed, 1-255")
    k: int = Field(5, ge=1, le=10, description="Number of matches to return, 1-10")


class Match(BaseModel):
    id: int
    name: str
    pokedex_number: int
    generation: int
    type1: str
    type2: Optional[str]
    is_legendary: bool
    base_total: int
    distance: float


class MatchResponse(BaseModel):
    query: StatQuery
    matches: list[Match]


@app.get("/info")
def info():
    bundle = require(_doppelganger, _doppelganger_error, "doppelganger")
    return bundle["metadata"]


@app.post("/doppelganger", response_model=MatchResponse)
def find_doppelganger(query: StatQuery):
    bundle = require(_doppelganger, _doppelganger_error, "doppelganger")

    row = pd.DataFrame([{col: getattr(query, col) for col in STAT_COLUMNS}])
    transformed = bundle["pipeline"].transform(row)

    distances, indices = bundle["neighbors"].kneighbors(transformed, n_neighbors=query.k)

    reference = bundle["reference"]
    match_fields = Match.model_fields.keys() - {"distance"}
    matches = [
        Match(
            **{field: reference[idx][field] for field in match_fields},
            distance=round(float(dist), 4),
        )
        for idx, dist in zip(indices[0], distances[0])
    ]

    return MatchResponse(query=query, matches=matches)


# ---------------------------------------------------------------- team builder

class TeamQuery(BaseModel):
    team: list[int] = Field(..., min_length=1, max_length=5, description="1-5 Pokemon ids already on the team")
    k: int = Field(3, ge=1, le=10, description="Number of recommendations to return, 1-10")

    @field_validator("team")
    @classmethod
    def no_duplicate_ids(cls, value: list[int]) -> list[int]:
        if len(set(value)) != len(value):
            raise ValueError("team ids must be unique")
        return value


class TeamMember(BaseModel):
    id: int
    name: str
    type1: str
    type2: Optional[str]
    is_legendary: bool


class Recommendation(BaseModel):
    id: int
    name: str
    pokedex_number: int
    type1: str
    type2: Optional[str]
    base_total: int
    fit_score: float


class TeamResponse(BaseModel):
    team: list[TeamMember]
    recommendations: list[Recommendation]


@app.get("/team/info")
def team_info():
    bundle = require(_team_builder, _team_builder_error, "team-builder")
    return bundle["metadata"]


@app.post("/team/recommend", response_model=TeamResponse)
def recommend_team(query: TeamQuery):
    bundle = require(_team_builder, _team_builder_error, "team-builder")

    reference_by_id = {p["id"]: p for p in bundle["reference"]}
    missing = [pid for pid in query.team if pid not in reference_by_id]
    if missing:
        raise HTTPException(status_code=422, detail=f"Unknown Pokemon id(s): {missing}")

    team = [reference_by_id[pid] for pid in query.team]
    team_ids = set(query.team)

    candidate_ids = [pid for pid in bundle["candidate_pool_ids"] if pid not in team_ids]
    rows = [{"team": team, "candidate": reference_by_id[pid]} for pid in candidate_ids]

    scores = bundle["pipeline"].predict(rows)

    ranked = sorted(zip(candidate_ids, scores), key=lambda pair: pair[1], reverse=True)[: query.k]

    recommendations = [
        Recommendation(
            id=pid,
            name=reference_by_id[pid]["name"],
            pokedex_number=reference_by_id[pid]["pokedex_number"],
            type1=reference_by_id[pid]["type1"],
            type2=reference_by_id[pid]["type2"],
            base_total=reference_by_id[pid]["base_total"],
            fit_score=round(float(score), 4),
        )
        for pid, score in ranked
    ]

    team_members = [
        TeamMember(id=m["id"], name=m["name"], type1=m["type1"], type2=m["type2"], is_legendary=m["is_legendary"])
        for m in team
    ]

    return TeamResponse(team=team_members, recommendations=recommendations)
