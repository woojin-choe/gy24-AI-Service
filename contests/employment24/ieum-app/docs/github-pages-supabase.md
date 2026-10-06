# GitHub Pages + Supabase 배포

프런트엔드는 Next.js 정적 내보내기로 GitHub Pages에서 제공하고, Supabase Auth와 Postgres에 계정과 회사 정보를 저장합니다. 공고 조회, 선택적 AI 대화, 한글 PDF 생성은 Supabase Edge Function `ieum`에서 처리합니다.

현재 저장소 기준 주소: https://woojin-choe.github.io/gy24-AI-Service/

## 1. Supabase

Supabase 프로젝트를 생성합니다. 프로젝트 URL과 **publishable 키**(또는 기존 anon 키)를 준비합니다. service_role/secret 키는 브라우저나 GitHub 공개 변수에 넣지 않습니다.

앱 디렉터리에서 Supabase CLI를 사용합니다:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
cp supabase/.env.example supabase/.env
# supabase/.env에 운영용 기업마당/LLM 키와 한글 글꼴 URL을 입력
supabase secrets set --env-file supabase/.env
supabase functions deploy ieum
```

CLI가 없으면 공식 설치 안내: https://supabase.com/docs/guides/local-development/cli/getting-started

`supabase/migrations/20261006000000_ieum.sql`은 회사 정보 테이블과 RLS 정책, 사용자별 일일 AI 요청 한도(UTC 기준 30회)를 만듭니다. 회사 정보는 자기 계정만 조회·수정·삭제할 수 있습니다. `verify_jwt=false`는 비회원 공고 조회를 허용하기 위한 설정이며, 대화·PDF는 함수 내부에서 Supabase Auth로 토큰을 검증합니다.

Auth → URL Configuration:

- Site URL: `https://woojin-choe.github.io/gy24-AI-Service/`
- Redirect URLs: 위 URL과 개발용 `http://localhost:3001/`
- 이메일 확인을 사용합니다. 회원가입 후 확인 이메일 링크를 열고 로그인합니다.
- Auth 비밀번호 최소 길이를 10자로 설정합니다.

`ALLOWED_ORIGINS`에는 경로 없이 origin만 넣습니다. 다른 저장소/도메인으로 배포하면 값도 변경합니다.

PDF에는 한글을 지원하고 임베딩이 허용된 **TTF**가 필요합니다. 라이선스를 확인한 글꼴을 Supabase Storage 공개 버킷 등에 올리고 HTTPS 파일 URL을 `PDF_FONT_URL`에 설정합니다. 현재 프로젝트에는 SIL Open Font License의 나눔고딕 공개 HTTPS URL이 설정되어 있습니다. 글꼴이 설정되지 않으면 PDF 요청은 명시적인 오류를 반환합니다. macOS 시스템 글꼴 경로는 클라우드에서 사용할 수 없습니다.

LLM 설정 3개가 없으면 기존 단계별 체험 대화를 사용합니다. 기업마당 키가 없으면 체험용 공고가 기본입니다. 공개 운영에서는 개인/운영용 키를 사용합니다.

## 2. GitHub Pages

저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 선택합니다.

현재 이음 프로젝트의 URL과 공개 키는 워크플로 기본값으로 연결되어 있습니다. 다른 프로젝트로 바꾸려면 Settings → Secrets and variables → Actions → Variables에 다음 두 변수를 추가해 기본값을 덮어씁니다:

| 변수 | 값 |
| --- | --- |
| `SUPABASE_URL` | 프로젝트 HTTPS URL |
| `SUPABASE_PUBLISHABLE_KEY` | 공개 publishable/anon 키 |

변경사항을 `main`에 푸시하거나 Actions의 `Deploy Ieum to GitHub Pages`를 수동 실행합니다. 빌드·타입 검사·테스트를 통과한 `out/`을 배포합니다. Supabase 연결값이 비어 있으면 워크플로를 중단합니다. 변수 변경 후에는 다시 빌드해야 합니다.

프로젝트 저장소 경로는 워크플로에서 자동 설정합니다. 사용자 루트 사이트(`owner.github.io` 저장소)로 바꾸는 경우 `NEXT_PUBLIC_BASE_PATH`를 빈 값으로 변경합니다.

## 3. 개발 및 검증

```bash
npm ci
cp .env.example .env
# NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 설정
npm run dev
npm run typecheck
npm test
NEXT_PUBLIC_BASE_PATH=/gy24-AI-Service npm run build
```

Supabase 없이도 비회원 체험 공고 화면을 확인할 수 있습니다. 로그인·회사 정보·대화·PDF는 연결 설정이 필요합니다. 브라우저에 노출해도 되는 URL과 공개 키만 `NEXT_PUBLIC_*`에 넣습니다.

이전 로컬 서버를 계속 사용하려면 `.env`에 `NEXT_PUBLIC_LOCAL_API=true`를 설정하고 `npm run dev:local`을 실행합니다. 기존 `.local` 계정/프로필은 Supabase로 자동 이전되지 않습니다.

배포 후 서로 다른 두 계정으로 프로필을 저장하고, 다른 계정의 프로필을 읽거나 수정할 수 없는지 확인합니다. 회원가입 확인 이메일, 재방문 로그인, 자동 로그인 미선택 시 세션 저장, 로그아웃, 공고 조회, 3단계 대화와 한글 PDF/서명을 확인합니다. 자동 로그인은 localStorage, 미선택은 탭의 sessionStorage를 사용합니다.

이 구현에는 비밀번호 재설정 UI와 계정 삭제 UI가 없습니다. 회사 정보 삭제는 저장된 프로필을 삭제하며, 내려받은 PDF는 사용자가 관리합니다.

참고: [Next.js 정적 내보내기](https://nextjs.org/docs/app/guides/static-exports), [GitHub Pages 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Supabase 함수 인증](https://supabase.com/docs/guides/functions/auth-legacy-jwt).

## 현재 이음 프로젝트 상태

프로젝트 `qynhrrughunzqamhddim`에 DB 생성 SQL을 Dashboard SQL Editor로 실행했고 `ieum` 함수를 배포했습니다. 서버 공고 조회 100건을 확인했습니다. LLM 키 미설정으로 단계별 체험 대화를 사용합니다. 이 DB는 SQL Editor에서 생성했으므로 CLI 마이그레이션 이력 등록 전에는 초기 마이그레이션을 다시 `db push`하지 않습니다.

배포 검증: 임시 계정 두 개로 로그인, 프로필 저장/조회, 다른 계정의 읽기·덮어쓰기 차단, 인증된 단계별 대화, 클라우드 한글 PDF 생성과 비회원 PDF 차단을 확인했고 테스트 계정을 삭제했습니다.
