# 6 배포

기준: [연동 계약](4-1-CONTRACT.md), [검증](5-1-VERIFICATION.md).

<br>

### 6-1 배포 경로

| 단계 | 내용 |
|---|---|
| 빌드 | 없음<br>확장 소스 폴더가 그대로 배포물 |
| 버전 | `manifest.json`의 `version`<br>스토어에 제출할 때마다 올림 |
| 릴리스 노트 | 버전마다 노트 파일 `v<버전>.md` 하나가 원본<br>release·hotfix 브랜치에서 버전을 올릴 때 함께 씀<br>절은 `### Features`, `### Fixes`, `### Internal`. 절별로 보이는 곳은 아래 표 |
| 패키지 | `main`의 버전 태그 `v<버전>`을 push하면 태그와 `version`이 같은지 확인하고 확장 소스 폴더를 zip 하나로 묶음<br>zip 최상위에 `manifest.json`이 있음<br>zip을 첨부하고 노트 파일을 본문으로 한 GitHub Release를 만듦<br>노트 파일이 없거나 비면 Release를 만들지 않고 실패 |
| 제출 | 같은 zip을 Chrome 웹 스토어, 네이버 웨일 스토어, Firefox Add-ons에 각각 제출<br>스토어별로 `manifest.json`을 고치지 않음 |
| 제출 방법 | Chrome, Firefox: 사람이 버전과 확인 문구를 넣어 시작하는 자동 제출<br>`main`의 최신 커밋이 그 버전 태그일 때만 제출<br>Firefox는 `### Internal` 절을 뺀 노트를 버전 노트(`ko`)로 보냄. 남는 절이 없으면 노트 없이 제출<br>노트 파일이 없으면 업로드 전에 실패<br>웨일: 공개 API가 없어 사람이 GitHub Release의 zip을 올림<br>자동 제출이 실패하면 같은 태그 커밋에서 zip을 만들어 사람이 올림 |
| 반영 | 스토어별 심사 뒤 설치한 사용자에게 업데이트됨 |

| 노트 절 | 내용 | 보이는 곳 |
|---|---|---|
| `### Features` | 사용자에게 보이는 새 기능 | GitHub Release, 랜딩, Firefox 버전 노트 |
| `### Fixes` | 사용자에게 보이는 수정 | GitHub Release, 랜딩, Firefox 버전 노트 |
| `### Internal` | 배포, 테스트, 문서 같은 내부 변경 | GitHub Release에만 |

앞 버전 이후 어느 스토어에 나가지 않은 변경도 다음 버전 노트에 넣는다.

<br>

### 6-2 호환 조건

| 변경 | 조건 |
|---|---|
| `host_permissions`에 새 호스트 추가 | Chrome 정책상 새 권한 경고 대상<br>업데이트 뒤 사용자가 새 권한을 승인할 때까지 확장이 꺼질 수 있음 |
| Firefox 확장 ID | `browser_specific_settings.gecko.id`는 `{e8f7a9c2-4b1d-4f3e-8a5c-9b2d1e0f3a4c}`<br>Firefox Add-ons에 등록된 ID와 같아야 하고 바꾸지 않음 |
| Firefox 최소 버전 | `strict_min_version` `140.0`<br>140 미만 Firefox는 이 버전부터 업데이트를 받지 못함 |
| Firefox 데이터 수집 선언 | `data_collection_permissions.required`는 `none`<br>2-2-6에 따라 다른 서버로 데이터를 보내지 않음 |
| Chrome, Whale의 `browser_specific_settings` | 쓰지 않는 키<br>확장 관리 화면에 경고가 보일 수 있으나 동작에는 영향 없음 |

<br>

### 6-3 배포 전후 확인

| 시점 | 확인 |
|---|---|
| 제출 전 | 압축 해제 확장으로 5-1의 검증 케이스 전체 확인 |
| 반영 후 | 스토어에서 업데이트한 설치본으로 BOJP-QA-001 확인 |
| 태그 push 뒤 | GitHub Release 본문이 노트 파일과 같음<br>랜딩 업데이트 소식에 새 버전이 보임(BOJP-QA-046) |

<br>

### 6-4 되돌리기

되돌릴 때는 이전 버전의 내용을 버전 번호를 올려 다시 제출한다.

<br>

### 6-5 랜딩 페이지

확장 소개와 업데이트 소식을 보이는 정적 페이지다. 확장 밖에 있고 확장은 이 페이지에 요청하지 않는다.

| 항목 | 내용 |
|---|---|
| 주소 | `https://kangkyunghyun.github.io/boj-performance/`<br>manifest `homepage_url`([4-1-6](4-1-CONTRACT.md#4-1-6-외부-링크)) |
| 소스 | 저장소의 랜딩 폴더. 빌드와 외부 라이브러리 없이 그대로 올림 |
| 배포 | GitHub Pages(소스: GitHub Actions)<br>`main` push 가운데 랜딩 폴더나 배포 워크플로가 바뀐 경우와 수동 실행<br>`github-pages` 환경이 `main`만 허용해 다른 브랜치에서는 배포하지 않음 |
| 내용 | 확장 소개와 보이는 곳, 채점 현황 캡처, 스토어 링크 3개, 업데이트 소식, GitHub 저장소와 이슈 링크 |
| 업데이트 소식 | `GET https://api.github.com/repos/kangkyunghyun/boj-performance/releases?per_page=10`에서 draft가 아닌 최근 3개<br>최신 하나만 펼침. 버전 이름과 게시 날짜를 보임<br>본문은 `### Internal` 절을 빼고 제목, 목록, 문단, `` `코드` ``만 글자로 보임. 본문의 HTML은 해석하지 않고 글자 그대로 |
| 캐시 | 받은 3개를 탭의 `sessionStorage`에 두고 같은 탭에서는 다시 요청하지 않음<br>인증 없는 GitHub API 한도가 IP당 시간당 60회 |
| 실패 | 요청 실패, 응답 형식 오류, Release 0개이면 "업데이트 소식을 불러오지 못했습니다" 문구. GitHub 릴리스 페이지 링크는 늘 보임 |
| 색 | 운영체제 색 모드(`prefers-color-scheme`)만 따름. 전환 버튼 없음 |
