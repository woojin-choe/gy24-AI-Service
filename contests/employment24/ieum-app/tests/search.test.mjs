import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesQuery } from '../supabase/functions/_shared/search.mjs';

const notice = {
  title: '[서울] 2026년 청년일자리도약장려금 참여기업 모집 공고',
  summary: '청년을 정규직으로 채용한 중소기업에 인건비를 지원합니다.',
  agency: '고용노동부', target: '중소기업', tags: '',
};

test('empty and whitespace-only queries match everything', () => {
  assert.ok(matchesQuery(notice, ''));
  assert.ok(matchesQuery(notice, '   '));
});

test('surrounding spaces and letter case are ignored', () => {
  assert.ok(matchesQuery(notice, '  청년  '));
  assert.ok(matchesQuery({ ...notice, title: 'IT 인력 지원' }, 'it'));
});

test('multiple words must all appear, in any order or place', () => {
  assert.ok(matchesQuery(notice, '청년 채용'));
  assert.ok(matchesQuery(notice, '채용 청년'));
  assert.ok(matchesQuery(notice, '서울 장려금'));
  assert.ok(!matchesQuery(notice, '청년 육아휴직'));
});

test('queries without spaces match spaced text', () => {
  assert.ok(matchesQuery(notice, '청년일자리 도약'));
  assert.ok(matchesQuery({ ...notice, summary: '청년 채용 시 지원' }, '청년채용'));
  assert.ok(matchesQuery(notice, '참여기업모집'));
});
