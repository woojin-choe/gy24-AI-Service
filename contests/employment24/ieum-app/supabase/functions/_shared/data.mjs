export const DEMO = [
 {id:'demo-01', title:'[체험용] 신규 채용 기업 고용지원사업', agency:'이음 데모', summary:'새 직원을 채용한 기업의 신청 준비 과정을 체험하는 가상 공고입니다. 실제 지원사업이나 신청 기간이 아닙니다.', target:'신규 채용을 준비하는 사업주', period:'체험용 · 실제 접수 없음', url:'https://www.work24.go.kr/', tags:'인력,채용,전국', demo:true},
 {id:'demo-02', title:'[체험용] 유연근무 도입 지원사업', agency:'이음 데모', summary:'유연근무 계획을 정리하고 신청 준비서를 만드는 가상 공고입니다.', target:'유연근무 도입을 검토하는 기업', period:'체험용 · 실제 접수 없음', url:'https://www.work24.go.kr/', tags:'인력,유연근무,전국', demo:true},
 {id:'demo-03', title:'[체험용] 재직자 직무훈련 지원사업', agency:'이음 데모', summary:'직원 교육 계획의 부족한 정보를 대화로 채우는 가상 공고입니다.', target:'직원 교육을 계획하는 사업주', period:'체험용 · 실제 접수 없음', url:'https://www.work24.go.kr/', tags:'인력,교육,전국', demo:true},
];
export function clean(value) { return String(value ?? '').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim(); }
export function safeUrl(value) { try { const u=new URL(value); return ['https:','http:'].includes(u.protocol)?u.href:''; } catch { return ''; } }
export function normalize(data) {
 const rows=[];
 function walk(v) { if(Array.isArray(v)) return v.forEach(walk); if(!v||typeof v!=='object')return; if(v.pblancId||v.seq) { rows.push(v);return; } Object.values(v).forEach(walk); }
 walk(data);
 return [...new Map(rows.map(x=>{const id=clean(x.pblancId||x.seq); return [id,{id,title:clean(x.pblancNm||x.title),agency:clean(x.jrsdInsttNm||x.author),summary:clean(x.bsnsSumryCn||x.description),target:clean(x.trgetNm),period:clean(x.reqstBeginEndDe||x.reqstDt)||'공고 원문 확인',url:safeUrl(x.pblancUrl||x.link),applyUrl:safeUrl(x.rceptEngnHmpgUrl),attachmentUrl:safeUrl(x.flpthNm),attachmentName:clean(x.fileNm),documentUrl:safeUrl(x.printFlpthNm),documentName:clean(x.printFileNm),applicationMethod:clean(x.reqstMthPapersCn),contact:clean(x.refrncNm),tags:clean(x.hashTags),demo:false}];})).values()];
}
export function profileOnly(input) {
 const fields=['company','registration','owner','industry','region','employees','email','signature'];
 const result={}; for(const key of fields) result[key]=String(input?.[key]??'').slice(0,key==='signature'?400000:200);
 if(result.signature && !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(result.signature)) throw Error('서명은 PNG 형식만 사용할 수 있습니다.');
 return result;
}
