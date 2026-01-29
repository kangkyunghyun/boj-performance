function main() {
  const params = new URLSearchParams(window.location.search);
  const problemId = params.get("problem_id");

  if (!problemId) return;

  console.log(`BOJ Performance: ${problemId}번 문제 분석 시작`);

  injectGraphContainer();
}

function injectGraphContainer() {
  if (document.getElementById("boj-performance-graph-container")) return;

  const container = document.createElement("div");
  container.id = "boj-performance-graph-container";
  container.style.width = "100%";
  container.style.height = "200px";
  container.style.backgroundColor = "#f8f9fa";
  container.style.border = "1px solid #dee2e6";
  container.style.margin = "20px 0";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.innerHTML =
    "<strong>여기에 그래프가 그려질 예정입니다 (가짜 데이터 준비 중)</strong>";

  const targetElement = document.querySelector(".table-responsive");
  if (targetElement) {
    targetElement.parentNode.insertBefore(container, targetElement);
  }
}

main();
