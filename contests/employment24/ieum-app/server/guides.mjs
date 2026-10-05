// Reviewed against the official recruitment PDF on 2026-10-05.
export function getGuide(notice){
 if(notice.id==='PBLN_000000000126951'||(!notice.demo&&notice.title.includes('2026년 외국인 취업채용박람회'))){return {
  checkedAt:'2026-10-05',sourceName:'서울지방중소벤처기업청 공식 모집자료',sourceUrl:'https://www.mss.go.kr/site/seoul/ex/bbs/View.do?bcIdx=1071297&cbIdx=146',
  documentUrl:'https://www.mss.go.kr/common/board/Download.do?bcIdx=1071297&cbIdx=146&streFileNm=5f4303ed-a42a-4576-a856-233fefc72ec1.pdf',
  requirements:['외국인 채용 희망 여부 확인','사업자등록증상 본사·주사무소·사업장 중 서울 소재 사업장 확인','공식 참가신청서 작성','사업자등록증 준비','해당 시 기타 서류 준비','외국인 채용경험 우대를 신청하는 경우 입증서류 준비'],
  note:'온라인 참가신청 방식이며 모집자료에서 참가신청서·사업자등록증·그 외 기타 서류(해당 시)를 안내합니다. 조기마감 가능성이 있으므로 실제 접수 상태를 확인하세요. 신청폼의 전체 입력 항목은 별도 확인이 필요합니다.'
 };}return null;
}
