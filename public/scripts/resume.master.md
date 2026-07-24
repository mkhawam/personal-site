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
<!-- id: exp-rutgers-appdev | tags: full-stack, python, django, react, typescript, jupyter, devops, ansible, security, accessibility, education-tech | pin -->

- Maintained and extended codePost, a full-stack code grading platform (Django API, React UI, Celery workers) deployed across 4 VMs with Docker Compose, serving 500+ students per semester with autograding, a multi-language test framework with per-cell Jupyter evaluation, and AI-assisted comment generation (Ollama/OpenAI) with org-level cost tracking.
- Designed and built jupyter-assignments, a JupyterLab sidebar extension (React/TypeScript + Python) with a 4-tier role system (student/grader/staff/instructor) and a platform adapter pattern abstracting codePost and Autolab behind a unified interface, enabling in-editor assignment management across multiple grading platforms.
- Automated JupyterHub deployment across course servers with Ansible, managing CAS/Kerberos/Azure auth, Python versioning, modular extensions, and Zabbix monitoring.
- Published next-cas-client, an npm package providing CAS 2.0/3.0 and SAML 1.1 single sign-on for Next.js applications with iron-session session management, built for university CAS authentication.
- Built a 3-way notebook merge tool using content-similarity matching to prevent instructor updates from clobbering student edits in shared activebooks.
- Led WCAG accessibility remediation on codePost-ui and built an accessibility scanner (Flask, Playwright, Docker) for automated audits across university domains.
- Patched directory traversal, privilege escalation, and infinite recursion vulnerabilities; migrated codePost-ui from CRA to Vite + React Router v7.

### Rutgers University, <em>Student Lab Technician</em> <span class="date">January 2023 - May 2025</span>
<!-- id: exp-rutgers-labtech | tags: hardware, support, documentation, raspberry-pi, computer-vision, react, express -->

- Managed 10 Hackerspace workspaces, writing student-focused documentation and maintaining the WordPress site, modernizing the space.
- Developed a Raspberry Pi learning environment with MediaPipe, boosting student engagement by 70%.
- Developed a 3D printer monitoring service using Express and React to stream live video, increasing printer usage by 30%.

### Swish, <em>Full-Stack Developer</em> <span class="date">July 2021 - December 2021</span>
<!-- id: exp-swish | tags: automation, node, puppeteer, electron, testing, full-stack -->

- Automated account creation on web platforms using Puppeteer and Node.js, accelerating creation by 300% with Mocha-based testing.
- Migrated CLI to Electron desktop application, increasing user engagement by 200%.

### C-Tech, <em>Computer Technician</em> <span class="date">July 2019 - December 2021</span>
<!-- id: exp-ctech | tags: it, windows, powershell, automation, security -->

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
<!-- id: proj-apptracker | tags: typescript, llm, ai, email, automation, discord, mongodb, backend | default: 1 -->

- Built a TypeScript application that tracks job applications by reading incoming emails via IMAP, classifying them with a Bayesian classifier, and generating status updates using Ollama AI models.
- Integrated Discord bot notifications and MongoDB storage to provide real-time application status updates.

### [Jackal](https://github.com/mkhawam/Jackal) <span class="date">November 2024</span>
<!-- id: proj-jackal | tags: security, network-security, suricata, data, mongodb, node, react, full-stack | default: 2 -->

- Developed a Node.js-based frontend for Suricata network log analysis, enabling the review of 1M+ logs per day with interactive web-based graph visualizations.
- Built a queue system supporting ingestion of 1000+ events per second and a MongoDB pipeline with sub-100ms query latency for terabytes of logs.

### [CompLock](https://github.com/rusec/CompLock) <span class="date">November 2023 - Present</span>
<!-- id: proj-complock | tags: security, blue-team, c2, ssh, cli, typescript, devops | default: 3 -->

