import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import DeleteUserButton from "@/components/DeleteUserButton";

// 会員一覧は常に最新の登録・活動状況を反映する必要があるため、静的プリレンダリングを無効化する。
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/");

  const [users, savedCounts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { ideas: true, activities: true } } },
    }),
    prisma.idea.groupBy({ by: ["userId"], where: { saved: true }, _count: true }),
  ]);

  const savedCountByUser = new Map(savedCounts.map((s) => [s.userId, s._count]));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs font-bold tracking-[0.2em] text-al-purple">
            ADMIN
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
            会員一覧
          </h1>
          <p className="mt-2 max-w-xl text-sm text-al-gray-500">
            登録している会員と、それぞれの企画・活動状況を確認できます（管理者専用）。
          </p>
        </div>
        <div className="pt-1 text-right">
          <p className="font-display text-sm font-bold">{user.displayName}</p>
          <LogoutButton className="mt-1" />
        </div>
      </div>

      {users.length === 0 ? (
        <p className="al-flyer-card mt-8 rounded-2xl px-4 py-10 text-center text-al-gray-400">
          まだ会員がいません。
        </p>
      ) : (
        <>
          {/* デスクトップ：横スクロールなしで収まる表形式 */}
          <div className="mt-8 hidden al-flyer-card overflow-x-auto rounded-2xl md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-al-gray-50 text-xs text-al-gray-500">
                <tr>
                  <th className="px-4 py-3 font-display font-bold">表示名</th>
                  <th className="px-4 py-3 font-display font-bold">メールアドレス</th>
                  <th className="px-4 py-3 font-display font-bold">登録日</th>
                  <th className="px-4 py-3 text-right font-display font-bold">保存済み企画</th>
                  <th className="px-4 py-3 text-right font-display font-bold">総活動数</th>
                  <th className="px-4 py-3" />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-al-gray-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-bold">{u.displayName}</td>
                    <td className="px-4 py-3 text-al-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-al-gray-500">
                      {u.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-right">{savedCountByUser.get(u.id) ?? 0}</td>
                    <td className="px-4 py-3 text-right">{u._count.activities}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-bold text-al-purple hover:underline"
                      >
                        詳細 →
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {u.id === user.id ? (
                        <span className="text-al-gray-300">（自分）</span>
                      ) : (
                        <DeleteUserButton
                          userId={u.id}
                          email={u.email}
                          displayName={u.displayName}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* スマホ：横スクロールさせず、1人ずつカードで縦に並べる */}
          <div className="mt-8 space-y-3 md:hidden">
            {users.map((u) => (
              <div key={u.id} className="al-flyer-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold">{u.displayName}</p>
                    <p className="truncate text-xs text-al-gray-500">{u.email}</p>
                  </div>
                  <span className="shrink-0 text-xs text-al-gray-400">
                    {u.createdAt.toISOString().slice(0, 10)}
                  </span>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-al-gray-500">
                  <span>保存済み企画：{savedCountByUser.get(u.id) ?? 0}</span>
                  <span>総活動数：{u._count.activities}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-al-gray-100 pt-3 text-sm">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="font-bold text-al-purple hover:underline"
                  >
                    詳細 →
                  </Link>
                  {u.id === user.id ? (
                    <span className="text-xs text-al-gray-300">（自分）</span>
                  ) : (
                    <DeleteUserButton
                      userId={u.id}
                      email={u.email}
                      displayName={u.displayName}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
