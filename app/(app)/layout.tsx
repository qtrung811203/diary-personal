import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import JournalProvider from "@/components/JournalProvider";
import PinGate from "@/components/PinGate";
import Sidebar from "@/components/Sidebar";
import ViewportHeightSync from "@/components/ViewportHeightSync";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <PinGate>
      <JournalProvider>
        <ViewportHeightSync />
        <div className="flex h-[var(--app-h,100dvh)] overflow-hidden bg-[#fffaf3]">
          <Sidebar />
          <main className="flex-1 min-w-0 h-full overflow-hidden">{children}</main>
        </div>
      </JournalProvider>
    </PinGate>
  );
}
