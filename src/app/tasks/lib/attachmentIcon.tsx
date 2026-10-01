import { ExternalLink, FileCode, FileText, Globe, Image as ImageIcon, Video } from "lucide-react";
// Brand icons — lucide-react 1.x dropped brand glyphs; react-icons (already a
// dependency, used in Socials) is lucide's recommended source for these.
import { FaCodepen, FaFigma, FaGithub, FaInstagram, FaLinkedin, FaSlack, FaTrello, FaTwitter, FaYoutube } from "react-icons/fa";

const SERVICES: [string[], React.ReactNode][] = [
    [["github.com"], <FaGithub key="gh" size={12} />],
    [["youtube.com", "youtu.be"], <FaYoutube key="yt" size={12} />],
    [["twitter.com", "x.com"], <FaTwitter key="tw" size={12} />],
    [["figma.com"], <FaFigma key="fg" size={12} />],
    [["instagram.com"], <FaInstagram key="ig" size={12} />],
    [["linkedin.com"], <FaLinkedin key="li" size={12} />],
    [["codepen.io"], <FaCodepen key="cp" size={12} />],
    [["trello.com"], <FaTrello key="tr" size={12} />],
    [["slack.com"], <FaSlack key="sl" size={12} />],
];

const DOCS = [".pdf", ".doc", ".docx", ".txt"];
const IMAGES = [".png", ".jpg", ".jpeg", ".gif", ".svg"];
const VIDEOS = [".mp4", ".mov", ".avi"];
const CODE = [".js", ".ts", ".tsx", ".py", ".css", ".html"];

/** Small glyph for an attachment pill, picked from the URL's host or file extension. */
export function getIconForUrl(url: string): React.ReactNode {
    try {
        const u = new URL(url);
        const domain = u.hostname.toLowerCase();
        const path = u.pathname.toLowerCase();

        for (const [hosts, icon] of SERVICES) if (hosts.some((h) => domain.includes(h))) return icon;
        if (DOCS.some((e) => path.endsWith(e))) return <FileText size={12} />;
        if (IMAGES.some((e) => path.endsWith(e))) return <ImageIcon size={12} />;
        if (VIDEOS.some((e) => path.endsWith(e))) return <Video size={12} />;
        if (CODE.some((e) => path.endsWith(e))) return <FileCode size={12} />;
        return <Globe size={12} />;
    } catch {
        return <ExternalLink size={12} />;
    }
}
