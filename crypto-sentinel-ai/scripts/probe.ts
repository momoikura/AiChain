import { getSnapshot } from "../lib/data/store";

let yellowTicks = 0;
let redTicks = 0;
let maxScore = 0;
const N = 200;
const topScores: number[] = [];

for (let t = 0; t < N; t++) {
  const { alerts } = getSnapshot(1_000_000 + t);
  const top = alerts.reduce((m, a) => Math.max(m, a.score.score), 0);
  topScores.push(top);
  maxScore = Math.max(maxScore, top);
  if (alerts.some((a) => a.level === "yellow")) yellowTicks++;
  if (alerts.some((a) => a.level === "red")) redTicks++;
}

topScores.sort((a, b) => b - a);
console.log(`ticks sampled: ${N}`);
console.log(`ticks with a YELLOW alert: ${yellowTicks} (${((yellowTicks / N) * 100).toFixed(0)}%)`);
console.log(`ticks with a RED alert:    ${redTicks} (${((redTicks / N) * 100).toFixed(0)}%)`);
console.log(`global max top-score: ${maxScore}`);
console.log(`median top-score: ${topScores[Math.floor(N / 2)]}`);
console.log(`p90 top-score: ${topScores[Math.floor(N * 0.1)]}`);
