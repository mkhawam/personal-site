import Image from "next/image";
import { Projects } from "./components/Projects";

export default function ProjectsPage() {
    return (
        <div className="grow bg-base-300 text-base-content min-h-screen p-8 pb-20 select-none">
            <div className="">
                <div className="text-5xl">Projects</div>
            </div>
            <div>
                <Projects />
            </div>


        </div>
    );
}
