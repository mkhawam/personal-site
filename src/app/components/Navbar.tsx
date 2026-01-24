import Image from "next/image";
import { NavBarMenu } from "./NavBarMenu";
import Socials from "./Socials"; 
// Note: ThemeController removed as we are enforcing a specific dark aesthetic.

export default function NavBar() {
  return (
    <div className="flex flex-col h-full bg-transparent">
      
      {/* Profile Header */}
      <div className="p-8 flex flex-col items-center border-b border-white/5">
        <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-white/10 shadow-xl">
            <Image
              alt="Mohamad Khawam"
              src="https://avatars.githubusercontent.com/mkhawam"
              fill
              className="object-cover"
              sizes="96px"
              priority
            />
        </div>
        <h2 className="text-lg font-bold text-zinc-100">Mohamad Khawam</h2>
        <p className="text-xs text-zinc-500 font-mono mt-1">Full Stack Developer</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <NavBarMenu />
      </div>

      {/* Footer / Socials */}
      <div className="p-6 border-t border-white/5 bg-black/20">
        <Socials />
      </div>
    </div>
  );
}
