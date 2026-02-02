/**
 * @file api.js
 * @description 백준 서버에서 데이터를 크롤링/조회하는 함수 모음
 */

// 문제의 전체 정답자 데이터를 페이지네이션하며 조회
async function fetchSolvedData(problemId, langId) {
  let data = [];
  let baseUrl = `https://www.acmicpc.net/status?problem_id=${problemId}&result_id=4`;
  if (langId) baseUrl += `&language_id=${langId}`;

  let nextUrl = baseUrl;
  let pageCount = 0;

  while (nextUrl && pageCount < 10) {
    try {
      const res = await fetch(nextUrl);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/html");

      const rows = doc.querySelectorAll("#status-table tbody tr");
      rows.forEach((row) => {
        const cols = row.querySelectorAll("td");
        if (cols.length > 5) {
          const memory = parseInt(cols[4].innerText);
          const time = parseInt(cols[5].innerText);
          if (!isNaN(memory) && !isNaN(time)) {
            data.push({ memory, time });
          }
        }
      });

      const nextBtn = doc.querySelector("#next_page");
      nextUrl = nextBtn ? nextBtn.getAttribute("href") : null;
      if (nextUrl && !nextUrl.startsWith("http")) {
        nextUrl = `https://www.acmicpc.net${nextUrl}`;
      }
      pageCount++;
    } catch (e) {
      console.error("데이터 조회 중 에러 발생:", e);
      break;
    }
  }
  return data;
}

// 사용자의 해당 문제 최고 기록 조회(실행 시간, 메모리)
async function fetchMyBestSubmission(problemId, userId, langId) {
  let url = `https://www.acmicpc.net/status?problem_id=${problemId}&user_id=${userId}&result_id=4`;
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
