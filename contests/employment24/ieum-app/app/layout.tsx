import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'이음 — 우리 회사의 고용지원 비서',description:'공고를 발견하고, 필요한 정보만 대화로 채워 신청을 준비하세요.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
