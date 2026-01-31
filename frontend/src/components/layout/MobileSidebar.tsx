"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Video,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useLogout } from "@/hooks";

const menu = [
  { label: "Dashboard", icon: Home },
  { label: "Meetings", icon: Video },
  { label: "Schedule", icon: Calendar },
  { label: "Messages", icon: MessageSquare },
  { label: "Settings", icon: Settings },
];

export default function MobileSidebar() {
  const router = useRouter();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => router.push("/login"),
      onError: () => router.push("/login"),
    });
  };

  return (
    <>
      {/* Menu trigger button — top-right, only on mobile */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-[#FAFAFB] shadow-sm flex items-center justify-center text-[#029CD4] md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 md:hidden",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Drawer panel — slides from LEFT */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[260px] transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Inner container matching AppSidebar design */}
        <div className="h-[calc(100vh-2rem)] my-4 ml-4 bg-[#FAFAFB] rounded-[40px] shadow-sm flex flex-col overflow-hidden">
          {/* Top row: Logo + Close button */}
          <div className="h-16 flex items-center justify-between pl-5 pr-4">
            <Image
              src="/logo.png"
              alt="CosmicForge Logo"
              width={140}
              height={32}
              className="w-[120px] min-w-[120px] object-contain object-left"
              priority
            />
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#B6B6B6] hover:text-[#029CD4] transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="mt-6 space-y-1 flex-1">
            {menu.map(({ label, icon: Icon }) => {
              const isActive = active === label;
              return (
                <button
                  key={label}
                  onClick={() => {
                    setActive(label);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative w-full flex items-center gap-3 px-5 py-3 transition-colors",
                    isActive ? "text-[#029CD4]" : "text-[#B6B6B6]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>

                  {isActive && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-[#029CD4] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="pb-8 px-5 space-y-4">
            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={logout.isPending}
              className="w-full flex items-center gap-3 text-[#B6B6B6] hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-5 h-5 min-w-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3">
              <Image
                src="/profile.png"
                alt="Profile"
                width={36}
                height={36}
                className="w-9 h-9 min-w-9 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-gray-700 truncate">
                Profile
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
