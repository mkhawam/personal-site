/**
 * Contents for files seeded into the simulated filesystem.
 *
 * /cv has no Next.js route on purpose — it falls through to the 404 page, which
 * is this shell. So the CV has to be findable here: `ls` then `cat resume.md`.
 * Kept in sync by hand with public/scripts/resume.md.
 */

export const RESUME_MD = `Mohamad Khawam
New Jersey, United States
Khawammohamad99@gmail.com  |  (862)-285-1846

  github.com/mkhawam
  linkedin.com/in/mohamad-k
  mohamadk.com

Tip: run \`resume\` to open the PDF version.

== SUMMARY ==

Application developer at Rutgers University with experience spanning
full-stack platforms, infrastructure automation, and security. Built and
shipped features across Django, React, JupyterLab, and Ansible-managed
deployments used in CS and data science courses. Background in competitive
cyber defense and network security tooling.

== EXPERIENCE ==

Rutgers University — Application Developer          June 2025 - Present
  * Maintained and extended codePost, a full-stack code grading platform
    (Django API, React UI, Celery workers) deployed across 4 VMs with Docker
    Compose, serving 500+ students per semester with autograding, a
    multi-language test framework with per-cell Jupyter evaluation, and
    AI-assisted comment generation (Ollama/OpenAI) with org-level cost
    tracking.
  * Designed and built jupyter-assignments, a JupyterLab sidebar extension
    (React/TypeScript + Python) with a 4-tier role system and a platform
    adapter pattern abstracting codePost and Autolab behind a unified
    interface.
  * Automated JupyterHub deployment across course servers with Ansible,
    managing CAS/Kerberos/Azure auth, Python versioning, modular extensions,
    and Zabbix monitoring.
  * Published next-cas-client, an npm package providing CAS 2.0/3.0 and
    SAML 1.1 single sign-on for Next.js applications with iron-session
    session management.
  * Built a 3-way notebook merge tool using content-similarity matching to
    prevent instructor updates from clobbering student edits.
  * Led WCAG accessibility remediation on codePost-ui and built an
    accessibility scanner (Flask, Playwright, Docker).
  * Patched directory traversal, privilege escalation, and infinite recursion
    vulnerabilities; migrated codePost-ui from CRA to Vite + React Router v7.

Rutgers University — Student Lab Technician      January 2023 - May 2025
  * Managed 10 Hackerspace workspaces, writing student-focused documentation
    and maintaining the WordPress site.
  * Developed a Raspberry Pi learning environment with MediaPipe, boosting
    student engagement by 70%.
  * Developed a 3D printer monitoring service using Express and React to
    stream live video, increasing printer usage by 30%.

Swish — Full-Stack Developer                     July 2021 - December 2021
  * Automated account creation on web platforms using Puppeteer and Node.js,
    accelerating creation by 300% with Mocha-based testing.
  * Migrated CLI to Electron desktop application, increasing user engagement
    by 200%.

C-Tech — Computer Technician                     July 2019 - December 2021
  * Automated computer initialization with PowerShell scripts, cutting build
    time from 40 to 20 minutes.
  * Implemented a secure HDD erasure workflow processing dozens of drives
    daily, onboarding 3 new enterprise clients.

== SKILLS ==

Languages:      Python, TypeScript, JavaScript, C, Java, Golang, PowerShell
Frameworks:     React, Django, Flask, Next.js, Express, JupyterLab, Electron,
                Vite
Data:           MariaDB, MongoDB, Redis, Celery, LevelDB, S3
Infrastructure: Docker, Ansible, Nginx, Linux, Proxmox, VMware, AWS, OpenStack,
                GitHub Actions, Zabbix
Security:       Network Security, Suricata, pfSense, CAS/SAML, Kerberos, OWASP
Other:          Git, Playwright, Puppeteer, Vitest, Tree-sitter, OpenCV,
                MediaPipe, Ollama, WebContainers, WCAG Accessibility

== PROJECTS ==

AppTracker (2025)
  TypeScript application that tracks job applications by reading incoming
  email over IMAP, classifying with a Bayesian classifier, and generating
  status updates using Ollama models. Discord notifications, MongoDB storage.

Jackal (November 2024)
  Node.js frontend for Suricata network log analysis, handling 1M+ logs per
  day with interactive graph visualizations. Queue system ingesting 1000+
  events per second, MongoDB pipeline with sub-100ms query latency.

CompLock (November 2023 - Present)
  SSH command and control software in TypeScript using LevelDB and SSH2,
  used by RUSEC in CCDC competitions. Cut password rotation across 30
  machines from 5 minutes to 30 seconds.

mohamadk.com (April 2025 - Present)
  Next.js 16 / React 19 portfolio with a markdown blog pipeline, PWA support,
  an in-browser WebContainers code playground running my published npm
  package, and a simulated Linux shell in TypeScript as the 404 page.
  (You are here.)

ts-declaration-json (October 2024)
  NPM package that parses TypeScript modules and returns declarations as
  JSON, enabling automated React component generation.

Ticket Collector — HackRU 2023 (February 2023)
  Maverick Track award winner. Autonomous robot that traverses train aisles
  to collect tickets and count passengers for NJ Transit, using OpenCV facial
  recognition and QR-code ticket validation on Raspberry Pi and Arduino.

== EDUCATION ==

B.A. Computer Science, Rutgers University                      May 2025
  Coursework: Computer Security, Software Methodology,
  Computer Architecture.

== LEADERSHIP ==

Vice President, RUSecurity                   January 2023 - May 2025
  * Directed network administration for CCDC; team placed 4th in 2024.
  * Led club infrastructure setup using Proxmox and VMware ESXi.
  * Led development of the club's BlackBox machine environment with Wazuh
    detection rules and the ToolBox hardening toolkit for CCDC prep.
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
