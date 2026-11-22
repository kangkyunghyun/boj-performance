// scripts/ 전용 공용 유틸. 확장 소스(src/)에는 들어가지 않는다. Node 표준 라이브러리만 쓴다.
const fs = require("fs");

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }
  return value;
}

// 업로드할 zip이나 릴리스 노트 경로. 없으면 네트워크 호출 전에 멈춘다.
function getPackageFile(envName) {
  const packageFile = getRequiredEnv(envName);
  if (!fs.existsSync(packageFile)) {
    throw new Error(`${envName} file does not exist: ${packageFile}`);
  }
  return packageFile;
}

// 응답이 2xx가 아니면 본문을 담아 던진다. 스토어 API 호출이 모두 이 경로를 지난다.
async function requestJson(label, url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`${label} failed (${response.status}): ${message}`);
  }
  return body;
}

module.exports = { getPackageFile, getRequiredEnv, requestJson };
