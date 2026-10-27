import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import JournalProvider from "@/components/JournalProvider";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <JournalProvider>
      <div className="flex h-dvh overflow-hidden bg-[#fffaf3]">
        <Sidebar />
        <main className="flex-1 min-w-0 h-dvh overflow-hidden">{children}</main>
      </div>
    </JournalProvider>
  );
}
