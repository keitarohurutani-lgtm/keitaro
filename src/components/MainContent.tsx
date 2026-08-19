"use client";

import { usePathname } from "next/navigation";
import { AUTH_PATHS } from "@/lib/nav";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.has(pathname);

  return <main className={`flex-1 ${isAuthPage ? "" : "pb-24 md:pb-0"}`}>{children}</main>;
}
