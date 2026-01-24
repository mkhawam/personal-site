'use client';

import { JSX } from "react";
import { Github } from "./Github";
import { motion } from "framer-motion";
import clsx from "clsx";

type project = {
    name: string;
    description: string;
    url: string;
    embed: JSX.Element;
    tags: string[];
}

const projects: project[] = [
    {
        name: "Job Application Tracker",
        description: "A node js application that allows a user to track their job application using their incoming emails. The application uses discord to send notifications to the user when a new job update is found and uses an LLM to parse the email extracting the relevant information.",
        url: "https://github.com/mkhawam/AppTracker",
        embed: <Github username="mkhawam" repo="AppTracker" />,
        tags: ["NodeJS", "LLM", "Bayesian", "Discord", "Automation", "Email", "NLP"],
    },
    {
        name: "Windows Cloud-Init Script",
        description: "A OpenStack cloud-init script for windows. The script is used to automate the configuration of windows instances in OpenStack or Proxmox.",
        url: "https://github.com/mkhawam/cloud-init",
        embed: <Github username="mkhawam" repo="cloud-init" />,
        tags: ["Windows", "Cloud-Init", "OpenStack", "Proxmox", "Automation", "PowerShell"],
    },
    {
        name: "Pfsense-Api",
        description: "A simple API for Pfsense. The API is used to automate the configuration of Pfsense instances. The API is used to create, read, update and delete firewall rules. after the work of jaredhendrickson13.",
        url: "https://github.com/mkhawam/pfsense-api",
        embed: <Github username="mkhawam" repo="pfsense-api" />,
        tags: ["Pfsense", "API", "Automation", "Network Security", "Firewall"],

    },
    {
        name: "Proxmox Discord Bot",
        description: " Discord bot provides sysadmins a way to provide discord connective to their Proxmox node. Utilizing one node in a cluster. Sysadmins can provide their Discord users with an easy way to create and edit VMs.",
        url: "https://github.com/mkhawam/Discord_Proxmox",
        embed: <Github username="mkhawam" repo="Discord_Proxmox" />,
        tags: ["NodeJS", "Discord", "Proxmox", "Automation", "Network Security", "Web Application"],
    },

    {
        name: "Jackal",
        description: "Network Behavior Analysis application that uses suricata to analyze network traffic and detect anomalies. By generated alerts by suricata, the application can detect and analyze network attacks. The application uses a web interface to display the alerts and provide a user-friendly way to analyze the data.",

        url: "https://github.com/mkhawam/Jackal",
        embed: <Github username="mkhawam" repo="Jackal" />,
        tags: ["Python", "Flask", "Suricata", "Network Security", "Web Application", "Data Analysis", "Machine Learning", "React", "MongoDB", "Docker"],

    },
    {
        name: "NetLock",
        description: "NetLock is a siem/command control server that is meant to be deployed quickly and without a lot of work from the end user. The goal is to create a C2 server that gives the blue team key insights into the landscape by documenting events happening around the network. It does this by using beacons which give event updates to the server using HTTPS. ",
        url: "https://github.com/rusec/NetLock",
        embed: <Github username="rusec" repo="NetLock" />,
        tags: ["NodeJS", "Express", "MongoDB", "Web Application", "Network Security", "Docker"],
    },
    {
        name: "CompLock",
        description: "CompLock was created to help blue teams control there computers using a centralized database. This was meant to be used in blue team competitions where the blue team has control over the computers using SSH or LDAP. The cli application allows for a simple C2 server to change passwords of machines quickly and easily. Through development of this applications I learned alot on Network Security and Networking. I made it using NodeJS simply because I wanted to push a langauage I knew to its limits.",
        url: "https://github.com/rusec/CompLock",
        embed: <Github username="rusec" repo="CompLock" />,
        tags: ["NodeJS", "LevelDB", "CLI Application", "Network Security", "SSH", "LDAP"],

    },
    {
        name: "JobApps",
        description: "JobApps is a web application that allows users to track their job applications. The application uses a web interface to display the job applications and provide a user-friendly way to manage the data. Before Simplify was created.",
        url: "https://github.com/mkhawam/JobApps",
        embed: <Github username="mkhawam" repo="JobApps" />,
        tags: ["Typescript", "React", "NodeJS", "Express", "LevelDB", "Web Application",],
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" }
    }
};

export function Projects() {
    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pb-20 opacity-0"
        >
            {projects.map((project, idx) => (
                <motion.div 
                    key={project.name}
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    viewport={{ once: true }}
                    className="group relative flex flex-col h-full overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-white/20 hover:shadow-2xl hover:shadow-white/5"
                >
                    <div className="p-6 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-zinc-100 group-hover:text-white transition-colors duration-300">
                                {project.name}
                            </h2>
                            <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                {project.embed}
                            </div>
                        </div>

                        <p className="text-zinc-400 leading-relaxed mb-6 flex-1">
                            {project.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-auto">
                            {project.tags.map((tag) => (
                                <span 
                                    key={tag} 
                                    className="px-3 py-1 text-xs font-semibold rounded-full bg-white/5 border border-white/10 text-zinc-500 group-hover:border-white/20 group-hover:text-zinc-300 transition-colors"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end">
                        <a 
                            href={project.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-sm btn-ghost hover:bg-white hover:text-zinc-900 transition-all"
                        >
                            View Project
                        </a>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}