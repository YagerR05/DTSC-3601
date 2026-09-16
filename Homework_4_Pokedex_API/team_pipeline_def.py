"""Custom scikit-learn transformer for the Team Builder pipeline. Must be
importable under this exact module name wherever the fitted bundle is
unpickled (local dev, FastAPI, and inside the Modal image).
"""

import math

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin

ATTACK_TYPES = [
    "bug", "dark", "dragon", "electric", "fairy", "fight", "fire", "flying",
    "ghost", "grass", "ground", "ice", "normal", "poison", "psychic", "rock",
    "steel", "water",
]

FEATURE_NAMES = (
    [f"team_exposure_{t}" for t in ATTACK_TYPES]
    + [f"candidate_type_score_{t}" for t in ATTACK_TYPES]
    + [
        "team_physical_share", "candidate_physical_share", "team_size",
        "candidate_is_mega", "team_has_mega", "candidate_base_total",
    ]
)


def _type_score(against: float) -> float:
    """log2-scaled defensive multiplier: resist -> negative, weak -> positive,
    matching the label formula in build_team_builder.py exactly - so the
    forest is given the same representation the labels were computed from,
    rather than having to reconstruct a log-scaled sum from raw averages."""
    if against <= 0:
        return -2.0
    return math.log2(against)


class TeamContextFeaturizer(BaseEstimator, TransformerMixin):
    """Aggregates a variable-length team (1-5 Pokemon) plus one candidate
    Pokemon into a fixed-size numeric feature vector, regardless of team
    size, so a downstream model can score how well the candidate fits the
    team so far. `team_exposure_<type>` is the sum (not average) of each
    member's log2 type score for that attacking type - summing rather than
    averaging is what lets the model see a type multiple team members are
    weak to as worse than one, even if a third member happens to resist it.

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

            team_exposure = [sum(_type_score(m[f"against_{t}"]) for m in team) for t in types]
            cand_type_score = [_type_score(cand[f"against_{t}"]) for t in types]

            team_atk_total = sum(m["attack"] for m in team)
            team_spa_total = sum(m["sp_attack"] for m in team)
            team_physical_share = team_atk_total / max(1.0, team_atk_total + team_spa_total)
            cand_physical_share = cand["attack"] / max(1.0, cand["attack"] + cand["sp_attack"])

            team_has_mega = float(any(m["is_mega"] for m in team))

            out[i] = team_exposure + cand_type_score + [
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
