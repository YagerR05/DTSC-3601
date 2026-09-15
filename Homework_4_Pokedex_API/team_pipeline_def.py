"""Custom scikit-learn transformer for the Team Builder pipeline. Must be
importable under this exact module name wherever the fitted bundle is
unpickled (local dev, FastAPI, and inside the Modal image).
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

ATTACK_TYPES = [
    "bug", "dark", "dragon", "electric", "fairy", "fight", "fire", "flying",
    "ghost", "grass", "ground", "ice", "normal", "poison", "psychic", "rock",
    "steel", "water",
]

FEATURE_NAMES = (
    [f"team_against_{t}" for t in ATTACK_TYPES]
    + [f"candidate_against_{t}" for t in ATTACK_TYPES]
    + [
        "team_physical_share", "candidate_physical_share", "team_size",
        "candidate_is_mega", "team_has_mega", "candidate_base_total",
    ]
)


class TeamContextFeaturizer(BaseEstimator, TransformerMixin):
    """Aggregates a variable-length team (1-5 Pokemon) plus one candidate
    Pokemon into a fixed-size numeric feature vector, regardless of team
    size, so a downstream model can score how well the candidate fits the
    team so far. The variable-length aggregation (mean type-weakness
    across however many team members there are, whether *any* team member
    already covers a type, etc.) is the actual work this transformer does -
    a plain column selector wouldn't handle a team of 1 and a team of 5
    the same way.

    Expects an iterable of dicts, each with keys:
      "team": list of 1-5 Pokemon dicts (each with against_<type> for all
              18 types, attack, sp_attack, is_mega)
      "candidate": a single Pokemon dict with the same keys plus base_total
    """

    def __init__(self, attack_types=None):
        self.attack_types = attack_types

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        types = list(self.attack_types) if self.attack_types else list(ATTACK_TYPES)
        rows = X if isinstance(X, list) else list(X)
        out = np.zeros((len(rows), len(types) * 2 + 6), dtype=float)

        for i, row in enumerate(rows):
            team = row["team"]
            cand = row["candidate"]
            n = len(team)

            team_against = [float(np.mean([m[f"against_{t}"] for m in team])) for t in types]
            cand_against = [float(cand[f"against_{t}"]) for t in types]

            team_atk_total = sum(m["attack"] for m in team)
            team_spa_total = sum(m["sp_attack"] for m in team)
            team_physical_share = team_atk_total / max(1.0, team_atk_total + team_spa_total)
            cand_physical_share = cand["attack"] / max(1.0, cand["attack"] + cand["sp_attack"])

            team_has_mega = float(any(m["is_mega"] for m in team))

            out[i] = team_against + cand_against + [
                team_physical_share,
                cand_physical_share,
                float(n),
                float(cand["is_mega"]),
                team_has_mega,
                float(cand["base_total"]),
            ]

        return out

    def get_feature_names_out(self, input_features=None):
        return np.array(FEATURE_NAMES)
