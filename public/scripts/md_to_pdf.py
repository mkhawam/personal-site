#!/usr/bin/env python3
"""
Markdown to PDF resume generator with custom styling.
Automatically scales to fit exactly one page.

Usage:
    python md_to_pdf.py [input.md] [output.pdf]

Defaults:
    input:  resume.md  (in the same directory as this script)
    output: resume.pdf (in the same directory as this script)

Requirements:
    pip install markdown weasyprint
"""

import sys
import os
import re
import yaml
import markdown

from weasyprint import HTML

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Tunable base values (at scale=1.0) ──
BASE_BODY_FONT = 10.0      # pt
BASE_LINE_HEIGHT = 1.15
BASE_H1_FONT = 20          # pt
BASE_H2_FONT = 12          # pt
BASE_CONTACT_FONT = 8.5    # pt
BASE_MARGIN_TOP = 0.3      # in
BASE_MARGIN_SIDE = 0.4     # in
BASE_MARGIN_BOT = 0.3      # in


def build_css(scale: float = 1.0) -> str:
    """Return the full CSS string, scaled by `scale` (1.0 = no change)."""
    body_font = BASE_BODY_FONT * scale
    # Line-height scales gently (e.g. 1.30 → 1.18 at scale=0.80)
    line_h = BASE_LINE_HEIGHT - (1.0 - scale) * 0.6
    h1_font = BASE_H1_FONT * scale
    h2_font = BASE_H2_FONT * scale
    contact_font = BASE_CONTACT_FONT * scale
    # Margins shrink proportionally with scale
    m_top = BASE_MARGIN_TOP * scale
    m_side = max(BASE_MARGIN_SIDE * scale, 0.35)
    m_bot = BASE_MARGIN_BOT * scale

    return f"""
@page {{
    size: Letter;
    margin: {m_top:.3f}in {m_side:.3f}in {m_bot:.3f}in {m_side:.3f}in;
}}

body {{
    font-family: "Georgia", "Times New Roman", serif;
    font-size: {body_font:.2f}pt;
    line-height: {line_h};
    color: #1a1a1a;
    margin: 0;
    padding: 0;
}}

* {{
    border: none;
    outline: none;
}}

/* ── Name ── */
h1 {{
    font-size: {h1_font:.1f}pt;
    text-align: center;
    margin: 0 0 2px 0;
    padding: 0;
    color: #000;
    font-weight: 700;
    letter-spacing: 0.5px;
}}

/* Contact line right below the name */
.contact-line {{
    text-align: center;
    font-size: {contact_font:.1f}pt;
    color: #333;
    margin: 0 0 6px 0;
}}
.contact-line a {{
    color: #333;
    text-decoration: none;
}}
.contact-line a:hover {{
    text-decoration: underline;
}}
.contact-line .sep {{
    margin: 0 4px;
}}
.contact-line .social-icon {{
    width: {contact_font * 1.1:.1f}pt;
    height: {contact_font * 1.1:.1f}pt;
    vertical-align: middle;
    margin-right: 2px;
    display: inline-block;
}}

/* ── Section headers (Experience, Skills, …) ── */
h2 {{
    font-size: {h2_font:.1f}pt;
    font-weight: 700;
    color: #000;
    border-bottom: 1.5px solid #000;
    margin: {6 * scale:.1f}px 0 {2 * scale:.1f}px 0;
    padding-bottom: 1px;
    text-transform: capitalize;
}}

/* ── Entry header row (ATS-friendly div layout) ── */
.entry-header {{
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: {3 * scale:.1f}px 0 0 0;
    gap: 8px;
    border: none;
    outline: none;
    background: none;
}}
.entry-header span {{
    border: none;
    outline: none;
    background: none;
}}
.entry-header .entry-left {{
    text-align: left;
    font-size: {body_font:.2f}pt;
    flex-shrink: 1;
}}
.entry-header .entry-left strong {{
    font-weight: 700;
}}
.entry-header .entry-left em {{
    font-style: italic;
    font-weight: normal;
}}
.entry-header .entry-right {{
    text-align: right;
    font-weight: 700;
    white-space: nowrap;
    font-size: {body_font:.2f}pt;
    flex-shrink: 0;
}}
.entry-header .entry-left a {{
    font-weight: 700;
    text-decoration: underline;
}}

/* ── Bullet lists ── */
ul {{
    margin: 1px 0 {2 * scale:.1f}px 0;
    padding-left: 16px;
}}

li {{
    margin-bottom: 1.5px;
    text-align: justify;
}}

/* ── Horizontal rules (hidden, sections separated by h2 borders) ── */
hr {{
    border: none;
    height: 0;
    margin: 0;
    padding: 0;
    display: none;
}}

/* ── Links (black text for ATS, still clickable) ── */
a {{
    color: #000;
    text-decoration: underline;
}}

strong {{
    font-weight: 700;
}}

p {{
    margin: 0 0 2px 0;
}}

/* ── Hidden ATS-only contact block (invisible but in document flow for extraction) ── */
.ats-contact {{
    font-size: 0.1pt;
    line-height: 0;
    color: white;
    height: 0;
    overflow: hidden;
    margin: 0;
    padding: 0;
}}
"""


