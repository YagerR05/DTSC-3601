"""Modal deployment entry point for the Pokedex ML FastAPI service
(Doppelganger + Team Builder).

Usage:
    uv run modal serve modal_serve.py    # dev server, hot-reloads on save
    uv run modal deploy modal_serve.py   # deploy a persistent public URL
"""

import modal

app = modal.App("pokedex-doppelganger")

# sklearn pinned to the EXACT version recorded in both artifacts' metadata
# (see doppelganger.joblib / team_builder.joblib "sklearn_version") - a
# mismatch here is a classic way to silently get a broken unpickle or a
# different model.
image = (
    modal.Image.debian_slim(python_version="3.13")
    .pip_install(
        "scikit-learn==1.7.2",
        "pandas>=2.2,<3.1",
        "numpy>=2.0,<2.6",
        "joblib>=1.4,<1.7",
        "fastapi>=0.115",
        "pydantic>=2.0",
    )
    .add_local_file("pipeline_def.py", remote_path="/root/pipeline_def.py")
    .add_local_file("team_pipeline_def.py", remote_path="/root/team_pipeline_def.py")
    .add_local_file("serve.py", remote_path="/root/serve.py")
    .add_local_file("doppelganger.joblib", remote_path="/root/doppelganger.joblib")
    .add_local_file("team_builder.joblib", remote_path="/root/team_builder.joblib")
)


@app.function(image=image, min_containers=0)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def fastapi_app():
    import sys

    sys.path.insert(0, "/root")
    from serve import app as web_app  # imported inside the function, per assignment

    return web_app
