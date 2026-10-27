"use client";

import { use } from "react";
import EntryView from "@/components/EntryView";

export default function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // key={id}: a fresh EntryView (and fresh closures) per entry.
  return <EntryView key={id} id={id} />;
}
