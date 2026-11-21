/**
 * @file api.js
 * @description 백준 서버에서 데이터를 크롤링/조회하는 함수 모음
 */

// 정답 제출 표본을 첫 페이지부터 최대 10페이지 조회
// 행: [제출 번호, 시간, 메모리], 제출 번호 내림차순
// stopAt이 있으면 그 제출 번호 이하 행을 만날 때 멈춤
// complete: 요청 예외 없이 끝났는지
async function fetchSolvedData(problemId, langId, stopAt, onFirstPage) {
  const rows = [];
  let complete = true;
  let baseUrl = `${location.origin}/status?problem_id=${problemId}&result_id=4`;
  if (langId) baseUrl += `&language_id=${langId}`;

  let nextUrl = baseUrl;
  let pageCount = 0;

  while (nextUrl && pageCount < 10) {
    try {
      const res = await fetch(nextUrl);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/html");

      let reached = false;
      for (const row of doc.querySelectorAll("#status-table tbody tr")) {
        const cols = row.querySelectorAll("td");
        if (cols.length <= 5) continue;
        const id = parseInt(cols[0].innerText);
        const memory = parseInt(cols[4].innerText);
        const time = parseInt(cols[5].innerText);
        if (isNaN(id) || isNaN(memory) || isNaN(time)) continue;
        if (stopAt != null && id <= stopAt) {
          reached = true;
          break;
        }
        rows.push([id, time, memory]);
      }

      const nextBtn = doc.querySelector("#next_page");
      nextUrl = reached || !nextBtn ? null : nextBtn.getAttribute("href");
      if (nextUrl && !nextUrl.startsWith("http")) {
        nextUrl = `${location.origin}${nextUrl}`;
      }
      if (pageCount === 0 && onFirstPage) onFirstPage(rows.slice());
      pageCount++;
    } catch (e) {
      console.error("데이터 조회 중 에러 발생:", e);
      complete = false;
      break;
    }
  }
  return { rows, complete };
}

// 표본 세션 캐시 (BOJ 페이지의 sessionStorage, 탭 단위)
function sampleCacheKey(problemId, langId) {
  return `boj-performance:v1:${problemId}:${langId || ""}`;
}

// 저장한 표본 행. 없거나 깨졌으면 null (깨진 값은 지움)
function loadSampleCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return null;
    const rows = parseSampleCache(raw);
    if (!rows) sessionStorage.removeItem(key);
    return rows;
  } catch (e) {
    return null;
  }
}

function parseSampleCache(raw) {
  try {
    const rows = JSON.parse(raw).rows;
    const ok =
      Array.isArray(rows) &&
      rows.length > 0 &&
      rows.every(
        (r, i) =>
          Array.isArray(r) &&
          r.length === 3 &&
          r.every(Number.isInteger) &&
          (i === 0 || r[0] < rows[i - 1][0]),
      );
    return ok ? rows : null;
  } catch (e) {
    return null;
  }
}

function saveSampleCache(key, rows) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ rows, savedAt: Date.now() }));
  } catch (e) {
    // 용량 초과, 차단: 캐시 없이 동작
  }
}

// 새 행(더 최신)을 앞에 붙이고 최신 200행으로 자름
function mergeSamples(newRows, cachedRows) {
  return newRows.concat(cachedRows).slice(0, 200);
}

// 사용자의 해당 문제 최고 기록 조회(실행 시간, 메모리)
async function fetchMyBestSubmission(problemId, userId, langId) {
  let url = `${location.origin}/status?problem_id=${problemId}&user_id=${userId}&result_id=4`;
  if (langId) url += `&language_id=${langId}`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    const rows = doc.querySelectorAll("#status-table tbody tr");
    let best = null;

    rows.forEach((row) => {
      const cols = row.querySelectorAll("td");
      if (cols.length > 6) {
        const memory = parseInt(cols[4].innerText);
        const time = parseInt(cols[5].innerText);

        if (!isNaN(memory) && !isNaN(time)) {
          if (
            !best ||
            time < best.time ||
            (time === best.time && memory < best.memory)
          ) {
            best = { time, memory };
          }
        }
      }
    });
    return best;
  } catch (e) {
    return null;
  }
}
