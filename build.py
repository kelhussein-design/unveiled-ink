#!/usr/bin/env python3
"""Build index.html from the bilingual template and JSON data files.

Reads:
  data/content.en.json, data/content.es.json
  data/books.en.json,   data/books.es.json
  data/testimonials.en.json, data/testimonials.es.json
  index-template.html

Writes:
  index.html

The template has placeholders that this script replaces:
  - Head meta placeholders (HTML_LANG_PLACEHOLDER, PAGE_TITLE_PLACEHOLDER, etc.)
    are filled with ENGLISH values so that crawlers, social-card bots, and
    no-JS users see English by default. The client-side render() swaps them
    live based on URL/localStorage.
  - CONTENT_EN_PLACEHOLDER / CONTENT_ES_PLACEHOLDER: the JSON for each lang
  - BOOKS_EN_PLACEHOLDER / BOOKS_ES_PLACEHOLDER: the books JSON
  - TESTIMONIALS_EN_PLACEHOLDER / TESTIMONIALS_ES_PLACEHOLDER: testimonials JSON

Usage:
  python3 build.py
"""

import json
import sys
from pathlib import Path


def main():
    root = Path(__file__).parent
    data_dir = root / "data"
    template_path = root / "index-template.html"
    output_path = root / "index.html"

    # Validate inputs
    required = [
        data_dir / "content.en.json",
        data_dir / "content.es.json",
        data_dir / "books.en.json",
        data_dir / "books.es.json",
        data_dir / "testimonials.en.json",
        data_dir / "testimonials.es.json",
        template_path,
    ]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        print("ERROR: missing files:", *missing, sep="\n  ")
        sys.exit(1)

    # Load and validate JSON (parse + re-dump to guarantee valid JS literals)
    def load_json(p):
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)

    content_en = load_json(data_dir / "content.en.json")
    content_es = load_json(data_dir / "content.es.json")
    books_en = load_json(data_dir / "books.en.json")
    books_es = load_json(data_dir / "books.es.json")
    testimonials_en = load_json(data_dir / "testimonials.en.json")
    testimonials_es = load_json(data_dir / "testimonials.es.json")

    # Consistency check: books.es must have all slugs from books.en
    en_slugs = set(books_en["books"].keys())
    es_slugs = set(books_es["books"].keys())
    if en_slugs != es_slugs:
        missing_in_es = en_slugs - es_slugs
        extra_in_es = es_slugs - en_slugs
        print("WARNING: book slug mismatch between EN and ES")
        if missing_in_es:
            print("  Missing in ES:", missing_in_es)
        if extra_in_es:
            print("  Extra in ES:", extra_in_es)

    # Consistency check: testimonials count
    if len(testimonials_en["testimonials"]) != len(testimonials_es["testimonials"]):
        print(
            f"WARNING: testimonial count mismatch "
            f"(EN={len(testimonials_en['testimonials'])}, "
            f"ES={len(testimonials_es['testimonials'])})"
        )

    # Load template
    with open(template_path, "r", encoding="utf-8") as f:
        template = f.read()

    # Head meta placeholders (server-rendered with English so non-JS crawlers
    # see English by default; client JS swaps them live based on URL/localStorage).
    meta_en = content_en["meta"]
    replacements_head = {
        "HTML_LANG_PLACEHOLDER": meta_en["html_lang"],
        "PAGE_TITLE_PLACEHOLDER": meta_en["page_title"],
        "PAGE_DESCRIPTION_PLACEHOLDER": meta_en["page_description"],
        "OG_TITLE_PLACEHOLDER": meta_en["og_title"],
        "OG_DESCRIPTION_PLACEHOLDER": meta_en["og_description"],
        "LOCALE_PLACEHOLDER": meta_en["locale"],
        "TWITTER_TITLE_PLACEHOLDER": meta_en["twitter_title"],
        "TWITTER_DESCRIPTION_PLACEHOLDER": meta_en["twitter_description"],
    }

    # JSON data placeholders — dump as compact JSON. Use ensure_ascii=False so
    # UTF-8 ñ, é etc. survive. Do NOT allow the literal sequence "</script>" to
    # break out of the script tag: replace forward slash in any such substring
    # with an escape. (The JSON strings in this project don't contain </script>
    # but we defend against future content.)
    def js_literal(obj):
        s = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
        return s.replace("</", "<\\/")

    replacements_data = {
        "CONTENT_EN_PLACEHOLDER": js_literal(content_en),
        "CONTENT_ES_PLACEHOLDER": js_literal(content_es),
        "BOOKS_EN_PLACEHOLDER": js_literal(books_en),
        "BOOKS_ES_PLACEHOLDER": js_literal(books_es),
        "TESTIMONIALS_EN_PLACEHOLDER": js_literal(testimonials_en),
        "TESTIMONIALS_ES_PLACEHOLDER": js_literal(testimonials_es),
    }

    # Apply replacements. Head first (simple string replacements), then data.
    html = template
    for key, val in replacements_head.items():
        if key not in html:
            print(f"WARNING: placeholder '{key}' not found in template")
        html = html.replace(key, val)
    for key, val in replacements_data.items():
        if key not in html:
            print(f"WARNING: placeholder '{key}' not found in template")
        html = html.replace(key, val)

    # Sanity: no placeholders should remain
    remaining = [k for k in (list(replacements_head) + list(replacements_data)) if k in html]
    if remaining:
        print("ERROR: unreplaced placeholders:", remaining)
        sys.exit(1)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    size_kb = output_path.stat().st_size / 1024
    print(f"Built {output_path.name} ({size_kb:.1f} KB)")
    print(f"  {len(books_en['books'])} books (EN), {len(books_es['books'])} books (ES)")
    print(f"  {len(testimonials_en['testimonials'])} testimonials each")


if __name__ == "__main__":
    main()
