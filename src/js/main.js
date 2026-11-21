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

  const currentLangId = params.get("language_id") || "";

  // 기록 없으면 종료
  const myRecord = await fetchMyBestSubmission(problemId, myId, currentLangId);
  if (!myRecord) return;

  // UI 초기화 및 주입
  const ui = injectGraphContainer();
  if (!ui) return;
  const { timeCard, memoryCard } = ui;

  // 표본 행으로 계산하고 차트 그리기
  const draw = (rows) => {
    const submissions = rows.map(([, time, memory]) => ({ time, memory }));

    // 데이터 가공 (data.js)
    const timeData = processData(submissions, "time", myRecord);
    const timeStats = calculatePercentile(submissions, "time", myRecord);

    const memoryData = processData(submissions, "memory", myRecord);
    const memoryStats = calculatePercentile(submissions, "memory", myRecord);

    // 차트 그리기 (graph.js)
    drawChart(timeCard, timeData, "time", myRecord, timeStats, currentLangId);
    drawChart(
      memoryCard,
      memoryData,
      "memory",
      myRecord,
      memoryStats,
      currentLangId,
    );
  };

  // 전체 데이터 로드 및 차트 그리기 함수 정의
  const loadAndDraw = async () => {
    const cacheKey = sampleCacheKey(problemId, currentLangId);
    const cached = loadSampleCache(cacheKey);

    // 저장한 표본으로 먼저 그리고 새 제출만 받아 붙임
    if (cached) {
      draw(cached);
      const { rows, complete } = await fetchSolvedData(
        problemId,
        currentLangId,
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
      currentLangId,
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
