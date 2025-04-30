import { JSX } from "react";
import { Github } from "./Github";


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
        url: "https://github.com/dominusmars/AppTracker",
        embed: <Github username="dominusmars" repo="AppTracker" />,
        tags: ["NodeJS", "LLM", "Bayesian", "Discord", "Automation", "Email", "NLP"],
    },
    {
        name: "Windows Cloud-Init Script",
        description: "A OpenStack cloud-init script for windows. The script is used to automate the configuration of windows instances in OpenStack or Proxmox.",
        url: "https://github.com/dominusmars/cloud-init",
        embed: <Github username="dominusmars" repo="cloud-init" />,
        tags: ["Windows", "Cloud-Init", "OpenStack", "Proxmox", "Automation", "PowerShell"],
    },
    {
        name: "Pfsense-Api",
        description: "A simple API for Pfsense. The API is used to automate the configuration of Pfsense instances. The API is used to create, read, update and delete firewall rules. after the work of jaredhendrickson13.",
        url: "https://github.com/dominusmars/pfsense-api",
        embed: <Github username="dominusmars" repo="pfsense-api" />,
        tags: ["Pfsense", "API", "Automation", "Network Security", "Firewall"],

    },
    {
        name: "Proxmox Discord Bot",
        description: " Discord bot provides sysadmins a way to provide discord connective to their Proxmox node. Utilizing one node in a cluster. Sysadmins can provide their Discord users with an easy way to create and edit VMs.",
        url: "https://github.com/dominusmars/Discord_Proxmox",
        embed: <Github username="dominusmars" repo="Discord_Proxmox" />,
        tags: ["NodeJS", "Discord", "Proxmox", "Automation", "Network Security", "Web Application"],
    },

    {
        name: "Jackal",
        description: "Network Behavior Analysis application that uses suricata to analyze network traffic and detect anomalies. By generated alerts by suricata, the application can detect and analyze network attacks. The application uses a web interface to display the alerts and provide a user-friendly way to analyze the data.",

        url: "https://github.com/dominusmars/Jackal",
        embed: <Github username="dominusmars" repo="Jackal" />,
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
        url: "https://github.com/dominusmars/JobApps",
        embed: <Github username="dominusmars" repo="JobApps" />,
        tags: ["Typescript", "React", "NodeJS", "Express", "LevelDB", "Web Application",],
    }

]


export function Projects() {

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-3xl font-bold mb-4"></h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {projects.map((project) => (
                    <div key={project.name} className="card bg-base-100 shadow-xl p-4">
                        <div className="card-body">
                            <h2 className="card-title">{project.name}</h2>
                            <p>{project.description}</p>
                            <div className="justify-start items-center">
                                {project.embed}

                            </div>
                            <div className="tags mt-2 flex flex-wrap gap-2">
                                {project.tags.map((tag) => (
                                    <span key={tag} className="badge badge-outline">{tag}</span>
                                ))}
                            </div>
                            <div className="card-actions justify-end">
                                <a href={project.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">View Project</a>
                            </div>


                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}