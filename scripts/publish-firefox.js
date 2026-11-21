// AMO API v5로 zip을 올리고 검증이 끝나면 새 버전을 만든다. 서명과 공개는 AMO 심사 뒤다.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { getPackageFile, getRequiredEnv, requestJson } = require("./lib");

const API = "https://addons.mozilla.org/api/v5";
const POLL_INTERVAL_MS = 10000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;
const JWT_EXPIRATION_SECONDS = 5 * 60;

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function createJwt(issuer, secret) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const unsignedToken =
    `${base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.` +
    base64Url(
      JSON.stringify({
        iss: issuer,
        jti: crypto.randomUUID(),
        iat: issuedAt,
        exp: issuedAt + JWT_EXPIRATION_SECONDS,
      }),
    );
  const signature = crypto
    .createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64url");
  return `${unsignedToken}.${signature}`;
}

// 요청마다 JWT를 새로 만든다. 만료가 5분이라 한 토큰을 돌려쓰면 긴 폴링에서 끊긴다.
function authorizedRequest(label, url, options, credentials) {
  const token = createJwt(credentials.issuer, credentials.secret);
  return requestJson(label, url, {
    ...options,
    headers: { Authorization: `JWT ${token}`, ...options.headers },
  });
}

async function waitForValidUpload(credentials, uploadUuid) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const status = await authorizedRequest(
      "Firefox upload status fetch",
      `${API}/addons/upload/${uploadUuid}/`,
      { method: "GET" },
      credentials,
    );
    console.log(`Firefox upload status: ${JSON.stringify(status, null, 2)}`);

    if (status.processed && status.valid) return;
    if (status.processed && status.valid === false) {
      throw new Error(
        `Firefox upload validation failed: ${JSON.stringify(status.validation || status, null, 2)}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Firefox upload validation timed out for ${uploadUuid}.`);
}

async function main() {
  try {
    const addonId = getRequiredEnv("FIREFOX_ADDON_ID");
    const license = getRequiredEnv("FIREFOX_LICENSE");
    const packageFile = getPackageFile("FIREFOX_PACKAGE_FILE");
    const credentials = {
      issuer: getRequiredEnv("FIREFOX_JWT_ISSUER"),
      secret: getRequiredEnv("FIREFOX_JWT_SECRET"),
    };

    const formData = new FormData();
    formData.append(
      "upload",
      new Blob([await fs.promises.readFile(packageFile)], { type: "application/zip" }),
      path.basename(packageFile),
    );
    formData.append("channel", "listed");

    const uploadResponse = await authorizedRequest(
      "Firefox package upload",
      `${API}/addons/upload/`,
      { method: "POST", body: formData },
      credentials,
    );
    console.log(`Firefox upload response: ${JSON.stringify(uploadResponse, null, 2)}`);

    if (!uploadResponse.uuid) {
      throw new Error("Firefox upload response did not include uuid.");
    }

    await waitForValidUpload(credentials, uploadResponse.uuid);

    // release_notes는 선택 항목이라 보내지 않는다. 변경 내역은 GitHub Release에 있다.
    const versionResponse = await authorizedRequest(
      "Firefox version create",
      `${API}/addons/addon/${encodeURIComponent(addonId)}/versions/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload: uploadResponse.uuid, license }),
      },
      credentials,
    );
    console.log(`Firefox version response: ${JSON.stringify(versionResponse, null, 2)}`);
  } catch (error) {
    console.error(`Firefox publish failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
