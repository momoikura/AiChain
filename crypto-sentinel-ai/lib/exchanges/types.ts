/**
 * Exchange balance adapters — READ-ONLY.
 *
 * Each adapter signs a request with the operator's own API key/secret and
 * returns spot balances. Deliberately read-only: no adapter here can place,
 * cancel or transfer anything. Keys are decrypted server-side only, used for
 * the signature, and never logged or returned to the client.
 */

export interface Balance {
  asset: string; // e.g. "SOL"
  free: number;
  locked: number;
  total: number;
}

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  /** Some venues (OKX) additionally require a passphrase. */
  passphrase?: string;
}

export interface ExchangeAdapter {
  id: string;
  label: string;
  /** Fetch spot balances. Throws on auth/network failure. */
  fetchBalances(creds: ExchangeCredentials): Promise<Balance[]>;
}

export class ExchangeError extends Error {
  constructor(
    public exchange: string,
    message: string,
    public status?: number
  ) {
    // Never include key material in the message.
    super(`[${exchange}] ${message}`);
    this.name = "ExchangeError";
  }
}

/** Drop dust so the UI isn't flooded with 0.00000001 balances. */
export function significant(balances: Balance[], min = 1e-8): Balance[] {
  return balances.filter((b) => b.total > min).sort((a, b) => b.total - a.total);
}
