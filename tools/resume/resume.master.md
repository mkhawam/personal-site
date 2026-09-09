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

Backend and platform engineer, and the sole active maintainer of a Django/DRF grading platform with 1,950+ users. I own everything from its sandboxed multi-language execution engine to the layer that tracks AI spend per token. Most of my work lives in concurrency, query performance, container isolation, and application security.

---

## Experience

### Rutgers University, <em>Application Developer (Software Engineer)</em> <span class="date">June 2025 - Present</span>
<!-- id: exp-rutgers-appdev | tags: backend, python, django, drf, rest, api-design, distributed-systems, concurrency, scalability, performance, caching, queues, celery, redis, database, indexing, query-optimization, idempotency, reliability, observability, docker, containers, linux, infrastructure, ci-cd, devops, security, authorization, rbac, metering, cost-attribution, billing, typescript, react, full-stack | pin -->

- Sole active engineer on codePost, a Django/DRF grading platform serving 1,950+ students, graders, and course admins across 19 courses. The backend is 80K lines of Python running as 12 containers across 4 VMs.
- Built the engine that runs untrusted student code: one Docker container per run across seven language runtimes and Jupyter notebooks, with no network, all capabilities dropped, and hard caps on CPU, memory, PIDs, and wall time. <!-- dupe: proj-codepost-sandbox -->
- Cut redundant grading compute: unchanged submissions skip the container run entirely via a content-hash cache, and test suites are batched so each category script runs once instead of once per test case. <!-- dupe: proj-codepost-sandbox -->
- Fixed N+1 queries in the permission chain with per-request role memoization and eager loading at 77 call sites, and made concurrent AI jobs idempotent. <!-- dupe: proj-codepost-scale -->
- Built per-token cost tracking for the platform's AI features: provider rate tables with cached-token discounts, fixed-point charges quantized to a millionth of a dollar, per-course rate overrides, and hourly, daily, and monthly rollups. <!-- dupe: proj-codepost-metering -->
- Made autograder environments self-healing, promoting images above an 0.8 success rate and rolling back below 0.5, and wrote the five-probe health endpoint that drives container autoheal and staged deploys. Grew the backend suite to 992 tests behind a four-job CI gate. <!-- dupe: proj-codepost-reliability -->
- Sole maintainer of the platform's 103K-line legacy React SPA. Migrated it from Create React App to Vite and React Router v5 to v7, added lazy-loaded route splitting, and gated deploys on a strict type check plus 173 tests. <!-- dupe: proj-codepost-ui -->
- Contributed 337 commits to the university's shared Ansible fleet repository, rebuilding the JupyterHub role with pluggable Kerberos, CAS, and Azure AD auth and per-user systemd cgroups that cap memory, disk, and CPU time. <!-- dupe: proj-jupyterhub-fleet -->
- Wrote and published jupyter-assignments to npm and PyPI, a JupyterLab extension that fronts three grading backends behind one adapter interface and enforces a four-tier role hierarchy, covered by 320 tests. <!-- dupe: proj-jupyter-assignments -->
- Fixed a directory traversal in dataset uploads, an email-and-logging infinite recursion, and authorization gaps that let students run code and see draft grades. <!-- dupe: proj-codepost-security -->

### Rutgers University, <em>Student Lab Technician</em> <span class="date">January 2023 - May 2025</span>
<!-- id: exp-rutgers-labtech | tags: hardware, support, documentation, raspberry-pi, computer-vision, react, express, linux, troubleshooting, technical-writing, mentoring -->

- Ran 10 Hackerspace workspaces, writing student-facing documentation and maintaining the WordPress site as part of modernizing the space.
- Built a Raspberry Pi computer-vision learning station with MediaPipe, used for walk-in student workshops.
- Built a 3D printer monitoring service (Express and React) streaming live video of the printer bay so students could check job status without walking over.

### Swish, <em>Full-Stack Developer</em> <span class="date">July 2021 - December 2021</span>
<!-- id: exp-swish | tags: automation, node, puppeteer, electron, testing, full-stack, backend, typescript, ci, desktop -->

- Automated account creation on web platforms with Puppeteer and Node.js, with Mocha regression tests covering the signup flows.
- Migrated the CLI to an Electron desktop application, replacing flag-based invocation with a GUI workflow.