# ── SVG icons (inline, no external dependencies) ──
ICONS = {
    "github": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>',
    "linkedin": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    "globe": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    "email": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    "phone": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
}


def _parse_frontmatter(md_text: str):
    """Split YAML frontmatter from markdown body. Returns (meta_dict, body_str)."""
    if md_text.startswith("---"):
        parts = md_text.split("---", 2)
        if len(parts) >= 3:
            meta = yaml.safe_load(parts[1]) or {}
            body = parts[2].strip()
            return meta, body
    return {}, md_text


def _build_header_html(meta: dict) -> str:
    """Build the HTML header from YAML frontmatter."""
    if not meta:
        return ""

    name = meta.get("name", "")
    parts = []

    # Location
    location = meta.get("location", "")
    if location:
        parts.append(location)

    # Email
    email = meta.get("email", "")
    if email:
        icon = f'<span class="social-icon">{ICONS.get("email", "")}</span>'
        parts.append(f'{icon}<a href="mailto:{email}">{email}</a>')

    # Phone
    phone = meta.get("phone", "")
    if phone:
        icon = f'<span class="social-icon">{ICONS.get("phone", "")}</span>'
        parts.append(f'{icon}{phone}')

    # Socials
    for social in meta.get("socials", []):
        icon_name = social.get("icon", "globe")
        label = social.get("label", social.get("url", ""))
        url = social.get("url", "#")
        icon_svg = ICONS.get(icon_name, ICONS.get("globe", ""))
        icon_html = f'<span class="social-icon">{icon_svg}</span>'
        parts.append(f'{icon_html}<a href="{url}">{label}</a>')

    sep = '<span class="sep">|</span>'
    contact_line = sep.join(parts)

    return f'<h1>{name}</h1>\n<div class="contact-line">{contact_line}</div>'


def _build_ats_contact(meta: dict) -> str:
    """Build a hidden plain-text contact block that ATS can extract reliably."""
    if not meta:
        return ""
    parts = []
    if meta.get("name"):
        parts.append(meta["name"])
    if meta.get("location"):
        parts.append(meta["location"])
    if meta.get("email"):
        parts.append(meta["email"])
    if meta.get("phone"):
        parts.append(meta["phone"])
    for social in meta.get("socials", []):
        label = social.get("label", social.get("url", ""))
        if label:
            parts.append(label)
    return '<div class="ats-contact">' + " | ".join(parts) + "</div>"


