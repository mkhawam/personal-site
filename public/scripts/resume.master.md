---
name: Mohamad Khawam
location: New Jersey, United States
email: Khawammohamad99@gmail.com
phone: (862)-285-1846
socials:
    - icon: github
      label: github.com/mkhawam
      url: https://github.com/mkhawam
    - icon: linkedin
      label: linkedin.com/in/mohamad-k
      url: https://linkedin.com/in/mohamad-k
    - icon: globe
      label: mohamadk.com
      url: https://mohamadk.com
---

## Summary

Backend and platform software engineer, sole active maintainer of a Django/DRF grading platform serving 1,950+ users on a 4-VM container fleet — including its sandboxed multi-language execution engine and per-token cost-attribution layer. Depth in concurrency, query performance, container isolation, and application security, behind 1,100+ automated tests and gated CI/CD.

---

## Experience

### Rutgers University, <em>Application Developer (Software Engineer)</em> <span class="date">June 2025 - Present</span>
<!-- id: exp-rutgers-appdev | tags: backend, python, django, drf, rest, api-design, distributed-systems, concurrency, scalability, performance, caching, queues, celery, redis, database, indexing, query-optimization, idempotency, reliability, observability, docker, containers, linux, infrastructure, ci-cd, devops, security, authorization, rbac, metering, cost-attribution, billing, typescript, react, full-stack | pin -->

- Sole active engineer on codePost, a Django/DRF grading platform serving 1,950+ users — 1,828 students, 57 graders, 17 course admins — across 19 courses and 74 assignments; 80K lines of Python, 91 schema migrations, and 30+ REST resource ViewSets running as 12 containers on a 4-VM Docker Compose fleet behind nginx and gunicorn/Uvicorn ASGI workers.
- Built the sandboxed execution engine: container-per-run Docker isolation for seven language runtimes, each with a paired per-cell Jupyter notebook executor, capped at 300s wall time, 1 GiB memory with swap disabled, one CPU, 500 PIDs, no network, and all Linux capabilities dropped. <!-- dupe: proj-codepost-sandbox -->
- Cut redundant grading compute with a SHA-256 content-hash execution cache that skips the container run entirely on a hit, backed by an index built for the (file, most-recent-run) query shape, plus test-suite batching that runs each category script once instead of once per test case. <!-- dupe: proj-codepost-sandbox -->
- Removed N+1 query storms from the permission chain with a purpose-built per-request role-memoization layer and 77 eager-loading sites; added 17 composite indexes, F()-expression race-safe counters, and compare-and-set idempotency guards on concurrent AI jobs. <!-- dupe: proj-codepost-scale -->
- Built per-token AI cost attribution: a USD rate table across two providers with cached-token discount modeling, charges quantized to one-millionth of a dollar in a Decimal(10,6) column, three-level course-over-organization-over-default rate-override precedence, and hourly, daily, and monthly rollups at course, organization, and platform scope. <!-- dupe: proj-codepost-metering -->
- Hardened operations with a five-probe health endpoint — database round-trip latency, live Celery worker count, cache write and read-back, pending migrations, disk headroom — self-healing autograder environments that promote above an 0.8 success rate and auto-roll-back below 0.5, and 992 backend tests running in parallel behind a four-job CI gate. <!-- dupe: proj-codepost-reliability -->
- Took sole ownership of a 5,200-commit legacy React SPA — 103K hand-written TS/TSX, 364 components, 167 routes — migrating Create React App to Vite and React Router v5 to v7 in one hop across 398 files, adding 39 lazy-loaded route boundaries, and gating deploys on a strict type check plus 173 tests. <!-- dupe: proj-codepost-ui -->
- Contributed 337 commits to a shared 229-role Ansible fleet repository, rebuilding JupyterHub with four pluggable auth backends (Kerberos, CAS, Azure AD, local) and per-user systemd cgroup isolation: 40 GB memory ceiling, swap off, OOM-kill on pressure, 10 GB quota, and an 8-hour CPU-time killer. <!-- dupe: proj-jupyterhub-fleet -->
- Designed and published jupyter-assignments to npm and PyPI: a JupyterLab extension with an abstract platform adapter (13 methods, three backends) and a four-tier role hierarchy enforced by a decorator at the platform layer, covered by 320 Python tests. <!-- dupe: proj-jupyter-assignments -->
- Found and fixed a directory traversal in dataset upload paths (shipped with a regression test), an infinite-recursion loop between email delivery and logging, and a cluster of authorization gaps including student-triggered code execution, draft-grade leakage, and stale-identity caching after impersonation. <!-- dupe: proj-codepost-security -->

