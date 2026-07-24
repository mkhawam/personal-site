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

Application developer at Rutgers University with experience spanning full-stack platforms, infrastructure automation, and security. Built and shipped features across Django, React, JupyterLab, and Ansible-managed deployments used in CS and data science courses. Background in competitive cyber defense and network security tooling.

---

## Experience

### Rutgers University, <em>Application Developer</em> <span class="date">June 2025 - Present</span>

- Maintained and extended codePost, a full-stack code grading platform (Django API, React UI, Celery workers) deployed across 4 VMs with Docker Compose, serving 500+ students per semester with autograding, a multi-language test framework with per-cell Jupyter evaluation, and AI-assisted comment generation (Ollama/OpenAI) with org-level cost tracking.
- Designed and built jupyter-assignments, a JupyterLab sidebar extension (React/TypeScript + Python) with a 4-tier role system (student/grader/staff/instructor) and a platform adapter pattern abstracting codePost and Autolab behind a unified interface, enabling in-editor assignment management across multiple grading platforms.
- Automated JupyterHub deployment across course servers with Ansible, managing CAS/Kerberos/Azure auth, Python versioning, modular extensions, and Zabbix monitoring.
- Published next-cas-client, an npm package providing CAS 2.0/3.0 and SAML 1.1 single sign-on for Next.js applications with iron-session session management, built for university CAS authentication.
- Built a 3-way notebook merge tool using content-similarity matching to prevent instructor updates from clobbering student edits in shared activebooks.
- Led WCAG accessibility remediation on codePost-ui and built an accessibility scanner (Flask, Playwright, Docker) for automated audits across university domains.
- Patched directory traversal, privilege escalation, and infinite recursion vulnerabilities; migrated codePost-ui from CRA to Vite + React Router v7.

### Rutgers University, <em>Student Lab Technician</em> <span class="date">January 2023 - May 2025</span>

- Managed 10 Hackerspace workspaces, writing student-focused documentation and maintaining the WordPress site, modernizing the space.
- Developed a Raspberry Pi learning environment with MediaPipe, boosting student engagement by 70%.
- Developed a 3D printer monitoring service using Express and React to stream live video, increasing printer usage by 30%.

### Swish, <em>Full-Stack Developer</em> <span class="date">July 2021 - December 2021</span>

- Automated account creation on web platforms using Puppeteer and Node.js, accelerating creation by 300% with Mocha-based testing.
- Migrated CLI to Electron desktop application, increasing user engagement by 200%.

### C-Tech, <em>Computer Technician</em> <span class="date">July 2019 - December 2021</span>

- Automated computer initialization with Powershell scripts, cutting build time from 40 to 20 minutes.
- Implemented a secure HDD erasure workflow processing dozens of drives daily, onboarding 3 new enterprise clients.

---

## Skills

**Languages:** Python, TypeScript, JavaScript, C, Java, Golang, PowerShell

**Frameworks:** React, Django, Flask, Next.js, Express, JupyterLab, Electron, Vite

**Data:** MariaDB, MongoDB, Redis, Celery, LevelDB, S3

**Infrastructure:** Docker, Ansible, Nginx, Linux, Proxmox, VMware, AWS, OpenStack, GitHub Actions, Zabbix

**Security:** Network Security, Suricata, pfSense, CAS/SAML, Kerberos, OWASP

**Other:** Git, Playwright, Puppeteer, Vitest, Tree-sitter, OpenCV, MediaPipe, Ollama, WebContainers, WCAG Accessibility

---

## Projects

### [AppTracker](https://github.com/mkhawam/AppTracker) <span class="date">2025</span>

- Built a TypeScript application that tracks job applications by reading incoming emails via IMAP, classifying them with a Bayesian classifier, and generating status updates using Ollama AI models.
- Integrated Discord bot notifications and MongoDB storage to provide real-time application status updates.

### [Jackal](https://github.com/mkhawam/Jackal) <span class="date">November 2024</span>

- Developed a Node.js-based frontend for Suricata network log analysis, enabling the review of 1M+ logs per day with interactive web-based graph visualizations.
- Built a queue system supporting ingestion of 1000+ events per second and a MongoDB pipeline with sub-100ms query latency for terabytes of logs.

### [CompLock](https://github.com/rusec/CompLock) <span class="date">November 2023 - Present</span>

- Developed SSH command and control software for networked computers in TypeScript, leveraging LevelDB and SSH2, utilized by RUSEC in CCDC competitions.
- Reduced password rotation on 30 machines from 5 minutes to 30 seconds with automated testing via GitHub Actions and Mocha.

### [mohamadk.com](https://mohamadk.com) <span class="date">April 2025 - Present</span>

- Designed and built a Next.js 16 / React 19 portfolio and blog with a markdown publishing pipeline, PWA support, server-resolved theming, and a keyboard command palette.
- Engineered an in-browser code playground with WebContainers that boots a Node.js runtime client-side to run my published ts-declaration-json package live, with no server execution.
- Implemented a simulated Linux shell in TypeScript (custom filesystem, user system, and coreutils) served as the site's 404 page, plus Spotify OAuth with token refresh and an AI task-planning agent with tool calling.

### [ts-declaration-json](https://github.com/mkhawam/ts-declaration-json) <span class="date">October 2024</span>

- Created an NPM package that parses TypeScript modules and returns declarations as JSON, enabling automated React component generation with parallel child processes.

### [Ticket Collector — HackRU 2023](https://devpost.com/software/ticket-collector) <span class="date">February 2023</span>

- Won the Maverick Track award at HackRU Spring 2023 with a team of four, building an autonomous robot that traverses train aisles to collect tickets and count passengers for NJ Transit.
- Implemented OpenCV facial recognition and QR-code ticket validation on Raspberry Pi and Arduino, offloading processing to a web streaming service.

---

## Education

### Bachelor of Arts, <em>Computer Science</em> <span class="date">May 2025</span>

- Rutgers University — Coursework: Computer Security, Software Methodology, Computer Architecture.

---

## Leadership

### Vice President, <em>RUSecurity</em> <span class="date">January 2023 - May 2025</span>

- Directed network administration for CCDC, with the team placing 4th in 2024.
- Led club infrastructure setup using Proxmox and VMware ESXi, yielding a 70% increase in technical competency.
- Led development of the club's BlackBox machine environment with Wazuh detection rules and the ToolBox hardening toolkit used for CCDC preparation.
