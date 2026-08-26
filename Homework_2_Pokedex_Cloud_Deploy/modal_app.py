"""Modal deployment entry point for the Pokedex Explorer Streamlit app.

Usage:
    uv run modal serve modal_app.py    # dev server, hot-reloads on save
    uv run modal deploy modal_app.py   # deploy a persistent public URL
"""

import subprocess

import modal

app = modal.App("pokedex-explorer")

image = (
    modal.Image.debian_slim(python_version="3.13")
    .pip_install(
        "pandas>=3.0.5",
        "plotly>=6.9.0",
        "streamlit>=1.62.0",
        "supabase>=2.31.0",
        "python-dotenv>=1.2.3",
    )
    .add_local_file("app.py", remote_path="/root/app.py")
)


@app.function(image=image, min_containers=0, secrets=[modal.Secret.from_name("pokedex-supabase")])
@modal.concurrent(max_inputs=100)
@modal.web_server(8000, startup_timeout=60)
def run():
    subprocess.Popen(
        "streamlit run app.py --server.port 8000 --server.address 0.0.0.0 --server.headless true",
        shell=True,
        cwd="/root",
    )
