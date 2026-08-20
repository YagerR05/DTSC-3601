"""Streamlit app for exploring the Kaggle Complete Pokemon Dataset across generations."""

import ast

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

DATA_PATH = "data/pokemon.csv"

# dataviz skill categorical palette, dark-surface steps (validated, fixed order — reused as-is)
CATEGORICAL = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#39c239", "#9085e9", "#e66767"]
SEQUENTIAL_BLUE = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"]

CHART_SURFACE = "#1a1a19"
SECONDARY_INK = "#e6e5df"
MUTED_INK = "#a6a49c"
GRIDLINE = "#3a3a37"
BASELINE = "#55534d"

TYPE_COLORS = {
    "normal": "#A8A77A", "fire": "#EE8130", "water": "#6390F0", "electric": "#F7D02C",
    "grass": "#7AC74C", "ice": "#96D9D6", "fighting": "#C22E28", "poison": "#A33EA1",
    "ground": "#E2BF65", "flying": "#A98FF3", "psychic": "#F95587", "bug": "#A6B91A",
    "rock": "#B6A136", "ghost": "#735797", "dragon": "#6F35FC", "dark": "#705746",
    "steel": "#B7B7CE", "fairy": "#D685AD",
}

STAT_COLS = ["hp", "attack", "defense", "sp_attack", "sp_defense", "speed"]
STAT_LABELS = {
    "hp": "HP", "attack": "Attack", "defense": "Defense",
    "sp_attack": "Sp. Attack", "sp_defense": "Sp. Defense", "speed": "Speed",
}

N_GENERATIONS = 9
GEN_LABELS = {i: f"Gen {i}" for i in range(1, N_GENERATIONS + 1)}
GEN_PALETTE = CATEGORICAL + ["#a97442"]  # 9th hue (brown) for Gen 9, distinct from the other 8
GEN_COLORS = {gen: GEN_PALETTE[gen - 1] for gen in range(1, N_GENERATIONS + 1)}


def base_layout(fig: go.Figure, **kwargs) -> go.Figure:
    fig.update_layout(
        plot_bgcolor=CHART_SURFACE,
        paper_bgcolor=CHART_SURFACE,
        font_color=SECONDARY_INK,
        margin=dict(l=10, r=10, t=40, b=10),
        legend=dict(bgcolor="rgba(0,0,0,0)", font_color=SECONDARY_INK),
        **kwargs,
    )
    fig.update_xaxes(gridcolor=GRIDLINE, zeroline=False, linecolor=BASELINE, tickfont_color=SECONDARY_INK, title_font_color=SECONDARY_INK)
    fig.update_yaxes(gridcolor=GRIDLINE, zeroline=False, linecolor=BASELINE, tickfont_color=SECONDARY_INK, title_font_color=SECONDARY_INK)
    return fig


@st.cache_data
def load_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    df["type2"] = df["type2"].fillna("none")
    df["generation"] = df["generation"].astype(int)
    df["is_legendary"] = df["is_legendary"].astype(bool)

    def parse_abilities(raw: str) -> list[str]:
        try:
            return ast.literal_eval(raw)
        except (ValueError, SyntaxError):
            return []

    df["abilities_list"] = df["abilities"].apply(parse_abilities)
    return df


st.set_page_config(page_title="Pokedex Explorer", page_icon="🔴", layout="wide")

df = load_data()

st.sidebar.title("🔴 Pokedex Explorer")
st.sidebar.caption("Gen 1–7: Kaggle rounakbanik/pokemon · Gen 8: edgaro/pokedex-gen8 · Gen 9: timbuck/pokemon-generation-9")

gens_selected = st.sidebar.multiselect(
    "Generation",
    options=sorted(df["generation"].unique()),
    default=sorted(df["generation"].unique()),
    format_func=lambda g: GEN_LABELS[g],
)
all_types = sorted(set(df["type1"]) | set(t for t in df["type2"] if t != "none"))
types_selected = st.sidebar.multiselect("Type", options=all_types, default=[])
legendary_filter = st.sidebar.radio("Legendary status", ["All", "Legendary only", "Non-legendary only"], index=0)

