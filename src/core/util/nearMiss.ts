/** Standard iterative Levenshtein distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr: number[] = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length]!;
}

/**
 * Returns the candidate `token` was probably meant to be, or undefined when
 * `token` is already valid or resembles nothing.
 *
 * Thresholds are deliberately tight. A loose threshold turns every unfamiliar
 * identifier into a false positive, which is the failure mode this extension
 * exists to avoid.
 */
export function suggest(
  token: string,
  candidates: readonly string[],
): string | undefined {
  if (candidates.includes(token)) return undefined;

  // A case-only difference is always a near-miss, at any length.
  // `belongsto` for `belongsTo` is the single most common instance.
  const lower = token.toLowerCase();
  for (const c of candidates) {
    if (c.toLowerCase() === lower) return c;
  }

  // The threshold scales on the CANDIDATE's length, not the token's. A long,
  // well-established dictionary word can plausibly absorb a three-edit typo
  // ('PersistedModel', 14 chars, tolerates 'PersistantModel'), but a short
  // dictionary word must not inherit that tolerance just because the user's
  // own identifier happens to be long -- 'Checkpoint' (10 chars) keeps a
  // threshold of 2, so a real user model like 'CheckpointLog' (13 chars)
  // stays unflagged rather than being mistaken for a typo of 'Checkpoint'.
  let best: string | undefined;
  let bestDistance = Infinity;
  for (const c of candidates) {
    const threshold = c.length < 6 ? 1 : c.length < 12 ? 2 : 3;
    const d = levenshtein(token, c);
    if (d <= threshold && d < bestDistance) {
      best = c;
      bestDistance = d;
    }
  }
  return best;
}
