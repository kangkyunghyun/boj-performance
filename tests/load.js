// 확장 코드(전역 함수)를 manifest의 js 순서대로 한 vm 컨텍스트에 읽는다. libs 제외
// main.js가 읽히자마자 main()을 부르므로 문제 번호 없는 주소를 준다(바로 끝남)
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SRC = path.join(__dirname, "..", "src");

function load(globals = {}) {
  const ctx = vm.createContext({
    window: { location: { search: "" } },
    URLSearchParams,
    console,
    ...globals,
  });
  const { js } = JSON.parse(
    fs.readFileSync(path.join(SRC, "manifest.json"), "utf8"),
  ).content_scripts[0];
  for (const file of js.filter((f) => !f.startsWith("js/libs/"))) {
    vm.runInContext(fs.readFileSync(path.join(SRC, file), "utf8"), ctx, {
      filename: file,
    });
  }
  // 결과는 다른 realm의 객체라 deepStrictEqual이 프로토타입 차이로 실패한다. 복사해서 돌려준다
  return new Proxy(ctx, {
    get: (t, k) =>
      typeof t[k] === "function"
        ? (...a) => structuredClone(t[k](...a))
        : t[k],
  });
}

module.exports = { load };
