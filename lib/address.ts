const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH = /^0x[a-fA-F0-9]{64}$/;
const PRIVATE_KEY = /^(0x)?[a-fA-F0-9]{64}$/;

export function isEvmAddress(value: string | null | undefined): value is string {
  return Boolean(value && EVM_ADDRESS.test(value.trim()));
}

export function isTxHash(value: string | null | undefined): value is string {
  return Boolean(value && TX_HASH.test(value.trim()));
}

export function isPrivateKeyHex(value: string | null | undefined): boolean {
  return Boolean(value && PRIVATE_KEY.test(value.trim()));
}

export function normalizeAddress(value: string) {
  return value.trim();
}

export function addressesEqual(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function shortAddress(value: string, left = 6, right = 4) {
  const trimmed = value.trim();
  if (trimmed.length <= left + right + 3) return trimmed;
  return `${trimmed.slice(0, left)}…${trimmed.slice(-right)}`;
}

export function normalizePrivateKey(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}