- Developed SSH command and control software for networked computers in TypeScript, leveraging LevelDB and SSH2, utilized by RUSEC in CCDC competitions.
- Reduced password rotation on 30 machines from 5 minutes to 30 seconds with automated testing via GitHub Actions and Mocha.

### [NetLock](https://github.com/rusec/NetLock) <span class="date">July 2024 - 2025</span>
<!-- id: proj-netlock | tags: security, blue-team, c2, siem, node, express, mongodb, backend -->

- Built a SIEM / command-and-control server for blue-team competition use (Node.js, Express, MongoDB), designed for rapid deployment with minimal end-user setup.
- Implemented HTTPS beacons that report host events to a central server, giving defenders live visibility into network activity across the competition landscape.

### [next-cas-client](https://github.com/rutgers-lcsr/next-cas-client) <span class="date">2025</span>
<!-- id: proj-next-cas-client | tags: typescript, next, authentication, sso, open-source, npm, frontend -->

- Published an npm package (next-cas-client) for CAS single sign-on in Next.js, handling authentication, ticket validation, and session management via iron-session.
- Supports CAS 2.0, CAS 3.0, and SAML 1.1 validation; built at Rutgers LCSR for university CAS authentication in Next.js applications.

### [Accessibility Scanner](https://github.com/rutgers-lcsr/Accessibility_Scanner) <span class="date">2025</span>
<!-- id: proj-a11y-scanner | tags: accessibility, flask, next, playwright, celery, python, full-stack, automation -->

- Built a web accessibility auditing platform: a Flask API and Next.js interface drive Playwright and Axe scans through Celery workers across university domains.
- Stores per-page results with screenshots so remediation progress is measurable over time.

### [mohamadk.com](https://mohamadk.com) <span class="date">April 2025 - Present</span>
<!-- id: proj-portfolio | tags: next, react, typescript, full-stack, frontend, pwa, ai, webcontainers, design | default: 4 -->

- Designed and built a Next.js 16 / React 19 portfolio and blog with a markdown publishing pipeline, PWA support, server-resolved theming, and a keyboard command palette.
- Engineered an in-browser code playground with WebContainers that boots a Node.js runtime client-side to run my published ts-declaration-json package live, with no server execution.
- Implemented a simulated Linux shell in TypeScript (custom filesystem, user system, and coreutils) served as the site's 404 page, plus Spotify OAuth with token refresh and an AI task-planning agent with tool calling.

### [ts-declaration-json](https://github.com/mkhawam/ts-declaration-json) <span class="date">October 2024</span>
<!-- id: proj-ts-declaration-json | tags: typescript, npm, open-source, tooling, codegen | default: 5 -->

- Created an NPM package that parses TypeScript modules and returns declarations as JSON, enabling automated React component generation with parallel child processes.

### [pfSense API](https://github.com/mkhawam/pfsense-api) <span class="date">November 2024</span>
<!-- id: proj-pfsense-api | tags: security, firewall, automation, api, networking -->

- Built an API for pfSense that automates instance configuration, exposing create, read, update, and delete operations for firewall rules, extending jaredhendrickson13's package.

### [Windows Cloud-Init Script](https://github.com/mkhawam/cloud-init) <span class="date">March 2025</span>
<!-- id: proj-cloud-init | tags: windows, powershell, cloud, openstack, proxmox, automation, infrastructure -->

- Wrote an OpenStack cloud-init script for Windows that automates configuration of Windows instances on OpenStack and Proxmox with PowerShell.

### [Drone Project](https://github.com/Cyrus-Majd/Drone-Indepenent-Study-PI) <span class="date">January 2023 - May 2023</span>
<!-- id: proj-drone | tags: computer-vision, opencv, python, embedded, research -->

- Implemented OpenCV vision algorithms to guide a drone along computer-generated paths, achieving 90% search precision with 10x range increase via cellular communication.

### [JobApps](https://github.com/mkhawam/JobApps) <span class="date">February 2024</span>
<!-- id: proj-jobapps | tags: typescript, react, node, express, leveldb, full-stack, web -->