### Rutgers University, <em>Student Lab Technician</em> <span class="date">January 2023 - May 2025</span>
<!-- id: exp-rutgers-labtech | tags: hardware, support, documentation, raspberry-pi, computer-vision, react, express, linux, troubleshooting, technical-writing, mentoring -->

- Managed 10 Hackerspace workspaces, writing student-focused documentation and maintaining the WordPress site, modernizing the space.
- Built a Raspberry Pi computer-vision learning station with MediaPipe, used for walk-in student workshops.
- Built a 3D printer monitoring service (Express and React) streaming live video of the printer bay so students could check job status without walking over.

### Swish, <em>Full-Stack Developer</em> <span class="date">July 2021 - December 2021</span>
<!-- id: exp-swish | tags: automation, node, puppeteer, electron, testing, full-stack, backend, typescript, ci, desktop -->

- Automated account creation on web platforms using Puppeteer and Node.js, with Mocha-based regression tests covering the signup flows.
- Migrated the CLI to an Electron desktop application, replacing flag-based invocation with a GUI workflow.

### C-Tech, <em>Computer Technician</em> <span class="date">July 2019 - December 2021</span>
<!-- id: exp-ctech | tags: it, windows, powershell, automation, security, linux, scripting, compliance, operations -->

- Automated computer initialization with Powershell scripts, cutting build time from 40 to 20 minutes.
- Implemented a secure HDD erasure workflow processing dozens of drives daily, onboarding 3 new enterprise clients.

---

## Skills

**Languages:** Python, TypeScript, JavaScript, C, Java, Golang, SQL, PowerShell, Bash

**Frameworks:** Django, Django REST Framework, Django Channels, Celery, React, Next.js, Flask, Express, JupyterLab, Vite, Electron

**Data:** MariaDB / InnoDB, MongoDB, Redis, LevelDB, Django ORM, Schema Design and Migrations, Query Optimization and Indexing

**Infrastructure:** Docker, Docker Compose, Ansible, Nginx, gunicorn / Uvicorn (ASGI), Linux, systemd, NFS, Proxmox, VMware, OpenStack, AWS, GitHub Actions, GitLab CI, Zabbix

**Architecture:** REST and OpenAPI Design, Distributed Task Queues, Caching and Invalidation, Container Isolation, Idempotency and Race Safety, RBAC and Authorization, Rate Limiting, Usage Metering and Cost Attribution, Health Checks and Self-Healing, CI/CD and Staged Deploys, WCAG 2.1 AA

**Security:** Application Security, OWASP Top 10, Authorization and Access Control, CAS / SAML / Kerberos SSO, JWT and API Key Management, Encryption at Rest, Suricata, pfSense

**Testing:** pytest, pytest-xdist, Vitest, Testing Library, Playwright, axe-core, Molecule, Mocha

**Other:** Git, Ollama, OpenAI and Gemini APIs, Tree-sitter, WebContainers, OpenCV, MediaPipe

---

## Projects

### [Jackal](https://github.com/mkhawam/Jackal) <span class="date">November 2024</span>
<!-- id: proj-jackal | tags: security, network-security, suricata, ids, data, mongodb, node, react, full-stack, backend, data-pipeline, ingestion, queues, log-analysis, visualization, nosql, self-directed -->

