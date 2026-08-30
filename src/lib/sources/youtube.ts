// YouTube Data API v3 を使った実データ取得。
// TikTok/Instagramと違い、APIキーの発行だけで（審査なしで）今すぐ使える公式APIのため、
// 「今伸びている動き」を実データで見せるための暫定ソースとして採用している。
// 取得できるのは「再生回数」などの実数値のみ。週次の伸び率(%)はYouTube API単体では
// 算出できないため、伸び率を捏造せず「再生回数」をそのまま表示する方針にしている。

export interface YoutubeTrendVideo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelUrl: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  publishedAt: string;
  url: string;
}

interface SearchListItem {
  id?: { videoId?: string };
}

interface VideoListItem {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
  };
  statistics?: { viewCount?: string };
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error(
      "YOUTUBE_API_KEY が設定されていません。.env.local に設定してください（取得手順は .env.local.example 参照）。"
    );
  }
  return key;
}

export async function fetchTrendingVideos(
  query: string,
  maxResults = 3,
  publishedAfterDays = 30
): Promise<YoutubeTrendVideo[]> {
  const apiKey = getApiKey();
  const publishedAfter = new Date(
    Date.now() - publishedAfterDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("regionCode", "JP");
  searchUrl.searchParams.set("relevanceLanguage", "ja");
  searchUrl.searchParams.set("order", "viewCount");
  searchUrl.searchParams.set("publishedAfter", publishedAfter);
  searchUrl.searchParams.set("maxResults", String(maxResults));
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`YouTube検索に失敗しました (status ${searchRes.status}, query: ${query})`);
  }
  const searchJson = (await searchRes.json()) as { items?: SearchListItem[] };
  const videoIds = (searchJson.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));

  if (videoIds.length === 0) return [];

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "snippet,statistics");
  videosUrl.searchParams.set("id", videoIds.join(","));
  videosUrl.searchParams.set("key", apiKey);

  const videosRes = await fetch(videosUrl);
  if (!videosRes.ok) {
    throw new Error(`YouTube動画情報の取得に失敗しました (status ${videosRes.status})`);
  }
  const videosJson = (await videosRes.json()) as { items?: VideoListItem[] };

  return (videosJson.items ?? []).map((item) => ({
    videoId: item.id,
    title: item.snippet?.title ?? "",
    description: item.snippet?.description ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
    channelUrl: item.snippet?.channelId
      ? `https://www.youtube.com/channel/${item.snippet.channelId}`
      : null,
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? null,
    viewCount: Number(item.statistics?.viewCount ?? 0),
    publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
    url: `https://www.youtube.com/watch?v=${item.id}`,
  }));
}

export function formatViewCount(viewCount: number): string {
  if (viewCount >= 10000) {
    return `${(viewCount / 10000).toFixed(1)}万回再生`;
  }
  return `${viewCount}回再生`;
}