filtered = df[df["generation"].isin(gens_selected)]
if types_selected:
    filtered = filtered[filtered["type1"].isin(types_selected) | filtered["type2"].isin(types_selected)]
if legendary_filter == "Legendary only":
    filtered = filtered[filtered["is_legendary"]]
elif legendary_filter == "Non-legendary only":
    filtered = filtered[~filtered["is_legendary"]]

st.sidebar.markdown(f"**{len(filtered)}** of {len(df)} Pokemon match")

st.title("Pokemon Across the Generations")
st.caption("Explore base stats, types, and legendary status across all nine generations.")

tab_overview, tab_generations, tab_types, tab_compare, tab_explorer = st.tabs(
    ["Overview", "Generations", "Types", "Compare", "Explorer"]
)

with tab_overview:
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Pokemon", len(filtered))
    col2.metric("Generations", filtered["generation"].nunique())
    col3.metric("Legendary", int(filtered["is_legendary"].sum()))
    col4.metric("Avg. Base Total", f"{filtered['base_total'].mean():.0f}" if len(filtered) else "—")

    st.subheader("Base Total distribution")
    fig = px.histogram(filtered, x="base_total", nbins=40, color_discrete_sequence=[CATEGORICAL[0]])
    fig.update_traces(marker_line_color=CHART_SURFACE, marker_line_width=1)
    base_layout(fig, xaxis_title="Base stat total", yaxis_title="Count", showlegend=False, height=360)
    st.plotly_chart(fig, use_container_width=True)

    st.subheader("Strongest Pokemon (by Base Total)")
    top_n = filtered.sort_values("base_total", ascending=False).head(15)
    top_n = top_n.assign(generation_label=top_n["generation"].map(GEN_LABELS))
    fig = px.bar(
        top_n,
        x="base_total", y="name", orientation="h",
        color="generation_label",
        color_discrete_map={GEN_LABELS[g]: c for g, c in GEN_COLORS.items()},
        category_orders={
            "generation_label": [GEN_LABELS[g] for g in sorted(GEN_COLORS)],
            "name": list(top_n["name"]),
        },
    )
    base_layout(fig, xaxis_title="Base stat total", yaxis_title="", height=460, legend_title_text="Generation")
    st.plotly_chart(fig, use_container_width=True)

with tab_generations:
    st.subheader("Pokemon count per generation")
    counts = filtered.groupby("generation").size().reset_index(name="count")
    counts["generation_label"] = counts["generation"].map(GEN_LABELS)
    fig = px.bar(
        counts, x="generation_label", y="count",
        color="generation_label",
        color_discrete_map={GEN_LABELS[g]: c for g, c in GEN_COLORS.items()},
        category_orders={"generation_label": [GEN_LABELS[g] for g in sorted(GEN_COLORS)]},
    )
    base_layout(fig, xaxis_title="", yaxis_title="Count", showlegend=False, height=360)
    st.plotly_chart(fig, use_container_width=True)

    st.subheader("Average base stats by generation")
    avg_stats = filtered.groupby("generation")[STAT_COLS].mean().reset_index()
    avg_stats["generation_label"] = avg_stats["generation"].map(GEN_LABELS)
    fig = go.Figure()
    for i, stat in enumerate(STAT_COLS):
        fig.add_trace(go.Scatter(
            x=avg_stats["generation_label"], y=avg_stats[stat],
            mode="lines+markers", name=STAT_LABELS[stat],
            line=dict(color=CATEGORICAL[i % len(CATEGORICAL)], width=2),
            marker=dict(size=8),
        ))
    base_layout(fig, xaxis_title="", yaxis_title="Average stat value", height=420, legend_title_text="Stat")
    st.plotly_chart(fig, use_container_width=True)

    st.subheader("Legendary share by generation")
    leg_share = filtered.groupby("generation")["is_legendary"].mean().reset_index()
    leg_share["generation_label"] = leg_share["generation"].map(GEN_LABELS)
    leg_share["pct"] = leg_share["is_legendary"] * 100
    fig = px.bar(
        leg_share, x="generation_label", y="pct",
        color="generation_label",
        color_discrete_map={GEN_LABELS[g]: c for g, c in GEN_COLORS.items()},
        category_orders={"generation_label": [GEN_LABELS[g] for g in sorted(GEN_COLORS)]},
    )
    base_layout(fig, xaxis_title="", yaxis_title="% Legendary", showlegend=False, height=340)
    st.plotly_chart(fig, use_container_width=True)

