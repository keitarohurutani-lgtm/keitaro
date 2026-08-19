import Link from "next/link";

export default function Logo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  return (
    <Link
      href="/"
      className={`font-display font-bold tracking-tight ${variant === "dark" ? "text-al-black" : "text-white"} ${className}`}
    >
      ASOBI<span className="text-al-pink">LAB</span>
    </Link>
  );
}
