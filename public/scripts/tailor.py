#!/usr/bin/env python3
"""
Tailor the master resume to a specific job posting using `claude -p`.

Selects and reorders entries from resume.master.md — bullets are copied
VERBATIM from the master; the only model-authored text is the Summary.

Usage:
    python tailor.py --job posting.txt                  # text file, '-' for stdin, or literal text
    python tailor.py --url https://example.com/job      # fetch the posting with claude (WebFetch)
    python tailor.py --search "Acme security engineer"  # find the posting with claude (WebSearch)

Options:
    --master PATH    master resume (default: resume.master.md next to this script)
    --out NAME       output basename (default: resume.tailored) -> NAME.md / NAME.pdf / NAME.job.txt
    --model MODEL    model for claude -p (default: sonnet)
    --projects N     max project entries on the tailored resume (default: 5)
    --pdf            also render NAME.pdf via md_to_pdf.py

Requirements:
    the `claude` CLI on PATH; md_to_pdf.py's deps for --pdf (pip install markdown weasyprint)
"""

import argparse
import json
import os
import re
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

CLAUDE_TIMEOUT = 300  # seconds per claude -p call

# Sections whose ### entries are selectable; anything else (Skills, Education)
# is carried over as-is.
ENTRY_SECTIONS = ("Experience", "Projects", "Leadership", "Writing")

META_RE = re.compile(r"<!--\s*id:\s*(?P<body>.*?)\s*-->")
TODO_RE = re.compile(r"<!--\s*TODO:.*?-->\s*\n?")


# ── Master parsing ──────────────────────────────────────────────────────────

def parse_master(md_path):
    """Parse the master resume into (frontmatter, sections, entries).

    sections: ordered {title: raw_body} for non-entry sections (Summary, Skills, ...)
    entries:  ordered {id: {section, header, bullets, tags, pin}}
    """
    with open(md_path, "r", encoding="utf-8") as f:
        text = f.read()

    frontmatter = ""
    body = text
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            frontmatter = f"---{parts[1]}---"
            body = parts[2]

    sections = {}
    entries = {}
    section_order = []

    for chunk in re.split(r"^## ", body, flags=re.M)[1:]:
        title, _, section_body = chunk.partition("\n")
        title = title.strip()
        section_order.append(title)
        # Drop the trailing `---` separator; we re-add separators on emit.
        section_body = re.sub(r"\n---\s*$", "", section_body.strip())

        if title not in ENTRY_SECTIONS:
            sections[title] = section_body
            continue

        for entry_chunk in re.split(r"^### ", section_body, flags=re.M)[1:]:
            header, _, entry_body = entry_chunk.partition("\n")
            meta_m = META_RE.search(entry_body)
            if not meta_m:
                print(f"Warning: entry without <!-- id --> meta in {title}: {header[:60]}",
                      file=sys.stderr)
                continue
            meta_parts = [p.strip() for p in meta_m.group("body").split("|")]
            entry_id = meta_parts[0]
            tags, pin = [], False
            for part in meta_parts[1:]:
                if part.startswith("tags:"):
                    tags = [t.strip().lower() for t in part[5:].split(",") if t.strip()]
                elif part == "pin":
                    pin = True
            bullets = META_RE.sub("", entry_body)
            bullets = TODO_RE.sub("", bullets).strip()
            entries[entry_id] = {
                "section": title,
                "header": header.strip(),
                "bullets": bullets,
                "tags": tags,
                "pin": pin,
            }

    return frontmatter, sections, section_order, entries


def header_label(header):
    """Human-readable label for a ### header (strip HTML/markdown for the catalog)."""
    label = re.sub(r'<span class="date">(.*?)</span>', r"(\1)", header)
    label = re.sub(r"</?em>", "", label)
    label = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", label)
    return re.sub(r"\s+", " ", label).strip()


# ── claude -p plumbing ──────────────────────────────────────────────────────

