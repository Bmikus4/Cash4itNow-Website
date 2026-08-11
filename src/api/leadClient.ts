/**
 * Drop-in replacement for the dead Base44 form calls.
 *
 * The live site's seven forms call `base44.entities.*.create()`, a no-network
 * stub that returns `{id: "stub_1"}` and shows a success toast. Each of those
 * call sites becomes one `submitLead()` here.
 *
 * Two things this does that the stub could not: it reports failure honestly, and
 * it measures how long the visitor spent on the form. That elapsed time is a
 * spam signal the server cannot obtain any other way — a bot fills and posts in
 * milliseconds — so the timer has to start when the form mounts, in the browser.
 */

export type LeadFormId =
  | 'hero_evaluation'
  | 'contact_page_evaluation'
  | 'home_cta_evaluation'
  | 'footer_newsletter'
  | 'sale_coupon'
  | 'item_offer';

export interface LeadFields {
  name?: string;
  phone?: string;
  email?: string;
  propertyAddress?: string;
  message?: string;
  /** Step-2 enrichment: photos, preferred visit window, categories, item id. */
  payload?: Record<string, unknown>;
}

export interface SubmitOptions {
  formId: LeadFormId;
  fields: LeadFields;
  /** From `startLeadTimer()`, called when the form mounted. */
  mountedAt?: number;
  honeypot?: string;
  turnstileToken?: string;
  endpoint?: string;
  signal?: AbortSignal;
}

export type SubmitResult =
  | { ok: true; message: string }
  | { ok: false; message: string; retryable: boolean; fieldErrors?: Record<string, string[]> };

const DEFAULT_ENDPOINT = 'https://cash4itnow.vercel.app/api/public/lead';

export function startLeadTimer(): number {
  return Date.now();
}

function utmFromLocation(): Record<string, string> | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid']) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  return Object.keys(utm).length ? utm : undefined;
}

export async function submitLead(options: SubmitOptions): Promise<SubmitResult> {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;

  const body = {
    formId: options.formId,
    page: typeof window === 'undefined' ? '' : window.location.pathname,
    ...options.fields,
    honeypot: options.honeypot ?? '',
    elapsedMs: options.mountedAt ? Date.now() - options.mountedAt : undefined,
    turnstileToken: options.turnstileToken,
    referrer: typeof document === 'undefined' ? undefined : document.referrer || undefined,
    utmData: utmFromLocation(),
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      issues?: Record<string, string[]>;
    };

    if (response.ok && data.ok) {
      return { ok: true, message: data.message ?? "Thanks — we'll be in touch shortly." };
    }

    if (response.status === 400) {
      return {
        ok: false,
        retryable: false,
        message: data.message ?? 'Please check the highlighted fields.',
        fieldErrors: data.issues,
      };
    }

    // 429 and 5xx are both worth retrying; the visitor should be offered the
    // phone number rather than a dead end.
    return {
      ok: false,
      retryable: true,
      message:
        data.message ?? 'We could not save that just now. Please try again, or call us directly.',
    };
  } catch {
    return {
      ok: false,
      retryable: true,
      message: 'We could not reach the server. Please try again, or call us directly.',
    };
  }
}
