# Unveiled Ink — Project Notes

Working notebook for the site maintainers (Khalid + Sulay). See `README.md` for technical docs.

## Status as of April 2026

- **v9 is live** — Spanish toggle works, both languages embedded in one `index.html`
- **Domain not yet connected** — `unveiledink.com` still points at the old Squarespace site
- **No CMS yet** — content is edited by modifying JSON files in the GitHub repo directly

## Current priorities

1. Sulay reviews the Spanish translations (see `SPANISH_REVIEW.docx` — separate Word doc, not in repo)
2. Set up Decap CMS so Sulay can edit content without touching code
3. Connect `unveiledink.com` domain to Netlify (do this LAST, after CMS is working)

## Decisions made and why

**Both languages embedded in one `index.html`, swapped by JavaScript.**
Considered separate `/es/` pages for SEO. Chose single-page + toggle because: (a) build stays simple, (b) language swap is instant with no page reload, (c) works better for Decap CMS since we don't have to maintain two URL trees. Head meta tags render in English for crawlers; Google executes the JS so it sees both.

**Using `tú` (not `usted`) in Spanish translations.**
The English site uses warm, first-person voice ("I can help you tell it"). `usted` would sound formal/distant. Sulay will confirm this is right — she's from a Dominican background and is the final authority on tone.

**Book titles stay in English in the Spanish version.**
The books were published in English. A native Spanish reader looking at the portfolio knows the book's English title because that's what they'd search for. Translating titles would confuse more than clarify.

**Book subtitles DO get translated.**
"A Novel" → "Una novela", "A Memoir" → "Unas memorias", etc. These are generic descriptors, not part of the title proper.

**Editorial workflow for Decap CMS (when we set it up).**
Sulay's edits will become drafts first, then she publishes. Gives her a preview URL and the ability to walk away mid-edit. Book editor's instinct is to revise — editorial workflow matches how she already works.

**GitHub OAuth for CMS authentication (when we set it up).**
Considered Netlify Identity (simpler, deprecated-but-working) and DecapBridge (third party). Chose GitHub OAuth because: most future-proof, no third-party dependencies, no migration risk. Cost: Sulay needs a GitHub account, but Khalid will set it up for her in her name, with her email and her phone for 2FA. She'll be a "Collaborator" on the repo (not owner).

## Open questions / revisit later

- **JS-disabled users see a blank page.** Everything renders via JS now. Googlebot is fine (executes JS). If we ever want to support JS-off, the fix is to pre-render English markup in the template.
- **Sulay's Spanish review pass.** Deferred until after Decap CMS is set up so she can edit in the CMS UI instead of a Word doc.
- **Should the CMS also let her upload book covers?** Decap can handle this, but requires a bit more config. Defaulting to "no" for v10; can add later.

## What's in this folder

- `README.md` — technical docs (start here if you haven't worked on this before)
- `NOTES.md` — this file
- `index.html` — the built site (don't edit directly; regenerate with `python3 build.py`)
- `index-template.html` — template with placeholders
- `build.py` — Python script that builds `index.html` from JSON data
- `build_review_doc.js` — generates the Spanish review Word doc
- `data/` — the content (6 JSON files, EN + ES pairs)
- `images/` — headshot and 43 book covers

## History

- **v8** (pre-April 2026): Original single-language site built from template + JSON
- **v9** (April 2026): Added Spanish toggle, extracted UI chrome to JSON, new build script
- **v10** (planned): Decap CMS integration
- **v11** (planned): Domain connection to `unveiledink.com`
