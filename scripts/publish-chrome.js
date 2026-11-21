// Chrome Web Store API v2로 zip을 올리고 게시를 요청한다. 심사 뒤 공개된다.
const fs = require("fs");

const { getPackageFile, getRequiredEnv, requestJson } = require("./lib");

const API = "https://chromewebstore.googleapis.com";

async function getAccessToken() {
  const tokenResponse = await requestJson(
    "Chrome access token request",
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: getRequiredEnv("CHROME_CLIENT_ID"),
        client_secret: getRequiredEnv("CHROME_CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: getRequiredEnv("CHROME_REFRESH_TOKEN"),
      }),
    },
  );

  if (!tokenResponse.access_token) {
    throw new Error("Chrome access token response did not include access_token.");
  }
  return tokenResponse.access_token;
}

async function main() {
  try {
    const packageFile = getPackageFile("CHROME_PACKAGE_FILE");
    const item =
      `publishers/${getRequiredEnv("CHROME_PUBLISHER_ID")}` +
      `/items/${getRequiredEnv("CHROME_EXTENSION_ID")}`;
    const accessToken = await getAccessToken();
    const auth = { Authorization: `Bearer ${accessToken}` };

    const uploadResponse = await requestJson(
      "Chrome package upload",
      `${API}/upload/v2/${item}:upload`,
      {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/zip" },
        body: await fs.promises.readFile(packageFile),
      },
    );
    console.log(`Chrome upload response: ${JSON.stringify(uploadResponse, null, 2)}`);

    const publishResponse = await requestJson(
      "Chrome package publish",
      `${API}/v2/${item}:publish`,
      { method: "POST", headers: auth },
    );
    console.log(`Chrome publish response: ${JSON.stringify(publishResponse, null, 2)}`);

    const statusResponse = await requestJson(
      "Chrome item status fetch",
      `${API}/v2/${item}:fetchStatus`,
      { method: "GET", headers: auth },
    );
    console.log(`Chrome item status: ${JSON.stringify(statusResponse, null, 2)}`);
  } catch (error) {
    console.error(`Chrome publish failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
