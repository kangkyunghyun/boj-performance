---
name: create-release
description: 새 버전을 스토어에 내거나 배포본을 긴급 수정할 때 사용한다. "릴리스 해줘", "1.0.5 배포 준비", "hotfix 내야 해", "버전 올리고 태그 달아", "스토어에 게시해"처럼 요청할 때 쓴다. release·hotfix 브랜치, 버전 올리기, main 병합 뒤 태그와 develop 되합치기, 자동 Release와 스토어 게시 워크플로 순서가 정해져 있으니 이 스킬을 따른다.
---

# 릴리스와 핫픽스

## 순서

| 순서 | 단계 | 할 일 |
|---|---|---|
| 1 | 브랜치 | create-branch로 `release/<버전>`(`origin/develop` 기준) 또는 `hotfix/<버전>`(`origin/main` 기준) |
| 2 | 버전 | `src/manifest.json`의 `version`을 `<버전>`으로 올림. hotfix는 수정 커밋도 이 브랜치에 둠 |
| 3 | 노트 | `docs/releases/v<버전>.md`를 씀. 형식은 `docs/releases/README.md`. 앞 태그 이후 `git log`와 병합된 PR을 보고 사용자 문구로 쓰며 PR 제목을 옮기지 않음 |
| 4 | 문구 | release-copy로 `docs/copy/`의 스토어 설명 업데이트 섹션과 홍보글을 갱신 |
| 5 | 커밋 | create-commit. 버전, 노트, 문구를 한 커밋 `chore: <버전> 버전 올림과 릴리스 노트` |
| 6 | PR | create-pr로 base `main` Draft PR. 제목 `chore: <버전> 릴리스 (#이슈번호)`, hotfix는 `fix: ... (#이슈번호)` |
| 7 | 병합 | 사용자 지시 뒤 merge commit으로 `main`에 병합 |
| 8 | 태그 | `main`의 병합 커밋에 `v<버전>` 태그를 달고 push |
| 9 | 되합치기 | head `main`, base `develop` PR을 만들고 사용자 지시 뒤 merge commit으로 병합 |
| 10 | 패키지 | 태그 push로 `release.yml`이 zip과 노트 파일 본문의 GitHub Release를 만든다. 실행 결과, Release의 zip 첨부와 본문, `pages.yml` 랜딩 배포를 확인 |
| 11 | 스토어 | 사용자 지시 뒤 `main`에서 `publish-chrome.yml`, `publish-firefox.yml`을 실행. 웨일은 Release의 zip을 사람이 올림. 설명란은 `docs/copy/1-1-STORE-LISTING.md`를 사람이 붙여 넣음. 입력, Secrets, 스토어 링크는 루트 `AGENTS.md`의 릴리스 절 |

## 단계별 규칙

- 버전은 `src/manifest.json`의 현재 값보다 커야 한다. 스토어는 같은 버전이나 낮은 버전을 다시 받지 않는다.
- 이전 버전으로 되돌릴 때도 이전 내용을 hotfix로 만들고 버전을 올려 다시 낸다.
- PR 본문의 스토어 영향에 버전 변경과 manifest 권한 변경을 적는다. `host_permissions`에 새 호스트가 생기면 "Chrome 정책상 새 권한 경고 대상. 업데이트 뒤 사용자가 승인할 때까지 확장이 꺼질 수 있음"을 함께 적는다.
- 태그는 병합된 `main` 커밋을 확인한 뒤 단다.

```bash
git fetch origin refs/heads/main:refs/remotes/origin/main --tags
git log --oneline -1 origin/main          # 병합 커밋인지 확인
git tag -a v<버전> origin/main -m "v<버전>"
git push origin v<버전>
```

- 노트 파일이 없으면 `release.yml`이 Release를 만들지 않고 실패하고, `publish-firefox.yml`도 업로드 전에 실패한다. 태그를 옮기지 말고 노트를 `main`에 넣는 hotfix로 버전을 올려 다시 낸다.
- 태그 push 뒤 `gh run list --workflow release.yml --limit 1`, `gh release view v<버전> --json assets,body`로 Release와 `boj-performance-v<버전>.zip`, 본문을 확인한다.
- 게시 워크플로는 `main` 최신 커밋이 태그 `v<버전>`일 때만 통과한다. 되합치기는 `develop`만 바꾸므로 영향이 없다.

```bash
gh workflow run publish-chrome.yml --ref main -f version=<버전> -f confirm_publish=publish-chrome
gh workflow run publish-firefox.yml --ref main -f version=<버전> -f confirm_publish=publish-firefox
gh run list --workflow publish-chrome.yml --limit 1
```

### 자동화가 실패했을 때

- zip은 태그 커밋의 `src/`로 만든다. 작업 트리에 미커밋 변경이 있으면 섞이지 않게 임시 worktree에서 만든다. zip 최상위에 `manifest.json`이 있어야 하고 `.`으로 시작하는 파일은 뺀다. zip은 커밋하지 않는다.

```bash
git worktree add --detach /tmp/boj-performance-v<버전> v<버전>
(cd /tmp/boj-performance-v<버전>/src && zip -r "$OLDPWD/boj-performance-<버전>.zip" . -x '.*')
git worktree remove /tmp/boj-performance-v<버전>
unzip -l boj-performance-<버전>.zip | grep -E ' manifest.json$'
```

## 금지

- 병합, 태그, push, 되합치기는 사용자 지시가 있을 때만 한다. 이 스킬 호출만으로 승인된 것으로 보지 않는다.
- feature 브랜치에서 버전을 올리지 않는다.
- 태그를 `main` 밖의 커밋에 달거나, 이미 push한 태그를 옮기지 않는다.
- 게시 워크플로는 사용자 지시가 있을 때만 실행한다. 게시 요청 성공을 스토어 공개로 보고하지 않는다. 공개는 스토어 심사 뒤다.
- 웨일 업로드를 했다고 보고하지 않는다. 사람이 한다.

## 완료 보고

버전, 브랜치, PR URL과 상태, 태그와 그 커밋, 되합치기 PR 상태, Release와 zip 확인 결과, 실행한 게시 워크플로와 결과, 남은 사람 작업(웨일 업로드, 스토어 심사 확인)을 보고한다.