with tab_types:
    st.subheader("Type1 frequency")
    type_counts = filtered["type1"].value_counts().reset_index()
    type_counts.columns = ["type1", "count"]
    fig = px.bar(
        type_counts, x="type1", y="count",
        color="type1", color_discrete_map=TYPE_COLORS,
    )
    base_layout(fig, xaxis_title="", yaxis_title="Count", showlegend=False, height=420)
    st.plotly_chart(fig, use_container_width=True)

    st.subheader("Average Base Total by type")
    avg_by_type = filtered.groupby("type1")["base_total"].mean().sort_values(ascending=False).reset_index()
    fig = px.bar(
        avg_by_type, x="base_total", y="type1", orientation="h",
        color="type1", color_discrete_map=TYPE_COLORS,
    )
    base_layout(fig, xaxis_title="Average base total", yaxis_title="", showlegend=False, height=560)
    st.plotly_chart(fig, use_container_width=True)

with tab_compare:
    st.subheader("Compare Pokemon (radar chart)")
    names = st.multiselect(
        "Pick up to 5 Pokemon",
        options=sorted(df["name"]),
        default=sorted(df["name"])[:2] if len(df) >= 2 else list(df["name"]),
        max_selections=5,
    )
    if names:
        fig = go.Figure()
        for i, name in enumerate(names):
            row = df[df["name"] == name].iloc[0]
            values = [row[s] for s in STAT_COLS] + [row[STAT_COLS[0]]]
            labels = [STAT_LABELS[s] for s in STAT_COLS] + [STAT_LABELS[STAT_COLS[0]]]
            color = CATEGORICAL[i % len(CATEGORICAL)]
            fig.add_trace(go.Scatterpolar(
                r=values, theta=labels, name=name, fill="toself",
                line=dict(color=color, width=2), opacity=0.75,
            ))
        fig.update_layout(
            polar=dict(
                bgcolor=CHART_SURFACE,
                radialaxis=dict(visible=True, gridcolor=GRIDLINE, linecolor=BASELINE, tickfont_color=MUTED_INK),
                angularaxis=dict(gridcolor=GRIDLINE, linecolor=BASELINE, tickfont_color=SECONDARY_INK),
            ),
            paper_bgcolor=CHART_SURFACE, font_color=SECONDARY_INK, height=520,
            legend=dict(bgcolor="rgba(0,0,0,0)", font_color=SECONDARY_INK),
        )
        st.plotly_chart(fig, use_container_width=True)

        st.dataframe(
            df[df["name"].isin(names)].set_index("name")[
                STAT_COLS + ["base_total", "type1", "type2", "generation", "is_legendary"]
            ],
            use_container_width=True,
        )
    else:
        st.info("Select at least one Pokemon to compare.")

with tab_explorer:
    st.subheader("Pokedex table")
    search = st.text_input("Search by name")
    table = filtered
    if search:
        table = table[table["name"].str.contains(search, case=False, na=False)]
    st.dataframe(
        table[
            ["pokedex_number", "name", "generation", "type1", "type2", "is_legendary"]
            + STAT_COLS + ["base_total", "height_m", "weight_kg", "classfication"]
        ].sort_values("pokedex_number").set_index("pokedex_number"),
        use_container_width=True,
        height=560,
    )
