let chartInstances = { time: null, memory: null };

async function main() {
  // 문제 내 채점 현황 페이지에서만 동작
  const params = new URLSearchParams(window.location.search);
  const problemId = params.get("problem_id");
  if (!problemId) return;

  // UI 주입
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

    // 현재 언어 필터에 맞는 내 기록 조회
    myRecord = await fetchMyBestSubmission(problemId, myId, currentLangId);
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
    drawChart(timeCard, timeData, "time", myRecord, timeStats, currentLangId);

    const memoryData = processData(submissions, "memory", myRecord);
    const memoryStats = calculatePercentile(submissions, "memory", myRecord);
    drawChart(
      memoryCard,
      memoryData,
      "memory",
      myRecord,
      memoryStats,
      currentLangId,
    );
  };

  // 초기 로드
  loadAndDraw();
}

// 백분위 계산 함수
function calculatePercentile(submissions, type, myRecord) {
  const total = submissions.length;
  if (!myRecord) return { val: null, top: null, total: total };
  const myVal = myRecord[type];
  const fasterCount = submissions.filter((s) => s[type] < myVal).length;
  const topPercent = ((fasterCount + 1) / total) * 100;
  return { val: myVal, top: topPercent.toFixed(2), total: total };
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

  // 다크 모드 감지 후 클래스 적용
  if (isDarkMode()) {
    container.classList.add("boj-graph-dark");
  } else {
    container.classList.remove("boj-graph-dark");
  }

  // 차트 카드 영역
  const chartsRow = document.createElement("div");
  chartsRow.className = "charts-row";

  const timeCard = createCardElement("실행 시간", "time-card");
  const memoryCard = createCardElement("메모리", "memory-card");

  chartsRow.appendChild(timeCard);
  chartsRow.appendChild(memoryCard);
  container.appendChild(chartsRow);

  return { timeCard, memoryCard };
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
  while (nextUrl && pageCount < 10) {
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
      //   await new Promise((r) => setTimeout(r, 60));
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

// 내 최고 기록 불러오기 함수 (시간 -> 메모리 순 정렬)
async function fetchMyBestSubmission(problemId, userId, langId) {
  let url = `https://www.acmicpc.net/status?problem_id=${problemId}&user_id=${userId}&result_id=4`;
  if (langId) {
    url += `&language_id=${langId}`;
  }

  try {
    const res = await fetch(url);
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    const rows = doc.querySelectorAll("#status-table tbody tr");
    let best = null;

    rows.forEach((row) => {
      const cols = row.querySelectorAll("td");
      if (cols.length > 6) {
        const memory = parseInt(cols[4].innerText);
        const time = parseInt(cols[5].innerText);

        if (!isNaN(memory) && !isNaN(time)) {
          if (
            !best ||
            time < best.time ||
            (time === best.time && memory < best.memory)
          ) {
            best = { time, memory };
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
function drawChart(card, chartData, type, myRecord, stats, currentLangId) {
  const statArea = card.querySelector(".stat-area");
  const unit = type === "time" ? "ms" : "KB";

  const langName = getLanguageName(currentLangId);
  const detailText = `최근 <span style="color:#4db8ff">${stats.total}</span>건의 제출 기준${langName ? `<br>(${langName})` : ""}`;

  const infoIcon = `
    <div class="tooltip-wrapper">
        <svg viewBox="0 0 24 24" class="info-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
        <span class="tooltip-text">${detailText}</span>
    </div>
  `;

  if (myRecord) {
    statArea.innerHTML = `
        <div class="card-stat-big">${stats.val} ${unit}</div>
        <div class="card-stat-sub">
            상위 <span class="beats-highlight">${stats.top}%</span> ${infoIcon}
        </div>
      `;
  } else {
    statArea.innerHTML = `
        <div class="card-stat-big">-</div>
        <div class="card-stat-sub">
            내 기록 없음 ${infoIcon}
        </div>
      `;
  }

  const dark = isDarkMode();

  const barColor = dark ? "#444444" : "#cfcfcf";
  const myColor = dark ? "#ffffff" : "#262626";
  const hoverMyColor = dark ? "#e0e0e0" : "#000000";
  const hoverBarColor = dark ? "#666666" : "#a0a0a0";

  // 그래프
  const wrapper = card.querySelector(".canvas-wrapper");
  wrapper.innerHTML = "";
  const canvas = document.createElement("canvas");
  wrapper.appendChild(canvas);
  const ctx = canvas.getContext("2d");

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
            return myRecord && val === myRecord[type]
              ? hoverMyColor
              : hoverBarColor;
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
          backgroundColor: dark ? "#555" : "#333",
          callbacks: { label: (c) => ` ${c.raw}명` },
        },
      },
      scales: {
        y: { display: false },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            color: dark ? "#888" : "#8c8c8c",
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

// 선택된 언어 이름 조회 함수
function getLanguageName(langId) {
  if (!langId || langId === "-1") return null;

  const selectBox = document.querySelector('select[name="language_id"]');
  if (selectBox) {
    const option = selectBox.querySelector(`option[value="${langId}"]`);
    if (option) {
      return option.innerText.trim();
    }
  }
  return null;
}

// 다크 모드 여부 확인 함수
function isDarkMode() {
  // boj-extended 확장 프로그램 설정 확인
  const extendedTheme = localStorage.getItem("boj-extended-theme"); // 'dark' or 'light'

  if (extendedTheme === "dark") return true;
  if (extendedTheme === "light") return false;

  // 설정이 없으면 브라우저/OS 시스템 설정 확인
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

main();
