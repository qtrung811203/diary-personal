// Entries older than today open read-only. One that was just created for a
// past day (from the dashboard) is meant to be written in, so the creator
// leaves a note here that the next open of that entry should start editable.
const pending = new Set<string>();

export const markEditIntent = (id: string) => void pending.add(id);
export const consumeEditIntent = (id: string) => pending.delete(id);
