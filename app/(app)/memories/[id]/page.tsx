"use client";

import { use } from "react";
import EntryReader from "@/components/memories/EntryReader";

export default function MemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EntryReader key={id} id={id} />;
}
