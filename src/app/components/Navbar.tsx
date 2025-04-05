import Image from "next/image";
import { NavBarMenu } from "./NavBarMenu";
import ThemeController from "./ThemeController";
export default function NavBar() {
  return (
    <div className=" bg-base-100 shadow-sm w-sm">
      <div className="flex items-center justify-center h-1/5">
        <div tabIndex={0} role="button" className="avatar">
          <div className="rounded-full">
            <Image
              alt="Tailwind CSS Navbar component"
              src="https://avatars.githubusercontent.com/dominusmars"
              width={70}
              height={70}
            />
          </div>
        </div>
      </div>
      <NavBarMenu />
      <div>
        <ThemeController />
      </div>
    </div>
  );
}