def run_claude(prompt, model, allowed_tools=None, system=None):
    """Run `claude -p` with the prompt on stdin; return the result text."""
    cmd = ["claude", "-p", "--model", model, "--output-format", "json"]
    if allowed_tools:
        cmd += ["--allowedTools", ",".join(allowed_tools)]
    if system:
        cmd += ["--append-system-prompt", system]
    proc = subprocess.run(cmd, input=prompt, capture_output=True, text=True,
                          timeout=CLAUDE_TIMEOUT)
    if proc.returncode != 0:
        raise RuntimeError(f"claude -p failed (exit {proc.returncode}): {proc.stderr.strip()[:500]}")
    envelope = json.loads(proc.stdout)
    if envelope.get("is_error"):
        raise RuntimeError(f"claude -p returned an error: {str(envelope.get('result'))[:500]}")
    return envelope.get("result", "")


def fetch_job_text(args):
    """Resolve the job description text from --job / --url / --search."""
    if args.job:
        if args.job == "-":
            return sys.stdin.read()
        if os.path.isfile(args.job):
            with open(args.job, "r", encoding="utf-8") as f:
                return f.read()
        return args.job  # literal text

    contract = (
        "You are a retrieval tool. Return ONLY the job posting content as plain text: "
        "job title, company, location, responsibilities, requirements, qualifications, "
        "and tech stack. No commentary, no markdown fences, no advice. "
        "If you cannot access the posting, return exactly: ERROR: <one-line reason>"
    )
    if args.url:
        print(f"Fetching job posting: {args.url}")
        prompt = f"Fetch this job posting and return its content as plain text: {args.url}"
        tools = ["WebFetch"]
    else:
        print(f"Searching for job posting: {args.search}")
        prompt = (f"Search the web for this job posting, open the best match, and return "
                  f"its content as plain text: {args.search}")
        tools = ["WebSearch", "WebFetch"]

    text = run_claude(prompt, args.model, allowed_tools=tools, system=contract).strip()
    if not text or text.startswith("ERROR:"):
        sys.exit(f"Could not retrieve the job posting: {text or 'empty response'}\n"
                 f"Tip: paste it manually with --job posting.txt (login-walled sites often block fetches).")
    return text


SELECTION_CONTRACT = (
    "You are a resume-tailoring selector. You are given a job posting and a catalog of "
    "resume entries, each with an id and verbatim bullets. Respond with ONLY a JSON object "
    "(no markdown fences, no prose):\n"
    '{"summary": "...", "experience": [ids], "projects": [ids], "extras": [ids], '
    '"skills_emphasis": ["term", ...]}\n'
    "Rules:\n"
    "- Select and ORDER entry ids by relevance to this job. Never invent ids.\n"
    "- You may NOT rewrite, merge, or invent bullets — selection and ordering only.\n"
    "- 'summary' is the ONLY text you write: 2-3 sentences tailoring the candidate's real "
    "background to this role. State only facts present in the catalog.\n"
    "- 'extras' holds Leadership/Writing ids worth including (may be empty).\n"
    "- 'skills_emphasis' lists exact skill terms from the catalog's skills pool that this "
    "job values most, in priority order.\n"
    "- Do not use any tools. Respond immediately with the JSON object."
)


def select_entries(job_text, entries, skills_pool, max_projects, model):
    """Ask claude to pick and order entry ids; returns the parsed selection dict."""
    catalog_lines = []
    for entry_id, e in entries.items():
        catalog_lines.append(f"[{e['section']}] id={entry_id}"
                             f"{' (always included)' if e['pin'] else ''}")
        catalog_lines.append(f"  {header_label(e['header'])}  tags: {', '.join(e['tags'])}")
        for line in e["bullets"].splitlines():
            if line.strip():
                catalog_lines.append(f"  {line.strip()}")
    prompt = (
        f"JOB POSTING:\n{job_text.strip()}\n\n"
        f"RESUME CATALOG:\n" + "\n".join(catalog_lines) + "\n\n"
        f"SKILLS POOL:\n{skills_pool.strip()}\n\n"
        f"Select at most {max_projects} project ids. Include every experience id unless one is "
        f"clearly irrelevant to this job. Respond with the JSON object only."
    )

    raw = run_claude(prompt, model, system=SELECTION_CONTRACT)
    for attempt in (1, 2):
        try:
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
            m = re.search(r"\{.*\}", cleaned, re.S)
            return json.loads(m.group(0) if m else cleaned)
        except (json.JSONDecodeError, AttributeError):
            if attempt == 2:
                raise
            print("  Model response was not valid JSON; retrying once...", file=sys.stderr)
            raw = run_claude(prompt + "\n\nREMINDER: respond with ONLY the raw JSON object.",
                             model, system=SELECTION_CONTRACT)


