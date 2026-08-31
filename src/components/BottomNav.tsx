"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNav, mobileMoreNav, AUTH_PATHS } from "@/lib/nav";
import { navIcons, IconMore } from "./icons";

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // ページ遷移したら「もっと」メニューは自動で閉じる（レンダー中に前回値と比較する、
  // Reactが推奨する「propが変わったらstateをリセットする」パターン。useEffectは使わない）。
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMoreOpen(false);
  }

  if (AUTH_PATHS.has(pathname)) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const moreActive = mobileMoreNav.some((item) => isActive(item.href));

  return (
    <>
      {moreOpen && (
        <>
          <button
            aria-label="メニューを閉じる"
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
          />
          <div className="fixed inset-x-3 bottom-[calc(4.5rem+max(env(safe-area-inset-bottom),8px))] z-50 al-flyer-card overflow-hidden rounded-2xl bg-white md:hidden">
            {mobileMoreNav.map((item) => {
              const Icon = navIcons[item.label];
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 border-b border-al-gray-100 px-4 py-3.5 last:border-b-0 ${
                    active ? "bg-al-gray-50" : ""
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5 shrink-0 text-al-black" />}
                  <span>
                    <span className="block font-display text-sm font-bold">{item.label}</span>
                    <span className="block text-xs text-al-gray-500">{item.sub}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-al-gray-200 bg-al-black md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5">
          {mobileNav.map((item) => {
            const active = isActive(item.href);
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
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors ${
              moreOpen || moreActive ? "text-al-lime" : "text-al-gray-400"
            }`}
          >
            {(moreOpen || moreActive) && (
              <span className="absolute -top-1.5 h-[3px] w-6 rounded-full bg-al-lime" />
            )}
            <IconMore className="h-5 w-5" />
            <span className="font-display text-[10px] font-bold tracking-wide">もっと</span>
          </button>
        </div>
      </nav>
    </>
  );
}