- Built a Node.js application for exploring Suricata IDS alerts: an event ingestion queue, a MongoDB storage and aggregation pipeline, and interactive web-based graph visualizations of network activity.
- Self-directed project to learn network telemetry and intrusion-detection tooling in preparation for CCDC.

### [CompLock](https://github.com/rusec/CompLock) <span class="date">November 2023 - Present</span>
<!-- id: proj-complock | tags: security, blue-team, c2, ssh, cli, typescript, devops, distributed-systems, orchestration, credential-rotation, automation, ci-cd, testing, key-value-store | default: 1 -->

- Developed SSH command and control software for networked computers in TypeScript, leveraging LevelDB and SSH2, utilized by RUSEC in CCDC competitions.
- Reduced password rotation on 30 machines from 5 minutes to 30 seconds with automated testing via GitHub Actions and Mocha.

### [mohamadk.com](https://mohamadk.com) <span class="date">April 2025 - Present</span>
<!-- id: proj-portfolio | tags: next, react, typescript, full-stack, frontend, pwa, ai, webcontainers, design, backend, oauth, api-design, caching, performance, ssr, agents, tool-calling | default: 2 -->

- Designed and built a Next.js 16 / React 19 portfolio and blog with a markdown publishing pipeline, PWA support, server-resolved theming, and a keyboard command palette.
- Engineered an in-browser code playground with WebContainers that boots a Node.js runtime client-side to run my published ts-declaration-json package live, with no server execution.
- Implemented a simulated Linux shell in TypeScript (custom filesystem, user system, and coreutils) served as the site's 404 page, plus Spotify OAuth with token refresh and an AI task-planning agent with tool calling.

### [AppTracker](https://github.com/mkhawam/AppTracker) <span class="date">2025</span>
<!-- id: proj-apptracker | tags: typescript, llm, ai, email, automation, discord, mongodb, backend, imap, classification, machine-learning, event-driven, nosql, integration | default: 3 -->

- Built a TypeScript application that tracks job applications by reading incoming emails via IMAP, classifying them with a Bayesian classifier, and generating status updates using Ollama AI models.
- Integrated Discord bot notifications and MongoDB storage to provide real-time application status updates.

### Sandboxed Code Execution Platform — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-sandbox | tags: backend, python, docker, containers, isolation, sandboxing, security, systems, linux, resource-limits, cgroups, concurrency, distributed-systems, performance, caching, streaming, websockets, sse, untrusted-code, multi-tenancy -->

- Built a container-per-run execution sandbox on the Docker API for untrusted student code: seven language runtimes each with a paired notebook executor, sharing a 1,600-line base class that owns lifecycle, streaming, and teardown.
- Enforced hard resource limits per run — 300s wall time, 1 GiB memory with swap disabled and swappiness zero, exactly one CPU via quota and period, 500 PIDs to stop fork bombs, tmpfs-only scratch, network disabled by default, all capabilities dropped, no-new-privileges — with output truncated at 1 MB and file writes at 10 MB.
- Added a SHA-256 content-hash execution cache with an index built for the (file, most-recent-run) query shape, so an unchanged submission returns a prior result without starting a container.
- Streamed live results over Server-Sent Events with 1s keepalives and over Django Channels WebSockets for interactive shells, throttling build-log writes to one database save every two seconds.
- Graded Jupyter notebooks per cell against nbformat v4 typed cells and per-test target cell IDs, and batched suites by category so each category script runs once rather than once per test case.

### AI Cost Attribution and Metering — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-metering | tags: backend, python, django, billing, metering, cost-attribution, usage-tracking, pricing, financial-precision, decimal, analytics, aggregation, reporting, data-modeling, indexing, query-optimization, multi-tenancy, async, ai, llm -->
<!-- TODO: add total USD metered and total tokens from the AIUsageRecord table. -->

