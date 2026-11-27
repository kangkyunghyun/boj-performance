const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load");

const { sampleCacheKey, parseSampleCache, mergeSamples } = load();

const rows = (ids) => ids.map((id) => [id, 4, 2020]);

test("BOJP-QA-025 sampleCacheKey 문제와 언어", () => {
  assert.equal(sampleCacheKey("1000", "84"), "boj-performance:v1:1000:84");
});

test("BOJP-QA-034 sampleCacheKey 모든 언어는 빈 값", () => {
  assert.equal(sampleCacheKey("1000", ""), "boj-performance:v1:1000:");
  assert.equal(sampleCacheKey("1000", null), "boj-performance:v1:1000:");
});

test("parseSampleCache 올바른 값", () => {
  const r = rows([30, 20, 10]);
  assert.deepEqual(parseSampleCache(JSON.stringify({ rows: r, savedAt: 1 })), r);
});

for (const [name, raw] of [
  ["BOJP-QA-029 JSON 아님", "{"],
  ["rows 없음", JSON.stringify({ savedAt: 1 })],
  ["null", "null"],
  ["rows가 배열 아님", JSON.stringify({ rows: "x" })],
  ["빈 rows", JSON.stringify({ rows: [] })],
  ["행 길이가 3 아님", JSON.stringify({ rows: [[30, 4]] })],
  ["정수 아닌 값", JSON.stringify({ rows: [[30, 4.5, 2020]] })],
  ["문자열 값", JSON.stringify({ rows: [["30", 4, 2020]] })],
  ["제출 번호 내림차순 아님", JSON.stringify({ rows: rows([10, 20]) })],
  ["제출 번호 중복", JSON.stringify({ rows: rows([20, 20]) })],
]) {
  test(`parseSampleCache 깨진 값: ${name}`, () => {
    assert.equal(parseSampleCache(raw), null);
  });
}

test("BOJP-QA-027 mergeSamples 새 행을 앞에, 200행으로 자름", () => {
  const cached = rows(Array.from({ length: 200 }, (_, i) => 200 - i));
  const merged = mergeSamples(rows([202, 201]), cached);
  assert.equal(merged.length, 200);
  assert.deepEqual(merged.slice(0, 3).map((r) => r[0]), [202, 201, 200]);
  assert.equal(merged.at(-1)[0], 3);
});

test("mergeSamples 200행 미만이면 모두 유지", () => {
  assert.deepEqual(mergeSamples(rows([5]), rows([3, 1])), rows([5, 3, 1]));
});

test("BOJP-QA-029 loadSampleCache 깨진 값은 지우고 null", () => {
  const store = new Map([["k", "{"]]);
  const sessionStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
  const api = load({ sessionStorage });
  assert.equal(api.loadSampleCache("k"), null);
  assert.equal(store.has("k"), false);
  api.saveSampleCache("k", rows([2, 1]));
  assert.deepEqual(api.loadSampleCache("k"), rows([2, 1]));
});

test("BOJP-QA-030 saveSampleCache 용량 초과여도 예외 없음", () => {
  const sessionStorage = {
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  const api = load({ sessionStorage });
  assert.doesNotThrow(() => api.saveSampleCache("k", rows([1])));
});

// fetch 응답과 DOMParser 결과를 흉내 냄. 행: [제출 번호, 메모리, 시간, 언어]
function fakeBoj(pages) {
  let i = 0;
  const fetch = async () => {
    const p = pages[i++];
    return { ok: p.status === 200, status: p.status, text: async () => i - 1 };
  };
  const cell = (v) => ({ innerText: String(v), textContent: String(v) });
  const DOMParser = class {
    parseFromString(n) {
      const p = pages[n];
      return {
        querySelectorAll: () =>
          p.rows.map(([id, mem, time, lang]) => ({
            querySelectorAll: () =>
              [id, "u", "p", "r", mem, time, "s", lang].map(cell),
          })),
        querySelector: () =>
          p.next ? { getAttribute: () => `/status?top=${p.next}` } : null,
      };
    }
  };
  return { fetch, DOMParser, location: { origin: "https://acmicpc.net" } };
}

test("BOJP-QA-047 fetchSolvedData 오류 상태면 그 전 행만, 완료 아님", async () => {
  const api = load(
    fakeBoj([
      { status: 200, rows: [[30, 2020, 4, "C++17"]], next: 29 },
      { status: 403, rows: [] },
    ]),
  );
  api.console = { error: () => {} };
  const { rows, complete } = await api.fetchSolvedData("1000", "", null);
  assert.deepEqual(rows, [[30, 4, 2020]]);
  assert.equal(complete, false);
});

test("fetchSolvedData 정상 응답은 다음 페이지까지 읽고 완료", async () => {
  const api = load(
    fakeBoj([
      { status: 200, rows: [[30, 2020, 4, "C++17"]], next: 29 },
      { status: 200, rows: [[20, 2024, 8, "C++17"]] },
    ]),
  );
  const { rows, complete } = await api.fetchSolvedData("1000", "", null);
  assert.deepEqual(rows, [[30, 4, 2020], [20, 8, 2024]]);
  assert.equal(complete, true);
});

test("fetchMySubmissions 오류 상태면 null", async () => {
  const api = load(fakeBoj([{ status: 403, rows: [[30, 2020, 4, "C++17"]] }]));
  assert.equal(await api.fetchMySubmissions("1000", "me", ""), null);
});
