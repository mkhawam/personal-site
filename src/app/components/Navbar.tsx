import Image from "next/image";
import { NavBarMenu } from "./NavBarMenu";
import ThemeController from "./ThemeController";
import Socials from "./Socials";
export default function NavBar() {
  return (
    <div className="bg-base-100 shadow-sm md:w-xs sm:w-full relative h-100vh">
      <div className="flex items-center justify-center h-1/5">
        <div tabIndex={0} role="button" className="avatar">
          <div className="rounded-full w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36">
            <Image
              alt="Tailwind CSS Navbar component"
              src="https://avatars.githubusercontent.com/mkhawam"
              width={100}
              height={100}
              sizes="(max-width: 768px) 25vw, 20vw"
              quality={100}
              priority={true}
              className="object-contain"
            />
          </div>
        </div>
      </div>
      <NavBarMenu />
      <div className="fixed bottom-0 left-0 p-8 w-full md:w-xs sm:w-full flex z-10">
        <Socials />
        <ThemeController />
      </div>
    </div>
  );
}
