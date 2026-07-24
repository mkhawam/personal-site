import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24; // re-issue if iat older than 24h

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: '/',
};

// Throws on first use (not module load — `next build` runs with NODE_ENV=production
// before deployment env vars exist) so a missing secret fails loudly in prod instead
// of silently signing/verifying with a known constant.
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not set. Refusing to sign/verify tokens in production.');
    }
    return new TextEncoder().encode('dev_secret_do_not_use_in_prod');
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  // getSecret() stays outside the try: a prod misconfiguration must throw,
  // not read as "logged out".
  const secret = getSecret();
  try {
    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
    return payload;
  } catch {
    return null;
  }
}

export function shouldRefreshToken(payload: JWTPayload): boolean {
  if (typeof payload.iat !== 'number') return true;
  return Date.now() / 1000 - payload.iat > REFRESH_THRESHOLD_SECONDS;
}

export async function refreshToken(payload: JWTPayload): Promise<string> {
  // Strip registered claims so signToken stamps fresh iat/exp.
  const { iat, exp, nbf, ...claims } = payload;
  void iat; void exp; void nbf;
  return signToken(claims);
}

// Only relative in-site paths survive; anything else falls back to /tasks.
export function safeReturnTo(value: string | null): string {
  if (
    value &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('://') &&
    !value.includes('\\') &&
    value.length < 512
  ) {
    return value;
  }
  return '/tasks';
}
