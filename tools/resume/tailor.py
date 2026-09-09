#!/usr/bin/env python3
"""
Tailor the master resume to a specific job posting using `claude -p`.

Selects and reorders entries from resume.master.md — bullets are copied
VERBATIM from the master; the only model-authored text is the Summary.

Usage:
    python tailor.py --job posting.txt                  # text file, '-' for stdin, or literal text
    python tailor.py --url https://example.com/job      # render the posting in headless Chrome
    python tailor.py --search "Acme security engineer"  # find the posting with claude (WebSearch)
    python tailor.py --general --pdf                    # regenerate the canonical resume.md/pdf
                                                        # from the master (no model; uses the
                                                        # `default: N` ranks in the meta lines)

Tailored runs are written to their own folder, named for the posting:

    resumes/<job_title>_<company>/resume.md / resume.pdf / resume.job.txt

Options:
    --master PATH    master resume (default: resume.master.md next to this script)
    --outdir DIR     parent folder for tailored runs (default: resumes/ next to this script)
    --out NAME       explicit output basename, overriding the per-job folder
                     -> NAME.md / NAME.pdf / NAME.job.txt (default for --general: resume)
    --model MODEL    model for claude -p (default: sonnet)
    --projects N     max project entries (default: 4; unlimited for --general)
    --min-scale S    readability floor for --pdf (default 0.82 ~= 8.2pt body); content
                     is trimmed (projects, then dupe-annotated experience bullets,
                     then extras) until the page fits at S or better
    --pdf            also render NAME.pdf via md_to_pdf.py

Experience bullets in the master may end with `<!-- dupe: proj-id -->`, marking a
bullet that restates a project entry: it is dropped automatically whenever that
project is selected, and is first in line for trimming under page pressure.

--url (and the page --search finds) is rendered in headless Chrome, so JS-only job
boards (Ashby, Greenhouse, Lever, Workday) work; the page's schema.org JobPosting
data is used when present. Falls back to claude's WebFetch if the browser can't do it.

    --no-browser         skip the browser, use claude WebFetch as before
    --browser-bin PATH   Chrome/Chromium binary (default: first one found on PATH)
    --browser-timeout N  seconds to let the page render (default: 45)
    --browser-profile D  Chrome profile dir to reuse — log in once with
                         `google-chrome --user-data-dir=D` to reach gated postings

Requirements:
    the `claude` CLI on PATH; a Chrome-family browser for --url/--search rendering;
    md_to_pdf.py's deps for --pdf (pip install markdown weasyprint)
"""

import argparse
import html as html_mod
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

CLAUDE_TIMEOUT = 300  # seconds per claude -p call

# Sections whose ### entries are selectable; anything else (Skills, Education)
# is carried over as-is.
ENTRY_SECTIONS = ("Experience", "Projects", "Leadership", "Writing & Talks")

META_RE = re.compile(r"<!--\s*id:\s*(?P<body>.*?)\s*-->")
TODO_RE = re.compile(r"<!--\s*TODO:.*?-->\s*\n?")
DUPE_RE = re.compile(r"\s*<!--\s*dupe:\s*(?P<target>\S+?)\s*-->")

MIN_SCALE_DEFAULT = 0.82  # readability floor: 10pt * 0.82 = 8.2pt body text


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
            tags, pin, default = [], False, None
            for part in meta_parts[1:]:
                if part.startswith("tags:"):
                    tags = [t.strip().lower() for t in part[5:].split(",") if t.strip()]
                elif part == "pin":
                    pin = True
                elif part.startswith("default:"):
                    default = int(part[8:].strip())
            bullets = META_RE.sub("", entry_body)
            bullets = TODO_RE.sub("", bullets).strip()
            # Per-line bullet items; a `<!-- dupe: proj-x -->` annotation marks a bullet
            # that restates a project entry, so it can be dropped when that project is
            # selected (or under page pressure).
            bullet_items = []
            for line in bullets.splitlines():
                if not line.strip():
                    continue
                dupe_m = DUPE_RE.search(line)
                bullet_items.append({"text": DUPE_RE.sub("", line).rstrip(),
                                     "dupe": dupe_m.group("target") if dupe_m else None})
            entries[entry_id] = {
                "section": title,
                "header": header.strip(),
                "bullets": "\n".join(b["text"] for b in bullet_items),
                "bullet_items": bullet_items,
                "tags": tags,
                "pin": pin,
                "default": default,
            }

    return frontmatter, sections, section_order, entries


