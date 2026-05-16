/** Resolve achievement label: i18n key `achievement.<type>` with server title fallback. */
export function tAchievement(
  type: string,
  fallbackTitle: string,
  t: (key: string) => string
): string {
  const key = `achievement.${type}`;
  const out = t(key);
  return out === key ? fallbackTitle : out;
}
