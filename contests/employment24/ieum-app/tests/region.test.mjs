import test from 'node:test';
import assert from 'node:assert/strict';
import { regionMatch, titleRegions } from '../supabase/functions/_shared/region.mjs';

const n = (title, agency = '', tags = '') => ({ title, agency, tags });

test('title prefixes split into regions', () => {
  assert.deepEqual(titleRegions('[서울ㆍ인천ㆍ경기] 공고'), ['서울', '인천', '경기']);
  assert.deepEqual(titleRegions('[대구·경북] 공고'), ['대구', '경북']);
  assert.deepEqual(titleRegions('지역 표기 없는 공고'), []);
});

test('official region names match short title prefixes', () => {
  assert.equal(regionMatch(n('[서울] 청년일자리도약장려금', '고용노동부'), '서울특별시'), 'match');
  assert.equal(regionMatch(n('[서울ㆍ인천ㆍ경기] 박람회', '고용노동부'), '경기도'), 'match');
  assert.equal(regionMatch(n('[경남] 김해시 청년지원', '경상남도'), '서울특별시'), 'other');
});

test('merged Gwangju-Jeonnam notices match both former regions', () => {
  const notice = n('[전남광주] 청년 근속장려금', '전남광주통합특별시');
  assert.equal(regionMatch(notice, '광주광역시'), 'match');
  assert.equal(regionMatch(notice, '전라남도'), 'match');
  assert.equal(regionMatch(notice, '서울특별시'), 'other');
});

test('agency decides when the title has no region', () => {
  assert.equal(regionMatch(n('일자리 지원사업', '대구광역시'), '대구광역시'), 'match');
  assert.equal(regionMatch(n('일자리 지원사업', '경상북도'), '서울특별시'), 'other');
  assert.equal(regionMatch(n('고용장려금 안내', '고용노동부'), '부산광역시'), 'nationwide');
  assert.equal(regionMatch(n('채용 지원', '김해시'), '서울특별시'), 'other');
});

test('tags and empty regions', () => {
  assert.equal(regionMatch(n('지원', '', '인력,전국'), '울산광역시'), 'nationwide');
  assert.equal(regionMatch(n('[서울] 지원', '고용노동부'), ''), '');
  assert.equal(regionMatch(n('[서울] 지원', '고용노동부'), '  '), '');
});
