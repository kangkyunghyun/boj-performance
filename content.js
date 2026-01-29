function main() {
  const params = new URLSearchParams(window.location.search);
  const problemId = params.get("problem_id");

  if (!problemId) return;

  console.log(`BOJ Performance: ${problemId}번 문제 분석 시작`);

  const container = injectGraphContainer();

  if (container) {
    drawDummyChart(container);
  }
}

function injectGraphContainer() {
  if (document.getElementById("boj-performance-graph-container")) {
    return document.getElementById("boj-performance-graph-container");
  }

  const container = document.createElement("div");
  container.id = "boj-performance-graph-container";

  container.style.width = "100%";
  container.style.maxWidth = "800px"; // 너무 넓어지지 않게
  container.style.margin = "20px auto"; // 가운데 정렬
  container.style.backgroundColor = "#fff";
  container.style.padding = "15px";
  container.style.border = "1px solid #ddd";
  container.style.borderRadius = "8px";

  const canvas = document.createElement("canvas");
  canvas.id = "runtimeChart";
  container.appendChild(canvas);

  const targetElement = document.querySelector(".table-responsive");
  if (targetElement) {
    targetElement.parentNode.insertBefore(container, targetElement);
    return container;
  }
  return null;
}

function drawDummyChart(container) {
  const ctx = document.getElementById("runtimeChart").getContext("2d");

  // 가짜 데이터 (Dummy Data): 런타임 분포 (X축: 시간, Y축: 사람 수)
  const data = {
    labels: ["4ms", "8ms", "12ms", "16ms", "20ms", "24ms", "28ms", "32ms"],
    datasets: [
      {
        label: "런타임 분포 (가짜 데이터)",
        data: [5, 12, 45, 20, 8, 3, 2, 1], // 막대 높이
        backgroundColor: "rgba(54, 162, 235, 0.6)", // 파란색
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        barPercentage: 0.9, // 막대 너비 조절
        categoryPercentage: 1.0,
      },
    ],
  };

  // Chart.js 실행
  new Chart(ctx, {
    type: "bar",
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }, // 범례 숨김
        title: {
          display: true,
          text: "런타임 분포 (Runtime Distribution)",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "사람 수" },
        },
        x: {
          title: { display: true, text: "실행 시간" },
        },
      },
    },
  });
}

main();
