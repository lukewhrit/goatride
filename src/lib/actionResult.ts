/* eslint-disable max-classes-per-file -- the server and client halves of one mechanism */
/*
 * In production, Next.js replaces the message of any error thrown from a server function with a
 * generic one, so problems the user can act on ("Could not find a location for …") never reach
 * the browser. Server functions instead throw a UserError for those, `toResult` turns it into a
 * returned value, and the client turns it back into an ActionError with `unwrap`. Every other
 * error still throws and reaches the client with its message hidden.
 */

export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** An error whose message is safe and useful to show the user. Server side only. */
export class UserError extends Error {
  override name = 'UserError';
}

/** Runs a server function body, returning any UserError as `{ ok: false, error }`. */
export async function toResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    throw e;
  }
}

/** Client side: an error a server function reported with a user-facing message. */
export class ActionError extends Error {
  override name = 'ActionError';
}

/** Returns a server function's value, or throws its user-facing error as an ActionError. */
export async function unwrap<T>(result: Promise<ActionResult<T>> | ActionResult<T>): Promise<T> {
  const r = await result;
  if (!r.ok) throw new ActionError(r.error);
  return r.value;
}

/** A message for a caught error: the user-facing one if there is one, otherwise `fallback`. */
export const errorMessage = (err: unknown, fallback: string): string =>
  err instanceof ActionError ? err.message : fallback;