def fallback_selection(job_text, entries, max_projects):
    """Deterministic tag/keyword-overlap selection when the model call fails."""
    words = set(re.findall(r"[a-z][a-z0-9+./-]{1,}", job_text.lower()))

    def score(e):
        tag_hits = sum(1 for t in e["tags"] if t in words or t.replace("-", " ") in job_text.lower())
        text_hits = sum(1 for w in set(re.findall(r"[a-z][a-z0-9+./-]{2,}", e["bullets"].lower()))
                        if w in words)
        return tag_hits * 3 + text_hits

    by_section = {"Experience": [], "Projects": [], "extras": []}
    for entry_id, e in entries.items():
        bucket = e["section"] if e["section"] in ("Experience", "Projects") else "extras"
        by_section[bucket].append((score(e), entry_id))
    for bucket in by_section.values():
        bucket.sort(key=lambda pair: -pair[0])

    return {
        "summary": None,  # keep the master summary
        "experience": [i for _, i in by_section["Experience"]],
        "projects": [i for _, i in by_section["Projects"][:max_projects]],
        "extras": [i for s, i in by_section["extras"] if s > 0 or entries[i]["pin"]],
        "skills_emphasis": [],
    }


# ── Validation & assembly ───────────────────────────────────────────────────

def validate_selection(selection, entries, max_projects):
    """Enforce the select-and-reorder-only contract; returns cleaned selection."""
    def clean(ids, section_ok):
        seen, out = set(), []
        for i in ids or []:
            if i in entries and i not in seen and entries[i]["section"] in section_ok:
                seen.add(i)
                out.append(i)
            elif i not in entries:
                print(f"  Dropping unknown id from model output: {i}", file=sys.stderr)
        return out

    experience = clean(selection.get("experience"), ("Experience",))
    projects = clean(selection.get("projects"), ("Projects",))[:max_projects]
    extras = clean(selection.get("extras"), ("Leadership", "Writing"))

    # Pinned entries are always retained (prepended in master order if dropped).
    for entry_id, e in entries.items():
        target = {"Experience": experience, "Projects": projects}.get(e["section"], extras)
        if e["pin"] and entry_id not in target:
            target.insert(0, entry_id)

    summary = selection.get("summary")
    return {"summary": summary.strip() if isinstance(summary, str) and summary.strip() else None,
            "experience": experience, "projects": projects, "extras": extras,
            "skills_emphasis": selection.get("skills_emphasis") or []}


def reorder_skills(skills_body, emphasis):
    """Move emphasized terms to the front of their **Category:** line; drop nothing."""
    if not emphasis:
        return skills_body
    emph_lower = [t.strip().lower() for t in emphasis if isinstance(t, str)]

    def rework(m):
        label, items = m.group(1), [s.strip() for s in m.group(2).split(",")]
        ranked = sorted(items, key=lambda s: emph_lower.index(s.lower())
                        if s.lower() in emph_lower else len(emph_lower))
        return f"{label} {', '.join(ranked)}"

    return re.sub(r"^(\*\*[^:]+:\*\*) (.+)$", rework, skills_body, flags=re.M)


def assemble(frontmatter, sections, entries, selection):
    """Build the tailored markdown in canonical section order."""
    summary = selection["summary"] or sections.get("Summary", "")
    skills = reorder_skills(sections.get("Skills", ""), selection["skills_emphasis"])

    def entry_block(entry_id):
        e = entries[entry_id]
        return f"### {e['header']}\n\n{e['bullets']}"

    parts = [frontmatter, f"## Summary\n\n{summary}"]
    if selection["experience"]:
        parts.append("## Experience\n\n" + "\n\n".join(entry_block(i) for i in selection["experience"]))
    if skills:
        parts.append(f"## Skills\n\n{skills}")
    if selection["projects"]:
        parts.append("## Projects\n\n" + "\n\n".join(entry_block(i) for i in selection["projects"]))
    if "Education" in sections:
        edu = TODO_RE.sub("", META_RE.sub("", sections["Education"])).strip()
        parts.append(f"## Education\n\n{edu}")
    for section in ("Leadership", "Writing"):
        ids = [i for i in selection["extras"] if entries[i]["section"] == section]
        if ids:
            parts.append(f"## {section}\n\n" + "\n\n".join(entry_block(i) for i in ids))
    return "\n\n---\n\n".join(parts) + "\n"


