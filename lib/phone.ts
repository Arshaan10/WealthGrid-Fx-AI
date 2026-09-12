/** Canonical phone: digits only, leading + kept. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 16) {
    throw new Error("Enter a valid phone number (8–16 digits).");
  }
  return plus ? `+${digits}` : `+${digits}`;
}

export function isValidPhone(raw: string): boolean {
  try {
    normalizePhone(raw);
    return true;
  } catch {
    return false;
  }
}
