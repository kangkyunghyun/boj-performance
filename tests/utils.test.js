const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load");

// 선택자 엔진 대신, 선택자에 값을 넣으면 실패하게 흉내 냄
const options = [
  { value: "84", innerText: "C++17" },
  { value: "1003", innerText: "Python 3" },
];
const document = {
  querySelectorAll: (sel) =>
    sel === 'select[name="language_id"] option' ? options : [],
  querySelector: () => ({
    querySelector: () => {
      throw new Error("SyntaxError: invalid selector");
    },
  }),
};

test("BOJP-QA-048 getLanguageName 따옴표가 든 값에 예외 없이 null", () => {
  const { getLanguageName } = load({ document });
  assert.equal(getLanguageName('84"]'), null);
});

test("getLanguageName 필터 값의 언어 이름", () => {
  const { getLanguageName } = load({ document });
  assert.equal(getLanguageName("1003"), "Python 3");
  assert.equal(getLanguageName("-1"), null);
});
