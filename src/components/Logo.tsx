import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display font-bold tracking-tight text-al-black ${className}`}
    >
      ASOBI<span className="text-al-pink">LAB</span>
    </Link>
  );
}
