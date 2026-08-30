import PlaybookClient from "./PlaybookClient";

export default function PlaybookPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-blue">PLAYBOOK</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">ネタ集</h1>
      <p className="mt-2 max-w-xl text-sm text-al-gray-500">
        スマホ1台でそのまま真似できる、投稿の「型」を集めました。ネタに迷ったら、気になるものを選んで撮ってみましょう。
      </p>

      <PlaybookClient />
    </div>
  );
}
