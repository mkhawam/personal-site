import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FaDiscord } from "react-icons/fa";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

// The OAuth callback lands here on failure (see api/auth/discord/callback)
const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Discord sign-in didn't complete. Give it another try.",
  unauthorized: "That Discord account isn't on the allow-list for this site.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Something went wrong signing you in.") : null;

  return (
    <div className="min-h-full w-full p-8 md:p-12 bg-gradient-to-br from-base-100 via-base-200 to-base-100 flex items-center justify-center">
      <div className="animate-rise w-full max-w-md space-y-8">
        <div className="space-y-5">
          <p className="text-xs md:text-sm font-mono uppercase tracking-[0.2em] text-primary">Restricted Area</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-base-content tracking-tight">Welcome back</h1>
          <p className="text-base-content/70 font-light leading-relaxed">
            Sign in to reach the workflow — tasks, focus timer, and encrypted sync.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-error/20 bg-error/10 px-5 py-4 text-sm text-error" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="rounded-2xl border border-base-content/10 bg-base-200/50 p-6 md:p-8 shadow-xl space-y-6">
          <a
            href="/api/auth/discord/login"
            className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-[#5865F2]/25"
          >
            <FaDiscord size={22} />
            Continue with Discord
          </a>

          <p className="text-xs text-base-content/50 text-center leading-relaxed">
            Authentication is restricted to authorized accounts. Everything else on this site is open — no login needed.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-base-content/50 hover:text-base-content transition-colors"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </div>
    </div>
  );
}
