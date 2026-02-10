"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Wallet,
  Repeat,
  ArrowRightLeft,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { logoutAction } from "@/actions/authActions";
import { useUserStore } from "@/store/useUserStore";

const menuItems = [
  { name: "Accounts", icon: CreditCard, href: "accounts" },
  { name: "Transactions", icon: ArrowRightLeft, href: "transactions" },
  { name: "Categories", icon: Shield, href: "categories" },
  { name: "Budgets", icon: Wallet, href: "budgets" },
  { name: "Subscriptions", icon: Repeat, href: "subscriptions" },
  { name: "Settings", icon: Shield, href: "settings" },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useUserStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
    logout();
    router.push("/");
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "ADMIN") setIsAdmin(true);
      } catch (e) {}
    }
  }, []);

  const allMenuItems = isAdmin
    ? [
        ...menuItems,
        { name: "User Admin", icon: Shield, href: "admin/users" },
        { name: "System Admin", icon: Shield, href: "admin/system" },
      ]
    : menuItems;

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-background border border-(--foreground) hover:bg-foreground hover:text-background transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        id="tour-sidebar"
        className={`h-screen flex flex-col bg-background border-r border-(--foreground) transition-all duration-300 z-40 
          ${isCollapsed ? "w-20" : "w-72"}
          ${
            isMobileMenuOpen
              ? "fixed left-0 top-0"
              : "fixed -left-72 lg:relative lg:left-0"
          }
        `}
      >
        <div className="p-4 flex items-center justify-between h-16 border-b border-(--foreground)">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-black italic text-lg">
                M
              </div>
              <span className="text-xs font-black tracking-widest uppercase italic">
                <Link href={`/dashboard`}>MoneyTracker</Link>
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-black italic mx-auto">
              M
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-foreground/5">
          <nav className="flex flex-col">
            {allMenuItems.map((item) => {
              const isActive = pathname
                .replace("/dashboard/", "")
                .startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={`/dashboard/${item.href}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-8 py-6 text-xs font-black uppercase tracking-widest transition-all group ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-foreground hover:bg-muted/10"
                  }`}
                >
                  <item.icon
                    size={18}
                    className={`${
                      isActive ? "text-background" : "text-foreground"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="transition-transform group-hover:translate-x-1 duration-300">
                      {item.name}
                    </span>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 text-xs font-black uppercase bg-foreground text-background opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-(--foreground) divide-y divide-(--foreground)">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center px-8 py-6 hover:bg-muted/10 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <div className="flex gap-2 text-xs font-black uppercase tracking-widest">
                <ChevronLeft size={16} /> Collapse View
              </div>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-4 px-8 py-6 text-xs font-black uppercase tracking-widest hover:bg-muted/10 transition-all group"
          >
            {theme === "light" ? (
              <>
                <Moon size={18} />
                {!isCollapsed && <span>Dark Mode</span>}
              </>
            ) : (
              <>
                <Sun size={18} />
                {!isCollapsed && <span>Light Mode</span>}
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-8 py-6 text-xs font-black uppercase tracking-widest hover:bg-muted/10 transition-all group"
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