- Built a per-request metering and rating layer for LLM spend: a USD rate table of input and output prices per million tokens across two providers, with provider-specific cached-token discounts applied to the cached portion of input separately from the uncached portion.
- Stored money as fixed-point Decimal with six decimal places and quantized every computed charge to one-millionth of a dollar, avoiding float drift across large volumes of small charges.
- Implemented three-level rate-override precedence — course over organization over platform default — so per-tenant pricing could change without a deploy.
- Modeled usage as an append-only record with seven usage columns and four composite indexes sized for hourly, daily, and monthly rollups at course, organization, and platform scope.
- Ran A/B prompt experiments with concurrent variant calls under asyncio.gather, attributing cost and outcome per variant across five providers including a self-hosted one.

### Backend Performance and Concurrency — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-scale | tags: backend, python, django, performance, scalability, concurrency, distributed-systems, queues, celery, redis, async, caching, database, sql, indexing, query-optimization, data-modeling, migrations, idempotency, race-conditions, pagination, throttling, rate-limiting, api-design -->
<!-- TODO: add query count before/after the RoleCache fix (CaptureQueriesContext on the submission-detail endpoint). -->

- Cut the permission chain's N+1 query fan-out with a purpose-built per-request memoization module that deduplicates repeated role lookups across the course to assignment to submission compute path, backed by 77 eager-loading sites.
- Designed the schema across 91 migrations and 36 models with 94 relational fields, 17 composite indexes, and 10 uniqueness constraints, plus capped pagination on every list endpoint.
- Made concurrent writes safe without locks using database-side F() expression counters and compare-and-set guards that make duplicate in-flight AI jobs idempotent.
- Ran background work on Celery over Redis: 16 tasks across 10 priority levels, bounded retries at three attempts with a 60s delay, 600s hard and 550s soft time limits, exponential-backoff webhook delivery, and two beat schedules.
- Layered request throttling at 5, 30, and 60 requests per minute by scope, and tuned the data tier with a 10 GB InnoDB buffer pool and 60s persistent connections.

### Reliability and Release Engineering — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-reliability | tags: backend, reliability, sre, observability, monitoring, health-checks, self-healing, resilience, testing, test-automation, pytest, ci-cd, deployment, release-engineering, docker, infrastructure, automation, devops, rollback -->

- Wrote a five-probe health endpoint reporting database round-trip latency in milliseconds, live Celery worker count from a broker ping, a cache write and read-back, pending migration count, and disk usage against a 90% threshold, wired to six container healthchecks and autoheal sidecars.
- Built self-healing autograder environments that promote a candidate image above an 0.8 success rate, auto-roll-back below 0.5 with a five-run minimum before either verdict, infer missing dependencies after three identical failures, and retain three prior image versions.
- Grew the backend suite to 992 tests across 83 files and 26,000 test lines, running in parallel under pytest-xdist behind a four-job CI gate: commit-message lint, template lint, static type check, and coverage.
- Serialized production deploys into three dependency-ordered stages — data, then API, then workers — each waiting for health before the next, then tagged a release and triggered downstream regeneration of the TypeScript client and Python SDK.

### Application Security Remediation — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-security | tags: security, appsec, owasp, authorization, authz, access-control, rbac, authentication, jwt, api-keys, encryption, path-traversal, privilege-escalation, vulnerability, secure-coding, multi-tenancy, csp, backend, python, django -->

- Fixed a directory traversal in dataset upload paths by normalizing to a slug and stripping to a basename, and shipped the fix together with a regression test that reproduces the escape.
- Closed a cluster of authorization gaps: student-triggered code execution, cache read versus execute separation, draft-grade leakage to students, a missing role check on the supergrader path, and unsanitized one-time tokens.
- Stopped stale-identity leakage after admin impersonation with no-store cache headers, and added a CSP frame-ancestors middleware.
- Scoped credentials to a single course — both JWTs and API keys — and stored API keys as SHA-256 digests with an indexed 8-character prefix for lookup, shown to the user exactly once.
- Encrypted sensitive columns at rest, and eliminated an infinite recursion loop between email delivery and logging that could exhaust the worker.

