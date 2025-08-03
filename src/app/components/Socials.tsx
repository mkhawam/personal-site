import { FaGithub, FaLinkedin } from 'react-icons/fa';

const socials = [
    {
        name: 'GitHub',
        icon: <FaGithub size={35} />,
        href: 'https://github.com/mkhawam',
        color: 'btn-neutral',
    },
    {
        name: 'LinkedIn',
        icon: <FaLinkedin size={35} />,
        href: 'https://linkedin.com/in/mohamad-k',
        color: 'btn-primary',
    },
    // {
    //     name: 'Twitter',
    //     icon: <FaTwitter />,
    //     href: 'https://twitter.com/',
    //     color: 'btn-accent',
    // },
    // {
    //     name: 'Instagram',
    //     icon: <FaInstagram />,
    //     href: 'https://instagram.com/yourusername',
    //     color: 'btn-secondary',
    // },
];

export default function Socials() {
    return (
        <div className="flex flex-wrap gap-3 justify-center">
            {socials.map((social) => (
                <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-base-content flex items-center`}
                >
                    {social.icon}
                    {/* <span className="hidden sm:inline">{social.name}</span> */}
                </a>
            ))}
        </div>
    );
}
