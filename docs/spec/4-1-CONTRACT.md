# 4-1 연동 계약

기준: [요구사항](2-2-REQUIREMENTS.md), [화면 흐름](3-2-INTERACTION-FLOWS.md).

<br>

### 4-1-1 BOJ 경계

BOJ는 공개 API를 제공하지 않는다. BOJ Performance는 채점 현황 페이지의 HTML을 읽는다.

| 용도 | 출처 | 사용 |
|---|---|---|
| 문제와 언어 | 현재 페이지 주소의 `problem_id`, `language_id` | 요청 쿼리에 그대로 붙임<br>`language_id`가 비어 있으면 붙이지 않음 |
| 대회 판별 | 현재 페이지 주소의 `contest_id` | 값이 있으면 대회 채점 현황 |
| 로그인 아이디 | 현재 페이지의 `.loginbar .username` 글자 | 앞뒤 공백 제거<br>요소가 없으면 로그인하지 않은 것으로 봄 |
| 언어 이름 | 현재 페이지의 `select[name="language_id"]`에서 값이 `language_id`와 같은 `option`의 글자 | 앞뒤 공백 제거<br>`language_id`가 빈 값이나 `-1`이면 이름 없음 |
| 끼워 넣을 자리 | 현재 페이지의 `.table-responsive` | 이 요소 바로 앞에 성능 카드 묶음을 넣음<br>요소가 없으면 넣지 않음 |
| 내 기록 | `GET {출처}/status?problem_id={문제}&user_id={로그인 아이디}&result_id=4&language_id={언어}` | 첫 페이지만 읽음 |
| 표본 | `GET {출처}/status?problem_id={문제}&result_id=4&language_id={언어}` | 첫 페이지부터 다음 페이지 링크를 따라 읽음 |

`{출처}`는 현재 페이지의 스킴과 호스트다. 요청 주소에 도메인을 고정하지 않는다. `result_id=4`는 "맞았습니다!!" 결과다.

<br>

### 4-1-2 도메인과 권한

| 항목 | 값 |
|---|---|
| BOJ 도메인 | `acmicpc.net` |
| `www` 호스트 | `www.acmicpc.net`<br>BOJ가 301 응답으로 `acmicpc.net`에 보냄 |
| 확장을 넣는 페이지 | `https://acmicpc.net/status*`<br>`https://www.acmicpc.net/status*` |
| `host_permissions` | `https://acmicpc.net/*`<br>`https://www.acmicpc.net/*` |
| `permissions` | `declarativeNetRequest` |

요청 헤더 변경은 요청 호스트가 `host_permissions`에 있어야 적용된다.

<br>

### 4-1-3 요청 헤더

BOJ는 `Sec-Fetch-Mode: cors` 요청에 상태 200과 빈 본문을 준다. `Sec-Fetch-Mode: navigate` 요청에는 정상 HTML을 준다. 페이지 안에서 보내는 조회는 브라우저가 `cors`로 표시하므로 확장의 선언형 요청 규칙이 헤더를 바꾼다.

| 항목 | 값 |
|---|---|
| 적용 주소 | `||acmicpc.net/status`<br>`acmicpc.net`과 하위 도메인의 `/status`로 시작하는 주소 |
| 적용 요청 종류 | `xmlhttprequest`, `sub_frame` |
| `Sec-Fetch-Mode` | `navigate` |
| `Sec-Fetch-Dest` | `document` |
| `Sec-Fetch-Site` | `same-origin` |
| `Sec-Fetch-User` | `?1` |

<br>

### 4-1-4 결과 표 읽기

행은 `#status-table tbody tr`이다. 셀은 행의 `td`를 순서대로 센다.

| 순서 | 머리글 | 사용 |
|---|---|---|
| 0 | 제출 번호 | 없음 |
| 1 | 아이디 | 없음 |
| 2 | 문제 | 없음 |
| 3 | 결과 | 없음 |
| 4 | 메모리 | 셀 글자 앞부분의 정수를 KB 값으로 씀 |
| 5 | 시간 | 셀 글자 앞부분의 정수를 ms 값으로 씀 |
| 6 | 채점 서버 | 클래스 `judge-platform` 셀의 글자를 앞뒤 공백을 지우고 채점 서버 값으로 씀 |
| 7 | 언어 | 없음 |
| 8 | 코드 길이 | 없음 |
| 9 | 제출한 시간 | 없음 |

| 조건 | 처리 |
|---|---|
| 내 기록 요청의 행 | 셀이 7개 이상인 행만 읽음 |
| 표본 요청의 행 | 셀이 6개 이상인 행만 읽음 |
| 메모리나 시간이 정수로 시작하지 않음 | 그 행을 건너뜀 |
| 내 기록 요청에서 처음 읽은 행 | 그 행의 채점 서버를 기준 채점 서버로 씀<br>결과 표는 최신 제출이 위 |
| `judge-platform` 셀이 없거나 비어 있음 | 채점 서버 값 없음 |
| 다음 페이지 | `#next_page`의 `href`<br>`http`로 시작하지 않으면 앞에 `{출처}`를 붙임<br>요소가 없으면 마지막 페이지 |

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
