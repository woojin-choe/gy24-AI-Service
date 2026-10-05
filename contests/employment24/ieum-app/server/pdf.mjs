import { getGuide } from './guides.mjs';
import { readFile } from 'node:fs/promises';
import { PDFDocument, rgb, PDFString } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
const C={green:rgb(.12,.30,.24),ink:rgb(.15,.20,.18),muted:rgb(.43,.49,.45),pale:rgb(.94,.96,.92),line:rgb(.84,.88,.83),amber:rgb(.61,.44,.19)};
const text=v=>String(v??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/[\u0000-\u0008\u000b-\u001f]/g,' ').trim();
const questionLabels=['신청 목적 및 추진 내용','참여 인원 및 추진 일정','증빙자료 준비 현황'];
export function reviewAnswers(messages){return messages.filter(x=>x.role==='user').map((m,i)=>{const value=text(m.content);const unconfirmed=!value||/아무렇게|대충|알아서|ㄴㄴ|없는데/.test(value)||(!/[가-힣]/.test(value)&&value.length<80);return {label:questionLabels[i]||`추가 답변 ${i+1}`,value,unconfirmed};});}
export async function makePdf(profile,notice,messages,signed,fontPath=process.env.PDF_FONT_PATH||'/System/Library/Fonts/Supplemental/Arial Unicode.ttf'){
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);let font;try{font=await pdf.embedFont(await readFile(fontPath),{subset:true});}catch{throw Error('한글 PDF 글꼴을 찾을 수 없습니다. PDF_FONT_PATH를 확인해주세요.');}
 const date=new Date().toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'});let page,y;const W=595,H=842,M=44,usable=507;
 const wrap=(value,size=10,width=usable)=>{const lines=[];for(const paragraph of text(value).split('\n')){let s='';for(const ch of paragraph){if(font.widthOfTextAtSize(s+ch,size)>width&&s){lines.push(s);s='';}s+=ch;}lines.push(s);}return lines;};
 const draw=(s,x,top,size=10,color=C.ink)=>page.drawText(text(s),{x,y:H-top-size,size,font,color});
 const box=(x,top,w,h,color,border)=>page.drawRectangle({x,y:H-top-h,width:w,height:h,color,borderColor:border,borderWidth:border?.7:0});
 function fresh(){page=pdf.addPage([W,H]);box(0,0,W,7,C.green);draw('이음',M,24,20,C.green);draw('IEUM  /  APPLICATION PREPARATION',105,33,8,C.muted);draw('작성일 '+date,421,33,8,C.muted);y=77;}
 function ensure(height){if(y+height>H-64)fresh();}
 function paragraph(value,size=10,color=C.ink,width=usable,x=M){for(const line of wrap(value,size,width)){ensure(size+7);draw(line,x,y,size,color);y+=size+7;}y+=5;}
 function section(n,title){ensure(50);box(M,y,23,23,C.green);draw(n,M+5,y+5,9,rgb(1,1,1));draw(title,M+34,y+3,14,C.green);y+=37;}
 function row(label,value){const lines=wrap(value||'미입력 / 확인 필요',10,355);const height=Math.max(36,lines.length*16+16);ensure(height+4);box(M,y,125,height,C.pale);box(M+125,y,382,height,rgb(1,1,1),C.line);draw(label,M+12,y+11,9,C.muted);lines.forEach((s,i)=>draw(s,M+138,y+10+i*16,10));y+=height;}
 function card(label,value,unconfirmed){const parts=wrap(value,10,usable-28);const batches=[];while(parts.length)batches.push(parts.splice(0,30));for(let i=0;i<batches.length;i++){const lines=batches[i];const height=39+lines.length*17;ensure(height+10);box(M,y,usable,height,C.pale);draw(label+(i?' (계속)':''),M+14,y+12,10,C.green);lines.forEach((s,j)=>draw(s,M+14,y+34+j*17,10,unconfirmed?C.amber:C.ink));y+=height+10;}}
 function link(label,url){if(!url)return;ensure(60);draw(label,M,y,10,C.green);y+=18;const lines=wrap(url,8,usable);for(const s of lines){ensure(17);draw(s,M,y,8,C.green);const a=pdf.context.register(pdf.context.obj({Type:'Annot',Subtype:'Link',Rect:[M,H-y-13,W-M,H-y+2],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(url)}}));page.node.addAnnot(a);y+=15;}y+=10;}
 fresh();draw('고용지원 신청 준비서',M,y,25,C.green);y+=39;
 paragraph('회사 정보와 신청 내용을 정리한 검토용 초안',10,C.muted);
 const titleLines=wrap(notice.title,15,usable-30);const titleH=49+titleLines.length*21;ensure(titleH);box(M,y,usable,titleH,C.green);titleLines.forEach((s,i)=>draw(s,M+15,y+15+i*21,15,rgb(1,1,1)));draw(notice.demo?'체험용 공고 | 실제 접수 없음':'공고 출처: '+notice.agency,M+15,y+23+titleLines.length*21,9,rgb(.77,.86,.78));y+=titleH+14;
 paragraph('접수 기간  '+(notice.period||'원문 확인'),10,C.muted);
 paragraph('이 문서는 공식 신청 양식이나 접수 완료 증명이 아닙니다. 공고의 지정 서식과 온라인 입력 항목을 확인한 뒤 제출하세요.',9,C.muted);
 section('01','사업장 기본정보');for(const [key,label]of Object.entries({company:'회사명',registration:'사업자등록번호',owner:'대표자',industry:'업종',region:'소재지',employees:'직원 수',email:'연락 이메일'}))row(label,profile[key]);y+=20;
 section('02','신청 내용 및 보완 사항');
 const answers=reviewAnswers(messages);if(!answers.length)card('입력 대기','신청 내용을 입력하면 이 영역에 반영됩니다.',true);
 for(const a of answers){card(a.label,a.unconfirmed?'보완 필요: 구체적인 사실과 계획을 다시 입력해주세요.\n사용자 원문: '+a.value:a.value,a.unconfirmed);}
 const missing=answers.filter(a=>a.unconfirmed).map(a=>a.label);if(answers.length<3)missing.push(...questionLabels.slice(answers.length));
 if(missing.length){paragraph('추가 확인 필요: '+missing.join(' / '),10,C.amber);paragraph('임의의 채용 계획이나 증빙 내용을 생성하지 않았습니다. 위 항목을 확인한 뒤 공식 양식에 반영하세요.',9,C.muted);}
 section('03','공고 정보 및 제출 경로');
 const guide=getGuide(notice);if(guide){paragraph('공식 모집자료 확인 기준: '+guide.checkedAt,9,C.muted);for(const requirement of guide.requirements)paragraph('□ '+requirement,10);paragraph(guide.note,9,C.muted);link(guide.sourceName,guide.sourceUrl);link('공식 모집자료 PDF',guide.documentUrl);}
 if(notice.summary)paragraph(notice.summary,10,C.muted);
 if(notice.target)row('공고상 지원대상',notice.target);y+=12;
 paragraph('제출 순서: 공고 원문 확인 → 지정 양식 및 증빙 준비 → 대표자 검토 → 공식 접수처 제출',10);
 link('공고 원문',notice.url);link(notice.applyUrl?'공식 신청 페이지':'',notice.applyUrl);link('공고 첨부자료',notice.attachmentUrl);link('모집개요 / 본문 자료',notice.documentUrl);
 ensure(40);paragraph('준비 확인: □ 자격·마감 확인  □ 공식 양식 확인  □ 증빙 준비  □ 최종 내용 검토',9,C.muted);
 ensure(100);box(M,y,usable,88,rgb(.97,.98,.96),C.line);draw('대표자 최종 확인',M+15,y+13,11,C.green);draw('대표자: '+(profile.owner||'미입력'),M+15,y+39,10);draw(signed&&profile.signature?'사용자 승인으로 등록 서명 삽입':'서명 미삽입',M+15,y+61,8,C.muted);
 if(signed&&profile.signature){const image=await pdf.embedPng(profile.signature);const dims=image.scaleToFit(145,55);page.drawImage(image,{x:W-M-165,y:H-y-72,width:dims.width,height:dims.height});}y+=100;
 const pages=pdf.getPages();for(const [i,p]of pages.entries()){p.drawLine({start:{x:M,y:44},end:{x:W-M,y:44},thickness:.6,color:C.line});p.drawText('이음 | 사업주 검토용 신청 준비서',{x:M,y:28,font,size:8,color:C.muted});p.drawText(`${i+1} / ${pages.length}`,{x:W-M-30,y:28,font,size:8,color:C.muted});}
 pdf.setTitle('이음 - 고용지원 신청 준비서');pdf.setAuthor('이음');return Buffer.from(await pdf.save());
}
