import Link from "next/link";
import { headers } from "next/headers";
import Terminal from "./components/Terminal";

export default async function NotFound() {
  const heads = await headers();

  const pathname = heads.get("x-pathname") || "";

  return (
    <div className="grow bg-base-300 text-base-content min-h-screen p-8 pb-20">
      <Terminal
        history={
          "Not Found \n" +
          `cat: ${pathname.toLowerCase()}: No such file or directory`
        }
      />
      <div>API calls are sys calls now?</div>
    </div>
  );
}
