---
name: create-commit
description: 로컬 변경을 이 레포 규칙에 맞게 커밋할 때 사용한다. "커밋해줘", "이거 커밋 남겨", "변경사항 커밋"처럼 요청할 때 쓴다. 실제 diff와 이미 staged된 변경을 검토하고 요청 범위만 커밋한다. 메시지 제안이나 검토만 요청하면 Git 상태를 바꾸지 않는다.
---

# 커밋 생성

## 메시지 규칙

```text
<type>: <한글 설명>

- 필요할 때만 본문 1~3줄

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

| 변경 | type |
|---|---|
| 새 기능 | `feat` |
| 버그 수정 | `fix` |
| 동작을 유지하는 구조 개선 | `refactor` |
| 문서, 스펙 | `docs` |
| 설정, 정리, 버전 올리기 | `chore` |
| GitHub Actions, 템플릿 | `ci` |

- 제목은 변경의 목적과 결과를 짧게 쓰고 마침표를 붙이지 않는다. 예: `fix: 백준 도메인 변경(acmicpc.net) 대응`.
- 사용자가 type을 정했으면 따른다. 아니면 이번 diff 내용으로 고른다. type 선택만으로 질문하지 않는다.
- 마지막 줄 `Co-Authored-By`는 에이전트가 커밋할 때 붙인다. 위에 빈 줄 하나를 둔다.

## 작업 흐름

1. `git status --short --branch`로 현재 브랜치를 본다. `main`, `develop`에 바로 커밋하지 않는다. 그 브랜치라면 멈추고 create-branch를 안내한다.
2. 변경 내용 자체를 읽는다. `git diff`, `git diff --cached`를 모두 보고 새 파일은 직접 연다. 통계만 보고 메시지를 쓰지 않는다.
3. 이미 staged된 변경도 커밋에 들어간다. 요청 범위 밖의 staged 변경이 있으면 임의로 unstage하지 말고 묻는다.
4. 필요한 검증을 한다. 동작이 바뀌면 `docs/spec/5-1-VERIFICATION.md`의 해당 케이스, 문서만 바뀌면 링크와 앵커 검사. 이미 같은 변경으로 통과한 검증은 다시 하지 않는다. 실패나 미실행이 있으면 커밋을 보류하고 보고한다.
5. 검토한 파일만 `git add -- <경로...>`로 stage한다. `git add .`, `git add -A`, `git commit -a`를 쓰지 않는다. `.work/`, zip, 캡처 파일은 stage하지 않는다.
6. `git diff --cached`와 `git diff --cached --check`로 staged 전체를 다시 본다. staged diff가 없으면 커밋하지 않는다.
7. 메시지를 임시 파일에 실제 줄바꿈으로 쓰고 `git commit --file <메시지 파일>`로 커밋한다. 본문 줄마다 `-m`을 쓰지 않는다.
8. `git show --stat --format=fuller HEAD`와 `git status --short`로 포함 내용과 남은 변경을 확인한다.

## 금지

- 요청 없이 amend, push, 훅 우회(`--no-verify`)를 하지 않는다.
- 변경을 치우려고 reset, checkout 복원, clean, stash, 파일 삭제를 하지 않는다.
- feature 브랜치에서 `src/manifest.json`의 `version`을 바꾼 커밋을 만들지 않는다. 버전은 release·hotfix에서만 올린다.

## 완료 보고

커밋 해시와 메시지, 포함한 파일, 검증 결과와 예외, 남은 staged·unstaged·미추적 변경을 보고한다.
