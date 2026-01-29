function main() {
  const params = new URLSearchParams(window.location.search);
  const problemId = params.get("problem_id");

  if (!problemId) return;

  console.log(`BOJ Performance: ${problemId}번 문제 분석 시작`);
}

main();
