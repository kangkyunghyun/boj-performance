---
name: create-branch
description: 이슈 번호로 작업 브랜치를 만들거나 기존 작업 브랜치로 옮길 때 사용한다. "브랜치 만들어줘", "#12 작업 시작", "이슈 12번 브랜치 따줘", "hotfix 브랜치 만들어"처럼 요청할 때 쓴다. git flow의 기준 브랜치와 fetch 규칙이 있으니 추측하지 말고 이 스킬을 따른다. 브랜치 이름 미리보기만 요청하면 Git 상태를 바꾸지 않는다.
---

# 브랜치 생성

## 이름과 기준

| 브랜치 | 이름 | 기준 |
|---|---|---|
| 기능, 문서, 리팩토링, CI | `feature/<이슈번호>-<영어-kebab>` | fetch한 `origin/develop` |
| 배포 준비 | `release/<버전>` | fetch한 `origin/develop` |
| 배포본 긴급 수정 | `hotfix/<버전>` | fetch한 `origin/main` |

- 영어 부분은 이슈 제목을 짧은 소문자 kebab-case로 옮긴다. 예: `feature/12-fix-memory-label`.
- 이슈 번호는 사용자 명시, 대화에서 확정된 번호, 현재 브랜치 이름 순서로 찾는다. 없으면 번호만 묻는다. 번호를 지어내지 않는다.
- `release/*`, `hotfix/*`의 버전은 `src/manifest.json`의 현재 `version` 다음 값이다. 정할 수 없으면 묻는다. 버전 올리기 자체는 create-release에서 한다.

## 작업 흐름

1. `git rev-parse --show-toplevel`, `git status --short --branch`로 레포와 현재 상태를 본다.
2. `gh issue view <번호> --json number,title,state`로 이슈를 확인한다. 닫힌 이슈면 알리고 진행할지 묻는다.
3. 브랜치 이름을 정한다. 미리보기만 요청했으면 여기서 끝낸다.
4. 기준 브랜치만 fetch한다: `git fetch origin refs/heads/<기준>:refs/remotes/origin/<기준>`.
   - fetch가 실패하면 오래된 로컬 `develop`이나 `main`으로 대신 만들지 않는다. 실패를 보고하고 멈춘다.
5. 같은 이름의 로컬 브랜치가 있으면 새로 만들지 않고 `git switch <브랜치>`로 옮긴다. 원격에만 있으면 `git switch --track origin/<브랜치>`.
6. 없으면 `git switch --no-track -c <브랜치> origin/<기준>`으로 만든다. 기준 브랜치를 upstream으로 잡지 않는다.
7. `git branch --show-current`, `git status --short`로 결과를 확인한다.

## 미커밋 변경

- 추적 파일과 미추적 파일의 변경은 그대로 보존한다.
- 변경을 새 브랜치로 가져가겠다는 사용자 의사가 확인된 경우에만 그 상태로 브랜치를 옮긴다. 확인이 없으면 변경 목록을 보여 주고 묻는다.
- `git stash`, `git reset`, `git checkout -- <파일>`, `git clean`으로 변경을 치우지 않는다. 체크아웃 충돌을 강제로 풀지 않는다.

## 완료 보고

브랜치 이름, 실제 기준 ref와 그 커밋, 새로 만들었는지 기존 브랜치로 옮겼는지, 남은 미커밋 변경을 보고한다.
