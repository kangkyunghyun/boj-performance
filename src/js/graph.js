/**
 * @file graph.js
 * @description Chart.js 라이브러리를 이용하여 차트를 렌더링하는 함수
 */

// 차트 인스턴스를 저장하여 재사용/삭제 시 활용
let chartInstances = { time: null, memory: null };

// 그래프 그리는 함수
// chartData: processData 결과, dark: 카드를 끼울 때 판정한 테마
// langName: 비교 언어 이름(없으면 모든 언어). 그래프 이름에만 씀
function drawChart(card, chartData, type, stats, dark, langName) {
  const statArea = card.querySelector(".stat-area");
  statArea.removeAttribute("aria-busy");
  const unit = type === "time" ? "ms" : "KB";
  const metric = type === "time" ? "실행 시간" : "메모리";

  statArea.innerHTML = `
      <div class="card-stat-big">${stats.val} ${unit}</div>
      <div class="card-stat-sub">
          상위 <span class="beats-highlight">${stats.top}%</span>
          <button type="button" class="tooltip-wrapper">
              <svg viewBox="0 0 24 24" class="info-icon" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <span class="tooltip-text" role="tooltip">최근 <span style="color:#4db8ff">${stats.total}</span>건의 제출 기준</span>
          </button>
      </div>
    `;

  // 안내 아이콘: 키보드 초점으로 툴팁을 열고 Esc로 닫음(초점 해제)
  // 새 문구는 HTML이 아니라 속성으로 넣음
  const tipButton = statArea.querySelector(".tooltip-wrapper");
  const tipId = `${card.id}-tip`;
  statArea.querySelector(".tooltip-text").id = tipId;
  tipButton.setAttribute("aria-label", `${metric} 표본 안내`);
  tipButton.setAttribute("aria-describedby", tipId);
  tipButton.addEventListener("keydown", (e) => {
    if (e.key === "Escape") tipButton.blur();
  });

  // 색상 설정 (다크 모드 대응)
  const barColor = dark ? "#444444" : "#cfcfcf";
  const myColor = dark ? "#ffffff" : "#262626";
  const hoverMyColor = dark ? "#e0e0e0" : "#000000";
  const hoverBarColor = dark ? "#666666" : "#a0a0a0";

  // 캔버스 초기화
  const wrapper = card.querySelector(".canvas-wrapper");
  wrapper.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    `${metric} 분포, 내 기록 ${stats.val}${unit}, 상위 ${stats.top}%, ${langName || "모든 언어"} 최근 ${stats.total}건 기준`,
  );
  wrapper.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 막대별 색상 배열 생성
  const isMine = (i) => i === chartData.mine;
  const bgColors = chartData.data.map((_, i) =>
    isMine(i) ? myColor : barColor,
  );

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
          // 빈 구간은 막대 없음 (minBarLength가 0에도 막대를 그림)
          data: chartData.data.map((c) => c || null),
          backgroundColor: bgColors,
          minBarLength: 5,
          borderRadius: 2,
          barPercentage: 0.7,
          hoverBackgroundColor: (ctx) =>
            isMine(ctx.dataIndex) ? hoverMyColor : hoverBarColor,
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
          callbacks: {
            title: () => "",
            label: (c) => ` ${chartData.tips[c.dataIndex]} · ${c.raw}건`,
          },
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
