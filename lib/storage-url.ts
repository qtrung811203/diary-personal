// Pulls the object key back out of a URL this app generated
// (`${base}/${bucket}/${key}`), trying both the public and internal bases
// since a URL stored before MINIO_PUBLIC_URL was set may use either.
// Returns null for anything that isn't recognizably one of our own URLs —
// deleting on a guess is worse than leaving an orphan behind.
export function extractStorageKey(
  url: string,
  bucket: string,
  ...bases: string[]
): string | null {
  for (const base of bases) {
    const prefix = `${base}/${bucket}/`;
    if (url.startsWith(prefix)) {
      const key = url.slice(prefix.length);
      return key || null;
    }
  }
  return null;
}
