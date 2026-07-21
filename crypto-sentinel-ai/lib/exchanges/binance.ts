import { createHmac } from "crypto";
import {
  ExchangeError,
  significant,
  type Balance,
  type ExchangeAdapter,
  type ExchangeCredentials,
} from "./types";

/**
 * Binance spot balances — GET /api/v3/account (read-only, SIGNED).
 * Signature = HMAC-SHA256(queryString, apiSecret), key sent as X-MBX-APIKEY.
 * Docs: binance-docs.github.io/apidocs/spot/en/#account-information-user_data
 */
export const binance: ExchangeAdapter = {
  id: "binance",
  label: "Binance",

  async fetchBalances({ apiKey, apiSecret }: ExchangeCredentials): Promise<Balance[]> {
    const query = `recvWindow=5000&timestamp=${Date.now()}`;
    const signature = createHmac("sha256", apiSecret).update(query).digest("hex");
    const url = `https://api.binance.com/api/v3/account?${query}&signature=${signature}`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "X-MBX-APIKEY": apiKey },
        cache: "no-store",
      });
    } catch {
      throw new ExchangeError("Binance", "network error reaching exchange");
    }

    if (!res.ok) {
      // Surface a safe, generic reason — never echo the response verbatim.
      const reason =
        res.status === 401 || res.status === 403
          ? "invalid API key or insufficient permissions"
          : res.status === 418 || res.status === 429
          ? "rate limited by exchange"
          : `exchange returned ${res.status}`;
      throw new ExchangeError("Binance", reason, res.status);
    }

    const data = (await res.json()) as {
      balances?: { asset: string; free: string; locked: string }[];
    };

    const balances: Balance[] = (data.balances ?? []).map((b) => {
      const free = Number(b.free) || 0;
      const locked = Number(b.locked) || 0;
      return { asset: b.asset.toUpperCase(), free, locked, total: free + locked };
    });

    return significant(balances);
  },
};