def _build_pdf_metadata(meta: dict) -> dict:
    """Build PDF metadata dict from YAML frontmatter for ATS document-level parsing."""
    name = meta.get("name", "Resume")
    email = meta.get("email", "")
    phone = meta.get("phone", "")
    location = meta.get("location", "")
    socials = [s.get("label", "") for s in meta.get("socials", []) if s.get("label")]

    keywords = [k for k in [email, phone, location] + socials if k]

    return {
        "title": f"{name} - Resume",
        "authors": [name],
        "subject": f"{name} | {email} | {phone}",
        "keywords": ", ".join(keywords),
        "creator": name,
    }


def _h3_to_divs(html: str) -> str:
    """
    Convert each <h3> with the pattern:
        Company, <em>Title</em> <span class="date">Date</span>
    or  <a href="...">Project</a> <span class="date">Date</span>
    into ATS-friendly <div> elements instead of tables.
    """
    h3_re = re.compile(r"<h3>(.*?)</h3>", re.DOTALL)

    def _replace(m: re.Match) -> str:
        inner = m.group(1).strip()

        # Extract date
        date_m = re.search(r'<span class="date">(.*?)</span>', inner)
        date_text = date_m.group(1) if date_m else ""
        rest = inner[: date_m.start()].strip() if date_m else inner

        # Build left content: keep company + title together
        em_m = re.search(r"<em>(.*?)</em>", rest)
        if em_m:
            company = rest[: em_m.start()].strip()
            if not company.endswith(","):
                company += ","
            title = em_m.group(1).strip()
            left_html = f"<strong>{company}</strong> <em>{title}</em>"
        else:
            left_html = f"<strong>{rest}</strong>"

        return (
            '<div class="entry-header">'
            f'<span class="entry-left">{left_html}</span>'
            f'<span class="entry-right">{date_text}</span>'
            "</div>"
        )

    return h3_re.sub(_replace, html)


def md_to_html(md_path: str, scale: float = 1.0):
    """Returns (html_string, meta_dict)."""
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    meta, body = _parse_frontmatter(md_text)
    html_body = markdown.markdown(body, extensions=["extra"])
    html_body = _h3_to_divs(html_body)
    css = build_css(scale)

    # Build header from YAML frontmatter
    header_html = _build_header_html(meta)
    ats_block = _build_ats_contact(meta)
    title = meta.get("name", "Resume")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="author" content="{title}">
    <title>{title} - Resume</title>
    <style>{css}</style>
</head>
<body>
{header_html}
{ats_block}
{html_body}
</body>
</html>"""
    return html, meta


def render(html_string: str):
    """Return a WeasyPrint Document (list of pages)."""
    return HTML(string=html_string).render()


def fit_one_page(md_path: str, output_path: str) -> None:
    """
    Render the resume, and if it exceeds one page, iteratively shrink
    the scale factor until it fits. Then write the final PDF.
    """
    scale = 1.0
    step = 0.01          # shrink by 1% each iteration
    min_scale = 0.70     # never go below 70%

    meta = {}
    while scale >= min_scale:
        html, meta = md_to_html(md_path, scale)
        doc = render(html)
        pages = len(doc.pages)
        print(f"  scale={scale:.2f}  →  {pages} page(s)")
        if pages <= 1:
            pdf_meta = _build_pdf_metadata(meta)
            doc.write_pdf(output_path, **pdf_meta)
            return
        scale -= step

    # If we bottomed out, just write whatever we have
    print(f"  Warning: could not fit to 1 page (min scale {min_scale:.0%}). Writing as-is.")
    pdf_meta = _build_pdf_metadata(meta)
    doc.write_pdf(output_path, **pdf_meta)
    return


def main():
    input_md = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SCRIPT_DIR, "resume.md")
    output_pdf = sys.argv[2] if len(sys.argv) > 2 else os.path.join(SCRIPT_DIR, "resume.pdf")

    if not os.path.isfile(input_md):
        print(f"Error: input file not found: {input_md}", file=sys.stderr)
        sys.exit(1)

    print(f"Converting {input_md} → {output_pdf}")
    fit_one_page(input_md, output_pdf)
    print(f"Done! Wrote {output_pdf}")


if __name__ == "__main__":
    main()