- Built a web application for tracking job applications with a TypeScript/React frontend and an Express + LevelDB backend, predating tools like Simplify.

### [Puncta Detector](https://github.com/mkhawam/Puncta-Detector) <span class="date">March 2024</span>
<!-- id: proj-puncta | tags: python, computer-vision, image-analysis, research, cli -->

- Built a Python CLI tool that identifies puncta in fluorescence microscopy images using configurable brightness-level analysis, for research lab image processing.

### [RUSEC ToolBox](https://github.com/rusec/ToolBox) <span class="date">November 2024 - Present</span>
<!-- id: proj-toolbox | tags: security, blue-team, hardening, python, windows, linux, ccdc -->

- Lead contributor to RUSEC's blue-team hardening toolkit: Linux and Windows hardening scripts, firewall configuration automation, and LOLBin mitigation used in competition preparation.

### [Apache Guacamole — contributor](https://github.com/apache/guacamole-server/pull/696) <span class="date">2026</span>
<!-- id: proj-oss-guacamole | tags: c, open-source, rdp, protocol, systems, remote-access -->

- Contributed RDPSND Wave2 (SNDC_WAVE2) PDU support to Apache Guacamole's RDP sound channel in C (GUACAMOLE-2306, PR under review).

### [JJava (Jupyter Java kernel) — contributor](https://github.com/dflib/jjava/pull/122) <span class="date">2026</span>
<!-- id: proj-oss-jjava | tags: java, jupyter, open-source, notebooks, education-tech -->

- Contributed interactive Swing & JavaFX rendering and static image rendering of GUI components in notebooks to JJava, the Jupyter kernel for Java (PRs under review).

### [Ticket Collector — HackRU 2023](https://devpost.com/software/ticket-collector) <span class="date">February 2023</span>
<!-- id: proj-hackru | tags: python, opencv, computer-vision, robotics, hardware, hackathon, award | default: 6 -->

- Won the Maverick Track award at HackRU Spring 2023 with a team of four, building an autonomous robot that traverses train aisles to collect tickets and count passengers for NJ Transit.
- Implemented OpenCV facial recognition and QR-code ticket validation on Raspberry Pi and Arduino, offloading processing to a web streaming service.

---

## Education

### Bachelor of Arts, <em>Computer Science</em> <span class="date">May 2025</span>
<!-- id: edu-rutgers | tags: education | pin -->

- Rutgers University — Coursework: Computer Security, Software Methodology, Computer Architecture.

---

## Leadership

### Vice President, <em>RUSecurity</em> <span class="date">January 2023 - May 2025</span>
<!-- id: lead-rusec | tags: security, blue-team, ccdc, infrastructure, leadership, proxmox, vmware | pin | default: 1 -->

- Directed network administration for CCDC, with the team placing 4th in 2024.
- Led club infrastructure setup using Proxmox and VMware ESXi, yielding a 70% increase in technical competency.
- Led development of the club's BlackBox machine environment with Wazuh detection rules and the ToolBox hardening toolkit used for CCDC preparation.

---

## Writing & Talks

### [Technical Blog](https://mohamadk.com/blog) <span class="date">2024 - Present</span>
<!-- id: writing-blog | tags: writing, security, software-design, communication -->

- Write about software design and security at mohamadk.com/blog — including a technical breakdown of the xz/liblzma OpenSSH backdoor (CVE-2024-3094), a Jersey CTF write-up on broken access control (OWASP A01), and essays on code readability and architecture.

### [RU CyberCon 2025 — OWASP Top 10](https://github.com/rusec/owasp_website) <span class="date">April 2025</span>
<!-- id: talk-cybercon | tags: security, owasp, talk, communication, next -->

- Presented the OWASP Top 10 vulnerabilities at RU CyberCon 2025, building an interactive Next.js demonstration site to accompany the talk.
