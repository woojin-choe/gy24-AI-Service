// 공고 검색: 띄어쓰기·대소문자·앞뒤 공백과 관계없이 찾고, 여러 단어는 모두 포함한 공고를 찾습니다.
const squash = text => String(text || '').toLowerCase().replace(/\s+/g, '');

export function matchesQuery(notice, query) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = squash([notice.title, notice.summary, notice.agency, notice.target, notice.tags].join(' '));
  // "청년 채용"은 두 단어가 모두 있으면, "청년채용"은 본문의 "청년 채용"과도 일치합니다.
  return words.every(word => haystack.includes(word)) || haystack.includes(squash(query));
}
