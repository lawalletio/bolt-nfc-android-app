export interface DeviceJwtClaims {
  userId: string;
  pubkey: string;
  role: string;
  permissions: string[];
  scopes: string[];
  sub: string;
  kind: 'device';
  iss: string;
  aud: string;
  exp: number; // seconds since epoch
  iat: number;
}

function base64urlDecode(str: string): string {
  // Convert base64url → base64, then pad to a multiple of 4.
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  return global.Buffer.from(padded, 'base64').toString('utf8');
}

export function isJwtFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(p => p.length > 0);
}

export function decodeJwt(token: string): DeviceJwtClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64urlDecode(parts[1]));
    if (typeof payload !== 'object' || payload === null) return null;
    return payload as DeviceJwtClaims;
  } catch {
    return null;
  }
}

// Returns true when the token is expired (or within skewSec of expiring).
export function isExpired(
  claims: DeviceJwtClaims | null,
  skewSec: number = 30,
): boolean {
  if (!claims || typeof claims.exp !== 'number') return true;
  return claims.exp * 1000 <= Date.now() + skewSec * 1000;
}

export function secondsUntilExpiry(claims: DeviceJwtClaims | null): number {
  if (!claims || typeof claims.exp !== 'number') return 0;
  return Math.max(0, Math.floor(claims.exp - Date.now() / 1000));
}
