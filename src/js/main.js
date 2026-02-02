/**
 * @file main.js
 * @description 확장 프로그램의 전체 로직을 조율하는 메인 파일
 */

async function main() {
  // 문제 내 채점 현황 페이지 확인
  const params = new URLSearchParams(window.location.search);
  const problemId = params.get("problem_id");
  if (!problemId) return;

  // UI 초기화 및 주입
  const ui = injectGraphContainer();
  if (!ui) return;
  const { timeCard, memoryCard } = ui;

  // 내 기록 조회
  let myRecord = null;
  const currentLangId = params.get("language_id") || "";
  const myId = getLoginId();

  if (myId) {
    updateCardLoading(timeCard, "내 기록 조회 중...");
    updateCardLoading(memoryCard, "내 기록 조회 중...");

    myRecord = await fetchMyBestSubmission(problemId, myId, currentLangId);
  }

  // 전체 데이터 로드 및 차트 그리기 함수 정의
  const loadAndDraw = async () => {
    updateCardLoading(timeCard, "분석 중...");
    updateCardLoading(memoryCard, "분석 중...");

    // 데이터 가져오기 (api.js)
    const submissions = await fetchSolvedData(problemId, currentLangId);

    if (submissions.length === 0) {
      updateCardError(timeCard);
      updateCardError(memoryCard);
      return;
    }

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

  // 5. 실행
  loadAndDraw();
}

// 메인 함수 실행
main();
