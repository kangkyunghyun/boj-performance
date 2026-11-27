/**
 * @file ui.js
 * @description DOM 요소를 생성, 삽입, 조작하는 UI 관련 함수 모음
 */

// 그래프가 들어갈 컨테이너 생성, 페이지에 주입. 카드는 스켈레톤으로 시작
function injectGraphContainer(dark) {
  // 테이블 위에 삽입. 자리가 없으면 넣지 않음
  const target = document.querySelector(".table-responsive");
  if (!target) return null;
  const container = document.createElement("div");
  container.id = "boj-performance-graph-container";
  target.parentNode.insertBefore(container, target);

  // 다크 모드 적용
  container.classList.toggle("boj-graph-dark", dark);

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

// 개별 카드 요소 생성. 결과가 오기 전까지 스켈레톤(화면 낭독기에는 "분석 중...")
function createCardElement(title, id) {
  const card = document.createElement("div");
  card.className = "card";
  card.id = id;
  card.innerHTML = `
    <div class="card-header">
        <div class="card-title">${title}</div>
        <div class="stat-area" aria-live="polite" aria-busy="true">
            <div class="skeleton skeleton-big" aria-hidden="true"></div>
            <div class="skeleton skeleton-sub" aria-hidden="true"></div>
            <span class="visually-hidden">분석 중...</span>
        </div>
    </div>
    <div class="canvas-wrapper"><div class="skeleton skeleton-chart" aria-hidden="true"></div></div>
  `;
  return card;
}

// 카드의 상태를 에러로 업데이트
function updateCardError(card) {
  const statArea = card.querySelector(".stat-area");
  statArea.removeAttribute("aria-busy");
  statArea.innerHTML = `<div class="card-stat-sub" style="color:red">데이터 부족</div>`;
  card.querySelector(".canvas-wrapper").innerHTML = "";
}
