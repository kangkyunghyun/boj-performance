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
  // 비교 언어는 언어 필터 그대로. 없으면 모든 언어
  const filterLangId = params.get("language_id");
  const langId = filterLangId && filterLangId !== "-1" ? filterLangId : "";
  const langName = getLanguageName(langId);

  // 내 정답 제출 첫 페이지. 없으면 종료
  const mine = await fetchMySubmissions(problemId, myId, langId);
  if (!mine || mine.length === 0) return;
  const myRecord = pickBest(mine);

  // UI 초기화 및 주입(스켈레톤). 테마는 여기서 한 번 판정
  const dark = isDarkMode();
  const ui = injectGraphContainer(dark);
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
      drawChart(card, chartData, type, stats, dark, langName);
    }
  };

  // 표본을 다 받은 뒤 한 번만 그림. 그 전까지는 스켈레톤
  const loadAndDraw = async () => {
    const cacheKey = sampleCacheKey(problemId, langId);
    const cached = loadSampleCache(cacheKey);

    // 저장한 표본이 있으면 새 제출만 받아 붙임. 실패하면 저장한 표본 그대로
    if (cached) {
      const { rows, complete } = await fetchSolvedData(
        problemId,
        langId,
        cached[0][0],
      );
      if (!complete || rows.length === 0) {
        draw(cached);
        return;
      }
      const merged = mergeSamples(rows, cached);
      draw(merged);
      saveSampleCache(cacheKey, merged);
      return;
    }

    const { rows, complete } = await fetchSolvedData(problemId, langId, null);
    if (rows.length === 0) {
      updateCardError(timeCard);
      updateCardError(memoryCard);
      return;
    }
    draw(rows);
    if (complete) saveSampleCache(cacheKey, rows);
  };

  // 실행
  loadAndDraw();
}

// 메인 함수 실행
main();
