const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load");

const { pickBest, makeBins, processData, calculatePercentile } = load();

const subs = (type, values) => values.map((v) => ({ [type]: v }));
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));

// 5-1-3 계산 확인: 상위 비율과 분포(막대 툴팁 이름, 제출 수, 강조 막대)
function check(type, values, mine, top, tips, data, mineIdx) {
  const s = subs(type, values);
  const rec = { [type]: mine };
  assert.equal(calculatePercentile(s, type, rec).top, top);
  const d = processData(s, type, rec);
  if (tips) assert.deepEqual(d.tips, tips);
  assert.deepEqual(d.data, data);
  assert.equal(d.mine, mineIdx);
}

const T4 = [10, 20, 20, 30];
const M4 = [2020, 2024, 2024, 3000];
test("BOJP-QA-019 내 값이 표본에 있음", () =>
  check("time", T4, 20, "50.00", ["10ms", "20ms", "30ms"], [1, 2, 1], 1));
test("BOJP-QA-020 내 값이 가장 작음", () =>
  check("time", T4, 10, "25.00", ["10ms", "20ms", "30ms"], [1, 2, 1], 0));
test("BOJP-QA-021 표본 밖 작은 내 값은 1건 더해 강조", () =>
  check("time", T4, 5, "25.00", ["5ms", "10ms", "20ms", "30ms"], [1, 1, 2, 1], 0));
test("BOJP-QA-022 표본 밖 큰 내 값, 상위 100 상한", () =>
  check("time", T4, 40, "100.00", ["10ms", "20ms", "30ms", "40ms"], [1, 2, 1, 1], 3));
test("BOJP-QA-023 메모리", () =>
  check("memory", M4, 2024, "50.00", ["2020KB", "2024KB", "3000KB"], [1, 2, 1], 1));
test("BOJP-QA-024 메모리 표본 밖 내 값", () =>
  check("memory", M4, 1500, "25.00", ["1500KB", "2020KB", "2024KB", "3000KB"], [1, 1, 2, 1], 0));

test("BOJP-QA-037 서로 다른 값 31개면 폭 1 구간과 맨 오른쪽 막대", () =>
  check(
    "time",
    range(31, (i) => i + 1),
    5,
    "16.13",
    [...range(30, (i) => `${i + 1}ms`), "≥ 31ms"],
    Array(31).fill(1),
    4,
  ));
test("BOJP-QA-038 0ms 포함, 폭 10", () =>
  check(
    "time",
    [...range(190, (i) => i), ...Array(10).fill(820)],
    0,
    "0.50",
    [...range(19, (i) => `${i * 10}–${i * 10 + 9}ms`), "≥ 190ms"],
    Array(20).fill(10),
    0,
  ));
test("BOJP-QA-039 모두 같은 값", () =>
  check("time", Array(200).fill(40), 40, "0.50", ["40ms"], [200], 0));
test("BOJP-QA-040 큰 메모리, 폭 10000, 표본 밖 내 값 포함", () => {
  const values = range(200, (i) => 2020 + i * 1517);
  const s = subs("memory", values);
  const d = processData(s, "memory", { memory: 2024 });
  assert.equal(calculatePercentile(s, "memory", { memory: 2024 }).top, "1.00");
  assert.equal(d.tips.length, 30);
  assert.equal(d.tips[0], "0–9999KB");
  assert.equal(d.tips[28], "280000–289999KB");
  assert.equal(d.tips[29], "≥ 290000KB");
  assert.equal(d.labels[0], "0KB");
  assert.equal(d.labels[29], "≥ 290000KB");
  assert.equal(d.data[0], 7);
  assert.equal(d.data[28], 6);
  assert.equal(d.data[29], 10);
  assert.equal(d.data.reduce((a, b) => a + b), 201);
  assert.equal(d.mine, 0);
});

test("makeBins 서로 다른 값 30개면 값마다 막대", () => {
  const sorted = range(30, (i) => i * 7);
  const bins = makeBins(sorted);
  assert.equal(bins.length, 30);
  assert.ok(bins.every((b, i) => b.from === i * 7 && b.to === i * 7 && b.count === 1));
});

test("makeBins 31개 이상이면 구간 31개 이하, 합은 표본 수", () => {
  for (const n of [31, 50, 200]) {
    const sorted = range(n, (i) => i * i * 13);
    const bins = makeBins(sorted);
    assert.ok(bins.length <= 31, `n=${n} bins=${bins.length}`);
    assert.equal(bins.reduce((a, b) => a + b.count, 0), n);
  }
});

test("makeBins 상위 5% 밖 값만 맨 오른쪽 막대로", () => {
  // 0~94 각 1건, 10000~10004 5건: p95(95번째) = 94
  const sorted = [...range(95, (i) => i), ...range(5, (i) => 10000 + i)];
  const bins = makeBins(sorted);
  const last = bins.at(-1);
  assert.equal(last.to, Infinity);
  assert.equal(last.count, 5);
  assert.ok(last.from > 94 && last.from <= 10000);
});

test("makeBins 최댓값이 95번째 백분위수 구간에 들면 맨 오른쪽 막대 없음", () => {
  // 0~30 각 1건 + 30 100건: p95 = 30, 폭 2, 경계 32
  const sorted = [...range(31, (i) => i), ...Array(100).fill(30)];
  const bins = makeBins(sorted);
  assert.notEqual(bins.at(-1).to, Infinity);
  assert.deepEqual(bins.at(-1), { from: 30, to: 31, count: 101 });
  assert.equal(bins.reduce((a, b) => a + b.count, 0), 131);
});

test("calculatePercentile 같은 값은 앞선 것으로 세지 않음", () => {
  const s = subs("time", [10, 10, 10, 10]);
  assert.equal(calculatePercentile(s, "time", { time: 10 }).top, "25.00");
  assert.equal(calculatePercentile(s, "time", { time: 10 }).total, 4);
});

test("BOJP-QA-002 pickBest 가장 짧은 시간, 같으면 적은 메모리", () => {
  const mine = [
    { time: 8, memory: 3000, lang: "C++17" },
    { time: 4, memory: 2100, lang: "C++17" },
    { time: 4, memory: 2020, lang: "Python 3" },
    { time: 4, memory: 2050, lang: "C++17" },
  ];
  assert.deepEqual(pickBest(mine), mine[2]);
});

test("pickBest 완전히 같으면 앞(최근) 제출", () => {
  const mine = [
    { time: 4, memory: 2020, lang: "A" },
    { time: 4, memory: 2020, lang: "B" },
  ];
  assert.equal(pickBest(mine).lang, "A");
});
