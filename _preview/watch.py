"""Watch source files and rebuild the preview automatically.

Usage:  python _preview/watch.py
Keep it running in a terminal (e.g. VS Code integrated terminal) while editing;
every save of a watched file re-runs build.py, and Live Server refreshes the
browser page for you. Stop with Ctrl+C.
"""
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, "_preview", "build.py")

WATCH_DIRS = ["_layouts", "_includes", "assets/css", "assets/js", "images"]
WATCH_FILES = ["index.md", "_config.yml", "publications.md", "service.md", "awards.md"]


def snapshot():
    state = {}
    for name in WATCH_FILES:
        p = os.path.join(ROOT, name)
        if os.path.exists(p):
            state[p] = os.path.getmtime(p)
    for d in WATCH_DIRS:
        base = os.path.join(ROOT, d)
        for dirpath, _, files in os.walk(base):
            for f in files:
                p = os.path.join(dirpath, f)
                state[p] = os.path.getmtime(p)
    return state


def rebuild(changed):
    print("changed:", ", ".join(sorted(changed)), "-> rebuilding...", flush=True)
    subprocess.run([sys.executable, BUILD])


def main():
    prev = snapshot()
    rebuild(["(initial)"])
    print("watching for changes... Ctrl+C to stop", flush=True)
    while True:
        time.sleep(0.6)
        cur = snapshot()
        changed = {p for p, t in cur.items() if prev.get(p) != t} | {
            p for p in prev if p not in cur
        }
        if changed:
            rebuild(os.path.relpath(p, ROOT) for p in changed)
            prev = cur


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nstopped.")