def header_label(header):
    """Human-readable label for a ### header (strip HTML/markdown for the catalog)."""
    label = re.sub(r'<span class="date">(.*?)</span>', r"(\1)", header)
    label = re.sub(r"</?em>", "", label)
    label = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", label)
    return re.sub(r"\s+", " ", label).strip()


# ── Headless browser fetching ───────────────────────────────────────────────
# Most modern job boards (Ashby, Greenhouse, Lever, Workday) are JS-rendered
# SPAs: a plain HTTP fetch sees an empty shell. Rendering the page in headless
# Chrome gets the real content, and most boards embed a schema.org JobPosting
# blob that gives us the title/company/description exactly.

CHROME_CANDIDATES = ("google-chrome", "google-chrome-stable", "chromium",
                     "chromium-browser", "brave-browser", "microsoft-edge")


def find_browser(explicit=None):
    """Path to a Chrome-family binary, or None."""
    for name in ([explicit] if explicit else []) + list(CHROME_CANDIDATES):
        path = name if os.path.isabs(name) else shutil.which(name)
        if path and os.path.exists(path):
            return path
    return None


def browser_dump_dom(url, browser_bin, timeout, profile_dir=None):
    """Render `url` in headless Chrome and return the post-JavaScript DOM."""
    tmp_profile = None
    if not profile_dir:
        tmp_profile = profile_dir = tempfile.mkdtemp(prefix="tailor-chrome-")
    try:
        base = [browser_bin, "--disable-gpu", "--no-first-run", "--no-default-browser-check",
                "--hide-scrollbars", "--mute-audio", "--disable-extensions",
                "--disable-background-networking", "--disable-sync",
                f"--user-data-dir={profile_dir}",
                f"--virtual-time-budget={max(1, timeout - 5) * 1000}",
                "--dump-dom", url]
        for headless in ("--headless=new", "--headless"):
            proc = subprocess.run([base[0], headless] + base[1:], capture_output=True,
                                  text=True, timeout=timeout + 15)
            if proc.returncode == 0 and len(proc.stdout) > 500:
                return proc.stdout
            last_err = (proc.stderr or "").strip().splitlines()
        raise RuntimeError(f"chrome returned {len(proc.stdout)} bytes"
                           f"{': ' + last_err[-1][:200] if last_err else ''}")
    finally:
        if tmp_profile:
            shutil.rmtree(tmp_profile, ignore_errors=True)


