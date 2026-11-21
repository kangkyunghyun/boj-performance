/**
 * @file main.js
 * @description 확장 프로그램의 전체 로직을 조율하는 메인 파일
 */

async function main() {
  const params = new URLSearchParams(window.location.search);

  // 대회 페이지 확인
  if (params.get("contest_id")) return;

  // 문제 내 채점 현황 페이지 확인
  const problemId = params.get("problem_id");
  if (!problemId) return;

  // 내 기록 조회
  const myId = getLoginId();
  if (!myId) return;

  // 언어 필터. "-1"은 BOJ 검색 양식의 "모든 언어"라 필터 없음과 같음
  const filterLangId = params.get("language_id");
  const hasFilter = filterLangId && filterLangId !== "-1";

  // 내 정답 제출 첫 페이지. 없으면 종료
  const mine = await fetchMySubmissions(
    problemId,
    myId,
    hasFilter ? filterLangId : "",
  );
  if (!mine || mine.length === 0) return;

  // 비교 언어: 필터가 있으면 그 언어, 없으면 가장 최근 정답 제출의 언어
  // 그 언어의 필터 값을 못 찾으면 모든 언어
  let langId = "";
  let langName = null;
  let myRecord;
  if (hasFilter) {
    langId = filterLangId;
    langName = getLanguageName(filterLangId) || mine[0].lang;
    myRecord = pickBest(mine);
  } else {
    const recentLang = mine[0].lang;
    langId = getLanguageId(recentLang) || "";
    langName = langId ? recentLang : null;
    myRecord = pickBest(
      langId ? mine.filter((s) => s.lang === recentLang) : mine,
    );
  }

  // 내가 정답을 낸 다른 언어: 현재 주소에서 언어 필터를 바꾼 주소
  // 결과 표 페이지 위치(top)는 빼서 BOJ 언어 필터 검색과 같은 결과로
  const others = [];
  for (const lang of new Set(mine.map((s) => s.lang))) {
    const id = getLanguageId(lang);
    if (!id || id === langId || lang === langName) continue;
    const url = new URL(location.href);
    url.searchParams.set("language_id", id);
    url.searchParams.delete("top");
    others.push({ name: lang, href: url.href });
  }

  // UI 초기화 및 주입. 테마는 여기서 한 번 판정
  const dark = isDarkMode();
  const ui = injectGraphContainer(dark, langName, others);
  if (!ui) return;
  const { timeCard, memoryCard } = ui;

  // 표본 행으로 계산하고 차트 그리기
  const draw = (rows) => {
    const submissions = rows.map(([, time, memory]) => ({ time, memory }));
    for (const [card, type] of [
      [timeCard, "time"],
      [memoryCard, "memory"],
    ]) {
      const chartData = processData(submissions, type, myRecord);
      const stats = calculatePercentile(submissions, type, myRecord);
      drawChart(card, chartData, type, stats, dark);
    }
  };

  // 전체 데이터 로드 및 차트 그리기 함수 정의
  const loadAndDraw = async () => {
    const cacheKey = sampleCacheKey(problemId, langId);
    const cached = loadSampleCache(cacheKey);

    // 저장한 표본으로 먼저 그리고 새 제출만 받아 붙임
    if (cached) {
      draw(cached);
      const { rows, complete } = await fetchSolvedData(
        problemId,
        langId,
        cached[0][0],
      );
      if (!complete || rows.length === 0) return;
      const merged = mergeSamples(rows, cached);
      draw(merged);
      saveSampleCache(cacheKey, merged);
      return;
    }

    updateCardLoading(timeCard, "분석 중...");
    updateCardLoading(memoryCard, "분석 중...");

    // 첫 페이지를 받으면 바로 그림 (api.js)
    let shown = 0;
    const { rows, complete } = await fetchSolvedData(
      problemId,
      langId,
      null,
      (firstRows) => {
        if (firstRows.length === 0) return;
        draw(firstRows);
        shown = firstRows.length;
      },
    );

    if (rows.length === 0) {
      updateCardError(timeCard);
      updateCardError(memoryCard);
      return;
    }

    if (rows.length !== shown) draw(rows);
    if (complete) saveSampleCache(cacheKey, rows);
  };

  // 5. 실행
  loadAndDraw();
}

// 메인 함수 실행
main();
