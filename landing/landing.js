// 랜딩 페이지의 업데이트 소식. GitHub Releases API의 본문(docs/releases/v<버전>.md)을 보인다.
// 노트 처리 함수는 scripts/publish-firefox.js와 tests/도 require해서 쓴다(규칙을 한 곳에 둠).
(function () {
  const RELEASES_API = "https://api.github.com/repos/kangkyunghyun/boj-performance/releases?per_page=10";
  const CACHE_KEY = "boj-performance-landing:releases";
  const SHOW_COUNT = 3;

  // "### Internal" 절을 다음 제목 전까지 뺀다. Internal이 마지막 절이 아니어도 된다.
  function stripInternalSection(notes) {
    let skipping = false;
    const kept = String(notes)
      .split(/\r?\n/)
      .filter((line) => {
        if (/^#{1,6} /.test(line)) skipping = line.replace(/^#+/, "").trim() === "Internal";
        return !skipping;
      });
    return `${kept.join("\n").trim()}\n`;
  }

  // 노트가 쓰는 문법만 블록으로 나눈다: 제목(#), 목록(- 또는 *), 그 밖은 문단.
  // 결과는 글자만 담고 DOM에는 textContent로만 넣는다. 본문은 신뢰 경계 밖(API 응답)이다.
  function parseReleaseBody(body) {
    const blocks = [];
    for (const raw of stripInternalSection(body).split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const heading = line.match(/^#{1,6} (.*)$/);
      const item = line.match(/^[-*] (.*)$/);
      const last = blocks[blocks.length - 1];
      if (heading) blocks.push({ type: "heading", text: heading[1].trim() });
      else if (item && last?.type === "list") last.items.push(item[1].trim());
      else if (item) blocks.push({ type: "list", items: [item[1].trim()] });
      else blocks.push({ type: "paragraph", text: line });
    }
    return blocks;
  }

  // `코드`만 <code>로, 나머지는 글자 노드로. 닫히지 않은 백틱은 글자로 둔다.
  function appendInline(doc, parent, text) {
    const parts = text.split("`");
    parts.forEach((part, i) => {
      const isCode = i % 2 === 1 && i < parts.length - 1;
      if (isCode) {
        const code = doc.createElement("code");
        code.textContent = part;
        parent.append(code);
      } else {
        parent.append(doc.createTextNode(i % 2 === 1 ? `\`${part}` : part));
      }
    });
  }

  function renderRelease(doc, release, open) {
    const details = doc.createElement("details");
    details.open = open;
    const summary = doc.createElement("summary");
    const name = doc.createElement("strong");
    name.textContent = release.tag;
    summary.append(name);
    const date = new Date(release.date);
    if (!Number.isNaN(date.getTime())) {
      const time = doc.createElement("time");
      time.dateTime = release.date;
      time.textContent = date.toLocaleDateString("ko-KR");
      summary.append(" ", time);
    }
    details.append(summary);
    for (const block of parseReleaseBody(release.body)) {
      if (block.type === "list") {
        const ul = doc.createElement("ul");
        for (const text of block.items) {
          const li = doc.createElement("li");
          appendInline(doc, li, text);
          ul.append(li);
        }
        details.append(ul);
      } else {
        const el = doc.createElement(block.type === "heading" ? "h4" : "p");
        appendInline(doc, el, block.text);
        details.append(el);
      }
    }
    return details;
  }

  // 탭마다 한 번만 API를 부른다. 인증 없는 GitHub API는 IP당 시간당 60회다.
  async function loadReleases(fetchFn, storage) {
    try {
      const cached = JSON.parse(storage.getItem(CACHE_KEY));
      if (Array.isArray(cached)) return cached;
    } catch {
      // 저장소를 못 쓰거나 깨졌으면 새로 받는다
    }
    const res = await fetchFn(RELEASES_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("unexpected payload");
    const releases = data
      .filter((r) => !r.draft && typeof r.tag_name === "string")
      .slice(0, SHOW_COUNT)
      .map((r) => ({ tag: r.tag_name, date: r.published_at, body: String(r.body || "") }));
    try {
      storage.setItem(CACHE_KEY, JSON.stringify(releases));
    } catch {
      // 캐시는 없어도 된다
    }
    return releases;
  }

  async function init(doc, fetchFn, storage) {
    const list = doc.getElementById("release-list");
    const status = doc.getElementById("release-status");
    try {
      const releases = await loadReleases(fetchFn, storage);
      if (releases.length === 0) throw new Error("no releases");
      list.replaceChildren(...releases.map((r, i) => renderRelease(doc, r, i === 0)));
      status.hidden = true;
    } catch {
      status.textContent = "업데이트 소식을 불러오지 못했습니다. 아래 GitHub 릴리스에서 확인하세요.";
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { stripInternalSection, parseReleaseBody };
  } else {
    let storage = null;
    try {
      storage = window.sessionStorage;
    } catch {
      // 저장소 차단 환경
    }
    init(document, window.fetch.bind(window), storage ?? { getItem: () => null, setItem() {} });
  }
})();
