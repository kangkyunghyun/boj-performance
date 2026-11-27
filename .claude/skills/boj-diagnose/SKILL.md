---
name: boj-diagnose
description: BOJ Performance 확장이 "작동 안 함", "그래프가 안 뜸", "데이터 부족"으로 보일 때 BOJ 쪽 변경(도메인·차단·DOM)을 순서대로 진단한다. 트리거 - "확장 안 돼", "그래프 안 나와", "백준 바뀐 것 같아", "작동 확인해봐".
---

# BOJ 변경 진단

확장 코드보다 BOJ 쪽 변경이 원인인 경우가 대부분이다. 아래 순서대로 확인하고, 처음 깨진 지점을 고친다. 의존점 목록은 `docs/spec/4-1-CONTRACT.md`, 깨졌을 때의 증상은 `docs/spec/4-4-EXECUTION.md`의 4-4-2.

## 1. 도메인·리다이렉트

```bash
curl -sS -o /dev/null -D - 'https://acmicpc.net/status?problem_id=1000' | grep -iE '^(HTTP|location)'
curl -sS -o /dev/null -D - 'https://www.acmicpc.net/status?problem_id=1000' | grep -iE '^(HTTP|location)'
```

최종 도착 호스트가 `manifest.json`의 `matches`·`host_permissions`에 없으면 content script가 주입되지 않는다(증상: 카드 자체가 안 보임).

## 2. 페이지 안 조회(cors)가 막혔는지

```bash
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36'
U='https://acmicpc.net/status?problem_id=1000&result_id=4'
curl -s -A "$UA" -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Site: same-origin' "$U" | wc -c
curl -s -A "$UA" -H 'Sec-Fetch-Mode: navigate' -H 'Sec-Fetch-Dest: document' -H 'Sec-Fetch-Site: same-origin' -H 'Sec-Fetch-User: ?1' "$U" | wc -c
```

- 둘 다 수만 바이트 → 정상. 확장은 요청 헤더를 바꾸지 않는다(D-023).
- cors 0바이트, navigate 수만 바이트 → BOJ가 페이지 안 조회를 다시 막았다. D-009의 `rules.json` 규칙을 되돌릴지 사용자와 정한다.
- navigate도 0바이트·에러 → 차단 방식이 바뀌었다. 응답 헤더와 본문을 보고 원인을 찾는다.

## 3. DOM 구조

2번의 navigate 응답을 파일로 저장해 확인한다.

```bash
curl -s -A "$UA" -H 'Sec-Fetch-Mode: navigate' -H 'Sec-Fetch-Dest: document' -H 'Sec-Fetch-Site: same-origin' -H 'Sec-Fetch-User: ?1' "$U" -o /tmp/boj-status.html
for s in 'id="status-table"' 'table-responsive' 'id="next_page"' 'name="language_id"'; do printf '%-22s %s\n' "$s" "$(grep -c "$s" /tmp/boj-status.html)"; done
```

모두 1 이상이어야 한다. `#status-table` 헤더 순서가 `제출 번호, 아이디, 문제, 결과, 메모리, 시간, ...`인지 확인한다. 메모리·시간 열 위치가 바뀌면 `api.js`의 `cols[4]`, `cols[5]`를 고친다.

## 4. 로그인 상태 DOM (Aside)

`.loginbar .username`은 로그인해야 보이므로 Aside u1(BOJ 로그인됨)으로 확인한다. 먼저 `aside guide repl`을 읽는다.

```bash
aside repl --account u1 'await openTab("https://acmicpc.net/status?problem_id=1000"); console.log(page.url(), await page.evaluate(() => document.querySelector(".loginbar .username")?.innerText)); await closeTab(page);'
```

`null`이면 로그아웃 상태이거나 셀렉터가 바뀐 것이다. `.loginbar` outerHTML을 출력해 구분한다.

페이지 컨텍스트에서 `fetch("/status?...")`를 직접 호출하면 확장의 조회와 같은 요청이 된다. 결과 표 행이 0개면 2번의 cors 차단을 의심한다.

## 5. 수정 후

`AGENTS.md`의 "검증" 절차로 실제 확장을 로드해 확인한다. 같은 탭에 저장한 표본이 차단·DOM 변경 증상을 가릴 수 있으니 새 탭에서 확인한다(`docs/spec/4-4-EXECUTION.md`의 4-4-2). 바뀐 의존점이 있으면 `docs/spec/4-1-CONTRACT.md`와 4-4-2도 같이 갱신한다.