### C-Tech, <em>Computer Technician</em> <span class="date">July 2019 - December 2021</span>
<!-- id: exp-ctech | tags: it, windows, powershell, automation, security, linux, scripting, compliance, operations -->

- Automated computer initialization with Powershell scripts, cutting build time from 40 to 20 minutes.
- Implemented a secure HDD erasure workflow processing dozens of drives daily, onboarding 3 new enterprise clients.

---

## Skills

**Languages:** Python, TypeScript, JavaScript, C, Java, Golang, SQL, Bash, PowerShell

**Frameworks:** Django, Django REST Framework, Django Channels, Celery, Flask, Node.js, Express, React, Next.js, JupyterLab, Electron

**Data:** MariaDB / InnoDB, MongoDB, Redis, Django ORM, Schema Design and Migrations, Query Optimization and Indexing, Caching

**Infrastructure:** Docker, Docker Compose, Ansible, Nginx, Linux, systemd, Proxmox, VMware, OpenStack, AWS, GitHub Actions, GitLab CI, CI/CD, Zabbix

**Security:** Application Security, OWASP Top 10, RBAC and Authorization, CAS / SAML / Kerberos SSO, JWT and API Key Management, Suricata, pfSense, Wazuh

**Testing:** pytest, Vitest, Jest, Playwright, Mocha, axe-core, Molecule, WCAG 2.1 AA

**AI:** OpenAI and Gemini APIs, Ollama, LLM Cost Metering, Tool-Calling Agents

---

## Projects

### [Jackal](https://github.com/mkhawam/Jackal) <span class="date">November 2024</span>
<!-- id: proj-jackal | tags: security, network-security, suricata, ids, data, mongodb, node, react, full-stack, backend, data-pipeline, ingestion, queues, log-analysis, visualization, nosql, self-directed -->

- Built a Node.js app for exploring Suricata IDS alerts, with an event ingestion queue, a MongoDB storage and aggregation pipeline, and interactive graph visualizations of network activity.
- Self-directed project to learn network telemetry and intrusion-detection tooling in preparation for CCDC.

### [CompLock](https://github.com/rusec/CompLock) <span class="date">November 2023 - Present</span>
<!-- id: proj-complock | tags: security, blue-team, c2, ssh, cli, typescript, devops, distributed-systems, orchestration, credential-rotation, automation, ci-cd, testing, key-value-store | default: 1 -->

- Built SSH command-and-control software for networked computers in TypeScript on LevelDB and SSH2, used by RUSEC in CCDC competitions.
- Cut password rotation across 30 machines from 5 minutes to 30 seconds, with Mocha tests running in GitHub Actions.

### [mohamadk.com](https://mohamadk.com) <span class="date">April 2025 - Present</span>
<!-- id: proj-portfolio | tags: next, react, typescript, full-stack, frontend, pwa, ai, webcontainers, design, backend, oauth, api-design, caching, performance, ssr, agents, tool-calling | default: 2 -->

- Designed and built a Next.js 16 / React 19 portfolio and blog with a markdown publishing pipeline, PWA support, and a keyboard command palette.
- Built an in-browser code playground on WebContainers that boots Node.js client-side to run my published ts-declaration-json package live.
- Wrote a simulated Linux shell in TypeScript (filesystem, users, coreutils) that serves as the site's 404 page, plus an AI task-planning agent with tool calling.

### [AppTracker](https://github.com/mkhawam/AppTracker) <span class="date">2025</span>
<!-- id: proj-apptracker | tags: typescript, llm, ai, email, automation, discord, mongodb, backend, imap, classification, machine-learning, event-driven, nosql, integration | default: 3 -->

- Built a TypeScript app that tracks job applications by watching email over IMAP, classifying messages with a Bayesian classifier, and generating status updates with Ollama.
- Sends real-time status updates through a Discord bot and keeps application history in MongoDB.

### Sandboxed Code Execution Platform — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-sandbox | tags: backend, python, docker, containers, isolation, sandboxing, security, systems, linux, resource-limits, cgroups, concurrency, distributed-systems, performance, caching, streaming, websockets, sse, untrusted-code, multi-tenancy -->

