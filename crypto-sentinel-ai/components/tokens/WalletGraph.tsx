import { Rng } from "@/lib/rng";

type NodeKind = "token" | "smart-money" | "whale" | "vc" | "exchange" | "team";

const KIND_COLOR: Record<NodeKind, string> = {
  token: "#00ff41",
  "smart-money": "#22d3ff",
  whale: "#b26bff",
  vc: "#ffcf3a",
  exchange: "#ff2957",
  team: "#00ffe0",
};

const KIND_LABEL: Record<NodeKind, string> = {
  token: "Token",
  "smart-money": "Smart money",
  whale: "Whale",
  vc: "VC",
  exchange: "Exchange",
  team: "Team",
};

/**
 * Deterministic wallet-relationship graph — a stand-in for the on-chain
 * clustering visualization (Arkham/Nansen-style). Node color encodes the
 * wallet label; edge direction/weight encodes net flow toward the token.
 */
export function WalletGraph({ symbol }: { symbol: string }) {
  const rng = new Rng(`graph:${symbol}`);
  const w = 520;
  const h = 300;
  const cx = w / 2;
  const cy = h / 2;

  const kinds: NodeKind[] = ["smart-money", "whale", "vc", "exchange", "team"];
  const n = 11;
  const nodes = Array.from({ length: n }, (_, i) => {
    const kind = i === 0 ? ("token" as NodeKind) : rng.pick(kinds);
    const angle = (i / n) * Math.PI * 2 + rng.float(-0.2, 0.2);
    const radius = i === 0 ? 0 : rng.float(90, 135);
    return {
      id: i,
      kind,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      r: i === 0 ? 20 : rng.float(6, 13),
      inflow: kind !== "exchange" && rng.bool(0.62),
    };
  });

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {/* edges — self-draw in, then data packets travel the pathways */}
        {nodes.slice(1).map((node, i) => {
          const color = node.inflow ? "#00ff41" : "#ff2957";
          // inflow = value moving toward the token (center); outflow = away.
          const from = node.inflow ? { x: node.x, y: node.y } : { x: cx, y: cy };
          const to = node.inflow ? { x: cx, y: cy } : { x: node.x, y: node.y };
          return (
            <g key={`e${node.id}`}>
              <line
                x1={cx}
                y1={cy}
                x2={node.x}
                y2={node.y}
                stroke={color}
                strokeOpacity={0.28}
                strokeWidth={node.inflow ? 1.6 : 1}
                pathLength={1}
                className="draw-line"
                style={{ animationDelay: `${i * 70}ms` }}
              />
              <circle r={2.3} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
                <animateMotion
                  dur={`${2.4 + (i % 3) * 0.7}s`}
                  begin={`${0.9 + i * 0.12}s`}
                  repeatCount="indefinite"
                  path={`M${from.x.toFixed(1)},${from.y.toFixed(1)} L${to.x.toFixed(1)},${to.y.toFixed(1)}`}
                />
              </circle>
            </g>
          );
        })}
        {/* nodes */}
        {nodes.map((node, i) => (
          <g key={node.id}>
            {/* sonar pulse ring */}
            <circle cx={node.x} cy={node.y} r={node.r} fill="none" stroke={KIND_COLOR[node.kind]}>
              <animate attributeName="r" from={node.r} to={node.r * (node.kind === "token" ? 2.6 : 2)} dur="2.6s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2.6s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
            </circle>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={KIND_COLOR[node.kind]}
              fillOpacity={node.kind === "token" ? 0.9 : 0.7}
              stroke={KIND_COLOR[node.kind]}
              strokeOpacity={0.6}
              style={{ filter: `drop-shadow(0 0 ${node.kind === "token" ? 12 : 6}px ${KIND_COLOR[node.kind]})` }}
            />
            {node.kind === "token" && (
              <text x={node.x} y={node.y + 4} textAnchor="middle" className="fill-base-950 text-[11px] font-bold">
                {symbol.slice(0, 4)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3">
        {(Object.keys(KIND_COLOR) as NodeKind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[10px] text-white/50">
            <span className="h-2 w-2 rounded-full" style={{ background: KIND_COLOR[k] }} />
            {KIND_LABEL[k]}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-3 text-[10px] text-white/40">
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-signal-green" /> inflow</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-signal-red" /> outflow</span>
        </span>
      </div>
    </div>
  );
}
