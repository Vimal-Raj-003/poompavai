import { db } from './db.js';
import { HttpError } from './http.js';

// Atomic fixed-window counter in Postgres (serverless instances share no memory).
export async function rateLimit(key, limit, windowSec, message = 'Too many attempts. Please try again later.') {
  const rows = await db.$queryRaw`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + (${windowSec} * interval '1 second'))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < now() THEN now() + (${windowSec} * interval '1 second') ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  if (Number(rows[0].count) > limit) throw new HttpError(429, message, 'RATE_LIMITED');
}