- Built a sandbox for untrusted student code on the Docker API, one container per run: seven language runtimes, each with a matching Jupyter executor, sharing one base class for lifecycle, streaming, and teardown.
- Capped every run at 300s wall time, 1 GiB memory with swap off, one CPU, and 500 PIDs to stop fork bombs, with network off, all capabilities dropped, no-new-privileges, and tmpfs-only scratch space.
- Cached execution results by SHA-256 content hash, so an unchanged submission returns its prior result without starting a container.
- Streamed live results over Server-Sent Events, and over Django Channels WebSockets for interactive shells, throttling build-log writes to one database save every two seconds.
- Graded Jupyter notebooks cell by cell against per-test target cell IDs, and batched test suites by category so each category script runs once rather than once per test case.

### AI Cost Attribution and Metering — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-metering | tags: backend, python, django, billing, metering, cost-attribution, usage-tracking, pricing, financial-precision, decimal, analytics, aggregation, reporting, data-modeling, indexing, query-optimization, multi-tenancy, async, ai, llm -->
<!-- TODO: add total USD metered and total tokens from the AIUsageRecord table. -->

- Built the metering and rating layer for LLM spend: a USD rate table of input and output prices per million tokens for two providers, with each provider's cached-token discount applied to the cached share of input.
- Stored charges as fixed-point Decimal quantized to a millionth of a dollar, so float drift can't accumulate across many small charges.
- Made rates overridable at three levels, course over organization over platform default, so per-tenant pricing changes without a deploy.
- Modeled usage as an append-only record indexed for hourly, daily, and monthly rollups at course, organization, and platform scope.
- Ran A/B prompt experiments with variants called concurrently under asyncio, attributing cost and outcome per variant across five providers, one of them self-hosted.

### Backend Performance and Concurrency — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-scale | tags: backend, python, django, performance, scalability, concurrency, distributed-systems, queues, celery, redis, async, caching, database, sql, indexing, query-optimization, data-modeling, migrations, idempotency, race-conditions, pagination, throttling, rate-limiting, api-design -->
<!-- TODO: add query count before/after the RoleCache fix (CaptureQueriesContext on the submission-detail endpoint). -->

- Cut the permission chain's N+1 query fan-out with per-request memoization of role lookups as a request walks from course to assignment to submission, backed by eager loading at 77 call sites.
- Designed the schema across 36 models and 91 migrations, with 17 composite indexes, 10 uniqueness constraints, and capped pagination on every list endpoint.
- Made concurrent writes safe without locks: counters update database-side through F() expressions, and compare-and-set guards make duplicate in-flight AI jobs idempotent.
- Ran background work on Celery over Redis: 16 tasks across 10 priority levels, with capped retries, hard and soft time limits, and exponential-backoff webhook delivery.
- Rate-limited endpoints at 5, 30, and 60 requests per minute by scope, and tuned the data tier with a 10 GB InnoDB buffer pool and persistent connections.

### Reliability and Release Engineering — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-reliability | tags: backend, reliability, sre, observability, monitoring, health-checks, self-healing, resilience, testing, test-automation, pytest, ci-cd, deployment, release-engineering, docker, infrastructure, automation, devops, rollback -->

- Wrote a five-probe health endpoint (database latency, live Celery worker count, cache read-back, pending migrations, disk headroom) wired into container healthchecks and autoheal sidecars.
- Made autograder environments self-healing: a candidate image promotes above an 0.8 success rate and rolls back below 0.5, and after three identical failures the system infers the missing dependency, keeping three prior image versions for rollback.
- Grew the backend suite to 992 tests run in parallel under pytest-xdist, behind a four-job CI gate: commit-message lint, template lint, static type check, and coverage.
- Serialized production deploys into three stages (data, then API, then workers), each waiting for health before the next, with release tags that regenerate the TypeScript client and Python SDK.

### Application Security Remediation — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-security | tags: security, appsec, owasp, authorization, authz, access-control, rbac, authentication, jwt, api-keys, encryption, path-traversal, privilege-escalation, vulnerability, secure-coding, multi-tenancy, csp, backend, python, django -->

- Fixed a directory traversal in dataset upload paths by normalizing names to a slug and stripping to a basename, and shipped a regression test that reproduces the escape alongside the fix.
- Closed a run of authorization gaps: students able to trigger code execution, draft grades visible to students, a missing role check on the supergrader path, and unsanitized one-time tokens.
- Stopped stale identities from leaking after admin impersonation with no-store cache headers, and added CSP frame-ancestors middleware.
- Scoped JWTs and API keys to a single course, and stored API keys as SHA-256 digests with an indexed prefix for lookup, showing the raw key exactly once.
- Encrypted sensitive columns at rest, and untangled an infinite recursion between email delivery and logging that could exhaust a worker.

