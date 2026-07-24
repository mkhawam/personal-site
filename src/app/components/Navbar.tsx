import Image from "next/image";
import { NavBarMenu } from "./NavBarMenu";
import Socials from "./Socials";
import ThemeController from "./ThemeController";
import CommandHint from "./CommandHint";

export default function NavBar({ isAuthed = false }: { isAuthed?: boolean }) {
  return (
    <div className="flex flex-col h-full bg-transparent">

      {/* Profile Header */}
      <div className="p-8 flex flex-col items-center border-b border-base-content/5">
        <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-base-content/10 shadow-xl">
            <Image
              alt="Mohamad Khawam"
              src="https://avatars.githubusercontent.com/mkhawam"
              fill
              className="object-cover"
              sizes="96px"
              priority
            />
        </div>
        <h2 className="text-lg font-bold text-base-content">Mohamad Khawam</h2>
        <p className="text-xs text-base-content/50 font-mono mt-1">Full Stack Developer</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <NavBarMenu isAuthed={isAuthed} />
      </div>

      {/* Footer / Socials */}
      <div className="p-6 border-t border-base-content/5 bg-base-300/40 space-y-4">
        <CommandHint />
        <div className="flex items-center justify-center gap-4">
          <Socials />
          <ThemeController />
        </div>
      </div>
    </div>
  );
}
