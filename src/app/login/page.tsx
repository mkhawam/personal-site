import { FaDiscord } from 'react-icons/fa';

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-base-content/50">Sign in to access your workflow</p>
      </div>

      <a
        href="/api/auth/discord/login"
        className="flex items-center gap-3 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-[#5865F2]/25 hover:scale-105"
      >
        <FaDiscord size={24} />
        Login with Discord
      </a>
      
      <p className="text-xs text-base-content/50 max-w-xs text-center">
        Authentication restricted to authorized users only.
      </p>
    </div>
  );
}
