/**
 * @file data.js
 * @description 데이터를 가공하거나 통계를 계산하는 함수 모음
 */

// 실행 시간이 가장 짧은 제출, 같으면 메모리가 적은 제출
function pickBest(subs) {
  return subs.reduce((best, s) =>
    s.time < best.time || (s.time === best.time && s.memory < best.memory)
      ? s
      : best,
  );
}

// 오름차순 값을 막대 구간으로: [{ from, to, count }], to까지 포함
// 서로 다른 값 30개 이하: 값마다 하나
// 초과: 95번째 백분위수까지를 1·2·5×10^k 폭으로 나누고(30개 이하인 가장 작은 폭)
//       그 위는 to가 Infinity인 맨 오른쪽 구간 하나
function makeBins(sorted) {
  const distinct = [...new Set(sorted)];
  if (distinct.length <= 30) {
    return distinct.map((v) => ({
      from: v,
      to: v,
      count: sorted.filter((x) => x === v).length,
    }));
  }

  const min = sorted[0];
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
  let w = 1;
  for (let i = 1; Math.floor(p95 / w) - Math.floor(min / w) + 1 > 30; i++) {
    w = [1, 2, 5][i % 3] * 10 ** Math.floor(i / 3);
  }

  const lo = Math.floor(min / w);
  const cut = (Math.floor(p95 / w) + 1) * w;
  const bins = [];
  for (let b = lo; b * w < cut; b++) {
    bins.push({ from: b * w, to: b * w + w - 1, count: 0 });
  }
  const over = { from: cut, to: Infinity, count: 0 };
  for (const v of sorted) {
    if (v >= cut) over.count++;
    else bins[Math.floor(v / w) - lo].count++;
  }
  if (over.count) bins.push(over);
  return bins;
}

// 제출 데이터를 막대 그래프 형태로 가공
// mine: 내 값이 들어간 막대 번호
function processData(submissions, type, myRecord) {
  const unit = type === "time" ? "ms" : "KB";
  const myVal = myRecord[type];
  const values = submissions.map((s) => s[type]);

  // 내 값이 표본에 없으면 1건으로 더해 강조 막대가 늘 보이게 함
  if (!values.includes(myVal)) values.push(myVal);
  values.sort((a, b) => a - b);

  const bins = makeBins(values);
  return {
    labels: bins.map((b) =>
      b.to === Infinity ? `≥ ${b.from}${unit}` : `${b.from}${unit}`,
    ),
    tips: bins.map((b) =>
      b.to === Infinity
        ? `≥ ${b.from}${unit}`
        : b.from === b.to
          ? `${b.from}${unit}`
          : `${b.from}–${b.to}${unit}`,
    ),
    data: bins.map((b) => b.count),
    mine: bins.findIndex((b) => myVal >= b.from && myVal <= b.to),
  };
}

// 상위 퍼센트 계산 (묶기 전 원래 값)
function calculatePercentile(submissions, type, myRecord) {
  const total = submissions.length;
  const myVal = myRecord[type];
  const fasterCount = submissions.filter((s) => s[type] < myVal).length;
  const topPercent = Math.min(((fasterCount + 1) / total) * 100, 100);

  return { val: myVal, top: topPercent.toFixed(2), total: total };
}
