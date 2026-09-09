/**
 * Contents for files seeded into the simulated filesystem.
 *
 * /cv has no Next.js route on purpose — it falls through to the 404 page, which
 * is this shell. So the CV has to be findable here: `ls` then `cat resume.md`.
 * Kept in sync by hand with tools/resume/resume.md.
 */

export const RESUME_MD = `Mohamad Khawam
New Jersey, United States
Khawammohamad99@gmail.com  |  (862)-285-1846

  github.com/mkhawam
  linkedin.com/in/mohamad-k
  mohamadk.com

Tip: run \`resume\` to open the PDF version.

== SUMMARY ==

Backend and platform software engineer, sole active maintainer of a Django/DRF
grading platform serving 1,950+ users on a 4-VM container fleet — including
its sandboxed multi-language execution engine and per-token cost-attribution
layer. Depth in concurrency, query performance, container isolation, and
application security, behind 1,100+ automated tests and gated CI/CD.

== EXPERIENCE ==

Rutgers University — Application Developer (Software Engineer)
                                                     June 2025 - Present
  * Sole active engineer on codePost, a Django/DRF grading platform serving
    1,950+ users — 1,828 students, 57 graders, 17 course admins — across 19
    courses and 74 assignments; 80K lines of Python, 91 schema migrations,
    and 30+ REST resource ViewSets running as 12 containers on a 4-VM Docker
    Compose fleet behind nginx and gunicorn/Uvicorn ASGI workers.
  * Built the sandboxed execution engine: container-per-run Docker isolation
    for seven language runtimes, each with a paired per-cell Jupyter
    notebook executor, capped at 300s wall time, 1 GiB memory with swap
    disabled, one CPU, 500 PIDs, no network, and all Linux capabilities
    dropped.
  * Cut redundant grading compute with a SHA-256 content-hash execution
    cache that skips the container run entirely on a hit, backed by an index
    built for the (file, most-recent-run) query shape, plus test-suite
    batching that runs each category script once instead of once per test
    case.
  * Removed N+1 query storms from the permission chain with a purpose-built
    per-request role-memoization layer and 77 eager-loading sites; added 17
    composite indexes, F()-expression race-safe counters, and
    compare-and-set idempotency guards on concurrent AI jobs.
  * Built per-token AI cost attribution: a USD rate table across two
    providers with cached-token discount modeling, charges quantized to
    one-millionth of a dollar in a Decimal(10,6) column, three-level
    course-over-organization-over-default rate-override precedence, and
    hourly, daily, and monthly rollups at course, organization, and platform
    scope.
  * Hardened operations with a five-probe health endpoint — database
    round-trip latency, live Celery worker count, cache write and read-back,
    pending migrations, disk headroom — self-healing autograder environments
    that promote above an 0.8 success rate and auto-roll-back below 0.5, and
    992 backend tests running in parallel behind a four-job CI gate.
  * Took sole ownership of a 5,200-commit legacy React SPA — 103K
    hand-written TS/TSX, 364 components, 167 routes — migrating Create React
    App to Vite and React Router v5 to v7 in one hop across 398 files,
    adding 39 lazy-loaded route boundaries, and gating deploys on a strict
    type check plus 173 tests.
  * Contributed 337 commits to a shared 229-role Ansible fleet repository,
    rebuilding JupyterHub with four pluggable auth backends (Kerberos, CAS,
    Azure AD, local) and per-user systemd cgroup isolation: 40 GB memory
    ceiling, swap off, OOM-kill on pressure, 10 GB quota, and an 8-hour
    CPU-time killer.
  * Designed and published jupyter-assignments to npm and PyPI: a JupyterLab
    extension with an abstract platform adapter (13 methods, three backends)
    and a four-tier role hierarchy enforced by a decorator at the platform
    layer, covered by 320 Python tests.
  * Found and fixed a directory traversal in dataset upload paths (shipped
    with a regression test), an infinite-recursion loop between email
    delivery and logging, and a cluster of authorization gaps including
    student-triggered code execution, draft-grade leakage, and
    stale-identity caching after impersonation.

Rutgers University — Student Lab Technician      January 2023 - May 2025
  * Managed 10 Hackerspace workspaces, writing student-focused documentation
    and maintaining the WordPress site, modernizing the space.
  * Built a Raspberry Pi computer-vision learning station with MediaPipe,
    used for walk-in student workshops.
  * Built a 3D printer monitoring service (Express and React) streaming live
    video of the printer bay so students could check job status without
    walking over.

Swish — Full-Stack Developer                   July 2021 - December 2021
  * Automated account creation on web platforms using Puppeteer and Node.js,
    with Mocha-based regression tests covering the signup flows.
  * Migrated the CLI to an Electron desktop application, replacing
    flag-based invocation with a GUI workflow.

C-Tech — Computer Technician                   July 2019 - December 2021
  * Automated computer initialization with Powershell scripts, cutting build
    time from 40 to 20 minutes.
  * Implemented a secure HDD erasure workflow processing dozens of drives
    daily, onboarding 3 new enterprise clients.

== SKILLS ==

Languages: Python, TypeScript, JavaScript, C, Java, Golang, SQL, PowerShell,
Bash

Frameworks: Django, Django REST Framework, Django Channels, Celery, React,
Next.js, Flask, Express, JupyterLab, Vite, Electron

Data: MariaDB / InnoDB, MongoDB, Redis, LevelDB, Django ORM, Schema Design
and Migrations, Query Optimization and Indexing

Infrastructure: Docker, Docker Compose, Ansible, Nginx, gunicorn / Uvicorn
(ASGI), Linux, systemd, NFS, Proxmox, VMware, OpenStack, AWS, GitHub
Actions, GitLab CI, Zabbix

Architecture: REST and OpenAPI Design, Distributed Task Queues, Caching and
Invalidation, Container Isolation, Idempotency and Race Safety, RBAC and
Authorization, Rate Limiting, Usage Metering and Cost Attribution, Health
Checks and Self-Healing, CI/CD and Staged Deploys, WCAG 2.1 AA

Security: Application Security, OWASP Top 10, Authorization and Access
Control, CAS / SAML / Kerberos SSO, JWT and API Key Management, Encryption
at Rest, Suricata, pfSense

Testing: pytest, pytest-xdist, Vitest, Testing Library, Playwright,
axe-core, Molecule, Mocha

Other: Git, Ollama, OpenAI and Gemini APIs, Tree-sitter, WebContainers,
OpenCV, MediaPipe

== PROJECTS ==

CompLock                                         November 2023 - Present
  * Developed SSH command and control software for networked computers in
    TypeScript, leveraging LevelDB and SSH2, utilized by RUSEC in CCDC
    competitions.
  * Reduced password rotation on 30 machines from 5 minutes to 30 seconds
    with automated testing via GitHub Actions and Mocha.

mohamadk.com                                        April 2025 - Present
  * Designed and built a Next.js 16 / React 19 portfolio and blog with a
    markdown publishing pipeline, PWA support, server-resolved theming, and
    a keyboard command palette.
  * Engineered an in-browser code playground with WebContainers that boots a
    Node.js runtime client-side to run my published ts-declaration-json
    package live, with no server execution.
  * Implemented a simulated Linux shell in TypeScript (custom filesystem,
    user system, and coreutils) served as the site's 404 page, plus Spotify
    OAuth with token refresh and an AI task-planning agent with tool
    calling.

AppTracker                                                          2025
  * Built a TypeScript application that tracks job applications by reading
    incoming emails via IMAP, classifying them with a Bayesian classifier,
    and generating status updates using Ollama AI models.
  * Integrated Discord bot notifications and MongoDB storage to provide
    real-time application status updates.

== EDUCATION ==

Bachelor of Arts, Computer Science                              May 2025
  * Rutgers University — Coursework: Computer Security, Software
    Methodology, Computer Architecture.

== LEADERSHIP ==

RUSecurity (Student Cyber Club) — Vice President January 2023 - May 2025
  * Directed network administration for CCDC, with the team placing 4th in
    2024.
  * Led club infrastructure setup on Proxmox and VMware ESXi, standing up
    the practice range the team trained on.
  * Led development of the club's BlackBox machine environment with Wazuh
    detection rules and the ToolBox hardening toolkit used for CCDC
    preparation.
`;

export const README_MD = `# personal-site

Personal site and blog for Mohamad Khawam.

Built with Next.js, Tailwind CSS, and DaisyUI. The 404 page is a simulated
Linux shell — you are inside it right now.

## Getting started

    npm install
    npm run dev

## Layout

    posts/    markdown blog posts
    public/   static assets
    src/app/  routes and components
    src/app/unix/  this shell

Try: ls, cd, cat, whoami, uname, ping, sl, resume, help
`;

export const PACKAGE_JSON = `{
  "name": "personal-site",
  "version": "0.2.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack --port 3001 --experimental-https",
    "build": "next build",
    "start": "next start"
  }
}
`;
