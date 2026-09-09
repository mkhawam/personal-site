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

- Sole active engineer on codePost, a Django/DRF grading platform serving 1,950+ students, graders, and course admins across 19 courses. The backend is 80K lines of Python running as 12 containers across 4 VMs.
- Built the engine that runs untrusted student code: one Docker container per run across seven language runtimes and Jupyter notebooks, with no network, all capabilities dropped, and hard caps on CPU, memory, PIDs, and wall time.
- Cut redundant grading compute: unchanged submissions skip the container run entirely via a content-hash cache, and test suites are batched so each category script runs once instead of once per test case.
- Fixed N+1 queries in the permission chain with per-request role memoization and eager loading at 77 call sites, and made concurrent AI jobs idempotent.
- Built per-token cost tracking for the platform's AI features: provider rate tables with cached-token discounts, fixed-point charges quantized to a millionth of a dollar, per-course rate overrides, and hourly, daily, and monthly rollups.
- Made autograder environments self-healing, promoting images above an 0.8 success rate and rolling back below 0.5, and wrote the five-probe health endpoint that drives container autoheal and staged deploys. Grew the backend suite to 992 tests behind a four-job CI gate.
- Sole maintainer of the platform's 103K-line legacy React SPA. Migrated it from Create React App to Vite and React Router v5 to v7, added lazy-loaded route splitting, and gated deploys on a strict type check plus 173 tests.
- Contributed 337 commits to the university's shared Ansible fleet repository, rebuilding the JupyterHub role with pluggable Kerberos, CAS, and Azure AD auth and per-user systemd cgroups that cap memory, disk, and CPU time.
- Wrote and published jupyter-assignments to npm and PyPI, a JupyterLab extension that fronts three grading backends behind one adapter interface and enforces a four-tier role hierarchy, covered by 320 tests.
- Fixed a directory traversal in dataset uploads, an email-and-logging infinite recursion, and authorization gaps that let students run code and see draft grades.

### Rutgers University, <em>Student Lab Technician</em> <span class="date">January 2023 - May 2025</span>

- Ran 10 Hackerspace workspaces, writing student-facing documentation and maintaining the WordPress site as part of modernizing the space.
- Built a Raspberry Pi computer-vision learning station with MediaPipe, used for walk-in student workshops.
- Built a 3D printer monitoring service (Express and React) streaming live video of the printer bay so students could check job status without walking over.

### Swish, <em>Full-Stack Developer</em> <span class="date">July 2021 - December 2021</span>

- Automated account creation on web platforms with Puppeteer and Node.js, with Mocha regression tests covering the signup flows.
- Migrated the CLI to an Electron desktop application, replacing flag-based invocation with a GUI workflow.

### C-Tech, <em>Computer Technician</em> <span class="date">July 2019 - December 2021</span>

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

### [CompLock](https://github.com/rusec/CompLock) <span class="date">November 2023 - Present</span>

- Built SSH command-and-control software for networked computers in TypeScript on LevelDB and SSH2, used by RUSEC in CCDC competitions.
- Cut password rotation across 30 machines from 5 minutes to 30 seconds, with Mocha tests running in GitHub Actions.

### [mohamadk.com](https://mohamadk.com) <span class="date">April 2025 - Present</span>

- Designed and built a Next.js 16 / React 19 portfolio and blog with a markdown publishing pipeline, PWA support, and a keyboard command palette.
- Built an in-browser code playground on WebContainers that boots Node.js client-side to run my published ts-declaration-json package live.
- Wrote a simulated Linux shell in TypeScript (filesystem, users, coreutils) that serves as the site's 404 page, plus an AI task-planning agent with tool calling.

### [AppTracker](https://github.com/mkhawam/AppTracker) <span class="date">2025</span>

- Built a TypeScript app that tracks job applications by watching email over IMAP, classifying messages with a Bayesian classifier, and generating status updates with Ollama.
- Sends real-time status updates through a Discord bot and keeps application history in MongoDB.

---

## Education

### Bachelor of Arts, <em>Computer Science</em> <span class="date">May 2025</span>

- Rutgers University — Coursework: Computer Security, Software Methodology, Computer Architecture.

---

## Leadership

### RUSecurity (Student Cybersecurity Club), <em>Vice President</em> <span class="date">January 2023 - May 2025</span>

- Directed network administration for CCDC, with the team placing 4th in 2024.
- Led club infrastructure setup on Proxmox and VMware ESXi, standing up the practice range the team trained on.
- Led development of the club's BlackBox machine environment with Wazuh detection rules and the ToolBox hardening toolkit used for CCDC preparation.
