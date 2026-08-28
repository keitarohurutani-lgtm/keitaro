import FaqClient from "./FaqClient";

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-blue">FAQ</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">よくある質問</h1>
      <p className="mt-2 max-w-xl text-sm text-al-gray-500">
        SNSの言葉の意味や、はじめ方のコツをまとめました。分からないことがあったら、まずここを見てみてください。
      </p>

      <FaqClient />
    </div>
  );
}