### Legacy React Modernization — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-ui | tags: frontend, react, typescript, vite, migration, legacy-modernization, refactoring, performance, code-splitting, bundle-optimization, accessibility, wcag, a11y, testing, vitest, ci-cd, design-systems, ownership -->

- Took sole ownership of a 5,200-commit React codebase from a 2018 startup and became its entire post-fork history: 102,738 hand-written TypeScript lines across 364 components and 167 routes.
- Migrated Create React App to Vite across 398 files, and React Router v5 to v7 in a single hop with no intermediate v6 step, leaving zero withRouter, RouteComponentProps, or useHistory call sites.
- Split the bundle with nine manual vendor chunks and 39 lazy-loaded route boundaries, with gzip and brotli size analysis wired into an analyze build.
- Ran WCAG 2.1 AA audits with axe across 26 surfaces in five role domains and remediated 56 files over seven focused commits, backed by a 58-token centralized color system and scripts that detect hardcoded colors.
- Built a 173-test Vitest suite with a fetch-mocking harness so no test touches the network, gating Docker deploys on self-hosted runners behind a hard no-emit type check.

### JupyterHub Fleet Automation — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-jupyterhub-fleet | tags: infrastructure, ansible, automation, devops, linux, systemd, cgroups, resource-limits, multi-tenancy, isolation, authentication, kerberos, sso, saml, monitoring, zabbix, observability, configuration-management, idempotency, nfs, platform-engineering -->

- Contributed 337 commits to a shared 3,000-commit university infrastructure repository spanning 229 Ansible roles, 185 host variable sets, and 49 group variable sets.
- Rebuilt the JupyterHub role with four pluggable authentication modes — Kerberos in production, CAS, Azure AD, and a local development mode — dispatched by host variable behind assert guards, on a custom LocalProcessSpawner subclass.
- Isolated each user in their own systemd slice: 40 GB memory ceiling and high-watermark, swap disabled, equal CPU weight, kill-on-memory-pressure, a 10 GB disk quota, and an 8-hour CPU-time job killer that emails the offending user before terminating.
- Automated Kerberos ticket renewal and NFS home provisioning, and auto-detected Jupyter hosts into Zabbix with three custom monitoring parameters.
- Drove a repository-wide lint sweep across 472 files and 207 of 225 roles, enforced ansible-lint through a pre-commit hook, and added Molecule idempotency tests to eight roles.

### [jupyter-assignments](https://www.npmjs.com/package/jupyter_assignments) <span class="date">2025 - 2026</span>
<!-- id: proj-jupyter-assignments | tags: python, typescript, jupyter, extension, npm, pypi, open-source, api-design, abstraction, adapter-pattern, rbac, authorization, access-control, testing, ci-cd, packaging, education-tech, full-stack -->

- Designed and published a JupyterLab extension to npm and PyPI (v0.3.3) with a hatch-jupyter-builder and jupyter-releaser pipeline, sole author across 10,573 Python and 6,746 TypeScript lines.
- Abstracted three grading backends — codePost, Autolab, and a local filesystem mode — behind a 1,346-line platform base class defining 13 abstract methods, resolved at runtime by an environment-driven factory.
- Enforced a four-tier role hierarchy at the platform layer with a minimum-role decorator applied uniformly across all three backends, mirrored in a frontend permissions module driving four role-specific sidebar views.
- Covered it with 320 Python test functions across 18 modules plus Jest and Playwright suites, gated by seven GitHub workflows and a GitLab build-and-deploy pipeline, under ruff, black, mypy, and TypeScript strict mode.
- Added a force-fetch backup path that snapshots student work to a timestamped read-only copy before any overwrite, with dedicated safety tests.

### Activebook 3-Way Notebook Merge — Rutgers <span class="date">2025</span>
<!-- id: proj-notebook-merge | tags: python, algorithms, merge, diff, conflict-resolution, jupyter, data-integrity, tooling, automation, ansible -->

