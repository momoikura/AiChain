import { createHmac } from "crypto";
import {
  ExchangeError,
  significant,
  type Balance,
  type ExchangeAdapter,
  type ExchangeCredentials,
} from "./types";

/**
 * Bybit v5 unified balances — GET /v5/account/wallet-balance (read-only).
 * Signature = HMAC-SHA256(timestamp + apiKey + recvWindow + queryString).
 * Docs: bybit-exchange.github.io/docs/v5/account/wallet-balance
 */
export const bybit: ExchangeAdapter = {
  id: "bybit",
  label: "Bybit",

  async fetchBalances({ apiKey, apiSecret }: ExchangeCredentials): Promise<Balance[]> {
    const ts = Date.now().toString();
    const recvWindow = "5000";
    const query = "accountType=UNIFIED";
    const signature = createHmac("sha256", apiSecret)
      .update(ts + apiKey + recvWindow + query)
      .digest("hex");

    let res: Response;
    try {
      res = await fetch(`https://api.bybit.com/v5/account/wallet-balance?${query}`, {
        headers: {
          "X-BAPI-API-KEY": apiKey,
          "X-BAPI-TIMESTAMP": ts,
          "X-BAPI-RECV-WINDOW": recvWindow,
          "X-BAPI-SIGN": signature,
        },
        cache: "no-store",
      });
    } catch {
      throw new ExchangeError("Bybit", "network error reaching exchange");
    }

    if (!res.ok) throw new ExchangeError("Bybit", `exchange returned ${res.status}`, res.status);

    const data = (await res.json()) as {
      retCode?: number;
      retMsg?: string;
      result?: { list?: { coin?: { coin: string; walletBalance: string; locked?: string }[] }[] };
    };

    // Bybit returns HTTP 200 with a non-zero retCode on auth errors.
    if (data.retCode !== 0) {
      throw new ExchangeError(
        "Bybit",
        data.retCode === 10003 || data.retCode === 10004
          ? "invalid API key or signature"
          : "exchange rejected the request"
      );
    }

    const coins = data.result?.list?.[0]?.coin ?? [];
    const balances: Balance[] = coins.map((c) => {
      const total = Number(c.walletBalance) || 0;
      const locked = Number(c.locked ?? 0) || 0;
      return { asset: c.coin.toUpperCase(), free: Math.max(0, total - locked), locked, total };
    });

    return significant(balances);
  },
};
