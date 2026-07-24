"use client";

import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import styles from "./Terminal.module.css";
import { Bash } from "../unix/Bash";
type Props = {
  history: string;
};

export default function Terminal({ history }: Props) {
  const [History, SetHistory] = useState(history + "\n" || "\n");
  const [Loading, SetLoading] = useState(false);

  const bash = useRef(new Bash());

  const [CurrentCommand, SetCurrentCommand] = useState("");
  // -1 means "at the live prompt"; otherwise an index into command history.
  const [historyIndex, setHistoryIndex] = useState(-1);

  async function onSubmitEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (CurrentCommand == "") return;
    const prompt = bash.current.getPrompt();
    const entered = CurrentCommand;
    SetLoading(true);
    SetHistory((h) => h + prompt + entered + "\n");
    SetCurrentCommand("");
    setHistoryIndex(-1);
    if (entered === "clear") {
      SetHistory("");
      SetLoading(false);
      return;
    }

    const output = await bash.current.executeCommand(entered);
    if (output) {
      SetHistory((h) => h + output + "\n");
    }
    SetLoading(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const past = bash.current.getHistory();

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (past.length === 0) return;
      const next = historyIndex === -1 ? past.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      SetCurrentCommand(past[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const next = historyIndex + 1;
      if (next >= past.length) {
        setHistoryIndex(-1);
        SetCurrentCommand("");
      } else {
        setHistoryIndex(next);
        SetCurrentCommand(past[next]);
      }
    } else if (e.key === "Tab") {
      // Complete the first word against the known command set.
      e.preventDefault();
      const [word, ...rest] = CurrentCommand.split(" ");
      if (rest.length > 0) return; // only complete the command name
      const matches = Bash.commandNames().filter((c) => c.startsWith(word));
      if (matches.length === 1) {
        SetCurrentCommand(matches[0] + " ");
      } else if (matches.length > 1) {
        SetHistory((h) => h + bash.current.getPrompt() + CurrentCommand + "\n" + matches.join("  ") + "\n");
      }
    }
  }

  return (
    <div className="bg-black text-white p-4 font-mono text-sm overflow-y-auto min-h-[60vh] max-h-[calc(100vh-10rem)] terminal">
      <pre className="whitespace-pre-wrap">{History}</pre>
      {!Loading && (
        <form onSubmit={onSubmitEvent} className="flex">
          <pre>{bash.current.getPrompt()}</pre>
          <input
            id="command"
            type="text"
            placeholder=""
            value={CurrentCommand}
            className={`${styles.input}`}
            onChange={(e) => SetCurrentCommand(e.target.value)}
            onKeyDown={onKeyDown}
            tabIndex={0}
            autoFocus={true}
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      )}
    </div>
  );
}
