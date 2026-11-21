---
name: create-pr
description: 현재 브랜치로 Draft PR을 만들거나 기존 PR을 갱신할 때, 그리고 머지 뒤 로컬 브랜치를 정리할 때 사용한다. "PR 올려줘", "Draft PR 만들어", "PR 본문 갱신", "머지했어 브랜치 정리해줘"처럼 요청할 때 쓴다. base 규칙, 중복 PR 방지, 검증 체크 규칙, squash 머지 뒤 삭제 방법이 비자명하니 이 스킬을 따른다. PR 조회나 본문 초안만 요청하면 원격 상태를 바꾸지 않는다.
---

# Draft PR 생성과 머지 뒤 정리

## 제목, base, 병합 방식

| head | base | 병합 방식 |
|---|---|---|
| `feature/*` | `develop` | squash |
| `release/*` | `main` | merge commit |
| `hotfix/*` | `main` | merge commit |
| `main`(release·hotfix 병합 뒤 되합치기) | `develop` | merge commit |

- 제목은 `<type>: <한글 설명> (#이슈번호)`. type은 create-commit의 표와 같다. 예: `fix: 백준 도메인 변경(acmicpc.net) 대응 (#12)`.
- 이슈 번호는 브랜치 이름에서 읽는다. release·hotfix처럼 이름에 번호가 없으면 대화에서 확정된 번호를 쓰고, 없으면 묻는다.
- release·hotfix PR과 되합치기 PR은 create-release 절차 안에서 만든다.
- PR 생성 요청은 head 브랜치 push와 Draft PR 생성까지다. ready 전환, 머지, 태그는 포함하지 않는다.

## 본문

`.github/pull_request_template.md`를 읽고 절 구조를 유지해 채운다.

- 요약과 변경 사항은 최종 diff를 기준으로 쓴다. 파일 이름 나열이나 대화 이력으로 채우지 않는다.
- 관련 이슈에 `Close #<번호>`를 넣는다. 되합치기 PR처럼 닫을 이슈가 없으면 그 줄을 지운다.
- 스펙 반영에는 바꾼 `docs/spec` 절과 DECISIONS ID를, 없으면 "없음"을 쓴다.
- 검증에는 실행한 `BOJP-QA-` ID와 브라우저만 체크한다. 실행하지 않은 케이스는 체크하지 않고 이유를 적는다.
- 스토어 영향에는 manifest 권한과 버전 변경을, 없으면 "없음"을 쓴다.
- 화면이 바뀌면 기존 화면은 Before/After, 새 화면은 결과를 캡처해 PR에 첨부한다. 캡처 파일은 레포에 커밋하지 않는다. 첨부할 수 없으면 파일 위치와 이유를 본문에 적는다.

## 작업 흐름

1. `git status --short --branch`, `gh auth status`, `gh repo view --json nameWithOwner`로 상태를 본다.
2. 열린 PR을 조회한다: `gh pr list --state open --head <head> --json number,url,title,isDraft,baseRefName`. 조회 실패를 PR 없음으로 보지 않는다. 이미 있으면 새로 만들지 않고 그 PR을 갱신한다. 기존 본문의 사용자 추가 내용은 지우지 않는다.
3. base를 fetch하고 실제 변경을 읽는다: `git fetch origin refs/heads/<base>:refs/remotes/origin/<base>`, `git log --oneline origin/<base>..HEAD`, `git diff origin/<base>...HEAD`. 커밋이나 diff가 없으면 PR을 만들지 않는다.
4. 미커밋 변경이 PR에 필요하면 create-commit으로 먼저 커밋한다. 범위 밖 변경은 그대로 둔다.
5. 본문을 임시 파일에 쓴다.
6. `git push -u origin HEAD:refs/heads/<head>`로 push한다. 요청 없이 force push하지 않는다.
7. 새 PR은 `gh pr create --draft --base <base> --head <head> --title "<제목>" --body-file <본문 파일>`, 기존 PR은 `gh pr edit <번호> --title ... --body-file ...`. 응답이 불확실하면 다시 만들기 전에 PR 목록을 재조회한다.
8. `gh pr view <번호> --json url,title,baseRefName,headRefName,isDraft`로 결과를 확인한다.

## 머지 뒤 정리

사용자가 머지했다고 해도 직접 확인한다.

1. `gh pr view <번호> --json state,mergedAt,headRefName,baseRefName`로 `MERGED`인지 본다. 열려 있으면 삭제하지 않고 알린다.
2. 지울 브랜치에 있다면 base로 옮긴다: `git fetch origin` 뒤 `git switch <base>`, `git merge --ff-only origin/<base>`. 미커밋 변경이 있으면 옮기지 말고 묻는다.
3. `git branch -D <head>`로 지운다. feature PR은 squash 머지라 head의 커밋이 base의 조상이 아니어서 `git branch -d`가 "not fully merged"로 거부한다. 그래서 1번에서 `MERGED`를 확인한 뒤에만 `-D`를 쓴다.
4. `git fetch --prune origin`으로 지워진 원격 추적 참조를 정리한다.

## 금지

- `main`, `develop`을 head로 새 작업 PR을 만들지 않는다. 되합치기 PR은 예외다.
- 실행하지 않은 검증을 체크하거나 통과했다고 쓰지 않는다.
- `MERGED`를 확인하지 않고 `git branch -D`를 쓰지 않는다.
- 사용자 지시 없이 ready 전환, 머지, 원격 브랜치 삭제를 하지 않는다.

## 완료 보고

PR URL, 제목, base와 head, 새로 만들었는지 갱신했는지, 체크한 검증, 첨부 여부, 남은 로컬 변경을 보고한다. 정리를 했으면 지운 브랜치와 남은 브랜치를 보고한다.
