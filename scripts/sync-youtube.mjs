import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const CHANNEL_ID = "UC4Co3TmVcyKtfOuZgTMJvpw";
const API_KEY = process.env.YOUTUBE_API_KEY;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = resolve(root, "data/youtube.json");
const execFileAsync = promisify(execFile);

const request = async (resource, params) => {
  const query = new URLSearchParams({ ...params, key: API_KEY });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${resource}?${query}`);
  if (!response.ok) throw new Error(`YouTube API ${resource} 요청 실패 (${response.status}): ${await response.text()}`);
  return response.json();
};

const number = (value) => value === undefined || value === null ? null : Number(value);
const parseDuration = (duration = "") => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "VIDEO";
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const totalMinutes = hours * 60 + minutes;
  return `${totalMinutes}:${String(seconds).padStart(2, "0")}`;
};
const topBy = (videos, key) => {
  if (!videos.length) return null;
  const video = [...videos].sort((a, b) => b[key] - a[key])[0];
  return { id: video.id, title: video.title, value: video[key] };
};

const previous = JSON.parse(await readFile(dataPath, "utf8"));
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const previousUpdateDate = previous.updatedAt ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(previous.updatedAt)) : null;
if (previousUpdateDate === today && process.env.FORCE_SYNC !== "true") {
  console.log(`YouTube ${today} 데이터가 이미 있어 중복 동기화를 건너뜁니다.`);
  process.exit(0);
}

if (!API_KEY) {
  const channelUrl = `https://www.youtube.com/channel/${CHANNEL_ID}`;
  const commonArgs = ["--dump-single-json", "--playlist-end", "12", "--skip-download", "--ignore-errors", "--no-warnings"];
  let raw;
  try {
    ({ stdout: raw } = await execFileAsync("yt-dlp", [...commonArgs, `${channelUrl}/videos`], { maxBuffer: 20 * 1024 * 1024 }));
  } catch {
    ({ stdout: raw } = await execFileAsync("yt-dlp", [...commonArgs, channelUrl], { maxBuffer: 20 * 1024 * 1024 }));
  }
  const channel = JSON.parse(raw);
  const secondsLabel = (seconds) => seconds === null || seconds === undefined ? "VIDEO" : `${Math.floor(Number(seconds) / 60)}:${String(Math.floor(Number(seconds) % 60)).padStart(2, "0")}`;
  const videos = (channel.entries || []).filter(Boolean).map((item) => {
    const views = number(item.view_count) || 0;
    const likes = number(item.like_count) || 0;
    const comments = number(item.comment_count) || 0;
    const publishedAt = item.timestamp ? new Date(Number(item.timestamp) * 1000).toISOString() : item.upload_date ? `${item.upload_date.slice(0, 4)}-${item.upload_date.slice(4, 6)}-${item.upload_date.slice(6, 8)}T00:00:00Z` : new Date().toISOString();
    return { id: item.id, title: item.title, publishedAt, thumbnail: item.thumbnail || item.thumbnails?.at(-1)?.url || null, duration: item.duration || null, durationLabel: secondsLabel(item.duration), views, likes, comments, engagementRate: views ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0 };
  });
  const totalRecentViews = videos.reduce((sum, video) => sum + video.views, 0);
  const totalRecentReactions = videos.reduce((sum, video) => sum + video.likes + video.comments, 0);
  const subscribers = number(channel.channel_follower_count);
  const output = {
    status: "ready",
    updatedAt: new Date().toISOString(),
    source: "public-channel-fallback",
    channel: { id: CHANNEL_ID, url: channelUrl, title: channel.channel || channel.uploader || channel.title, description: channel.description || null, thumbnail: channel.thumbnails?.find((item) => item.id === "avatar_uncropped")?.url || channel.thumbnails?.at(-1)?.url || null },
    summary: { subscribers, totalViews: null, videoCount: videos.length, averageRecentViews: videos.length ? Math.round(totalRecentViews / videos.length) : null, engagementRate: totalRecentViews ? Number(((totalRecentReactions / totalRecentViews) * 100).toFixed(2)) : null },
    delta: { subscribers: null, totalViews: null },
    highlights: { mostViewed: topBy(videos, "views"), mostLiked: topBy(videos, "likes"), mostCommented: topBy(videos, "comments") },
    history: previous.history || [],
    recentVideos: videos
  };
  await writeFile(dataPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`YouTube 공개 데이터 동기화 완료: ${output.channel.title} / 영상 ${videos.length}개`);
  process.exit(0);
}

