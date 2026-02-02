/**
 * @file utils.js
 * @description 공통적으로 사용되는 유틸리티 함수 모음
 */

// 현재 로그인한 사용자의 ID를 가져옵니다.
function getLoginId() {
  const user = document.querySelector(".loginbar .username");
  return user ? user.innerText.trim() : null;
}

// 선택된 언어 이름을 조회
function getLanguageName(langId) {
  if (!langId || langId === "-1") return null;

  const selectBox = document.querySelector('select[name="language_id"]');
  if (selectBox) {
    const option = selectBox.querySelector(`option[value="${langId}"]`);
    if (option) return option.innerText.trim();
  }
  return null;
}

// 다크 모드 활성화 여부 확인
function isDarkMode() {
  // 1순위: 확장 프로그램 설정 확인
  const extendedTheme = localStorage.getItem("boj-extended-theme"); // 'dark' or 'light'
  if (extendedTheme === "dark") return true;
  if (extendedTheme === "light") return false;

  // 2순위: 시스템(OS/브라우저) 설정 확인
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}
