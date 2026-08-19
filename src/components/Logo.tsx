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
      className={`group font-display font-bold tracking-tighter ${variant === "dark" ? "text-al-black" : "text-white"} ${className}`}
    >
      <span className="inline-block -skew-x-6">
        ASOBI
        <span className="relative text-al-pink">
          LAB
          <span className="absolute -bottom-0.5 left-0 h-[3px] w-full bg-al-lime transition-transform duration-150 group-hover:scale-x-0" />
        </span>
      </span>
    </Link>
  );
}
