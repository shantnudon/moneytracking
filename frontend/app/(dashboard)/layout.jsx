// "use client";

import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { checkAuth } from "@/actions/authActions";
import Sidebar from "@/components/UI/Sidebar";
import TopBar from "@/components/UI/TopBar";
import ChatAssistant from "@/components/AI/ChatAssistant";

export default async function DashboardLayout({ children }) {
  const res = await checkAuth();
  if (!res.success) {
    return redirect("/");
  }

  return (
    <div className="flex h-screen font-sans text-black transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full lg:w-auto">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="w-full animate-in fade-in duration-700 lg:pt-0">
            {children}
          </div>
        </main>
        <ChatAssistant />
      </div>
    </div>
  );
}
