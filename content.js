async function main() {
  const params = new URLSearchParams(window.location.search);
  const problemId = params.get("problem_id");

  if (!problemId) return;

  console.log(`BOJ Performance: ${problemId}번 문제 분석 시작`);

  const container = injectGraphContainer();

  if (container) {
    const loadingMsg = document.createElement("div");
    loadingMsg.innerText = "데이터를 불러오는 중입니다... (약 2~3초 소요)";
    loadingMsg.style.textAlign = "center";
    loadingMsg.style.color = "#666";
    container.appendChild(loadingMsg);

    const submissions = await fetchSolvedData(problemId);

    loadingMsg.remove();

    if (submissions.length > 0) {
      const processedData = processTimeData(submissions);
      drawChart(container, processedData);
    } else {
      container.innerText = "데이터를 가져오는데 실패했습니다.";
    }
  }
}

async function fetchSolvedData(problemId) {
  let data = [];
  let nextUrl = `https://www.acmicpc.net/status?problem_id=${problemId}&result_id=4`;

  const MAX_PAGES = 5;
  let pageCount = 0;

  try {
    while (nextUrl && pageCount < MAX_PAGES) {
      console.log(`데이터 수집 중... (${pageCount + 1}/${MAX_PAGES})`);

      const response = await fetch(nextUrl);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");

      const rows = doc.querySelectorAll("#status-table tbody tr");

      rows.forEach((row) => {
        const cols = row.querySelectorAll("td");
        if (cols.length > 5) {
          const resultText = cols[3].innerText.trim();
          if (!resultText.includes("맞았습니다")) return;

          const memoryStr = cols[4].innerText.trim();
          const timeStr = cols[5].innerText.trim();

          const memory = parseInt(memoryStr);
          const time = parseInt(timeStr);

          if (!isNaN(memory) && !isNaN(time)) {
            data.push({ memory, time });
          }
        }
      });

      const nextButton = doc.querySelector("#next_page");
      if (nextButton) {
        nextUrl = nextButton.getAttribute("href");
        if (nextUrl && !nextUrl.startsWith("http")) {
          nextUrl = `https://www.acmicpc.net${nextUrl}`;
        }
      } else {
        nextUrl = null;
      }

      pageCount++;

      await new Promise((r) => setTimeout(r, 200));
    }

    return data;
  } catch (error) {
    console.error("데이터 수집 중 에러 발생:", error);
    return data;
  }
}

function drawChart(container, chartData) {
  const existingCanvas = container.querySelector("canvas");
  if (existingCanvas) existingCanvas.remove();

  const canvas = document.createElement("canvas");
  canvas.id = "runtimeChart";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "런타임 분포",
          data: chartData.data,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 1.0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `상위 ${chartData.data.reduce((a, b) => a + b, 0)}개의 제출 결과 분석 (런타임)`,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "사람 수" },
          ticks: {
            stepSize: 1,
          },
        },
        x: {
          title: { display: true, text: "실행 시간" },
        },
      },
    },
  });
}

function injectGraphContainer() {
  if (document.getElementById("boj-performance-graph-container")) {
    return document.getElementById("boj-performance-graph-container");
  }

  const container = document.createElement("div");
  container.id = "boj-performance-graph-container";

  container.style.width = "100%";
  container.style.maxWidth = "800px";
  container.style.margin = "20px auto";
  container.style.backgroundColor = "#fff";
  container.style.padding = "15px";
  container.style.border = "1px solid #ddd";
  container.style.borderRadius = "8px";

  const loadingDiv = document.createElement("div");
  container.appendChild(loadingDiv);

  const targetElement = document.querySelector(".table-responsive");
  if (targetElement) {
    targetElement.parentNode.insertBefore(container, targetElement);
    return container;
  }
  return null;
}

function processTimeData(submissions) {
  const times = submissions.map((s) => s.time);

  const frequency = {};
  times.forEach((t) => (frequency[t] ? frequency[t]++ : (frequency[t] = 1)));

  const sortedTimes = Object.keys(frequency)
    .map(Number)
    .sort((a, b) => a - b);

  const labels = sortedTimes.map((t) => `${t}ms`); // X축 라벨
  const data = sortedTimes.map((t) => frequency[t]); // Y축 데이터

  return { labels, data };
}

main();
