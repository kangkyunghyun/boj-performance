# DECISIONS

현재 적용 기준은 각 명세에 두고 결정 당시의 내용과 대체 관계는 이 문서에 기록한다.

<br>

### 1 기록 규칙

- 결정 하나를 표 하나로 기록한다. 추가만 하고 지우지 않는다.
- 근거는 커밋이다. 커밋 메시지와 변경 내용에서 확인되지 않는 항목은 행을 두지 않는다.
- 결정이 바뀌면 새 ID로 기록하고 대체 관계를 적는다.

<br>

### 2 결정 기록

<a id="d-001"></a>

**D-001. 특정 문제의 채점 현황에서만 동작**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-01-29 |
| 상태 | 적용됨 |
| 채택 | 주소에 `problem_id`가 있는 채점 현황 페이지에서만 동작한다. |
| 이전 동작 | 페이지 판별 없음 |
| 근거 | [07e5a3d](https://github.com/kangkyunghyun/boj-performance/commit/07e5a3d) |

<br>

<a id="d-002"></a>

**D-002. 내 값을 분포 그래프에 반드시 포함**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-01-30 |
| 상태 | 적용됨 |
| 채택 | 내 값이 표본에 없으면 그 값의 막대를 1건으로 더한다. |
| 이전 동작 | 표본의 값만으로 막대를 만듦 |
| 근거 | [6b4d309](https://github.com/kangkyunghyun/boj-performance/commit/6b4d309) |

<br>

<a id="d-003"></a>

**D-003. 표본 페이지 수를 10으로**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-01-30, 2026-01-31 |
| 상태 | 적용됨 |
| 채택 | 표본은 최대 10페이지까지 읽는다. |
| 이전 동작 | 5페이지에서 6페이지로 바꾼 뒤 10페이지로 바꿈 |
| 근거 | [ac07371](https://github.com/kangkyunghyun/boj-performance/commit/ac07371), [544c8d0](https://github.com/kangkyunghyun/boj-performance/commit/544c8d0) |

<br>

<a id="d-004"></a>

**D-004. 상위 비율을 (작은 수 + 1) ÷ n으로 계산**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-02-01 |
| 상태 | 적용됨 |
| 채택 | 상위 비율은 표본에서 내 값보다 작은 제출 수에 1을 더해 표본 크기로 나눈 백분율이다. |
| 이전 동작 | 내 값보다 큰 제출 수 ÷ n × 100을 구하고 100에서 뺀 값을 상위 비율로 표시 |
| 근거 | [c6fdb90](https://github.com/kangkyunghyun/boj-performance/commit/c6fdb90) |

<br>

<a id="d-005"></a>

**D-005. 다크 모드 판정 순서**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-02-01 |
| 상태 | 적용됨 |
| 채택 | boj-extended의 `boj-extended-theme` 설정을 먼저 보고 설정이 없으면 운영체제 색 모드를 따른다. |
| 이전 동작 | 다크 모드 없음 |
| 근거 | [694c34d](https://github.com/kangkyunghyun/boj-performance/commit/694c34d) |

<br>

<a id="d-006"></a>

**D-006. 상위 비율 상한 100**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-02-02 |
| 상태 | 적용됨 |
| 채택 | 상위 비율이 100을 넘으면 100으로 표시한다. |
| 이전 동작 | 상한 없음 |
| 근거 | [180ba70](https://github.com/kangkyunghyun/boj-performance/commit/180ba70) |

<br>

<a id="d-007"></a>

**D-007. 정답 기록이 없으면 성능 카드를 표시하지 않음**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-02-09 |
| 상태 | 적용됨 |
| 채택 | 내 정답 기록을 먼저 조회하고 없으면 성능 카드를 끼워 넣지 않는다. |
| 이전 동작 | 성능 카드를 먼저 끼워 넣고 "내 기록 조회 중..." 뒤 기록이 없으면 "내 기록 없음"과 전체 분포를 표시 |
| 근거 | [05390e6](https://github.com/kangkyunghyun/boj-performance/commit/05390e6) |

<br>

<a id="d-008"></a>

**D-008. 대회 채점 현황 제외**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-02-16 |
| 상태 | 적용됨 |
| 채택 | 주소에 `contest_id`가 있으면 동작하지 않는다. |
| 이전 동작 | 대회 채점 현황에서도 동작 |
| 근거 | [676af48](https://github.com/kangkyunghyun/boj-performance/commit/676af48) |

<br>

<a id="d-009"></a>

**D-009. BOJ 조회 차단을 요청 헤더 변경으로 우회**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-03-17 |
| 상태 | 적용됨 |
| 배경 | BOJ가 `Sec-Fetch-Mode: cors` 요청에 빈 본문을 준다. |
| 채택 | 선언형 요청 규칙으로 BOJ 채점 현황 요청의 `Sec-Fetch-*` 헤더를 페이지 이동 요청 값으로 바꾼다. |
| 이전 동작 | 요청 헤더를 바꾸지 않음 |
| 근거 | [2c83209](https://github.com/kangkyunghyun/boj-performance/commit/2c83209) |

<br>

<a id="d-010"></a>

**D-010. BOJ 도메인 acmicpc.net 이전 대응**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-11-21 |
| 상태 | 적용됨 |
| 배경 | BOJ가 도메인을 `acmicpc.net`으로 옮기고 `www.acmicpc.net`을 301로 보낸다. |
| 채택 | 확장을 넣는 페이지와 `host_permissions`에 `acmicpc.net`을 더한다.<br>요청 주소를 현재 페이지의 출처로 만든다. |
| 이전 동작 | `www.acmicpc.net`만 등록<br>요청 주소에 `https://www.acmicpc.net`을 고정 |
| 근거 | 작업 트리 변경(커밋 전) |

<br>

<a id="d-011"></a>

**D-011. 이슈와 PR, git flow 사용**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-11-21 |
| 상태 | 채택 |
| 배경 | BOJ 재개로 운영을 다시 시작했고 사용자 제보 경로가 필요하다. |
| 채택 | 이슈와 PR, git flow를 사용한다. |
| 이전 동작 | `main`에 직접 커밋<br>이슈와 PR 미사용(커밋 38개 전부 `main`, 이슈와 PR 0건) |
| 근거 | 사용자 결정(2026-11-21) |

<br>

<a id="d-012"></a>

**D-012. 보안 검사(gitleaks, CodeQL) 도입**

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-11-21 |
| 상태 | 채택 |
| 배경 | 공개 저장소다. manyak-server와 같은 기준으로 검사한다. |
| 채택 | `develop`, `main` 대상 PR과 push에서 gitleaks로 비밀값을 검사한다.<br>CodeQL로 JavaScript와 GitHub Actions를 분석한다. 함께 묶은 Chart.js 번들은 제외한다. |
| 영향 | CodeQL은 보고만 하고 PR을 막지 않는다.<br>gitleaks는 비밀값을 찾으면 실패한다. |
| 근거 | 사용자 결정(2026-11-21) |
