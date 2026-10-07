(() => {
  const dashboard = document.querySelector("[data-sns-dashboard]");
  if (!dashboard) return;
  const number = new Intl.NumberFormat("ko-KR");
  const compact = new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 });
  const dateTime = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const setText = (selector, value) => { const element = dashboard.querySelector(selector); if (element) element.textContent = value; };
  const formatMetric = (value, options = {}) => value === null || value === undefined || Number.isNaN(Number(value)) ? "—" : options.percent ? `${Number(value).toFixed(2)}%` : compact.format(Number(value));
  const formatDelta = (value, label) => value === null || value === undefined ? "비교 데이터 대기 중" : `${Number(value) > 0 ? "+" : ""}${number.format(Number(value))} ${label}`;
  const setPlatformState = (platform, state, label) => {
    const element = dashboard.querySelector(`[data-platform-state="${platform}"]`);
    if (!element) return;
    element.dataset.state = state;
    const labelElement = element.querySelector("span:last-child");
    if (labelElement) labelElement.textContent = label;
  };

  const renderHistory = (history = []) => {
    const chart = dashboard.querySelector("[data-history-chart]");
    if (!chart || !history.length) return;
    const rows = history.slice(-7);
    const values = rows.map((row) => Number(row.dailyViews || 0));
    const max = Math.max(...values, 1);
    chart.innerHTML = rows.map((row, index) => { const height = Math.max(8, (values[index] / max) * 100); const label = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric" }).format(new Date(row.date)); return `<div class="history-bar-wrap"><strong>${compact.format(values[index])}</strong><div class="history-bar" style="--bar-height:${height}%"></div><span>${label}</span></div>`; }).join("");
    setText("[data-history-caption]", `${rows.length}일 기록`);
  };

  const renderInstagramHistory = (history = []) => {
    const chart = dashboard.querySelector("[data-ig-history-chart]");
    if (!chart || !history.length) return;
    const rows = history.slice(-7);
    const values = rows.map((row) => Number(row.followers || 0));
    const min = Math.min(...values);
    const range = Math.max(Math.max(...values) - min, 1);
    chart.innerHTML = rows.map((row, index) => { const height = 20 + ((values[index] - min) / range) * 80; const label = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric" }).format(new Date(row.date)); return `<div class="history-bar-wrap"><strong>${compact.format(values[index])}</strong><div class="history-bar history-bar--instagram" style="--bar-height:${height}%"></div><span>${label}</span></div>`; }).join("");
    setText("[data-ig-history-caption]", `${rows.length}일 기록`);
  };

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
  const videoCard = (video) => { const published = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "short", day: "numeric" }).format(new Date(video.publishedAt)); return `<article class="youtube-video-card"><a class="video-thumbnail" href="https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(video.title)} YouTube에서 보기"><img src="${escapeHtml(video.thumbnail)}" alt="" loading="lazy"><span>${escapeHtml(video.durationLabel || "VIDEO")}</span></a><div class="video-card-body"><time>${published}</time><h3>${escapeHtml(video.title)}</h3><dl><div><dt>조회</dt><dd>${compact.format(Number(video.views || 0))}</dd></div><div><dt>좋아요</dt><dd>${compact.format(Number(video.likes || 0))}</dd></div><div><dt>댓글</dt><dd>${compact.format(Number(video.comments || 0))}</dd></div><div><dt>참여율</dt><dd>${Number(video.engagementRate || 0).toFixed(2)}%</dd></div></dl></div></article>`; };
  const instagramCard = (post) => { const published = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "short", day: "numeric" }).format(new Date(post.timestamp)); const thumbnail = post.thumbnailUrl || post.mediaUrl || ""; const caption = post.caption || `${post.mediaType || "Instagram"} 게시물`; const metric = (value) => value === null || value === undefined ? "—" : compact.format(Number(value)); return `<article class="youtube-video-card instagram-post-card"><a class="video-thumbnail" href="${escapeHtml(post.permalink)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram 게시물 보기"><img src="${escapeHtml(thumbnail)}" alt="" loading="lazy"><span>${escapeHtml(post.mediaType || "POST")}</span></a><div class="video-card-body"><time>${published}</time><h3>${escapeHtml(caption)}</h3><dl><div><dt>좋아요</dt><dd>${metric(post.likes)}</dd></div><div><dt>댓글</dt><dd>${metric(post.comments)}</dd></div><div><dt>도달</dt><dd>${metric(post.reach)}</dd></div><div><dt>저장·공유</dt><dd>${metric(post.savesAndShares)}</dd></div></dl></div></article>`; };

  const render = (data) => {
    if (data.channel?.title) setText("[data-channel-title]", data.channel.title);
    if (data.channel?.url) dashboard.querySelector("[data-channel-link]")?.setAttribute("href", data.channel.url);
    const summary = data.summary || {};
    Object.entries({ subscribers: summary.subscribers, totalViews: summary.totalViews, videoCount: summary.videoCount, averageRecentViews: summary.averageRecentViews }).forEach(([key, value]) => setText(`[data-metric="${key}"]`, formatMetric(value)));
    setText('[data-metric="engagementRate"]', formatMetric(summary.engagementRate, { percent: true }));
    setText('[data-delta="subscribers"]', formatDelta(data.delta?.subscribers, "명 / 전일"));
    setText('[data-delta="totalViews"]', formatDelta(data.delta?.totalViews, "회 / 전일"));
    renderHistory(data.history);
    ["mostViewed", "mostLiked", "mostCommented"].forEach((key) => { const item = data.highlights?.[key]; setText(`[data-highlight="${key}"]`, item ? `${item.title} · ${compact.format(Number(item.value))}` : "—"); });
    const list = dashboard.querySelector("[data-video-list]");
    if (list && data.recentVideos?.length) list.innerHTML = data.recentVideos.slice(0, 6).map(videoCard).join("");
  };

  const renderInstagram = (data) => {
    if (data.account?.username) setText("[data-instagram-title]", `@${data.account.username}`);
    if (data.account?.url) dashboard.querySelector("[data-instagram-link]")?.setAttribute("href", data.account.url);
    const summary = data.summary || {};
    Object.entries({ followers: summary.followers, mediaCount: summary.mediaCount, averageEngagements: summary.averageEngagements, recentReach: summary.recentReach }).forEach(([key, value]) => setText(`[data-ig-metric="${key}"]`, formatMetric(value)));
    setText('[data-ig-metric="engagementRate"]', formatMetric(summary.engagementRate, { percent: true }));
    setText('[data-ig-delta="followers"]', formatDelta(data.delta?.followers, "명 / 전일"));
    renderInstagramHistory(data.history);
    ["mostLiked", "mostCommented", "mostReached"].forEach((key) => { const item = data.highlights?.[key]; setText(`[data-ig-highlight="${key}"]`, item ? `${item.title} · ${compact.format(Number(item.value))}` : "—"); });
    const list = dashboard.querySelector("[data-instagram-list]");
    if (list && data.recentPosts?.length) list.innerHTML = data.recentPosts.slice(0, 6).map(instagramCard).join("");
  };

  const getData = (name) => fetch(`data/${name}.json?v=${Date.now()}`, { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`); return response.json(); });
  Promise.allSettled([getData("youtube"), getData("instagram")]).then(([youtube, instagram]) => {
    if (youtube.status === "fulfilled") render(youtube.value);
    if (instagram.status === "fulfilled") renderInstagram(instagram.value);
    const youtubeReady = youtube.status === "fulfilled" && youtube.value.status === "ready";
    const instagramReady = instagram.status === "fulfilled" && instagram.value.status === "ready";
    const latestUpdate = [youtubeReady ? youtube.value.updatedAt : null, instagramReady ? instagram.value.updatedAt : null].filter(Boolean).sort().at(-1);
    setPlatformState("youtube", youtube.status === "rejected" ? "error" : youtubeReady ? "ready" : "empty", youtube.status === "rejected" ? "동기화 실패" : youtubeReady ? "정상 업데이트" : "데이터 없음");
    setPlatformState("instagram", instagram.status === "rejected" ? "error" : instagramReady ? "ready" : "empty", instagram.status === "rejected" ? "동기화 실패" : instagramReady ? "정상 업데이트" : "데이터 없음");
    const hasFailure = youtube.status === "rejected" || instagram.status === "rejected";
    if (hasFailure) setText("[data-sync-label]", "일부 데이터 동기화 실패");
    else if (youtubeReady && instagramReady) setText("[data-sync-label]", "자동 동기화 정상");
    else if (youtubeReady) setText("[data-sync-label]", "YouTube 정상 · Instagram 데이터 없음");
    else if (instagramReady) setText("[data-sync-label]", "Instagram 정상 · YouTube 데이터 없음");
    else setText("[data-sync-label]", "연결됨 · 수집된 데이터 없음");
    setText("[data-last-updated]", latestUpdate ? `마지막 업데이트 ${dateTime.format(new Date(latestUpdate))}` : "데이터 동기화 전");
    const syncState = dashboard.querySelector(".sns-sync-state");
    syncState?.classList.toggle("is-ready", youtubeReady && instagramReady);
    syncState?.classList.toggle("is-error", hasFailure);
  });
})();