- Built a three-way merge for Jupyter notebooks that matches cells by content similarity above a 0.6 ratio, so instructor updates to a shared activebook apply without clobbering student edits in the same file.
- Detected instructor chapter renames by comparing the ordered source of instructor-tagged cells across remote-only and local-only notebooks, preventing duplicate chapters, and snapshotted every notebook before merging to make each run undoable.

### [NetLock](https://github.com/rusec/NetLock) <span class="date">July 2024 - 2025</span>
<!-- id: proj-netlock | tags: security, blue-team, c2, siem, node, express, mongodb, backend, event-ingestion, agents, telemetry, observability, monitoring, https, distributed-systems -->

- Built a SIEM / command-and-control server for blue-team competition use (Node.js, Express, MongoDB), designed for rapid deployment with minimal end-user setup.
- Implemented HTTPS beacons that report host events to a central server, giving defenders live visibility into network activity across the competition landscape.

### [next-cas-client](https://github.com/rutgers-lcsr/next-cas-client) <span class="date">2025</span>
<!-- id: proj-next-cas-client | tags: typescript, next, authentication, sso, open-source, npm, frontend, backend, session-management, saml, oauth, identity, library, packaging, security -->

- Published an npm package (next-cas-client) for CAS single sign-on in Next.js, handling authentication, ticket validation, and session management via iron-session.
- Supports CAS 2.0, CAS 3.0, and SAML 1.1 validation; built at Rutgers LCSR for university CAS authentication in Next.js applications.

### [Accessibility Scanner](https://github.com/rutgers-lcsr/Accessibility_Scanner) <span class="date">2025</span>
<!-- id: proj-a11y-scanner | tags: accessibility, flask, next, playwright, celery, python, full-stack, automation, backend, queues, distributed-systems, job-scheduling, browser-automation, reporting, wcag, a11y, docker -->

- Built a web accessibility auditing platform: a Flask API and Next.js interface drive Playwright and Axe scans through Celery workers across university domains.
- Stores per-page results with screenshots so remediation progress is measurable over time.

### [ts-declaration-json](https://github.com/mkhawam/ts-declaration-json) <span class="date">October 2024</span>
<!-- id: proj-ts-declaration-json | tags: typescript, npm, open-source, tooling, codegen, parsing, ast, parallelism, multiprocessing, developer-tooling, packaging -->

- Created an NPM package that parses TypeScript modules and returns declarations as JSON, enabling automated React component generation with parallel child processes.

### [pfSense API](https://github.com/mkhawam/pfsense-api) <span class="date">November 2024</span>
<!-- id: proj-pfsense-api | tags: security, firewall, automation, api, networking, api-design, rest, crud, infrastructure-as-code -->

- Built an API for pfSense that automates instance configuration, exposing create, read, update, and delete operations for firewall rules, extending jaredhendrickson13's package.

### [Windows Cloud-Init Script](https://github.com/mkhawam/cloud-init) <span class="date">March 2025</span>
<!-- id: proj-cloud-init | tags: windows, powershell, cloud, openstack, proxmox, automation, infrastructure, provisioning, iaas, virtualization, configuration-management -->

- Wrote an OpenStack cloud-init script for Windows that automates configuration of Windows instances on OpenStack and Proxmox with PowerShell.

### [Drone Project](https://github.com/Cyrus-Majd/Drone-Indepenent-Study-PI) <span class="date">January 2023 - May 2023</span>
<!-- id: proj-drone | tags: computer-vision, opencv, python, embedded, research -->
<!-- TODO: was 90% search precision actually scored, or an estimate? If unscored, drop the figure. -->

- Implemented OpenCV vision algorithms to guide a drone along computer-generated paths, achieving 90% search precision with 10x range increase via cellular communication.

### [JobApps](https://github.com/mkhawam/JobApps) <span class="date">February 2024</span>
<!-- id: proj-jobapps | tags: typescript, react, node, express, leveldb, full-stack, web -->

- Built a web application for tracking job applications with a TypeScript/React frontend and an Express + LevelDB backend, predating tools like Simplify.