### Legacy React Modernization — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-codepost-ui | tags: frontend, react, typescript, vite, migration, legacy-modernization, refactoring, performance, code-splitting, bundle-optimization, accessibility, wcag, a11y, testing, vitest, ci-cd, design-systems, ownership -->

- Inherited a 5,200-commit React codebase from a 2018 startup as its only maintainer: 103K hand-written TypeScript lines across 364 components and 167 routes.
- Migrated it from Create React App to Vite, and took React Router from v5 straight to v7 with no v6 stop, leaving zero legacy withRouter or useHistory call sites.
- Split the bundle into nine vendor chunks and 39 lazy-loaded route boundaries, with a dedicated bundle-analysis build.
- Ran axe WCAG 2.1 AA audits across 26 surfaces and fixed the findings on top of a centralized color-token system, with lint scripts that catch hardcoded colors.
- Built a 173-test Vitest suite with a fetch-mocking harness so no test touches the network, and gated Docker deploys on a strict type check.

### JupyterHub Fleet Automation — Rutgers <span class="date">2025 - 2026</span>
<!-- id: proj-jupyterhub-fleet | tags: infrastructure, ansible, automation, devops, linux, systemd, cgroups, resource-limits, multi-tenancy, isolation, authentication, kerberos, sso, saml, monitoring, zabbix, observability, configuration-management, idempotency, nfs, platform-engineering -->

- Contributed 337 commits to the university's shared infrastructure repository of 229 Ansible roles.
- Rebuilt the JupyterHub role around a custom spawner with four pluggable authentication modes (Kerberos in production, CAS, Azure AD, and local development), selected per host.
- Isolated each user in their own systemd slice: a 40 GB memory ceiling, swap off, kill on memory pressure, a 10 GB disk quota, and an 8-hour CPU-time killer that emails the user before terminating.
- Automated Kerberos ticket renewal and NFS home provisioning, and had Jupyter hosts auto-register in Zabbix with three custom monitoring parameters.
- Drove a repository-wide ansible-lint sweep across 207 roles, enforced it through a pre-commit hook, and added Molecule idempotency tests to eight roles.

### [jupyter-assignments](https://www.npmjs.com/package/jupyter_assignments) <span class="date">2025 - 2026</span>
<!-- id: proj-jupyter-assignments | tags: python, typescript, jupyter, extension, npm, pypi, open-source, api-design, abstraction, adapter-pattern, rbac, authorization, access-control, testing, ci-cd, packaging, education-tech, full-stack -->

- Sole author of a JupyterLab extension published to npm and PyPI: 17K lines of Python and TypeScript with an automated release pipeline.
- Put three grading backends (codePost, Autolab, and a local filesystem mode) behind one platform adapter with 13 abstract methods, selected at runtime by an environment-driven factory.
- Enforced a four-tier role hierarchy with a minimum-role decorator shared by all three backends, mirrored by a frontend permissions module that drives role-specific sidebar views.
- Covered it with 320 Python tests plus Jest and Playwright suites, under mypy and strict TypeScript in CI.
- Added a force-fetch backup path that snapshots student work to a timestamped read-only copy before any overwrite, with its own safety tests.

### Activebook 3-Way Notebook Merge — Rutgers <span class="date">2025</span>
<!-- id: proj-notebook-merge | tags: python, algorithms, merge, diff, conflict-resolution, jupyter, data-integrity, tooling, automation, ansible -->

- Built a three-way merge for Jupyter notebooks that matches cells by content similarity above a 0.6 ratio, so instructor updates to a shared activebook land without clobbering student edits in the same file.
- Detected instructor chapter renames by comparing instructor-tagged cells across notebooks to prevent duplicate chapters, and snapshotted every notebook before merging so any run can be undone.

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

- Extended jaredhendrickson13's pfSense API package with create, read, update, and delete operations for firewall rules, automating instance configuration.

### [Windows Cloud-Init Script](https://github.com/mkhawam/cloud-init) <span class="date">March 2025</span>
<!-- id: proj-cloud-init | tags: windows, powershell, cloud, openstack, proxmox, automation, infrastructure, provisioning, iaas, virtualization, configuration-management -->

- Wrote a cloud-init script in PowerShell that automates configuration of Windows instances on OpenStack and Proxmox.

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
