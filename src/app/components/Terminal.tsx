"use client";

import { FormEvent, useState } from "react";
import "./Terminal.css";
type Props = {
  history: string;
};

export default function Terminal({ history }: Props) {
  const [History, SetHistory] = useState(history + "\n" || "\n");
  const [Loading, SetLoading] = useState(false);
  const [Pwd, SetPwd] = useState("~/personal-site");
  const [CurrentCommand, SetCurrentCommand] = useState("");
  const prompt = "root@fedora:~/personal-site$ ";
  let pwd = "~/personal-site";
  const changeDirectory = (location: string) => {};

  function onSubmitEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (CurrentCommand == "") return;

    SetLoading(true);
    SetHistory((h) => h + prompt + CurrentCommand + "\n");
    SetCurrentCommand("");
    const inputElement: HTMLInputElement | null = document.getElementById(
      "command",
    ) as HTMLInputElement;
    if (!inputElement) return;
    inputElement.value = "";

    SetLoading(false);
  }
  return (
    <div className="bg-black text-white p-3">
      <pre>{History}</pre>
      {!Loading && (
        <form onSubmit={onSubmitEvent} className="flex">
          <pre>{prompt}</pre>
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