# ── PDF rendering ───────────────────────────────────────────────────────────

def render_pdf(md_path, pdf_path, selection, frontmatter, sections, entries):
    """Render via md_to_pdf.py; if it can't fit one page, drop the lowest-ranked
    project and retry (down to 3 projects)."""
    while True:
        proc = subprocess.run([sys.executable, os.path.join(SCRIPT_DIR, "md_to_pdf.py"),
                               md_path, pdf_path], capture_output=True, text=True)
        sys.stdout.write(proc.stdout)
        if proc.returncode != 0:
            sys.exit(f"md_to_pdf.py failed:\n{proc.stderr.strip()[:800]}")
        if "could not fit" not in proc.stdout or len(selection["projects"]) <= 3:
            return
        dropped = selection["projects"].pop()
        print(f"  Overflow: dropping lowest-ranked project '{dropped}' and re-rendering...")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(assemble(frontmatter, sections, entries, selection))


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Tailor resume.master.md to a job posting via claude -p.")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--job", help="job description: a file path, '-' for stdin, or literal text")
    src.add_argument("--url", help="URL of the job posting (fetched with claude + WebFetch)")
    src.add_argument("--search", help="search query to find the posting (claude + WebSearch)")
    ap.add_argument("--master", default=os.path.join(SCRIPT_DIR, "resume.master.md"))
    ap.add_argument("--out", default=os.path.join(SCRIPT_DIR, "resume.tailored"),
                    help="output basename (writes NAME.md / NAME.pdf / NAME.job.txt)")
    ap.add_argument("--model", default="sonnet")
    ap.add_argument("--projects", type=int, default=5, help="max project entries (default 5)")
    ap.add_argument("--pdf", action="store_true", help="also render a PDF via md_to_pdf.py")
    args = ap.parse_args()

    if not os.path.isfile(args.master):
        sys.exit(f"Error: master resume not found: {args.master}")

    job_text = fetch_job_text(args)
    if args.url or args.search:
        job_txt_path = f"{args.out}.job.txt"
        with open(job_txt_path, "w", encoding="utf-8") as f:
            f.write(job_text)
        preview = "\n".join(job_text.strip().splitlines()[:12])
        print(f"\nSaved job text to {job_txt_path} — preview:\n{'-' * 60}\n{preview}\n{'-' * 60}\n"
              f"(verify this is the right posting; re-run with --job if not)\n")

    frontmatter, sections, _, entries = parse_master(args.master)
    print(f"Master: {len(entries)} entries "
          f"({sum(1 for e in entries.values() if e['section'] == 'Projects')} projects)")

    print(f"Selecting relevant entries with claude -p (model: {args.model})...")
    try:
        selection = select_entries(job_text, entries, sections.get("Skills", ""),
                                   args.projects, args.model)
    except Exception as err:  # noqa: BLE001 — any model failure falls back
        print(f"  Model selection failed ({err}); using tag-overlap fallback.", file=sys.stderr)
        selection = fallback_selection(job_text, entries, args.projects)

    selection = validate_selection(selection, entries, args.projects)
    print(f"Selected: {len(selection['experience'])} roles, {len(selection['projects'])} projects, "
          f"{len(selection['extras'])} extras"
          f"{'' if selection['summary'] else ' (kept master summary)'}")

    md_path = f"{args.out}.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(assemble(frontmatter, sections, entries, selection))
    print(f"Wrote {md_path}")

    if args.pdf:
        render_pdf(md_path, f"{args.out}.pdf", selection, frontmatter, sections, entries)
        print(f"Wrote {args.out}.pdf — review it before submitting (the Summary is model-written).")


if __name__ == "__main__":
    main()
