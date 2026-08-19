import { categoryAccent, isCategory } from "@/lib/data";

export default function CategoryTag({ category }: { category: string }) {
  const accent = isCategory(category) ? categoryAccent[category] : "bg-al-gray-500";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide text-white ${accent}`}
    >
      {category}
    </span>
  );
}
