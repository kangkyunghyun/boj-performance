# 1-2. 커뮤니티 홍보글

BOJ 게시판의 홍보 게시판과 PS 마이너 갤러리에 올리는 글 원본이다. 2026-11-25에 올린 글이 기준이다. BOJ 게시판은 [166535](https://www.acmicpc.net/board/view/166535), PS 갤러리는 [58048](https://gall.dcinside.com/mgallery/board/view/?id=ps&no=58048)이다.
스토어 설명은 [1-1-1](1-1-STORE-LISTING.md#1-1-1-한국어)이 맡고, 변경 이력은 [랜딩의 업데이트 소식](https://kangkyunghyun.github.io/boj-performance/)이 맡는다. 여기서 반복하지 않는다.

## 1-2-1 BOJ 홍보 게시판

카테고리는 홍보다.

제목:

```text
채점 현황에서 내 코드가 상위 몇 %인지 보여주는 확장 프로그램입니다
```

본문:

```text
화면 미리보기: 밝은 테마 · 어두운 테마

LeetCode처럼 내 코드가 다른 제출 사이 어디쯤인지 보여주는 확장 프로그램입니다.
맞은 문제의 채점 현황에 들어가면 실행 시간과 메모리 분포 그래프에 내 기록이 상위 몇 %인지 표시됩니다.
같은 언어로 맞은 제출끼리 비교합니다.

올해 1월에 만들어서 몇 분이 잘 써 주셨는데, 백준이 문을 닫으면서 같이 손을 놓았습니다.
백준이 다시 열려서 지금 BOJ에 맞게 고치고, 그때 받은 의견대로 그래프 x축을 일정한 구간으로 묶어 보여주도록 바꿨습니다.

Chrome: https://chromewebstore.google.com/detail/boj-performance/bklabnmnfggmenngdnlndikconflcbij
Whale: https://store.whale.naver.com/detail/clhhbjiamhmgpehbmmacbppbiiijccpd
Firefox: https://addons.mozilla.org/ko/firefox/addon/boj-performance

PC 브라우저에서만 동작하고, 백준 말고 다른 서버로는 아무것도 보내지 않습니다.
문제가 있으면 댓글로 알려 주세요.

유용하셨다면 GitHub Star 부탁드립니다. 스타는 개발자를 춤추게 합니다.
https://github.com/kangkyunghyun/boj-performance
```

링크는 HTML 모드로 건다.

| 글자 | 링크 |
|---|---|
| 밝은 테마 | `https://kangkyunghyun.github.io/boj-performance/assets/screenshot.png` |
| 어두운 테마 | `https://raw.githubusercontent.com/kangkyunghyun/boj-performance/develop/docs/screenshot-theme-dark.png` |
| 그때 받은 의견 | 지난 글 `https://www.acmicpc.net/board/view/165011` |

사진 대신 링크를 쓰는 이유: 2026-11 기준 BOJ 게시판은 본문에 `<img>`가 있으면 글쓰기 요청을 403으로 막고, 에디터 업로드도 동작하지 않는다. 사진이 들어가게 되면 "화면 미리보기" 줄을 지우고 맨 위에 사진 두 장을 넣는다.

## 1-2-2 PS 마이너 갤러리

고정닉으로 쓰고 말머리는 `일반`이다.

제목:

```text
(홍보) 채점 현황에서 내 코드가 상위 몇 %인지 보여주는 확장 프로그램입니다
```

본문은 1-2-1에서 "화면 미리보기" 줄을 빼고, 맨 위에 밝은 테마와 어두운 테마 사진 두 장을 디시 이미지 업로드로 넣는다. 나머지 문장과 링크는 같다.

## 1-2-3 갱신 절차

독자는 BOJ Performance를 처음 보고, 광고처럼 보이면 넘긴다. 작성 기준과 검증 명령은 [release-copy 스킬](../../.claude/skills/release-copy/SKILL.md)에 있다.

1. 필요한 정보만 둔다. 무엇을 하는지(설명 세 줄), 왜 지금 올리는지(사연 두 줄), 설치 링크, 설치를 망설이게 하는 질문의 답(PC 전용, 외부 전송 없음), Star 부탁 한 줄이다.
2. 기능 목록, 버전별 변경 목록, 대괄호 섹션 제목을 넣지 않는다. 새 기능이 위 설명 세 줄을 바꿀 만큼 클 때만 그 문장을 고친다.
3. 요청 횟수나 데이터를 가져오는 방식 같은 내부 동작은 본문에 쓰지 않는다. 댓글로 물으면 짧게 답한다. 예: "채점 현황 페이지를 브라우저에서 직접 읽어서 계산합니다!"
4. 문체는 `~습니다.`체다. 갤러리에도 같은 글을 쓴다.
5. 사연 문단("올해 1월에…", "백준이 다시 열려서…")은 2026-11 재홍보 때의 글이다. 다시 올릴 때는 그때 사정에 맞게 고친다. 사용자 수 같은 지표는 넣지 않는다.
6. 같은 곳에 다시 올리는 건 큰 기능이 나왔을 때만 한다.
