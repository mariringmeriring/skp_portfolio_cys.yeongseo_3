import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const USERNAME = "naru.studio.busan";
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID = process.env.INSTAGRAM_USER_ID;
const API_VERSION = process.env.INSTAGRAM_API_VERSION || "v24.0";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = resolve(root, "data/instagram.json");

if (!ACCESS_TOKEN || !USER_ID) {
  console.error("::error title=Instagram credentials missing::INSTAGRAM_ACCESS_TOKEN과 INSTAGRAM_USER_ID를 GitHub Actions Secrets에 등록해야 합니다.");
  process.exit(2);
}

const request = async (path, params = {}) => {
  const query = new URLSearchParams({ ...params, access_token: ACCESS_TOKEN });
  const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${path}?${query}`);
  if (!response.ok) throw new Error(`Instagram Graph API 요청 실패 (${response.status}): ${await response.text()}`);
  return response.json();
};
const optionalRequest = async (path, params) => { try { return await request(path, params); } catch (error) { console.warn(error.message); return null; } };
const metricValue = (insights, name) => insights?.data?.find((item) => item.name === name)?.values?.[0]?.value ?? null;
const numeric = (value) => value === null || value === undefined ? null : Number(value);
const titleFor = (post) => (post.caption || `${post.media_type || "Instagram"} 게시물`).replace(/\s+/g, " ").trim().slice(0, 46);
const topBy = (posts, key) => {
  const available = posts.filter((post) => post[key] !== null && post[key] !== undefined);
  if (!available.length) return null;
  const post = [...available].sort((a, b) => b[key] - a[key])[0];
  return { id: post.id, title: titleFor(post), value: post[key], permalink: post.permalink };
};

const previous = JSON.parse(await readFile(dataPath, "utf8"));
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const previousUpdateDate = previous.updatedAt ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(previous.updatedAt)) : null;
if (previousUpdateDate === today && process.env.FORCE_SYNC !== "true") {
  console.log(`Instagram ${today} 데이터가 이미 있어 중복 동기화를 건너뜁니다.`);
  process.exit(0);
}
const account = await request(USER_ID, { fields: "id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count" });
if (account.username?.toLowerCase() !== USERNAME) throw new Error(`Instagram 계정 불일치: @${account.username} (예상: @${USERNAME})`);
const mediaResponse = await request(`${USER_ID}/media`, { fields: "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count", limit: "12" });

const posts = await Promise.all((mediaResponse.data || []).map(async (post) => {
  const insightNames = post.media_product_type === "REELS" ? "reach,saved,shares,views,total_interactions" : "reach,saved,shares,total_interactions";
  const insights = await optionalRequest(`${post.id}/insights`, { metric: insightNames });
  const saves = numeric(metricValue(insights, "saved"));
  const shares = numeric(metricValue(insights, "shares"));
  return {
    id: post.id,
    caption: post.caption || "",
    mediaType: post.media_product_type || post.media_type,
    mediaUrl: post.media_url || null,
    thumbnailUrl: post.thumbnail_url || post.media_url || null,
    permalink: post.permalink,
    timestamp: post.timestamp,
    likes: numeric(post.like_count) || 0,
    comments: numeric(post.comments_count) || 0,
    reach: numeric(metricValue(insights, "reach")),
    views: numeric(metricValue(insights, "views")),
    saves,
    shares,
    savesAndShares: saves === null && shares === null ? null : (saves || 0) + (shares || 0),
    totalInteractions: numeric(metricValue(insights, "total_interactions"))
  };
}));

const followers = numeric(account.followers_count) || 0;
const previousSnapshot = previous.history?.at(-1) || null;
const snapshot = { date: `${today}T00:00:00+09:00`, followers, mediaCount: numeric(account.media_count) || 0 };
const history = [...(previous.history || [])];
if (history.at(-1)?.date?.slice(0, 10) === today) history[history.length - 1] = snapshot;
else history.push(snapshot);
const totalEngagements = posts.reduce((sum, post) => sum + post.likes + post.comments, 0);
const reachedPosts = posts.filter((post) => post.reach !== null);

const output = {
  status: "ready",
  updatedAt: new Date().toISOString(),
  account: {
    id: account.id,
    username: account.username,
    url: `https://www.instagram.com/${account.username}/`,
    name: account.name || null,
    biography: account.biography || null,
    profilePicture: account.profile_picture_url || null
  },
  summary: {
    followers,
    mediaCount: numeric(account.media_count) || 0,
    averageEngagements: posts.length ? Math.round(totalEngagements / posts.length) : 0,
    engagementRate: followers && posts.length ? Number(((totalEngagements / posts.length / followers) * 100).toFixed(2)) : 0,
    recentReach: reachedPosts.length ? reachedPosts.reduce((sum, post) => sum + post.reach, 0) : null
  },
  delta: { followers: previousSnapshot ? followers - Number(previousSnapshot.followers || 0) : null },
  highlights: { mostLiked: topBy(posts, "likes"), mostCommented: topBy(posts, "comments"), mostReached: topBy(posts, "reach") },
  history: history.slice(-30),
  recentPosts: posts
};

await writeFile(dataPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Instagram 데이터 동기화 완료: @${output.account.username} / 게시물 ${posts.length}개`);
