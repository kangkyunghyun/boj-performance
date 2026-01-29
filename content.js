// 언어 그룹 아이디
const LANGUAGES = {
  전체: "",
  "C++": "1001",
  C: "1004",
  Java: "1002",
  "Python 3": "28",
  PyPy3: "73",
  Rust: "1005",
  "Node.js": "17",
  Kotlin: "69",
};

let chartInstances = { time: null, memory: null };

async function main() {
  // 문제 내 채점 현황 페이지에서만 동작
  const params = new URLSearchParams(window.location.search);
  const problemId = params.get("problem_id");
  if (!problemId) return;

  // UI 주입
  const ui = injectGraphContainer();
  if (!ui) return;
  const { langSelect, timeCard, memoryCard } = ui;

  // 내 기록 조회
  let currentLangId = "";
  let myRecord = null;

  const myId = getLoginId();
  if (myId) {
    updateCardLoading(timeCard, "내 기록 조회 중...");
    updateCardLoading(memoryCard, "내 기록 조회 중...");

    myRecord = await fetchMyBestSubmission(problemId, myId);
  }

  // 데이터 불러오고 그리기
  const loadAndDraw = async () => {
    updateCardLoading(timeCard, "분석 중...");
    updateCardLoading(memoryCard, "분석 중...");

    // 제출 데이터 불러오기
    const submissions = await fetchSolvedData(problemId, currentLangId);

    // 제출 데이터가 없으면 에러 표시
    if (submissions.length === 0) {
      updateCardError(timeCard);
      updateCardError(memoryCard);
      return;
    }

    // 시간/메모리 통계 계산 및 그리기
    const timeData = processData(submissions, "time", myRecord);
    const timeStats = calculatePercentile(submissions, "time", myRecord);
    drawChart(timeCard, timeData, "time", myRecord, timeStats);

    const memoryData = processData(submissions, "memory", myRecord);
    const memoryStats = calculatePercentile(submissions, "memory", myRecord);
    drawChart(memoryCard, memoryData, "memory", myRecord, memoryStats);
  };

  // 언어 선택 변경 시 다시 불러오기
  langSelect.onchange = (e) => {
    currentLangId = e.target.value;
    loadAndDraw();
  };

  // 초기 로드
  loadAndDraw();
}

// 백분위 계산 함수
function calculatePercentile(submissions, type, myRecord) {
  if (!myRecord) return null;
  const myVal = myRecord[type];
  const total = submissions.length;
  const slowerCount = submissions.filter((s) => s[type] > myVal).length;
  const percentile = (slowerCount / total) * 100;
  return { val: myVal, beats: percentile.toFixed(2) };
}

// 그래프 컨테이너 주입 함수
function injectGraphContainer() {
  // 컨테이너 생성, 이미 존재하면 초기화
  let container = document.getElementById("boj-performance-graph-container");
  if (container) container.innerHTML = "";
  else {
    container = document.createElement("div");
    container.id = "boj-performance-graph-container";
    const target = document.querySelector(".table-responsive");
    if (target) target.parentNode.insertBefore(container, target);
    else return null;
  }

  // 언어 그룹 선택 UI
  const controls = document.createElement("div");
  controls.className = "chart-controls";

  const langSelect = document.createElement("select");
  langSelect.className = "lang-select";

  Object.keys(LANGUAGES).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = LANGUAGES[name];
    opt.innerText = name;
    langSelect.appendChild(opt);
  });
  controls.appendChild(langSelect);
  container.appendChild(controls);

  // 차트 카드
  const chartsRow = document.createElement("div");
  chartsRow.className = "charts-row";

  const timeCard = createCardElement("Runtime (시간)", "time-card");
  const memoryCard = createCardElement("Memory (메모리)", "memory-card");

  chartsRow.appendChild(timeCard);
  chartsRow.appendChild(memoryCard);
  container.appendChild(chartsRow);

  return { langSelect, timeCard, memoryCard };
}

// 카드 생성 함수
function createCardElement(title, id) {
  const card = document.createElement("div");
  card.className = "card";
  card.id = id;
  card.innerHTML = `
    <div class="card-header">
        <div class="card-title">${title}</div>
        <div class="stat-area">
            <div class="card-stat-big">-</div>
            <div class="card-stat-sub">...</div>
        </div>
    </div>
    <div class="canvas-wrapper"></div>
  `;
  return card;
}

