import { supabaseAdmin } from './supabase-server';

export interface RateLimitResult {
  limited: boolean;
  blockedUntil: Date | null;
  remaining: number;
}

/**
 * Checks if a specific identifier (IP address, phone number, etc.) is rate limited.
 * Persists tracking in the `rate_limits` database table.
 * 
 * @param identifier The rate limiting key (e.g. IP or phone number)
 * @param limitType The category of request (e.g. 'otp_request', 'pin_attempt')
 * @param maxRequests Maximum requests allowed within the window
 * @param windowSeconds The size of the rate limit window in seconds
 */
export async function isRateLimited(
  identifier: string,
  limitType: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const now = new Date();

    // Query existing rate limit entry
    const { data: entry, error } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('limit_type', limitType)
      .maybeSingle();

    if (error) {
      console.error(`[Rate Limit] Error fetching limit for ${identifier}:`, error);
      // Fallback: allow request on database error
      return { limited: false, blockedUntil: null, remaining: 1 };
    }

    if (!entry) {
      // First attempt: insert new record
      const { error: insertError } = await supabaseAdmin
        .from('rate_limits')
        .insert({
          identifier,
          limit_type: limitType,
          request_count: 1,
          window_start: now.toISOString(),
          blocked_until: null
        });

      if (insertError) {
        console.error('[Rate Limit] Error inserting rate limit record:', insertError);
      }

      return {
        limited: false,
        blockedUntil: null,
        remaining: maxRequests - 1
      };
    }

    // Check if currently blocked
    if (entry.blocked_until && new Date(entry.blocked_until) > now) {
      return {
        limited: true,
        blockedUntil: new Date(entry.blocked_until),
        remaining: 0
      };
    }

    const windowStart = new Date(entry.window_start);
    const elapsedSeconds = (now.getTime() - windowStart.getTime()) / 1000;

    if (elapsedSeconds > windowSeconds) {
      // Window expired: reset window
      const { error: updateError } = await supabaseAdmin
        .from('rate_limits')
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          blocked_until: null
        })
        .eq('id', entry.id);

      if (updateError) {
        console.error('[Rate Limit] Error resetting rate limit window:', updateError);
      }

      return {
        limited: false,
        blockedUntil: null,
        remaining: maxRequests - 1
      };
    }

    // Inside active window: increment count
    const nextCount = entry.request_count + 1;

    if (nextCount > maxRequests) {
      // Exceeded limit: block until next window
      const blockUntil = new Date(now.getTime() + windowSeconds * 1000);
      const { error: blockError } = await supabaseAdmin
        .from('rate_limits')
        .update({
          request_count: nextCount,
          blocked_until: blockUntil.toISOString()
        })
        .eq('id', entry.id);

      if (blockError) {
        console.error('[Rate Limit] Error setting rate limit block:', blockError);
      }

      return {
        limited: true,
        blockedUntil: blockUntil,
        remaining: 0
      };
    }

    // Under limit: update count
    const { error: countError } = await supabaseAdmin
      .from('rate_limits')
      .update({
        request_count: nextCount
      })
      .eq('id', entry.id);

    if (countError) {
      console.error('[Rate Limit] Error updating rate limit count:', countError);
    }

    return {
      limited: false,
      blockedUntil: null,
      remaining: maxRequests - nextCount
    };

  } catch (err) {
    console.error('[Rate Limit] Unhandled rate limit error:', err);
    return { limited: false, blockedUntil: null, remaining: 1 };
  }
}
