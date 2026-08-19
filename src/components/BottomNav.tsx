"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNav, AUTH_PATHS } from "@/lib/nav";
import { navIcons } from "./icons";

export default function BottomNav() {
  const pathname = usePathname();

  if (AUTH_PATHS.has(pathname)) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-al-gray-200 bg-al-black md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5">
        {mobileNav.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = navIcons[item.label];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors ${
                active ? "text-al-lime" : "text-al-gray-400"
              }`}
            >
              {active && (
                <span className="absolute -top-1.5 h-[3px] w-6 rounded-full bg-al-lime" />
              )}
              {Icon && <Icon className="h-5 w-5" />}
              <span className="font-display text-[10px] font-bold tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