// 제출 데이터 불러오기 함수
async function fetchSolvedData(problemId, langId) {
  let data = [];
  let baseUrl = `https://www.acmicpc.net/status?problem_id=${problemId}&result_id=4`;
  if (langId) baseUrl += `&language_id=${langId}`;
  let nextUrl = baseUrl;
  let pageCount = 0;
  while (nextUrl && pageCount < 5) {
    try {
      const res = await fetch(nextUrl);
      const doc = new DOMParser().parseFromString(
        await res.text(),
        "text/html",
      );
      const rows = doc.querySelectorAll("#status-table tbody tr");
      rows.forEach((row) => {
        const cols = row.querySelectorAll("td");
        if (cols.length > 5) {
          const memory = parseInt(cols[4].innerText);
          const time = parseInt(cols[5].innerText);
          if (!isNaN(memory) && !isNaN(time)) data.push({ memory, time });
        }
      });
      const nextBtn = doc.querySelector("#next_page");
      nextUrl = nextBtn ? nextBtn.getAttribute("href") : null;
      if (nextUrl && !nextUrl.startsWith("http"))
        nextUrl = `https://www.acmicpc.net${nextUrl}`;
      pageCount++;
      await new Promise((r) => setTimeout(r, 60));
    } catch (e) {
      break;
    }
  }
  return data;
}

// 로그인 아이디 가져오기 함수
function getLoginId() {
  const user = document.querySelector(".loginbar .username");
  return user ? user.innerText.trim() : null;
}

// 내 최고 기록 불러오기 함수
async function fetchMyBestSubmission(problemId, userId) {
  const url = `https://www.acmicpc.net/status?problem_id=${problemId}&user_id=${userId}&result_id=4`;
  try {
    const res = await fetch(url);
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    const rows = doc.querySelectorAll("#status-table tbody tr");
    let best = null;
    const sortedLangKeys = Object.keys(LANGUAGES).sort(
      (a, b) => b.length - a.length,
    );

    rows.forEach((row) => {
      const cols = row.querySelectorAll("td");
      if (cols.length > 6) {
        const memory = parseInt(cols[4].innerText);
        const time = parseInt(cols[5].innerText);
        const langText = cols[6].innerText.trim();
        if (!isNaN(memory) && !isNaN(time)) {
          if (!best || time < best.time) {
            let matchedId = null;
            for (const key of sortedLangKeys) {
              if (key !== "전체" && langText.includes(key)) {
                matchedId = LANGUAGES[key];
                break;
              }
            }
            best = { time, memory, languageId: matchedId };
          }
        }
      }
    });
    return best;
  } catch (e) {
    return null;
  }
}

// 데이터 처리 함수
function processData(submissions, type, myRecord) {
  const values = submissions.map((s) => s[type]);
  const freq = {};
  values.forEach((v) => (freq[v] = (freq[v] || 0) + 1));

  if (myRecord) {
    const myVal = myRecord[type];
    if (!freq[myVal]) {
      freq[myVal] = 1;
    }
  }

  const sorted = Object.keys(freq)
    .map(Number)
    .sort((a, b) => a - b);

  return {
    labels: sorted.map((v) => (type === "time" ? `${v}ms` : `${v}KB`)),
    data: sorted.map((v) => freq[v]),
  };
}

// 카드 상태 업데이트 함수
function updateCardLoading(card, msg) {
  card.querySelector(".stat-area").innerHTML =
    `<div class="card-stat-sub">${msg}</div>`;
}

// 카드 에러 표시 함수
function updateCardError(card) {
  card.querySelector(".stat-area").innerHTML =
    `<div class="card-stat-sub" style="color:red">데이터 부족</div>`;
}

// 그래프 그리기 함수
function drawChart(card, chartData, type, myRecord, stats) {
  const statArea = card.querySelector(".stat-area");
  const unit = type === "time" ? "ms" : "KB";

  // 상단 정보
  if (myRecord) {
    statArea.innerHTML = `
        <div class="card-stat-big">${stats.val} ${unit}</div>
        <div class="card-stat-sub">
            Beats <span class="beats-highlight">${stats.beats}%</span> of users
        </div>
      `;
  } else {
    statArea.innerHTML = `
        <div class="card-stat-big">-</div>
        <div class="card-stat-sub">내 기록 없음</div>
      `;
  }

  // 그래프
  const wrapper = card.querySelector(".canvas-wrapper");
  wrapper.innerHTML = "";
  const canvas = document.createElement("canvas");
  wrapper.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const barColor = "#cfcfcf";
  const myColor = "#262626";

  const bgColors = chartData.labels.map((l) => {
    const val = parseInt(l.replace(/[^0-9]/g, ""));
    return myRecord && val === myRecord[type] ? myColor : barColor;
  });

  if (chartInstances[type]) chartInstances[type].destroy();

  chartInstances[type] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          data: chartData.data,
          backgroundColor: bgColors,
          minBarLength: 5,
          borderRadius: 2,
          barPercentage: 0.7,

          hoverBackgroundColor: (ctx) => {
            const val = parseInt(
              chartData.labels[ctx.dataIndex].replace(/[^0-9]/g, ""),
            );
            return myRecord && val === myRecord[type] ? "#000000" : "#a0a0a0";
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#333",
          callbacks: { label: (c) => ` ${c.label}: ${c.raw}명` },
        },
      },
      scales: {
        y: { display: false },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            color: "#8c8c8c",
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
          },
          border: { display: false },
        },
      },
    },
  });
}

main();
