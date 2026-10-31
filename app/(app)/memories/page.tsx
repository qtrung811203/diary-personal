import { Suspense } from "react";
import MemoriesView from "@/components/memories/MemoriesView";

export default function MemoriesPage() {
  return (
    <Suspense fallback={<div className="h-full bg-[#fff4e4]" />}>
      <MemoriesView />
    </Suspense>
  );
}
