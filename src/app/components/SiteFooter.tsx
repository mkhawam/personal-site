import Socials from "./Socials";

/** Global footer; carries the #contact anchor the header and palette point at. */
export default function SiteFooter() {
    return (
        <footer id="contact" className="scroll-mt-24 border-t border-base-content/5">
            <div className="max-w-5xl mx-auto px-8 md:px-12 py-12 space-y-6">
                <div className="flex items-baseline gap-4">
                    <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-base-content/50">
                        Contact
                    </h2>
                    <div className="h-px flex-1 bg-base-content/10" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <a
                        href="mailto:khawammohamad99@gmail.com"
                        className="text-base-content/70 hover:text-primary transition-colors"
                    >
                        khawammohamad99@gmail.com
                    </a>
                    <Socials size={20} />
                </div>

                <blockquote className="text-sm italic font-serif text-base-content/50 max-w-prose">
                    &quot;You have light and peace inside of you. If you let it out, you
                    can change the world around you.&quot;
                    <cite className="not-italic ml-2 text-xs font-sans tracking-wide uppercase text-base-content/40">
                        — Uncle Iroh
                    </cite>
                </blockquote>

                <p className="text-xs text-base-content/40">
                    © {new Date().getFullYear()} Mohamad Khawam
                </p>
            </div>
        </footer>
    );
}
