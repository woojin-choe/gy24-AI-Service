import { readFile } from 'node:fs/promises';
import { makePdf as renderPdf } from '../supabase/functions/_shared/pdf.mjs';
export { reviewAnswers } from '../supabase/functions/_shared/pdf.mjs';
export async function makePdf(profile, notice, messages, signed, fontPath = process.env.PDF_FONT_PATH || '/System/Library/Fonts/Supplemental/Arial Unicode.ttf') {
 let bytes;
 try { bytes = await readFile(fontPath); } catch { throw Error('한글 PDF 글꼴을 찾을 수 없습니다. PDF_FONT_PATH를 확인해주세요.'); }
 return Buffer.from(await renderPdf(profile, notice, messages, signed, bytes));
}