def html_to_text(fragment):
    """Visible text from an HTML fragment (block tags become newlines)."""
    text = re.sub(r"(?is)<(script|style|noscript|svg|head)\b.*?</\1>", " ", fragment)
    text = re.sub(r"(?i)<(br|/p|/div|/li|/h[1-6]|/tr)\s*/?>", "\n", text)
    text = re.sub(r"(?i)<li\b[^>]*>", "\n- ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html_mod.unescape(text)
    text = re.sub(r"[ \t ]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def _first_jobposting(node, depth=0):
    """Find a schema.org JobPosting anywhere in a parsed JSON-LD blob."""
    if depth > 6:
        return None
    if isinstance(node, list):
        for item in node:
            found = _first_jobposting(item, depth + 1)
            if found:
                return found
    elif isinstance(node, dict):
        types = node.get("@type")
        types = types if isinstance(types, list) else [types]
        if "JobPosting" in types:
            return node
        for value in node.values():
            if isinstance(value, (dict, list)):
                found = _first_jobposting(value, depth + 1)
                if found:
                    return found
    return None


def _flatten(value):
    """Best-effort string from a schema.org value (str, dict, or nested Place)."""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return ", ".join(p for p in (_flatten(v) for v in value) if p)
    if isinstance(value, dict):
        if "name" in value and isinstance(value["name"], str):
            return value["name"].strip()
        parts = [value.get(k) for k in ("addressLocality", "addressRegion", "addressCountry")]
        joined = ", ".join(p for p in parts if isinstance(p, str) and p)
        if joined:
            return joined
        for key in ("address", "value"):
            if key in value:
                return _flatten(value[key])
    return ""


TITLE_NOISE_RE = re.compile(
    r"(?i)^\s*(job application for|application for|apply (?:for|to)|careers?|jobs?|job posting)\s*[:\-–]?\s+")

# Boards that put the employer in the first path segment.
BOARD_HOSTS = ("greenhouse.io", "lever.co", "ashbyhq.com", "workable.com",
               "breezy.hr", "recruitee.com", "teamtailor.com", "smartrecruiters.com")


def company_from_url(url):
    """Employer slug from a known job-board URL ('.../anthropic/jobs/123' -> 'anthropic')."""
    parts = urlsplit(url or "")
    if not any(parts.netloc.endswith(host) for host in BOARD_HOSTS):
        return ""
    segments = [seg for seg in parts.path.split("/") if seg]
    if segments and segments[0] not in ("jobs", "embed", "j", "o", "companies"):
        return segments[0].replace("-", " ")
    return ""


def extract_job_from_html(page_html):
    """(text, {'title','company'}) from a rendered page — JSON-LD first, then visible text."""
    for m in re.finditer(r'(?is)<script[^>]+application/ld\+json[^>]*>(.*?)</script>', page_html):
        try:
            data = json.loads(html_mod.unescape(m.group(1)).strip())
        except json.JSONDecodeError:
            continue
        posting = _first_jobposting(data)
        if not posting:
            continue
        title = _flatten(posting.get("title"))
        company = _flatten(posting.get("hiringOrganization"))
        header = [f"Job Title: {title}" if title else "",
                  f"Company: {company}" if company else "",
                  f"Location: {_flatten(posting.get('jobLocation'))}"
                  if posting.get("jobLocation") else "",
                  f"Employment Type: {_flatten(posting.get('employmentType'))}"
                  if posting.get("employmentType") else ""]
        body = html_to_text(_flatten(posting.get("description")) or "")
        text = "\n".join(line for line in header if line) + "\n\n" + body
        if len(text.strip()) > 400:
            return text.strip(), {"title": title, "company": company}

    # No usable JSON-LD: fall back to the rendered page's visible text.
    body_m = re.search(r"(?is)<body\b[^>]*>(.*)</body>", page_html)
    text = html_to_text(body_m.group(1) if body_m else page_html)
    hints = {"title": "", "company": ""}

    title_m = re.search(r"(?is)<title[^>]*>(.*?)</title>", page_html)
    if title_m:
        # Boards title pages "<Role> @ <Company>" / "<Role> - <Company>".
        page_title = html_mod.unescape(re.sub(r"\s+", " ", title_m.group(1))).strip()
        split = re.match(r"(?i)(.+?)\s+(?:@|\||–|—|-|·|at)\s+(.+)", page_title)
        hints = ({"title": split.group(1).strip(), "company": split.group(2).strip()}
                 if split else {"title": page_title, "company": ""})
        hints["title"] = TITLE_NOISE_RE.sub("", hints["title"]).strip()

    # Greenhouse et al. put the exact role in the <h1>; the <title> is boilerplate-wrapped.
    h1_m = re.search(r"(?is)<h1\b[^>]*>(.*?)</h1>", page_html)
    if h1_m:
        h1 = html_to_text(h1_m.group(1)).replace("\n", " ").strip()
        if 3 <= len(h1) <= 90 and not re.match(
                r"(?i)^(back to|careers?|jobs?|open (roles|positions)|apply|welcome)\b", h1):
            hints["title"] = h1
    return text, hints


def browser_fetch_job(url, args):
    """Render a posting with headless Chrome. Returns (text, hints) or None on failure."""
    browser_bin = find_browser(args.browser_bin)
    if not browser_bin:
        print("  No Chrome/Chromium binary found; falling back to claude WebFetch.",
              file=sys.stderr)
        return None
    print(f"Rendering in {os.path.basename(browser_bin)} (headless): {url}")
    try:
        page_html = browser_dump_dom(url, browser_bin, args.browser_timeout,
                                     args.browser_profile)
    except (subprocess.TimeoutExpired, RuntimeError, OSError) as err:
        print(f"  Browser fetch failed ({err}); falling back to claude WebFetch.",
              file=sys.stderr)
        return None
    text, hints = extract_job_from_html(page_html)
    if not hints.get("company"):
        hints["company"] = company_from_url(url)
    if len(text) < 400:
        print(f"  Rendered page yielded only {len(text)} chars"
              f"{' (login wall?)' if 'sign in' in text.lower() else ''};"
              f" falling back to claude WebFetch.", file=sys.stderr)
        return None
    label = " / ".join(p for p in (hints.get("title"), hints.get("company")) if p)
    print(f"  Got {len(text)} chars{f' — {label}' if label else ''}")
    return text, hints


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


URL_CONTRACT = (
    "You are a search tool. Find the job posting and return ONLY its canonical URL "
    "on one line \u2014 no markdown, no commentary. Prefer the employer's own job board "
    "(ashbyhq / greenhouse / lever / workday / the company site) over aggregators. "
    "If you cannot find it, return exactly: ERROR: <one-line reason>"
)


def resolve_search_url(query, model):
    """Ask claude to turn a search query into a posting URL (None if it can't)."""
    print(f"Searching for job posting: {query}")
    text = run_claude(f"Find the job posting for: {query}", model,
                      allowed_tools=["WebSearch", "WebFetch"], system=URL_CONTRACT).strip()
    url = re.search(r"https?://\S+", text)
    if text.startswith("ERROR:") or not url:
        print(f"  Search did not return a URL ({text[:160] or 'empty response'}).",
              file=sys.stderr)
        return None
    print(f"  Found: {url.group(0)}")
    return url.group(0)


def claude_fetch_job(args, url=None):
    """Original path: have claude retrieve the posting text (WebFetch/WebSearch)."""
    contract = (
        "You are a retrieval tool. Return ONLY the job posting content as plain text: "
        "job title, company, location, responsibilities, requirements, qualifications, "
        "and tech stack. No commentary, no markdown fences, no advice. "
        "If you cannot access the posting, return exactly: ERROR: <one-line reason>"
    )
    target = url or args.url
    if target:
        print(f"Fetching job posting with claude: {target}")
        prompt = f"Fetch this job posting and return its content as plain text: {target}"
        tools = ["WebFetch"]
    else:
        print(f"Searching for job posting: {args.search}")
        prompt = (f"Search the web for this job posting, open the best match, and return "
                  f"its content as plain text: {args.search}")
        tools = ["WebSearch", "WebFetch"]

    try:
        text = run_claude(prompt, args.model, allowed_tools=tools, system=contract).strip()
    except (RuntimeError, OSError, subprocess.TimeoutExpired, json.JSONDecodeError) as err:
        text = f"ERROR: {err}"
    if not text or text.startswith("ERROR:"):
        sys.exit(f"Could not retrieve the job posting: {text or 'empty response'}\n"
                 f"Tips: pass --browser-profile DIR with a Chrome profile that is logged in, "
                 f"or paste the posting manually with --job posting.txt")
    return text, {}


# Attribution junk that boards append; gh_jid & co. are load-bearing, so drop by name.
TRACKING_PARAMS = {"source", "src", "ref", "referrer", "gh_src", "trackingtag",
                   "lever-origin", "lever-source", "li_fat_id", "trk", "trackingid"}


def strip_tracking(url):
    """Drop utm_*/attribution params — some boards 404 or gate on them."""
    if not url:
        return url
    parts = urlsplit(url)
    if not parts.query:
        return url
    keep = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
            if not (k.lower().startswith("utm_") or k.lower() in TRACKING_PARAMS)]
    return urlunsplit(parts._replace(query=urlencode(keep)))


def fetch_job_text(args):
    """Resolve (job text, {title, company} hints) from --job / --url / --search."""
    if args.job:
        if args.job == "-":
            return sys.stdin.read(), {}
        if os.path.isfile(args.job):
            with open(args.job, "r", encoding="utf-8") as f:
                return f.read(), {}
        return args.job, {}  # literal text

    url = strip_tracking(args.url)
    if args.search:
        if args.no_browser:
            return claude_fetch_job(args)
        url = strip_tracking(resolve_search_url(args.search, args.model))
        if not url:
            return claude_fetch_job(args)

    if not args.no_browser:
        result = browser_fetch_job(url, args)
        if result:
            return result
    return claude_fetch_job(args, url)


SELECTION_CONTRACT = (
    "You are a resume-tailoring selector. You are given a job posting and a catalog of "
    "resume entries, each with an id and verbatim bullets. Respond with ONLY a JSON object "
    "(no markdown fences, no prose):\n"
    '{"job_title": "...", "company": "...", "summary": "...", "projects": [ids], '
    '"extras": [ids], "skills_emphasis": ["term", ...]}\n'
    "Rules:\n"
    "- 'job_title' and 'company' are copied from the posting (empty string if absent); "
    "they only name the output folder.\n"
    "- Select and ORDER project ids by relevance to this job. Never invent ids.\n"
    "- You may NOT rewrite, merge, or invent bullets — selection and ordering only.\n"
    "- 'summary' is the ONLY text you write: 2-3 sentences, at most 55 words, in punchy "
    "resume style (no pronouns), tailoring the candidate's real background to this role. "
    "State only facts present in the catalog.\n"
    "- 'extras' holds Leadership/Writing ids worth including (may be empty).\n"
    "- 'skills_emphasis' lists exact skill terms from the catalog's skills pool that this "
    "job values most, in priority order.\n"
    "- Prefer 3-4 projects: the resume must fit one readable page, and experience bullets "
    "already cover breadth — pick projects that ADD depth the job cares about.\n"
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
        f"Select at most {max_projects} project ids. (Experience entries are always included "
        f"and are listed only as background for the summary.) Respond with the JSON object only."
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


def general_selection(entries):
    """Deterministic default resume: entries carrying a `default: N` rank, in rank order."""
    ranked = {"Projects": [], "extras": []}
    for entry_id, e in entries.items():
        if e["section"] == "Experience" or e["default"] is None:
            continue
        bucket = "Projects" if e["section"] == "Projects" else "extras"
        ranked[bucket].append((e["default"], entry_id))
    for bucket in ranked.values():
        bucket.sort()
    return {
        "summary": None,  # keep the master summary
        "projects": [i for _, i in ranked["Projects"]],
        "extras": [i for _, i in ranked["extras"]],
        "skills_emphasis": [],
    }


def fallback_selection(job_text, entries, max_projects):
    """Deterministic tag/keyword-overlap selection when the model call fails."""
    words = set(re.findall(r"[a-z][a-z0-9+./-]{1,}", job_text.lower()))

    def score(e):
        tag_hits = sum(1 for t in e["tags"] if t in words or t.replace("-", " ") in job_text.lower())
        text_hits = sum(1 for w in set(re.findall(r"[a-z][a-z0-9+./-]{2,}", e["bullets"].lower()))
                        if w in words)
        return tag_hits * 3 + text_hits

    by_section = {"Projects": [], "extras": []}
    for entry_id, e in entries.items():
        if e["section"] == "Experience":
            continue  # experience is always included, in master order
        bucket = "Projects" if e["section"] == "Projects" else "extras"
        by_section[bucket].append((score(e), entry_id))
    for bucket in by_section.values():
        bucket.sort(key=lambda pair: -pair[0])

    return {
        "summary": None,  # keep the master summary
        "projects": [i for _, i in by_section["Projects"][:max_projects]],
        "extras": [i for s, i in by_section["extras"] if s > 0 or entries[i]["pin"]],
        "skills_emphasis": [],
    }


# ── Output naming ───────────────────────────────────────────────────────────

def slugify(text, maxlen=48):
    """Lowercase, underscore-joined, filesystem-safe slug (truncated on a word boundary)."""
    slug = re.sub(r"[^a-z0-9]+", "_", (text or "").lower()).strip("_")
    if len(slug) > maxlen:
        slug = slug[:maxlen].rsplit("_", 1)[0] or slug[:maxlen]
    return slug.strip("_")


def guess_job_meta(job_text):
    """Heuristic job title/company for when the model didn't report them."""
    labelled = {"title": "", "company": ""}
    for line in job_text.splitlines()[:40]:
        m = re.match(r"\s*(job title|position|role|title|company|employer|organization)\s*[:\-\u2013]\s*(.+)",
                     line, re.I)
        if not m:
            continue
        key = "company" if m.group(1).lower() in ("company", "employer", "organization") else "title"
        if not labelled[key]:
            labelled[key] = m.group(2).strip()
    title, company = labelled["title"], labelled["company"]
    if not title:
        for line in job_text.splitlines():
            if line.strip():
                title = re.sub(r"^#+\s*", "", line.strip())[:80]
                break
    # "Security Engineer at Acme" / "Security Engineer - Acme"
    if title and not company:
        m = re.match(r"(.+?)\s+(?:at|@|[-\u2013|])\s+(.+)", title)
        if m:
            title, company = m.group(1).strip(), m.group(2).strip()
    return title, company


def job_dir_slug(job_text, selection, hints=None):
    """Folder name for a tailored run: <job_title>_<company>.

    Structured data scraped from the posting beats the model's report of it.
    """
    title = (hints or {}).get("title", "") or ""
    company = (hints or {}).get("company", "") or ""
    if not title and not company and isinstance(selection, dict):
        title = str(selection.get("job_title") or "").strip()
        company = str(selection.get("company") or "").strip()
    if not title and not company:
        title, company = guess_job_meta(job_text)
    slug = "_".join(part for part in (slugify(title), slugify(company, 32)) if part)
    return slug or "untitled_job"


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

    # Every experience entry is always included, in master (chronological) order —
    # dropping roles would leave employment gaps.
    experience = [i for i, e in entries.items() if e["section"] == "Experience"]
    projects = clean(selection.get("projects"), ("Projects",))[:max_projects]
    extras = clean(selection.get("extras"), ("Leadership", "Writing & Talks"))

    # Pinned projects/extras are always retained (prepended in master order if dropped).
    for entry_id, e in entries.items():
        if e["section"] == "Experience" or not e["pin"]:
            continue
        target = projects if e["section"] == "Projects" else extras
        if entry_id not in target:
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
    """Build the tailored markdown in canonical section order.

    Experience bullets whose `dupe` target is a selected project are omitted
    (the project states the same work in more detail), as are any bullets the
    readability-floor ladder has cut (selection["cut_bullets"]).
    """
    summary = selection["summary"] or sections.get("Summary", "")
    skills = reorder_skills(sections.get("Skills", ""), selection["skills_emphasis"])
    selected_projects = set(selection["projects"])
    cut_bullets = selection.get("cut_bullets") or set()

    def entry_block(entry_id):
        e = entries[entry_id]
        lines = []
        for idx, b in enumerate(e["bullet_items"]):
            if e["section"] == "Experience" and b["dupe"] in selected_projects:
                continue
            if (entry_id, idx) in cut_bullets:
                continue
            lines.append(b["text"])
        return f"### {e['header']}\n\n" + "\n".join(lines)

    parts = [f"## Summary\n\n{summary}"]
    if selection["experience"]:
        parts.append("## Experience\n\n" + "\n\n".join(entry_block(i) for i in selection["experience"]))
    if skills:
        parts.append(f"## Skills\n\n{skills}")
    if selection["projects"]:
        parts.append("## Projects\n\n" + "\n\n".join(entry_block(i) for i in selection["projects"]))
    if "Education" in sections:
        edu = TODO_RE.sub("", META_RE.sub("", sections["Education"])).strip()
        parts.append(f"## Education\n\n{edu}")
    for section in ("Leadership", "Writing & Talks"):
        ids = [i for i in selection["extras"] if entries[i]["section"] == section]
        if ids:
            parts.append(f"## {section}\n\n" + "\n\n".join(entry_block(i) for i in ids))
    out = frontmatter + "\n\n" + "\n\n---\n\n".join(parts) + "\n"
    return re.sub(r"\n{3,}", "\n\n", out)


# ── PDF rendering ───────────────────────────────────────────────────────────

def _drop_project(selection, entries, min_left):
    """Pop the lowest-ranked project (if above min_left), suppressing any experience
    bullets it had been deduplicating so they don't reappear and grow the page."""
    if len(selection["projects"]) <= min_left:
        return None
    dropped = selection["projects"].pop()
    cut = selection.setdefault("cut_bullets", set())
    for entry_id in selection["experience"]:
        for idx, b in enumerate(entries[entry_id]["bullet_items"]):
            if b["dupe"] == dropped:
                cut.add((entry_id, idx))
    return dropped


def trim_steps(selection, entries):
    """Yield successive trims (mutating selection) for the readability-floor ladder."""
    while True:  # 1. projects down to 3
        dropped = _drop_project(selection, entries, 3)
        if not dropped:
            break
        yield f"dropping lowest-ranked project '{dropped}'"
    # 2. dupe-annotated experience bullets bottom-up (their detail exists in the
    #    project pool even when that project isn't on this resume)
    cut = selection.setdefault("cut_bullets", set())
    for entry_id in selection["experience"]:
        items = entries[entry_id]["bullet_items"]
        for idx in range(len(items) - 1, -1, -1):
            b = items[idx]
            if b["dupe"] and b["dupe"] not in selection["projects"] and (entry_id, idx) not in cut:
                cut.add((entry_id, idx))
                yield f"cutting experience bullet {idx + 1} of {entry_id} (detail lives in {b['dupe']})"
    # 3. unpinned extras, least-essential section first
    for section in ("Writing & Talks", "Leadership"):
        for extra_id in [i for i in reversed(selection["extras"])
                         if entries[i]["section"] == section and not entries[i]["pin"]]:
            selection["extras"].remove(extra_id)
            yield f"dropping extra '{extra_id}'"
    while True:  # 4. projects down to 2
        dropped = _drop_project(selection, entries, 2)
        if not dropped:
            break
        yield f"dropping project '{dropped}'"


def render_pdf(md_path, pdf_path, selection, frontmatter, sections, entries,
               min_scale=MIN_SCALE_DEFAULT):
    """Render via md_to_pdf.py, then keep trimming content (trim_steps ladder) until
    the page fits at a readable scale (>= min_scale) or nothing is left to trim."""
    def render_once():
        # DEBUG=1 makes md_to_pdf.py print its scale= lines, which the floor below reads.
        proc = subprocess.run([sys.executable, os.path.join(SCRIPT_DIR, "md_to_pdf.py"),
                               md_path, pdf_path], capture_output=True, text=True,
                              env={**os.environ, "DEBUG": "1"})
        sys.stdout.write(proc.stdout)
        if proc.returncode != 0:
            sys.exit(f"md_to_pdf.py failed:\n{proc.stderr.strip()[:800]}")
        if "could not fit" in proc.stdout:
            return 0.0  # 2 pages even at the 0.70 floor
        scales = re.findall(r"scale=(\d+\.\d+)", proc.stdout)
        return float(scales[-1]) if scales else 1.0

    trims = trim_steps(selection, entries)
    while True:
        scale = render_once()
        if scale >= min_scale:
            return
        step = next(trims, None)
        if step is None:
            print(f"  WARNING: still renders below the readability floor "
                  f"({scale:.2f} < {min_scale:.2f}) after all trims — shorten the "
                  f"master's bullets or lower --min-scale deliberately.")
            return
        print(f"  Scale {scale:.2f} < {min_scale:.2f}: {step}; re-rendering...")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(assemble(frontmatter, sections, entries, selection))


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Tailor resume.master.md to a job posting via claude -p.")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--job", help="job description: a file path, '-' for stdin, or literal text")
    src.add_argument("--url", help="URL of the job posting (fetched with claude + WebFetch)")
    src.add_argument("--search", help="search query to find the posting (claude + WebSearch)")
    src.add_argument("--general", action="store_true",
                     help="regenerate the canonical resume from the master's `default:` ranks (no model)")
    ap.add_argument("--master", default=os.path.join(SCRIPT_DIR, "resume.master.md"))
    ap.add_argument("--outdir", default=os.path.join(SCRIPT_DIR, "resumes"),
                    help="parent folder for tailored runs (default: resumes/ next to this script)")
    ap.add_argument("--out", default=None,
                    help="explicit output basename (writes NAME.md / NAME.pdf / NAME.job.txt); "
                         "overrides the per-job folder. Default: resumes/<job>_<company>/resume, "
                         "or resume for --general")
    ap.add_argument("--model", default="sonnet")
    ap.add_argument("--projects", type=int, default=None,
                    help="max project entries (default 4; unlimited for --general)")
    ap.add_argument("--min-scale", type=float, default=MIN_SCALE_DEFAULT,
                    help="readability floor for --pdf: keep trimming content until the "
                         f"page fits at this scale or better (default {MIN_SCALE_DEFAULT})")
    ap.add_argument("--pdf", action="store_true", help="also render a PDF via md_to_pdf.py")
    ap.add_argument("--no-browser", action="store_true",
                    help="don't render --url/--search pages in headless Chrome; use claude WebFetch")
    ap.add_argument("--browser-bin", default=os.environ.get("TAILOR_BROWSER"),
                    help="Chrome/Chromium binary to render with (default: first found on PATH)")
    ap.add_argument("--browser-timeout", type=int, default=45,
                    help="seconds to let the page render (default: 45)")
    ap.add_argument("--browser-profile", default=None,
                    help="Chrome profile dir to reuse for logged-in postings "
                         "(default: a throwaway profile)")
    args = ap.parse_args()

    if args.out is None and args.general:
        args.out = os.path.join(SCRIPT_DIR, "resume")
    if args.projects is None:
        args.projects = 10_000 if args.general else 4

    if not os.path.isfile(args.master):
        sys.exit(f"Error: master resume not found: {args.master}")

    if args.general:
        frontmatter, sections, _, entries = parse_master(args.master)
        selection = validate_selection(general_selection(entries), entries, args.projects)
        print(f"General resume: {len(selection['experience'])} roles, "
              f"{len(selection['projects'])} projects, {len(selection['extras'])} extras")
        md_path = f"{args.out}.md"
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(assemble(frontmatter, sections, entries, selection))
        print(f"Wrote {md_path} (generated from {os.path.basename(args.master)} — edit the master)")
        if args.pdf:
            render_pdf(md_path, f"{args.out}.pdf", selection, frontmatter, sections, entries,
                       args.min_scale)
            print(f"Wrote {args.out}.pdf")
        return

    job_text, job_hints = fetch_job_text(args)
    if args.url or args.search:
        preview = "\n".join(job_text.strip().splitlines()[:12])
        print(f"\nJob text preview:\n{'-' * 60}\n{preview}\n{'-' * 60}\n"
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

    if args.out is None:
        out_dir = os.path.join(args.outdir, job_dir_slug(job_text, selection, job_hints))
        os.makedirs(out_dir, exist_ok=True)
        args.out = os.path.join(out_dir, "resume")
        print(f"Output folder: {out_dir}")

    job_txt_path = f"{args.out}.job.txt"
    with open(job_txt_path, "w", encoding="utf-8") as f:
        f.write(job_text)
    print(f"Wrote {job_txt_path}")

    selection = validate_selection(selection, entries, args.projects)
    print(f"Selected: {len(selection['experience'])} roles, {len(selection['projects'])} projects, "
          f"{len(selection['extras'])} extras"
          f"{'' if selection['summary'] else ' (kept master summary)'}")

    md_path = f"{args.out}.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(assemble(frontmatter, sections, entries, selection))
    print(f"Wrote {md_path}")

    if args.pdf:
        render_pdf(md_path, f"{args.out}.pdf", selection, frontmatter, sections, entries,
                   args.min_scale)
        print(f"Wrote {args.out}.pdf — review it before submitting (the Summary is model-written).")


if __name__ == "__main__":
    main()
