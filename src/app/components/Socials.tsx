import { FaGithub, FaLinkedin } from 'react-icons/fa';

const socials = [
    {
        name: 'GitHub',
        Icon: FaGithub,
        href: 'https://github.com/mkhawam',
    },
    {
        name: 'LinkedIn',
        Icon: FaLinkedin,
        href: 'https://linkedin.com/in/mohamad-k',
    },
];

export default function Socials({ size = 35 }: { size?: number }) {
    return (
        <div className="flex flex-wrap gap-3 justify-center">
            {socials.map(({ name, Icon, href }) => (
                <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="text-base-content/70 hover:text-base-content transition-colors flex items-center"
                >
                    <Icon size={size} />
                </a>
            ))}
        </div>
    );
}
