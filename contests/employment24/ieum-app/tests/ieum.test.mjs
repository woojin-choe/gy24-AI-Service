import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, safeUrl, makePdf, DEMO } from '../server/api.mjs';
import { PDFDocument } from 'pdf-lib';
test('JSON variants normalize, preserve application links, and deduplicate',()=>{
 const data={jsonArray:[{pblancId:'A',pblancNm:'<b>지원</b>',pblancUrl:'https://example.com/a',rceptEngnHmpgUrl:'https://example.com/apply',reqstBeginEndDe:'20261001 ~ 20261031'},{seq:'A',title:'지원',link:'https://example.com/a'}]};
 const rows=normalize(data);assert.equal(rows.length,1);assert.equal(rows[0].period,'공고 원문 확인');
 assert.equal(normalize({jsonArray:[data.jsonArray[0]]})[0].applyUrl,'https://example.com/apply');
 assert.equal(safeUrl('javascript:alert(1)'),'');
 assert.equal(safeUrl('https://example.com'),'https://example.com/');
});
test('Korean PDF is readable, multipage-safe, and carries a link annotation',async()=>{
 const bytes=await makePdf({company:'가상 회사',owner:'가상 대표'},DEMO[0],[{role:'user',content:'신규 채용 준비 '.repeat(300)}],false);
 const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>=2);assert.ok(pdf.getPages().some(p=>p.node.Annots()));
});

test('vague replies remain marked for clarification',async()=>{
 const {reviewAnswers}=await import('../server/pdf.mjs');
 assert.ok(reviewAnswers([{role:'user',content:'3명 아무렇게나 써줘'}])[0].unconfirmed);
 assert.ok(reviewAnswers([{role:'user',content:'asdfasdf'}])[0].unconfirmed);
 assert.equal(reviewAnswers([{role:'user',content:'채용예정 인원은 2명이며 11월에 면접을 진행할 예정입니다.'}])[0].unconfirmed,false);
});
