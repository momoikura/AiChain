"use client";

import { useEffect, useState } from "react";
import { classNames } from "@/lib/format";

/**
 * Terminal typewriter. Types `text` char-by-char with a blinking caret.
 * Optionally cycles through multiple lines.
 */
export function TypeText({
  text,
  className,
  speed = 34,
  caret = true,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  speed?: number;
  caret?: boolean;
  startDelay?: number;
}) {
  const [out, setOut] = useState("");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setOut(text);
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return (
    <span className={classNames(caret && "caret", className)}>{out}</span>
  );
}
