# 4-1 연동 계약

기준: [요구사항](2-2-REQUIREMENTS.md), [화면 흐름](3-2-INTERACTION-FLOWS.md).

<br>

### 4-1-1 BOJ 경계

BOJ는 공개 API를 제공하지 않는다. BOJ Performance는 채점 현황 페이지의 HTML을 읽는다.

| 용도 | 출처 | 사용 |
|---|---|---|
| 문제와 언어 필터 | 현재 페이지 주소의 `problem_id`, `language_id` | `problem_id`는 요청 쿼리에 그대로 붙임<br>`language_id`가 없거나 `-1`이면 언어 필터 없음 |
| 대회 판별 | 현재 페이지 주소의 `contest_id` | 값이 있으면 대회 채점 현황 |
| 로그인 아이디 | 현재 페이지의 `.loginbar .username` 글자 | 앞뒤 공백 제거<br>요소가 없으면 로그인하지 않은 것으로 봄 |
| 언어 이름 | 현재 페이지의 `select[name="language_id"]`에서 값이 `language_id`와 같은 `option`의 글자 | 앞뒤 공백 제거<br>언어 필터가 있을 때 비교 언어 이름<br>`option`이 없으면 내 기록 요청 첫 행의 언어 셀 글자 |
| 언어 필터 값 | 현재 페이지의 `select[name="language_id"]`에서 앞뒤 공백을 뺀 글자가 언어 셀 글자와 같은 첫 `option`의 값 | 언어 필터가 없을 때 비교 언어와 다른 언어 링크의 `language_id`<br>없으면 대응 실패 |
| 끼워 넣을 자리 | 현재 페이지의 `.table-responsive` | 이 요소 바로 앞에 성능 카드 묶음을 넣음<br>요소가 없으면 넣지 않음 |
| 내 기록 | `GET {출처}/status?problem_id={문제}&user_id={로그인 아이디}&result_id=4&language_id={언어 필터}` | 첫 페이지만 읽음<br>언어 필터가 없으면 `language_id`를 붙이지 않음 |
| 표본 | `GET {출처}/status?problem_id={문제}&result_id=4&language_id={비교 언어}` | 첫 페이지부터 다음 페이지 링크를 따라 읽음<br>모든 언어로 비교하면 `language_id`를 붙이지 않음 |
| 다른 언어 링크 | 현재 페이지 주소에서 `language_id`를 그 언어의 필터 값으로 바꾸고 `top`을 뺀 주소 | `top`은 결과 표 페이지 위치. `#next_page`의 `href`에 붙는 쿼리 |

`{출처}`는 현재 페이지의 스킴과 호스트다. 요청 주소에 도메인을 고정하지 않는다. `result_id=4`는 "맞았습니다!!" 결과다.

<br>

### 4-1-2 도메인과 권한

| 항목 | 값 |
|---|---|
| BOJ 도메인 | `acmicpc.net` |
| `www` 호스트 | `www.acmicpc.net`<br>BOJ가 301 응답으로 `acmicpc.net`에 보냄 |
| 확장을 넣는 페이지 | `https://acmicpc.net/status*`<br>`https://www.acmicpc.net/status*` |
| `host_permissions` | `https://acmicpc.net/*`<br>`https://www.acmicpc.net/*` |
| `permissions` | 없음 |

<br>

### 4-1-3 요청 헤더

확장은 요청 헤더를 바꾸지 않는다. 페이지 안에서 보내는 조회는 브라우저가 `Sec-Fetch-Mode: cors`로 표시하고, BOJ는 이 요청에 결과 표가 든 HTML을 준다.

BOJ가 `cors` 요청에 상태 200과 빈 본문을 주던 시기에는 선언형 요청 규칙으로 헤더를 페이지 이동 요청 값으로 바꿨다([D-009](DECISIONS.md#d-009)). 재오픈 뒤 이 차단이 없어져 규칙을 지웠다([D-023](DECISIONS.md#d-023)).

<br>

### 4-1-4 결과 표 읽기

행은 `#status-table tbody tr`이다. 셀은 행의 `td`를 순서대로 센다.

| 순서 | 머리글 | 사용 |
|---|---|---|
| 0 | 제출 번호 | 표본 요청에서만 셀 글자 앞부분의 정수를 제출 번호로 씀<br>새 정답 제출을 가리는 기준 |
| 1 | 아이디 | 없음 |
| 2 | 문제 | 없음 |
| 3 | 결과 | 없음 |
| 4 | 메모리 | 셀 글자 앞부분의 정수를 KB 값으로 씀 |
| 5 | 시간 | 셀 글자 앞부분의 정수를 ms 값으로 씀 |
| 6 | 채점 서버 | 없음 |
| 7 | 언어 | 내 기록 요청에서만 셀 글자의 첫 `/` 앞부분, 앞뒤 공백 제거 |
| 8 | 코드 길이 | 없음 |
| 9 | 제출한 시간 | 없음 |

| 조건 | 처리 |
|---|---|
| 내 기록 요청의 행 | 셀이 8개 이상인 행만 읽음 |
| 표본 요청의 행 | 셀이 6개 이상인 행만 읽음 |
| 메모리나 시간이 정수로 시작하지 않음<br>표본 요청에서는 제출 번호도 | 그 행을 건너뜀 |
| 다음 페이지 | `#next_page`의 `href`<br>`http`로 시작하지 않으면 앞에 `{출처}`를 붙임<br>요소가 없으면 마지막 페이지 |

언어 셀과 언어 필터의 대응은 2026-11-22에 실측했다.

| 항목 | 예 |
|---|---|
| 내 제출의 언어 셀 | `<a href="/source/105219024">C++17</a>&nbsp;/&nbsp;<a href="/submit/34558/105219024">수정</a>`<br>셀 글자 `C++17 / 수정`, 언어 `C++17` |
| `option` | `<option value="84">C++17</option>`, `<option value="28">Python 3</option>` |
| `select`의 구성 | `모든 언어`(`-1`), 언어 그룹(`C++` `1001` 등 5개), 언어(`C++17` `84` 등 11개)<br>BOJ의 모든 언어가 들어 있지 않음. 예: `C++20`은 없어 대응 실패 |

<br>

### 4-1-5 boj-extended 테마 설정

| 항목 | 값 |
|---|---|
| 저장 위치 | 현재 페이지 출처의 `localStorage` |
| 키 | `boj-extended-theme` |
| 어두운 테마 | `dark` |
| 밝은 테마 | `light` |
| 설정 없음 | 키가 없거나 다른 값 |
| 설정 없음일 때 쓰는 값 | 브라우저의 `prefers-color-scheme: dark` 일치 여부 |

BOJ Performance는 이 키를 읽기만 한다.

<br>

### 4-1-6 외부 링크

| 항목 | 값 |
|---|---|
| manifest `homepage_url` | `https://kangkyunghyun.github.io/boj-performance/`<br>랜딩 페이지([6-5](6-DEPLOYMENT.md#6-5-랜딩-페이지)) |
| 보이는 곳 | 브라우저의 확장 관리 화면, 스토어의 홈페이지 링크 |
| 요청 | 확장은 이 주소에 요청하지 않음. 사용자가 링크를 눌렀을 때만 열림 |
