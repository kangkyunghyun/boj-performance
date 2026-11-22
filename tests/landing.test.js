const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// 랜딩과 Firefox 게시(scripts/publish-firefox.js)가 같은 함수를 쓴다
const { stripInternalSection, parseReleaseBody } = require("../landing/landing.js");

const NOTES = path.join(__dirname, "..", "docs", "releases");

test("BOJP-QA-044 Internal 절만 뺌", () => {
  const notes = "### Features\n\n- a\n\n### Internal\n\n- x\n- y\n\n### Fixes\n\n- b\n";
  assert.equal(stripInternalSection(notes), "### Features\n\n- a\n\n### Fixes\n\n- b\n");
  assert.equal(stripInternalSection("### Internal\n- x\n"), "\n");
  assert.equal(stripInternalSection("### Fixes\r\n- b\r\n"), "### Fixes\n- b\n");
});

test("BOJP-QA-044 docs/releases의 모든 노트에서 Internal이 남지 않음", () => {
  const files = fs.readdirSync(NOTES).filter((f) => /^v\d+\.\d+\.\d+\.md$/.test(f));
  assert.ok(files.length > 0);
  for (const f of files) {
    const notes = fs.readFileSync(path.join(NOTES, f), "utf8");
    assert.doesNotMatch(stripInternalSection(notes), /^#+ Internal/m, f);
  }
});

test("BOJP-QA-045 노트를 제목·목록·문단 글자로 나눔", () => {
  const body = [
    "## v1.0.1",
    "### Fixes",
    "- 첫째 `acmicpc.net`",
    "* 둘째",
    "",
    "**Full Changelog**: https://example.com",
    "<img src=x onerror=alert(1)>",
    "### Internal",
    "- 숨김",
  ].join("\n");
  assert.deepEqual(parseReleaseBody(body), [
    { type: "heading", text: "v1.0.1" },
    { type: "heading", text: "Fixes" },
    { type: "list", items: ["첫째 `acmicpc.net`", "둘째"] },
    { type: "paragraph", text: "**Full Changelog**: https://example.com" },
    { type: "paragraph", text: "<img src=x onerror=alert(1)>" },
  ]);
  assert.deepEqual(parseReleaseBody(""), []);
});
