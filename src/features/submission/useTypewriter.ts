import { useEffect, useMemo, useState } from "react";

const WORDS_PER_TICK = 3;
const TICK_MS = 50;   // about 60 words per second

/**
 * Reveals a list of text blocks word by word, in order, as one continuous stream.
 * text(i) returns the visible part of block i. When disabled, everything is visible at once.
 */
export function useTypewriter(blocks: string[], enabled: boolean) {
  // Split into words *with* their spaces, so joining a prefix keeps the original spacing.
  const tokens = useMemo(() => blocks.map((block) => block.split(/(?<=\s)/)), [blocks]);
  const offsets = useMemo(() => {
    const result: number[] = [];
    let sum = 0;
    for (const t of tokens) {
      result.push(sum);
      sum += t.length;
    }
    return { starts: result, total: sum };
  }, [tokens]);

  const [position, setPosition] = useState(enabled ? 0 : Number.POSITIVE_INFINITY);
  const done = position >= offsets.total;

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => {
      setPosition((p) => p + WORDS_PER_TICK);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [done]);

  function text(index: number): string {
    if (done) return blocks[index] ?? "";
    const visible = position - offsets.starts[index];
    if (visible <= 0) return "";
    return tokens[index].slice(0, visible).join("");
  }

  return { text, done, skip: () => setPosition(Number.POSITIVE_INFINITY) };
}