/**
 * @file graph.js
 * @description Chart.js 라이브러리를 이용하여 차트를 렌더링하는 함수
 */

// 차트 인스턴스를 저장하여 재사용/삭제 시 활용
let chartInstances = { time: null, memory: null };

// 그래프 그리는 함수
function drawChart(card, chartData, type, myRecord, stats, currentLangId) {
  const statArea = card.querySelector(".stat-area");
  const unit = type === "time" ? "ms" : "KB";

  // 상단 텍스트 정보 구성
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

  // 내 기록 유무에 따른 상단 텍스트 표시
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

  // 색상 설정 (다크 모드 대응)
  const dark = isDarkMode();
  const barColor = dark ? "#444444" : "#cfcfcf";
  const myColor = dark ? "#ffffff" : "#262626";
  const hoverMyColor = dark ? "#e0e0e0" : "#000000";
  const hoverBarColor = dark ? "#666666" : "#a0a0a0";

  // 캔버스 초기화
  const wrapper = card.querySelector(".canvas-wrapper");
  wrapper.innerHTML = "";
  const canvas = document.createElement("canvas");
  wrapper.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 막대별 색상 배열 생성
  const bgColors = chartData.labels.map((l) => {
    const val = parseInt(l.replace(/[^0-9]/g, ""));
    return myRecord && val === myRecord[type] ? myColor : barColor;
  });

  // 기존 차트 파괴
  if (chartInstances[type]) {
    chartInstances[type].destroy();
  }

  // 새 차트 생성
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
