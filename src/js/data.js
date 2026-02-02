/**
 * @file data.js
 * @description 데이터를 가공하거나 통계를 계산하는 함수 모음
 */

// 제출 데이터를 빈도수 형태로 가공
function processData(submissions, type, myRecord) {
  const values = submissions.map((s) => s[type]);
  const freq = {};

  // 빈도수 계산
  values.forEach((v) => (freq[v] = (freq[v] || 0) + 1));

  // 내 기록이 존재하지만 목록에 없으면 강제 추가
  if (myRecord) {
    const myVal = myRecord[type];
    if (!freq[myVal]) {
      freq[myVal] = 1;
    }
  }

  // 키를 숫자로 변환하고 오름차순 정렬
  const sorted = Object.keys(freq)
    .map(Number)
    .sort((a, b) => a - b);

  return {
    labels: sorted.map((v) => (type === "time" ? `${v}ms` : `${v}KB`)),
    data: sorted.map((v) => freq[v]),
  };
}

// 상위 퍼센트 계산
function calculatePercentile(submissions, type, myRecord) {
  const total = submissions.length;

  // 내 기록이 없으면 전체 수만 반환
  if (!myRecord) return { val: null, top: null, total: total };

  const myVal = myRecord[type];
  const fasterCount = submissions.filter((s) => s[type] < myVal).length;
  const topPercent = Math.min(((fasterCount + 1) / total) * 100, 100);

  return { val: myVal, top: topPercent.toFixed(2), total: total };
}
