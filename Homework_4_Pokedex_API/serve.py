"""FastAPI service for the Doppelganger stat-similarity pipeline.

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
from pydantic import BaseModel, Field

from pipeline_def import STAT_COLUMNS  # noqa: F401 - required so joblib can unpickle the bundle

ARTIFACT_PATH = Path(__file__).parent / "doppelganger.joblib"

# Loaded once at import time - never re-loaded or re-fit per request.
try:
    _bundle = joblib.load(ARTIFACT_PATH)
    _load_error: Optional[str] = None
except Exception as exc:  # noqa: BLE001 - any load failure should surface as 503, not crash the app
    _bundle = None
    _load_error = str(exc)

app = FastAPI(title="Pokedex Doppelganger API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_bundle() -> dict:
    if _bundle is None:
        raise HTTPException(status_code=503, detail=f"Model artifact not loaded: {_load_error}")
    return _bundle


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


@app.get("/")
def root():
    return {
        "service": "Pokedex Doppelganger API",
        "status": "ok" if _bundle is not None else "artifact not loaded",
        "docs": "/docs",
        "endpoints": {
            "GET /health": "liveness check",
            "GET /info": "artifact metadata",
            "POST /doppelganger": "stat query -> nearest-match Pokemon",
        },
    }


@app.get("/health")
def health():
    if _bundle is None:
        raise HTTPException(status_code=503, detail=f"Model artifact not loaded: {_load_error}")
    return {"status": "ok"}


@app.get("/info")
def info():
    bundle = require_bundle()
    return bundle["metadata"]


@app.post("/doppelganger", response_model=MatchResponse)
def find_doppelganger(query: StatQuery):
    bundle = require_bundle()

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