const channelResponse = await request("channels", { part: "snippet,statistics,contentDetails", id: CHANNEL_ID });
const channel = channelResponse.items?.[0];
if (!channel) throw new Error(`채널 ${CHANNEL_ID}을 찾을 수 없습니다.`);

const uploadsPlaylist = channel.contentDetails.relatedPlaylists.uploads;
const playlistResponse = await request("playlistItems", { part: "contentDetails", playlistId: uploadsPlaylist, maxResults: "12" });
const videoIds = playlistResponse.items.map((item) => item.contentDetails.videoId);
let videos = [];

if (videoIds.length) {
  const videosResponse = await request("videos", { part: "snippet,statistics,contentDetails", id: videoIds.join(",") });
  const videoMap = new Map(videosResponse.items.map((item) => [item.id, item]));
  videos = videoIds.map((id) => videoMap.get(id)).filter(Boolean).map((item) => {
    const views = number(item.statistics.viewCount) || 0;
    const likes = number(item.statistics.likeCount) || 0;
    const comments = number(item.statistics.commentCount) || 0;
    return {
      id: item.id,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      duration: item.contentDetails.duration,
      durationLabel: parseDuration(item.contentDetails.duration),
      views,
      likes,
      comments,
      engagementRate: views ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0
    };
  });
}

const totalViews = number(channel.statistics.viewCount) || 0;
const subscribers = number(channel.statistics.subscriberCount);
const previousSnapshot = previous.history?.at(-1) || null;
const dailyViews = previousSnapshot ? Math.max(0, totalViews - Number(previousSnapshot.totalViews || 0)) : 0;
const snapshot = { date: `${today}T00:00:00+09:00`, totalViews, subscribers, dailyViews };
const history = [...(previous.history || [])];
if (history.at(-1)?.date?.slice(0, 10) === today) history[history.length - 1] = snapshot;
else history.push(snapshot);
const totalRecentViews = videos.reduce((sum, video) => sum + video.views, 0);
const totalRecentReactions = videos.reduce((sum, video) => sum + video.likes + video.comments, 0);

const output = {
  status: "ready",
  updatedAt: new Date().toISOString(),
  channel: {
    id: CHANNEL_ID,
    url: `https://www.youtube.com/channel/${CHANNEL_ID}`,
    title: channel.snippet.title,
    description: channel.snippet.description,
    thumbnail: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url
  },
  summary: {
    subscribers,
    totalViews,
    videoCount: number(channel.statistics.videoCount) || 0,
    averageRecentViews: videos.length ? Math.round(totalRecentViews / videos.length) : null,
    engagementRate: totalRecentViews ? Number(((totalRecentReactions / totalRecentViews) * 100).toFixed(2)) : null
  },
  delta: {
    subscribers: previousSnapshot && subscribers !== null && previousSnapshot.subscribers !== null ? subscribers - Number(previousSnapshot.subscribers) : null,
    totalViews: previousSnapshot ? totalViews - Number(previousSnapshot.totalViews || 0) : null
  },
  highlights: {
    mostViewed: topBy(videos, "views"),
    mostLiked: topBy(videos, "likes"),
    mostCommented: topBy(videos, "comments")
  },
  history: history.slice(-30),
  recentVideos: videos
};

await mkdir(dirname(dataPath), { recursive: true });
await writeFile(dataPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`YouTube 데이터 동기화 완료: ${output.channel.title} / 영상 ${videos.length}개`);