### [Puncta Detector](https://github.com/mkhawam/Puncta-Detector) <span class="date">March 2024</span>
<!-- id: proj-puncta | tags: python, computer-vision, image-analysis, research, cli -->

- Built a Python CLI tool that identifies puncta in fluorescence microscopy images using configurable brightness-level analysis, for research lab image processing.

### [RUSEC ToolBox](https://github.com/rusec/ToolBox) <span class="date">November 2024 - Present</span>
<!-- id: proj-toolbox | tags: security, blue-team, hardening, python, windows, linux, ccdc, automation, operations -->

- Lead contributor to RUSEC's blue-team hardening toolkit: Linux and Windows hardening scripts, firewall configuration automation, and LOLBin mitigation used in competition preparation.

### [Apache Guacamole — contributor](https://github.com/apache/guacamole-server/pull/696) <span class="date">2026</span>
<!-- id: proj-oss-guacamole | tags: c, open-source, rdp, protocol, systems, remote-access, low-level, protocol-implementation, networking, audio, binary-protocol, contribution -->

- Contributed RDPSND Wave2 (SNDC_WAVE2) PDU support to Apache Guacamole's RDP sound channel in C (GUACAMOLE-2306, PR under review).

### [JJava (Jupyter Java kernel) — contributor](https://github.com/dflib/jjava/pull/122) <span class="date">2026</span>
<!-- id: proj-oss-jjava | tags: java, jupyter, open-source, notebooks, education-tech, jvm, rendering, contribution, tooling -->

- Contributed interactive Swing & JavaFX rendering and static image rendering of GUI components in notebooks to JJava, the Jupyter kernel for Java (PRs under review).

### [Ticket Collector — HackRU 2023](https://devpost.com/software/ticket-collector) <span class="date">February 2023</span>
<!-- id: proj-hackru | tags: python, opencv, computer-vision, robotics, hardware, hackathon, award -->

- Won the Maverick Track award at HackRU Spring 2023 with a team of four, building an autonomous robot that traverses train aisles to collect tickets and count passengers for NJ Transit.
- Implemented OpenCV facial recognition and QR-code ticket validation on Raspberry Pi and Arduino, offloading processing to a web streaming service.

---

## Education

### Bachelor of Arts, <em>Computer Science</em> <span class="date">May 2025</span>
<!-- id: edu-rutgers | tags: education | pin -->

- Rutgers University — Coursework: Computer Security, Software Methodology, Computer Architecture.

---

## Leadership

### RUSecurity (Student Cybersecurity Club), <em>Vice President</em> <span class="date">January 2023 - May 2025</span>
<!-- id: lead-rusec | tags: security, blue-team, ccdc, infrastructure, leadership, proxmox, vmware, incident-response, hardening, detection-engineering, siem, virtualization, operations, mentoring | pin | default: 1 -->

- Directed network administration for CCDC, with the team placing 4th in 2024.
- Led club infrastructure setup on Proxmox and VMware ESXi, standing up the practice range the team trained on.
- Led development of the club's BlackBox machine environment with Wazuh detection rules and the ToolBox hardening toolkit used for CCDC preparation.

---

## Writing & Talks

### [Technical Blog](https://mohamadk.com/blog) <span class="date">2024 - Present</span>
<!-- id: writing-blog | tags: writing, security, software-design, communication, technical-writing, documentation, appsec, owasp, code-quality, architecture -->

- Write about software design and security at mohamadk.com/blog — including a technical breakdown of the xz/liblzma OpenSSH backdoor (CVE-2024-3094), a Jersey CTF write-up on broken access control (OWASP A01), and essays on code readability and architecture.

### [RU CyberCon 2025 — OWASP Top 10](https://github.com/rusec/owasp_website) <span class="date">April 2025</span>
<!-- id: talk-cybercon | tags: security, owasp, talk, communication, next, appsec, secure-coding, presentation, mentoring -->

- Presented the OWASP Top 10 vulnerabilities at RU CyberCon 2025, building an interactive Next.js demonstration site to accompany the talk.
