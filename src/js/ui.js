/**
 * @file ui.js
 * @description DOM 요소를 생성, 삽입, 조작하는 UI 관련 함수 모음
 */

// 그래프가 들어갈 컨테이너 생성, 페이지에 주입
// langName: 비교 언어 이름(없으면 모든 언어), others: 다른 언어 [{ name, href }]
function injectGraphContainer(dark, langName, others) {
  let container = document.getElementById("boj-performance-graph-container");

  // 초기화
  if (container) {
    container.innerHTML = "";
  } else {
    container = document.createElement("div");
    container.id = "boj-performance-graph-container";

    // 테이블 위에 삽입
    const target = document.querySelector(".table-responsive");
    if (target) {
      target.parentNode.insertBefore(container, target);
    } else {
      return null;
    }
  }

  // 다크 모드 적용
  container.classList.toggle("boj-graph-dark", dark);

  container.appendChild(createLangLine(langName, others));

  // 카드 레이아웃 생성
  const chartsRow = document.createElement("div");
  chartsRow.className = "charts-row";

  const timeCard = createCardElement("실행 시간", "time-card");
  const memoryCard = createCardElement("메모리", "memory-card");

  chartsRow.appendChild(timeCard);
  chartsRow.appendChild(memoryCard);
  container.appendChild(chartsRow);

  return { timeCard, memoryCard };
}

// 비교 언어 줄: "{언어} 기준 · 다른 언어 {링크}, {링크}"
// 언어 이름은 BOJ 페이지 글자라 textContent로만 넣음
function createLangLine(langName, others) {
  const line = document.createElement("div");
  line.className = "lang-line";
  line.append(`${langName || "모든 언어"} 기준`);
  others.forEach((o, i) => {
    line.append(i === 0 ? " · 다른 언어 " : ", ");
    const link = document.createElement("a");
    link.href = o.href;
    link.textContent = o.name;
    line.append(link);
  });
  return line;
}

// 개별 카드 요소 생성
function createCardElement(title, id) {
  const card = document.createElement("div");
  card.className = "card";
  card.id = id;
  card.innerHTML = `
    <div class="card-header">
        <div class="card-title">${title}</div>
        <div class="stat-area" aria-live="polite">
            <div class="card-stat-big">-</div>
            <div class="card-stat-sub">...</div>
        </div>
    </div>
    <div class="canvas-wrapper"></div>
  `;
  return card;
}

// 카드의 상태를 메시지로 업데이트
function updateCardLoading(card, msg) {
  card.querySelector(".stat-area").innerHTML =
    `<div class="card-stat-sub">${msg}</div>`;
}

// 카드의 상태를 에러로 업데이트
function updateCardError(card) {
  card.querySelector(".stat-area").innerHTML =
    `<div class="card-stat-sub" style="color:red">데이터 부족</div>`;
}
