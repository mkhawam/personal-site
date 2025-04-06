"use client";

import { FormEvent, useRef, useState } from "react";
import styles from "./Terminal.module.css";
import { FileSystem } from "../unix/FileSystem";
import { Bash } from "../unix/Bash";
type Props = {
  history: string;
};

export default function Terminal({ history }: Props) {
  const [History, SetHistory] = useState(history + "\n" || "\n");
  const [Loading, SetLoading] = useState(false);

  const bash = useRef(new Bash());

  const [CurrentCommand, SetCurrentCommand] = useState("");


  async function onSubmitEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (CurrentCommand == "") return;
    const prompt = bash.current.getPrompt();
    SetLoading(true);
    SetHistory((h) => h + prompt + CurrentCommand + "\n");
    SetCurrentCommand("");
    const inputElement: HTMLInputElement | null = document.getElementById(
      "command",
    ) as HTMLInputElement;
    if (!inputElement) return;
    inputElement.value = "";
    if (CurrentCommand === "clear") {
      SetHistory("");
      SetLoading(false);
      return;
    }

    const output = await bash.current.executeCommand(CurrentCommand);
    if (output) {
      SetHistory((h) => h + output + "\n");
    }
    SetLoading(false);
  }
  return (
    <div className="bg-black text-white p-3 overflow-y-auto max-h-[calc(100vh-20px) terminal">
      <pre>{History}</pre>
      {!Loading && (
        <form onSubmit={onSubmitEvent} className="flex">
          <pre>{bash.current.getPrompt()}</pre>
          <input
            id="command"
            type="text"
            placeholder=""
            className={`${styles.input}`}
            onChange={(e) => SetCurrentCommand(e.target.value)}
            tabIndex={0}
          />
        </form>
      )}

    </div>
  );
}
