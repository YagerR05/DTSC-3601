"""Custom scikit-learn transformer(s) for the Doppelganger stat-similarity
pipeline. Must be importable under this exact module name wherever the
fitted bundle is unpickled (local dev, FastAPI, and inside the Modal image).
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

STAT_COLUMNS = ["hp", "attack", "defense", "sp_attack", "sp_defense", "speed"]

ENGINEERED_FEATURE_NAMES = [
    "hp", "attack", "defense", "sp_attack", "sp_defense", "speed",
    "physical_bulk", "special_bulk", "offense_total", "defense_total",
    "bulk_offense_ratio",
]


class StatFeatureEngineer(BaseEstimator, TransformerMixin):
    """Expands the 6 raw base stats into a richer feature set (bulk/power/
    balance composites) so nearest-neighbor distance reflects playstyle
    similarity rather than just raw stat closeness — e.g. two Pokemon with
    very different HP/Defense splits but the same total physical bulk end
    up closer together than a naive stat-distance would put them.

    Expects a DataFrame (or array ordered like STAT_COLUMNS) with columns:
    hp, attack, defense, sp_attack, sp_defense, speed.
    """

    def __init__(self, stat_columns=None):
        self.stat_columns = stat_columns

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        columns = list(self.stat_columns) if self.stat_columns else list(STAT_COLUMNS)
        df = X if isinstance(X, pd.DataFrame) else pd.DataFrame(X, columns=columns)

        hp = df["hp"].to_numpy(dtype=float)
        atk = df["attack"].to_numpy(dtype=float)
        dfn = df["defense"].to_numpy(dtype=float)
        spa = df["sp_attack"].to_numpy(dtype=float)
        spd = df["sp_defense"].to_numpy(dtype=float)
        spe = df["speed"].to_numpy(dtype=float)

        physical_bulk = hp + dfn
        special_bulk = hp + spd
        offense_total = atk + spa
        defense_total = dfn + spd
        bulk_offense_ratio = (physical_bulk + special_bulk) / np.clip(offense_total, 1, None)

        return np.column_stack([
            hp, atk, dfn, spa, spd, spe,
            physical_bulk, special_bulk,
            offense_total, defense_total,
            bulk_offense_ratio,
        ])

    def get_feature_names_out(self, input_features=None):
        return np.array(ENGINEERED_FEATURE_NAMES)
