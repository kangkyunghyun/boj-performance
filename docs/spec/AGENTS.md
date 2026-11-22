# BOJ Performance 스펙

<br>

### 1 문서 역할

| 문서 | 내용 |
|---|---|
| [1-BACKGROUND.md](1-BACKGROUND.md) | 1 배경. 사용자와 목적, 범위, 용어 |
| [2-1-USER-STORY.md](2-1-USER-STORY.md) | 2-1 유저 스토리 |
| [2-2-REQUIREMENTS.md](2-2-REQUIREMENTS.md) | 2-2 요구사항. 적용 범위, 내 기록과 표본, 상위 비율, 언어, 테마, 실패, 품질 제약, 접근성 |
| [3-1-INFORMATION-ARCHITECTURE.md](3-1-INFORMATION-ARCHITECTURE.md) | 3-1 화면 구성. 진입 조건, 정보 순서 |
| [3-2-INTERACTION-FLOWS.md](3-2-INTERACTION-FLOWS.md) | 3-2 화면 흐름. 페이지 진입부터 결과까지, 조작 |
| [3-3-LAYOUT.md](3-3-LAYOUT.md) | 3-3 화면 배치. 크기, 상태별 문구, 그래프 모양, 색, 접근 가능한 이름 |
| [4-1-CONTRACT.md](4-1-CONTRACT.md) | 4-1 연동 계약. BOJ 주소와 셀렉터, 도메인과 권한, 요청 헤더, 결과 표 열, boj-extended 설정 |
| [4-2-COMPONENT-ARCHITECTURE.md](4-2-COMPONENT-ARCHITECTURE.md) | 4-2 구성 요소 구조 |
| [4-3-STATE-MANAGEMENT.md](4-3-STATE-MANAGEMENT.md) | 4-3 상태 관리 |
| [4-4-EXECUTION.md](4-4-EXECUTION.md) | 4-4 실행. 요청 순서, BOJ 쪽 변경과 증상 |
| [5-1-VERIFICATION.md](5-1-VERIFICATION.md) | 5-1 검증. 요구사항 대응, 검증 케이스 |
| [6-DEPLOYMENT.md](6-DEPLOYMENT.md) | 6 배포. 스토어 제출, 호환 조건, 되돌리기 |
| [DECISIONS.md](DECISIONS.md) | 결정 기록 |

<br>

### 2 작업별 참조

| 작업 | 볼 문서 |
|---|---|
| "작동 안 함" 제보, BOJ 변경 대응 | [4-1](4-1-CONTRACT.md), [4-4-2](4-4-EXECUTION.md#4-4-2-boj-쪽-변경과-증상), [boj-diagnose 스킬](../../.claude/skills/boj-diagnose/SKILL.md) |
| 내 기록, 표본, 상위 비율, 분포 구간 계산 변경 | [2-2-2](2-2-REQUIREMENTS.md#2-2-2-성능-위치), [2-2-3](2-2-REQUIREMENTS.md#2-2-3-언어별-비교), [4-3-2](4-3-STATE-MANAGEMENT.md#4-3-2-세션-저장소), [5-1-3](5-1-VERIFICATION.md#5-1-3-계산-확인), [DECISIONS](DECISIONS.md) |
| 카드 모양, 문구, 색 변경 | [3-3](3-3-LAYOUT.md) |
| 키보드 조작, 화면 낭독기 이름 변경 | [2-2-7](2-2-REQUIREMENTS.md#2-2-7-접근성), [3-3-6](3-3-LAYOUT.md#3-3-6-접근-가능한-이름) |
| 테마 판정 변경 | [2-2-4](2-2-REQUIREMENTS.md#2-2-4-테마), [4-1-5](4-1-CONTRACT.md#4-1-5-boj-extended-테마-설정), [4-3](4-3-STATE-MANAGEMENT.md) |
| 구성 요소나 파일 추가 | [4-2](4-2-COMPONENT-ARCHITECTURE.md) |
| 릴리스 | [6](6-DEPLOYMENT.md), 저장소 루트 [AGENTS.md](../../AGENTS.md)의 릴리스 |

<br>

### 3 명세와 코드 대응

| 명세 | 코드 |
|---|---|
| 4-2 진입, 2-2-3 비교 언어와 다른 언어 링크 | [`src/js/main.js`](../../src/js/main.js) |
| 4-2 페이지 읽기, 4-1-1 언어 이름과 언어 필터 값, 4-1-5 테마 설정 | [`src/js/utils.js`](../../src/js/utils.js) |
| 4-2 BOJ 조회, 4-1-1 요청 주소, 4-1-4 결과 표 읽기, 4-3-2 세션 저장소 | [`src/js/api.js`](../../src/js/api.js) |
| 4-2 계산, 2-2-2 내 기록, 분포 구간, 상위 비율 | [`src/js/data.js`](../../src/js/data.js) |
| 4-2 카드, 4-1-1 끼워 넣을 자리, 3-3-2 분석 중과 데이터 부족, 3-3-3 비교 언어 줄, 3-3-6 상태 알림 영역 | [`src/js/ui.js`](../../src/js/ui.js) |
| 4-2 그래프, 3-3-3 툴팁 문구, 3-3-4 그래프, 3-3-5 막대와 축 색, 3-3-6 안내 아이콘과 그래프 이름 | [`src/js/graph.js`](../../src/js/graph.js) |
| 4-2 차트 라이브러리 | [`src/js/libs/chart.js`](../../src/js/libs/chart.js). Chart.js v4.4.1 번들, 수정하지 않음 |
| 4-2 요청 헤더 규칙, 4-1-3 요청 헤더 | [`src/rules.json`](../../src/rules.json) |
| 4-1-2 도메인과 권한, 4-2-2 의존 순서, 6-1 버전, 6-2 Firefox 조건 | [`src/manifest.json`](../../src/manifest.json)의 `content_scripts`(`matches`, `js` 배열 순서), `host_permissions`, `permissions`, `version`, `browser_specific_settings` |
| 6-1 패키지와 제출 방법 | [`.github/workflows/`](../../.github/workflows/)의 `release.yml`, `publish-chrome.yml`, `publish-firefox.yml`, [`scripts/`](../../scripts/) |
| 3-3-1 배치, 3-3-3 안내 툴팁 표시(마우스, 키보드 초점), 3-3-5 카드와 툴팁 색 | [`src/css/`](../../src/css/)의 `layout.css`, `card.css`, `tooltip.css`, `theme.css`(어두운 테마) |

<br>

### 4 작성과 검증

- 번호 문서에는 현재 정한 것만 적는다. 경위와 이전 동작은 DECISIONS에 추가한다.
- 같은 사실은 한 곳에 둔다. 코드 경로는 이 문서에만 둔다.
- 코드와 명세가 다르면 어느 쪽을 고칠지 정한 뒤 같은 작업에서 맞춘다.
- BOJ 쪽 계약이 바뀌면 4-1과 4-4-2를 함께 고친다.
- 유저 스토리 ID는 `BOJP-US-`, 검증 케이스 ID는 `BOJP-QA-` 뒤 세 자리 일련번호다. 쓴 ID는 다시 쓰지 않는다.
- 링크, 앵커, Mermaid 렌더를 검사하고 `git diff --check`를 실행한다.
- 브라우저 확인 절차는 저장소 루트 [AGENTS.md](../../AGENTS.md)의 검증을 따른다.
