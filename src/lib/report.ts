import { prisma } from "@/lib/prisma";

export async function getReportCounts() {
  const [analyzedPosts, savedIdeas, referencedPosts, trendChecks] = await Promise.all([
    prisma.activity.count({ where: { type: "POST_CHECK" } }),
    prisma.idea.count({ where: { saved: true } }),
    prisma.activity.count({ where: { type: "BENCHMARK" } }),
    prisma.activity.count({ where: { type: "TREND_CHECK" } }),
  ]);
  return { analyzedPosts, savedIdeas, referencedPosts, trendChecks };
}

const WEEKDAY_LABEL = ["日", "月", "火", "水", "木", "金", "土"];

export async function getWeeklyActivity(referenceDate: Date) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  const activities = await prisma.activity.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true },
  });

  const days: { label: string; dateLabel: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      label: WEEKDAY_LABEL[d.getDay()],
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      count: 0,
    });
  }

  for (const activity of activities) {
    const diffDays = Math.floor(
      (activity.createdAt.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (diffDays >= 0 && diffDays < 7) {
      days[diffDays].count++;
    }
  }

  return days;
}

export function formatRelativeDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
