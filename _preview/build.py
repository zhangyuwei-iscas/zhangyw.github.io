"""Assemble a Jekyll-simulation preview of the homepage.

Usage:  python _preview/build.py
Output: _preview/preview.html  (open in VS Code with Live Server, or any browser)

The _preview/ folder starts with an underscore, so Jekyll/GitHub Pages never
deploys it. Asset paths are rewritten to ../ so the file works both via
file:// and via Live Server serving the repo root.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def main():
    config = read("_config.yml")

    def cfg(key):
        m = re.search(rf"^\s*{key}:\s*(.+)$", config, re.M)
        return m.group(1).strip() if m else ""

    layout = read("_layouts/home.html")
    profile = read("_includes/profile-header.html")
    index = read("index.md")
    content = re.sub(r"^---\n.*?\n---\n", "", index, flags=re.S)

    verify = re.search(r'google_verify:\s*"([^"]+)"', config)
    subs = {
        "{% include profile-header.html %}": profile,
        "{{ content }}": content,
        "{% if page.title %}{{ page.title }} &#8211; {% endif %}{{ site.title }}": cfg("title"),
        "{{ site.title }}": cfg("title"),
        "{{ site.description }}": cfg("description"),
        "{{ site.owner.name }}": cfg("name"),
        "{{ site.owner.avatar }}": cfg("avatar"),
        "{{ site.owner.scholar }}": cfg("scholar"),
        "{{ site.owner.email }}": cfg("email"),
        "{{ site.owner.github }}": cfg("github"),
        "{{ site.owner.twitter }}": cfg("twitter"),
        "{% if site.google_verify %}<meta name=\"google-site-verification\" content=\"{{ site.google_verify }}\">{% endif %}":
            f'<meta name="google-site-verification" content="{verify.group(1)}">' if verify else "",
        "{{ site.url }}{{ page.url | remove: 'index.html' }}": "../",
        "{{ site.url }}": "..",
        "{{ page.url | remove: 'index.html' }}": "/",
    }
    for k, v in subs.items():
        layout = layout.replace(k, v)

    out = os.path.join(ROOT, "_preview", "preview.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(layout)

    leftover = re.findall(r"{{[^}]*}}|{%[^%]*%}", layout)
    print("written:", out)
    print("unresolved liquid tags:", leftover if leftover else "none")
    if leftover:
        sys.exit(1)


if __name__ == "__main__":
    main()
