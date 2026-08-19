"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { desktopNav } from "@/lib/nav";
import Logo from "./Logo";
import LogoutButton from "./LogoutButton";

const AUTH_PATHS = new Set(["/login", "/register"]);

export default function Header({ user }: { user: { displayName: string } | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (AUTH_PATHS.has(pathname)) return null;

  const isActive = (href: string) => {
    const [hrefPath, hrefQuery] = href.split("?");
    if (hrefPath !== pathname) return false;
    if (!hrefQuery) return true;
    const tab = new URLSearchParams(hrefQuery).get("tab");
    return searchParams.get("tab") === tab;
  };

  return (
    <header className="sticky top-0 z-40 hidden border-b border-al-gray-200 bg-white/90 backdrop-blur md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        <Logo className="text-xl" />
        <nav className="flex items-center gap-1">
          {desktopNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex flex-col rounded-xl px-4 py-2 transition-colors ${
                  active ? "bg-al-black text-white" : "text-al-black hover:bg-al-gray-100"
                }`}
              >
                <span className="font-display text-xs font-bold tracking-wide">
                  {item.label}
                </span>
                <span
                  className={`text-[11px] ${
                    active ? "text-al-gray-300" : "text-al-gray-500"
                  }`}
                >
                  {item.sub}
                </span>
              </Link>
            );
          })}
        </nav>
        {user && (
          <div className="flex items-center gap-3 pl-4">
            <span className="font-display text-sm font-bold">{user.displayName}</span>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
