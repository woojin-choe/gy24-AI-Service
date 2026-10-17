// 신청 준비 답변 검토: PDF와 화면이 같은 기준으로 '보완 필요'를 판단합니다. (pdf-lib 없이 가볍게 유지)
const text=v=>String(v??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/[\u0000-\u0008\u000b-\u001f]/g,' ').trim();
export const questionLabels=['신청 목적 및 추진 내용','참여 인원 및 추진 일정','증빙자료 준비 현황'];
export function reviewAnswers(messages){return messages.filter(x=>x.role==='user').map((m,i)=>{const value=text(m.content);const unconfirmed=!value||/아무렇게|대충|알아서|ㄴㄴ|없는데/.test(value)||(!/[가-힣]/.test(value)&&value.length<80);return {label:questionLabels[i]||`추가 답변 ${i+1}`,value,unconfirmed};});}
