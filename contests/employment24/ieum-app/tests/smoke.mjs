import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
const base='http://localhost:3001';
const request=async(path,method='GET',data)=>{const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});assert.equal(response.status,200,await response.clone().text());return response.json();};
const before=await request('/api/profile');
try{
 const profile={company:'테스트 가상 회사',owner:'가상 대표',region:'서울',industry:'서비스',employees:'8'};
 await request('/api/profile','POST',{profile});assert.equal((await request('/api/profile')).profile.company,profile.company);
 const notices=await request('/api/notices?mode=demo');assert.equal(notices.notices.length,3);
 const messages=[{role:'user',content:'직원을 새로 채용하려 합니다.'},{role:'user',content:'2명, 내년 1월 예정입니다.'},{role:'user',content:'근로계약서 초안이 준비되었습니다.'}];
 const chat=await request('/api/chat','POST',{profile,noticeId:'demo-01',messages});assert.equal(chat.mode,'guided');
 const result=await fetch(base+'/api/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile,noticeId:'demo-01',messages,signed:false})});assert.equal(result.status,200);assert.equal(result.headers.get('content-type'),'application/pdf');const bytes=new Uint8Array(await result.arrayBuffer());const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount());await writeFile('/tmp/ieum-sample.pdf',bytes);
 const csrf=await fetch(base+'/api/profile',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({profile})});assert.equal(csrf.status,403);
 console.log('회사 정보 저장·복원, 체험 대화, PDF, 교차 출처 차단 확인 완료');
}finally{await request('/api/profile','POST',{profile:before.profile});}
