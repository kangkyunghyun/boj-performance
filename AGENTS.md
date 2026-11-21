# AGENTS.md

백준(BOJ) 채점 현황 페이지에 내 제출의 실행 시간·메모리 위치를 그래프로 보여주는 브라우저 확장(Manifest V3). Chrome·Whale·Firefox 스토어에 배포한다.

## 구조

빌드 도구, 패키지 매니저, 테스트가 없다. `src/`가 곧 배포물이다.

```
src/
├── manifest.json   content script 주입 범위, 권한
├── rules.json      declarativeNetRequest: /status 요청의 Sec-Fetch-* 헤더를 navigate로 위조
├── js/             전역 함수 공유. manifest의 js 배열 순서가 곧 의존 순서
│   ├── utils.js    로그인 ID, 언어명, 다크 모드 감지
│   ├── api.js      /status HTML을 fetch → DOMParser로 크롤링
│   ├── data.js     빈도 집계, 상위 % 계산
│   ├── ui.js       카드 DOM 생성·삽입
│   ├── graph.js    Chart.js 렌더링
│   ├── main.js     진입점
│   └── libs/chart.js  Chart.js v4.4.1 번들. 수정 금지
└── css/            layout / card / tooltip / theme(다크)
scripts/            배포 자동화 전용. 확장에 들어가지 않음. Node 표준 라이브러리와 셸만
├── package.sh      버전·태그 검사 뒤 src/를 zip
├── publish-chrome.js   Chrome Web Store API 업로드·게시
├── publish-firefox.js  AMO API 업로드·검증 대기·버전 생성
└── lib.js          환경 변수, API 호출 공용
```

흐름: `problem_id` 있고 `contest_id` 없는 status 페이지 → 로그인 ID 확인 → 내 최고 기록 조회(첫 페이지) → 카드 삽입 → 정답 제출 최대 10페이지(약 200건) 순차 크롤링 → 차트.

## BOJ 의존점 (깨지면 여기부터 본다)

