import { headers } from "next/headers";
import Terminal from "./components/Terminal";

export const metadata = {
  title: "Not found",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const heads = await headers();

  const pathname = heads.get("x-pathname") || "";
  const isCv = pathname.toLowerCase().startsWith("/cv");

  return (
    <div className="grow bg-base-100 text-base-content min-h-screen p-6 md:p-8 pb-20">
      <div className="max-w-4xl mx-auto space-y-4">
        <p className="text-sm text-base-content/50 font-mono">
          {isCv ?
            "You found the shell. The CV is in here somewhere."
          : "API calls are sys calls now?"}
        </p>

        <div className="rounded-2xl overflow-hidden border border-base-content/10 shadow-2xl">
          <Terminal
            history={
              "Not Found \n" +
              `cat: ${pathname.toLowerCase()}: No such file or directory\n` +
              (isCv ?
                "\nhint: try `ls`, then `cat resume.md` (or just `resume` for the PDF)"
              : "\nhint: this is a real shell. try `help`")
            }
          />
        </div>
      </div>
    </div>
  );
}
