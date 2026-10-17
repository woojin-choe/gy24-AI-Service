// 회사 소재지(정식 명칭)와 공고 지역 표기(제목 "[경남]", 기관명 "경상남도" 등)를 맞춥니다.
// 2026년 광주·전남 통합 이후 공고는 "[전남광주]", "전남광주통합특별시"로도 표기됩니다.
const ALIASES = {
  '서울특별시': ['서울'],
  '부산광역시': ['부산'],
  '대구광역시': ['대구'],
  '인천광역시': ['인천'],
  '광주광역시': ['광주', '전남광주'],
  '대전광역시': ['대전'],
  '울산광역시': ['울산'],
  '세종특별자치시': ['세종'],
  '경기도': ['경기'],
  '강원특별자치도': ['강원'],
  '충청북도': ['충북'],
  '충청남도': ['충남'],
  '전북특별자치도': ['전북'],
  '전라남도': ['전남', '전남광주'],
  '경상북도': ['경북'],
  '경상남도': ['경남'],
  '제주특별자치도': ['제주'],
};
const PROVINCES = Object.entries(ALIASES).flatMap(([name, short]) => [name, ...short]);

/** 제목 맨 앞 [지역] 표기를 지역 목록으로 나눕니다. 예: "[서울ㆍ인천ㆍ경기]" → ['서울','인천','경기'] */
export function titleRegions(title = '') {
  const match = String(title).trim().match(/^\[([^\]]+)\]/);
  return match ? match[1].split(/[ㆍ·∙,/\s]+/).filter(Boolean) : [];
}

/**
 * 공고가 회사 소재지와 어떤 관계인지 판단합니다.
 * @returns {'match'|'nationwide'|'other'|''} 소재지가 없으면 ''.
 */
export function regionMatch(notice, region) {
  const name = String(region || '').trim();
  if (!name) return '';
  const names = [name, ...(ALIASES[name] || [])];
  const fromTitle = titleRegions(notice.title);
  const agency = String(notice.agency || '').trim();
  const tags = String(notice.tags || '').split(',').map(t => t.trim());
  if (fromTitle.some(r => names.includes(r)) || tags.some(t => names.includes(t))) return 'match';
  if (fromTitle.includes('전국') || tags.includes('전국')) return 'nationwide';
  if (fromTitle.length) return 'other';
  if (names.some(n => agency.startsWith(n))) return 'match';
  // 지역 표기 없이 중앙부처·청(고용노동부, 중소벤처기업부 등)이 낸 공고는 전국 대상 후보로 봅니다.
  // 시·군·구 기관은 지역 공고이므로 제외합니다.
  if (!PROVINCES.some(p => agency.startsWith(p)) && /(부|청|처|위원회)$/.test(agency)) return 'nationwide';
  return 'other';
}

export const REGION_LABEL = {
  match: '소재지 일치 · 자격 확인 필요',
  nationwide: '전국 대상 후보 · 자격 확인 필요',
  other: '지역 조건 확인 필요',
  '': '',
};
export const REGION_RANK = { match: 0, nationwide: 1, other: 2, '': 2 };