확장은 BOJ HTML 크롤링에 전적으로 의존한다. "작동 안 함" 제보는 대부분 BOJ 쪽 변경이다. 의존하는 도메인·주소·셀렉터·표 열·헤더 규칙은 [docs/spec/4-1-CONTRACT.md](docs/spec/4-1-CONTRACT.md), 깨졌을 때의 증상은 [4-4-2](docs/spec/4-4-EXECUTION.md#4-4-2-boj-쪽-변경과-증상)에 있다. 진단 절차는 `.claude/skills/boj-diagnose/SKILL.md`.

## 스펙

제품 스펙 세트는 `docs/spec/`에 있다. 문서 역할과 명세↔코드 대응은 [docs/spec/AGENTS.md](docs/spec/AGENTS.md).

## 규칙

- 의존성·빌드 도구·번들러를 추가하지 않는다. Vanilla JS 전역 함수 구조를 유지한다. `scripts/`도 Node 표준 라이브러리만 쓰고 `package.json`을 두지 않는다.
- 새 JS 파일은 `manifest.json`의 `js` 배열에 의존 순서대로 넣는다.
- BOJ 요청 수를 늘리지 않는다. 페이지 1회당 최대 11회(내 기록 1 + 크롤링 10)가 상한이다.
- `innerHTML`에 넣는 값은 BOJ DOM 출처로 한정한다. 외부 입력을 넣지 않는다.

## 검증

자동 테스트가 없으므로 실제 브라우저에서 확인한다.

1. `chrome://extensions` → 개발자 모드 → 압축해제된 확장 로드 → `src/` 선택(수정 후엔 새로고침).
2. 로그인 상태에서 내 정답 기록이 있는 문제의 status 페이지를 연다. 예: `https://acmicpc.net/status?problem_id=1000`
3. 표 위에 "실행 시간 / 메모리" 카드 2개와 내 막대 강조, 상위 %가 보이면 정상. 언어 필터 변경 후에도 확인.

BOJ 로그인 세션이 필요한 확인은 Aside `--account u1`로 할 수 있다(BOJ 로그인됨).

## 릴리스

절차는 `create-release` 스킬.

1. `release/<버전>` 또는 `hotfix/<버전>` 브랜치에서 `src/manifest.json`의 `version`을 올린다.
2. 그 브랜치를 PR로 `main`에 병합하고 병합 커밋에 `v<버전>` 태그를 단다. 이어서 `main`을 `develop`에 되합치는 PR을 병합한다.
3. 태그 push로 `release.yml`이 태그와 manifest 버전을 맞춰 보고 `boj-performance-v<버전>.zip`을 첨부한 GitHub Release(자동 릴리스 노트)를 만든다.
4. Actions에서 `main`을 대상으로 게시 워크플로를 수동 실행한다. 입력은 `version`과 확인 문구다.
   - `Publish Chrome Web Store`: 확인 문구 `publish-chrome`
   - `Publish Firefox Add-ons`: 확인 문구 `publish-firefox`
   - CLI: `gh workflow run publish-chrome.yml --ref main -f version=<버전> -f confirm_publish=publish-chrome`
5. 웨일은 API가 없다. GitHub Release의 zip을 손으로 올린다.
6. 자동화가 실패하면 `create-release` 스킬의 "자동화가 실패했을 때"대로 로컬에서 zip을 만들어 손으로 올린다.

스토어: [Chrome](https://chromewebstore.google.com/detail/boj-performance/bklabnmnfggmenngdnlndikconflcbij), [Whale](https://store.whale.naver.com/detail/clhhbjiamhmgpehbmmacbppbiiijccpd), [Firefox](https://addons.mozilla.org/ko/firefox/addon/boj-performance).

게시 워크플로가 쓰는 저장소 Secrets(Settings → Secrets and variables → Actions):

| 이름 | 용도 |
|---|---|
| `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN` | Chrome Web Store API OAuth |
| `CHROME_PUBLISHER_ID` | Chrome Web Store 게시자 ID |
| `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET` | AMO API 키 |

## 브랜치와 커밋

git flow를 쓴다.

| 브랜치 | 갈라지는 곳 | PR base | 병합 방식 | 용도 |
|---|---|---|---|---|
| `main` | | | | 스토어에 배포된 상태. 직접 커밋 금지 |
| `develop` | `main` | | | 다음 배포 통합. 직접 커밋 금지 |
| `feature/<이슈번호>-<영어-kebab>` | `develop` | `develop` | squash | 기능, 문서, 리팩토링, CI |
| `release/<버전>` | `develop` | `main` | merge commit | 버전 올리기, 배포 직전 수정 |
| `hotfix/<버전>` | `main` | `main` | merge commit | 배포본 긴급 수정(예: BOJ 쪽 변경 대응). 버전 올림 포함 |
| `main` 되합치기 | | `develop` | merge commit | release·hotfix를 `main`에 병합한 뒤 `develop`에 반영 |

- 작업은 GitHub 이슈부터 연다. 브랜치 이름과 PR 제목에 이슈 번호를 적고 PR 본문에 `Close #번호`를 넣는다.
- 태그 `v<버전>`은 release·hotfix가 `main`에 병합된 커밋에 단다. 버전은 release·hotfix 브랜치에서만 올린다.
- PR은 Draft로 열고 `.github/pull_request_template.md`를 채운다.
- 브랜치를 만들기 전에 `git fetch`로 기준 브랜치를 최신으로 맞춘다.
- 커밋 메시지: `<type>: <한글 설명>`. type은 `feat`, `fix`, `refactor`, `docs`, `chore`, `ci`.
  - 예: `fix: 백준 도메인 변경(acmicpc.net) 대응`
  - 에이전트가 커밋하면 끝에 빈 줄과 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙인다.
- PR 제목: 커밋 형식 뒤에 ` (#이슈번호)`. 예: `fix: 백준 도메인 변경(acmicpc.net) 대응 (#12)`
- 커밋·푸시·PR 생성·병합·태그는 요청받았을 때만 한다.

## 스킬

`.claude/skills/`에 있다.

| 스킬 | 용도 |
|---|---|
| `create-issue` | GitHub 이슈 생성 |
| `create-branch` | 이슈 번호로 git flow 브랜치 생성 |
| `create-commit` | 규칙에 맞는 커밋 |
| `create-pr` | Draft PR 생성·갱신, 머지 뒤 로컬 브랜치 정리 |
| `request-codex-review` | 로컬 Codex CLI 리뷰와 지적 판단 |
| `create-release` | release·hotfix, 태그, 되합치기, 스토어 게시 |
| `boj-diagnose` | "작동 안 함"일 때 BOJ 쪽 변경 진단 |

## CI

| 워크플로 | 검사 | 실행 | 결과 |
|---|---|---|---|
| `.github/workflows/security.yml` | gitleaks 비밀값 검사 | `develop`, `main` 대상 PR과 push | 찾으면 실패 |
| `.github/workflows/codeql.yml` | CodeQL(JavaScript, Actions). `src/js/libs/chart.js` 제외 | `develop`, `main` 대상 PR, `develop` push, 주 1회 | Security 탭에 보고만 하고 PR을 막지 않음 |
| `.github/workflows/release.yml` | 태그와 manifest 버전 일치, zip, GitHub Release | `v*.*.*` 태그 push | 버전이 다르면 실패 |
| `.github/workflows/publish-chrome.yml` | `main`, 확인 문구, 태그가 `main` 최신 커밋인지 확인 뒤 Chrome Web Store 업로드·게시 | 수동 | 심사 요청까지. 공개는 심사 뒤 |
| `.github/workflows/publish-firefox.yml` | 같은 확인 뒤 AMO 업로드·검증 대기·버전 생성 | 수동 | 심사 요청까지. 공개는 심사 뒤 |

빌드와 테스트 CI는 없다.
