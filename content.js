async function main() {
  const params = new URLSearchParams(window.location.search);
  const problemId = params.get("problem_id");
  if (!problemId) return;

  const ui = injectGraphContainer();
  if (!ui) return;

  const { container, btnTime, btnMemory, chartWrapper } = ui;

  chartWrapper.innerHTML =
    '<div style="padding: 40px; text-align: center; color: #666;">데이터를 불러오는 중입니다... </div>';

  const submissions = await fetchSolvedData(problemId);

  const myId = getLoginId();
  let myRecord = null;

  if (myId) {
    myRecord = await fetchMyBestSubmission(problemId, myId);
    if (myRecord) {
      console.log(
        `내 기록 발견! 시간: ${myRecord.time}ms, 메모리: ${myRecord.memory}KB`,
      );
    }
  }

  if (submissions.length === 0) {
    chartWrapper.innerHTML =
      '<div style="padding: 20px; text-align: center; color: red;">데이터 로딩 실패</div>';
    return;
  }

  const updateGraph = (type) => {
    if (type === "time") {
      btnTime.classList.add("active");
      btnMemory.classList.remove("active");
    } else {
      btnTime.classList.remove("active");
      btnMemory.classList.add("active");
    }

    const processedData = processData(submissions, type);
    drawChart(chartWrapper, processedData, type, myRecord);
  };

  btnTime.onclick = () => updateGraph("time");
  btnMemory.onclick = () => updateGraph("memory");

  updateGraph("time");
}

function injectGraphContainer() {
  let container = document.getElementById("boj-performance-container");

  if (container) {
    container.innerHTML = "";
  } else {
    container = document.createElement("div");
    container.id = "boj-performance-container";

    container.style.width = "100%";
    container.style.maxWidth = "800px";
    container.style.margin = "20px auto";
    container.style.backgroundColor = "#fff";
    container.style.padding = "15px";
    container.style.border = "1px solid #ddd";
    container.style.borderRadius = "8px";

    const targetElement = document.querySelector(".table-responsive");
    if (targetElement) {
      targetElement.parentNode.insertBefore(container, targetElement);
    } else {
      return null;
    }
  }

  const tabContainer = document.createElement("div");
  tabContainer.style.marginBottom = "15px";
  tabContainer.style.display = "flex";
  tabContainer.style.gap = "10px";
  tabContainer.style.justifyContent = "center";

  const btnTime = document.createElement("button");
  btnTime.innerText = "실행 시간";
  btnTime.className = "boj-performance-btn active";

  const btnMemory = document.createElement("button");
  btnMemory.innerText = "메모리";
  btnMemory.className = "boj-performance-btn";

  tabContainer.appendChild(btnTime);
  tabContainer.appendChild(btnMemory);
  container.appendChild(tabContainer);

  const chartWrapper = document.createElement("div");
  chartWrapper.id = "chart-wrapper";
  chartWrapper.style.minHeight = "300px";
  container.appendChild(chartWrapper);

  return { container, btnTime, btnMemory, chartWrapper };
}

async function fetchSolvedData(problemId) {
  let data = [];
  let nextUrl = `https://www.acmicpc.net/status?problem_id=${problemId}&result_id=4`;
  const MAX_PAGES = 5;
  let pageCount = 0;

  try {
    while (nextUrl && pageCount < MAX_PAGES) {
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

          const memory = parseInt(cols[4].innerText.trim());
          const time = parseInt(cols[5].innerText.trim());

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
    console.error("크롤링 에러:", error);
    return data;
  }
}

function processData(submissions, type) {
  const values = submissions.map((s) => s[type]);
  const frequency = {};

  values.forEach((v) => (frequency[v] = (frequency[v] || 0) + 1));

  const sortedValues = Object.keys(frequency)
    .map(Number)
    .sort((a, b) => a - b);

  const labels = sortedValues.map((v) =>
    type === "time" ? `${v}ms` : `${v}KB`,
  );
  const data = sortedValues.map((v) => frequency[v]);

  return { labels, data };
}

let myChart = null;

// myRecord 인자 추가 (내 기록 객체: { time: 100, memory: 2048 } 또는 null)
function drawChart(wrapper, chartData, type, myRecord) {
  wrapper.innerHTML = "";
  const canvas = document.createElement("canvas");
  wrapper.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const titleText = type === "time" ? "런타임 분포" : "메모리 사용량 분포";

  const defaultColor = "rgba(206, 206, 206, 0.68)";
  const highlightColor = "rgba(54, 162, 235, 0.6)";

  const backgroundColors = chartData.labels.map((label) => {
    if (!myRecord) return defaultColor;

    const labelValue = parseInt(label.replace(/[^0-9]/g, ""));

    const myValue = myRecord[type];

    if (labelValue === myValue) {
      return highlightColor;
    }
    return defaultColor;
  });

  const borderColors = backgroundColors.map((c) =>
    c.replace("0.6", "1").replace("0.2", "1"),
  );

  if (myChart) {
    myChart.destroy();
    myChart = null;
  }

  myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: titleText,
          data: chartData.data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 1.0,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `최근 ${chartData.data.reduce((a, b) => a + b, 0)}개의 데이터`,
        },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "사람 수" } },
        x: {
          title: { display: true, text: type === "time" ? "시간" : "메모리" },
        },
      },
    },
  });
}

function getLoginId() {
  const userElement = document.querySelector(".loginbar .username");
  if (userElement) {
    return userElement.innerText.trim();
  }
  return null;
}

async function fetchMyBestSubmission(problemId, userId) {
  const url = `https://www.acmicpc.net/status?problem_id=${problemId}&user_id=${userId}&result_id=4`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const rows = doc.querySelectorAll("#status-table tbody tr");

    let minTime = Infinity;
    let minMemory = Infinity;
    let found = false;

    rows.forEach((row) => {
      const cols = row.querySelectorAll("td");
      if (cols.length > 5) {
        const memory = parseInt(cols[4].innerText.trim());
        const time = parseInt(cols[5].innerText.trim());

        if (!isNaN(memory) && !isNaN(time)) {
          if (time < minTime) minTime = time;
          if (memory < minMemory) minMemory = memory;
          found = true;
        }
      }
    });

    if (found) return { time: minTime, memory: minMemory };
    return null;
  } catch (e) {
    console.error("내 기록 조회 실패", e);
    return null;
  }
}

main();
