---
name: request-codex-review
description: 현재 브랜치의 변경을 로컬 Codex CLI로 리뷰받고 지적을 판단할 때 사용한다. "코덱스 리뷰 받아줘", "codex review 돌려", "PR 올리기 전에 리뷰해봐", "리뷰 반영하고 다시 받아줘"처럼 요청할 때 쓴다. 이 레포는 GitHub의 `@codex review` 봇을 쓰지 않고 로컬 CLI로만 리뷰하므로 이 스킬을 따른다.
---

# Codex 리뷰 요청

## 비자명한 규칙

- 리뷰는 로컬 Codex CLI로만 한다. GitHub `@codex review` 코멘트 봇은 이 레포에 설치됐는지 확인되지 않아 쓰지 않는다. PR에 `@codex review` 코멘트를 달지 않는다.
- 리뷰 대상은 base 대비 현재 브랜치의 커밋이다. 미커밋 변경은 리뷰에 들어가지 않을 수 있으니 리뷰 전에 커밋했는지 확인한다.
- base는 create-pr의 표를 따른다. feature는 `develop`, release·hotfix는 `main`.

## 작업 흐름

1. `git status --short --branch`로 현재 브랜치와 미커밋 변경을 본다. 미커밋 변경이 있으면 리뷰 범위에 들어가지 않는다고 알리고 계속할지 묻는다.
2. base를 fetch한다: `git fetch origin refs/heads/<base>:refs/remotes/origin/<base>`.
3. 레포 루트에서 실행한다. 표준 입력을 닫아 대화형 대기를 막는다.

```bash
codex review --base origin/<base> -c model="gpt-6-luna" -c model_reasoning_effort="high" -c service_tier="default" < /dev/null
```

4. 출력의 지적을 하나씩 코드와 스펙에 대조해 나눈다.

| 분류 | 기준 | 처리 |
|---|---|---|
| 메이저 | 동작 오류, BOJ 요청 수 상한 초과, 보안(`innerHTML`에 외부 입력), 스펙과 다른 동작 | 반영 |
| 마이너 | 이름, 표현, 취향, 선택적 개선 | 보류 가능. 목록으로 보고 |
| 애매함 | 메이저인지 판단이 갈림, 스펙 변경이 필요함 | 고치지 말고 사용자 판단을 받음 |

5. 반영했으면 create-commit으로 커밋하고 3번을 다시 실행한다. 새 지적이 메이저 없이 끝날 때까지 반복하되, 같은 지적이 반복되면 멈추고 보고한다.

## 금지

- 리뷰가 끝나지 않았거나 실패했는데 "리뷰 통과"라고 보고하지 않는다.
- 메이저 지적을 사용자 확인 없이 무시하지 않는다.
- 애매한 제안을 사용자 확인 없이 반영하지 않는다.
- 리뷰 결과만으로 머지하지 않는다.

## 완료 보고

실행한 명령의 base, 리뷰 회차, 메이저와 마이너 지적 요약, 반영한 것과 보류한 것, 마지막 리뷰 결과를 보고한다. CLI 실패나 시간 초과가 있으면 그대로 보고한다.
