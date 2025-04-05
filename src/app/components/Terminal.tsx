"use client";

import { FormEvent, useRef, useState } from "react";
import "./Terminal.css";
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


  function onSubmitEvent(e: FormEvent<HTMLFormElement>) {
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


    const output = bash.current.executeCommand(CurrentCommand);
    if (output) {
      SetHistory((h) => h + output + "\n");
    }
    SetLoading(false);
  }
  return (
    <div className="bg-black text-white p-3 overflow-y-scroll max-h-full terminal">
      <pre>{History}</pre>
      {!Loading && (
        <form onSubmit={onSubmitEvent} className="flex">
          <pre>{bash.current.getPrompt()}</pre>
          <input
            id="command"
            type="text"
            placeholder=""
            className="input"
            onChange={(e) => SetCurrentCommand(e.target.value)}
          />
        </form>
      )}
    </div>
  );
}
