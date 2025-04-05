"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./NavBarMenu.css";

export function NavBarMenu() {
  const path = usePathname();
  function getClassName(baseClasses: string, targetName: string) {
    const loweredTarget = targetName.toLowerCase();

    if (loweredTarget == "home" && path == "/") return `${baseClasses} active`;

    if (path.toLowerCase().includes(loweredTarget.toLowerCase()))
      return `${baseClasses} active`;
    else return baseClasses;
  }

  return (
    <ul className="menu grow shrink menu-md overflow-y-auto flex flex-col w-full text-base-content">
      <li className={getClassName("", "Home")}>
        <Link href={"/"}>
          <div className={"py-3"}>Home</div>
        </Link>
      </li>
      <li className={getClassName("", "Projects")}>
        <Link href={"/projects"}>
          <div className={"py-3"}>Projects</div>
        </Link>
      </li>

      <li className={getClassName("", "Blog")}>
        <Link href={"/blog"}>
          <div className={"py-3"}>Blog</div>
        </Link>
      </li>
      <li className={getClassName("", "cv")}>
        <Link href={"/cv"}>
          <div className={"py-3"}>CV</div>
        </Link>
      </li>
      <li>
        <Link href={"mailto:khawammohamad99@gmail.com"}>
          <div className={"py-3"}>Contact</div>
        </Link>
      </li>
    </ul>
  );
}
