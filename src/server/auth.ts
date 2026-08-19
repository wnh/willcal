// Shared-password authentication.
//
// One password (WILLCAL_PASSWORD) is exchanged for a signed session cookie.
// Sessions are stateless: the cookie carries its own expiry and an HMAC over
// it, so nothing needs to survive a restart. The trade-off is that logging out
// only clears the browser's cookie; a token copied elsewhere stays valid until
// it expires. Changing WILLCAL_PASSWORD invalidates every existing session,
// because the default signing key is derived from the password.

import crypto from 'crypto';

const SESSION_COOKIE = 'willcal_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Failed logins are throttled per client address to make the single shared
// password impractical to guess over the network.
const MAX_FAILED_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  resetAt: number;
}

export class Auth {
  private readonly passwordHash: Buffer;
  private readonly secret: Buffer;
  private readonly secureCookie: boolean;
  private readonly attempts = new Map<string, AttemptRecord>();

  constructor(password: string, options: { secret?: string; secureCookie: boolean }) {
    this.passwordHash = crypto.createHash('sha256').update(password).digest();
    this.secret = options.secret
      ? Buffer.from(options.secret, 'utf8')
      : crypto.createHash('sha256').update(`willcal-session-v1:${password}`).digest();
    this.secureCookie = options.secureCookie;
  }

  /** True when the request carries a cookie with a valid, unexpired signature. */
  isAuthenticated(cookieHeader: string | undefined): boolean {
    const token = readCookie(cookieHeader, SESSION_COOKIE);
    return token !== null && this.verifyToken(token);
  }

  /**
   * Checks the submitted password. Returns the Set-Cookie value on success, or
   * null when the password is wrong. Throws if the address is rate limited.
   */
  login(password: unknown, clientKey: string): string | null {
    if (this.isRateLimited(clientKey)) {
      throw new Error('Too many failed sign-in attempts. Try again later.');
    }

    if (typeof password !== 'string' || !this.passwordMatches(password)) {
      this.recordFailure(clientKey);
      return null;
    }

    this.attempts.delete(clientKey);
    return this.cookie(this.createToken(), SESSION_DURATION_MS / 1000);
  }

  /** Set-Cookie value that expires the session cookie immediately. */
  logoutCookie(): string {
    return this.cookie('', 0);
  }

  private passwordMatches(password: string): boolean {
    // Hash first so both buffers are 32 bytes; timingSafeEqual throws on a
    // length mismatch, which would itself leak the password's length.
    const candidate = crypto.createHash('sha256').update(password).digest();
    return crypto.timingSafeEqual(candidate, this.passwordHash);
  }

  private createToken(): string {
    const expiry = Date.now() + SESSION_DURATION_MS;
    const nonce = crypto.randomBytes(12).toString('base64url');
    const payload = `${expiry}.${nonce}`;
    return `${payload}.${this.sign(payload)}`;
  }

  private verifyToken(token: string): boolean {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return false;

    const payload = token.slice(0, lastDot);
    const signature = token.slice(lastDot + 1);
    const expected = this.sign(payload);

    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return false;
    }

    const expiry = Number(payload.split('.')[0]);
    return Number.isFinite(expiry) && expiry > Date.now();
  }

  private sign(payload: string): string {
    return crypto.createHmac('sha256', this.secret).update(payload).digest('base64url');
  }

  private cookie(value: string, maxAgeSeconds: number): string {
    const parts = [
      `${SESSION_COOKIE}=${value}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${maxAgeSeconds}`,
    ];
    // Browsers treat localhost as a secure context, so Secure cookies still
    // work for local testing. Set WILLCAL_ALLOW_INSECURE_COOKIE=1 only when
    // reaching the server over plain HTTP on some other hostname.
    if (this.secureCookie) parts.push('Secure');
    return parts.join('; ');
  }

  private isRateLimited(clientKey: string): boolean {
    const record = this.attempts.get(clientKey);
    if (!record) return false;
    if (Date.now() > record.resetAt) {
      this.attempts.delete(clientKey);
      return false;
    }
    return record.count >= MAX_FAILED_ATTEMPTS;
  }

  private recordFailure(clientKey: string): void {
    const now = Date.now();
    const record = this.attempts.get(clientKey);
    if (!record || now > record.resetAt) {
      this.attempts.set(clientKey, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
      return;
    }
    record.count += 1;
  }
}

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=');
    if (separator === -1) continue;
    if (pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return null;
}
