# 팀원을 위한 Git·GitHub 사용 가이드

Git은 내 컴퓨터의 변경 이력을 기록하고, GitHub는 그 이력을 팀과 공유하는 곳입니다. 아래 명령은 저장소 폴더 안의 터미널에서 실행합니다. VS Code라면 폴더를 연 뒤 **터미널 → 새 터미널**을 선택하세요.

## 1. 처음 한 번: 저장소 받기

Git을 설치하고 `git --version`으로 설치 여부를 확인합니다. GitHub 계정을 만들고 저장소 초대를 받았다면 수락합니다. 커밋 작성자 이름과 이메일을 설정합니다. 예시 값은 본인 정보로 바꾸세요. 이메일 공개가 부담되면 GitHub 이메일 설정의 비공개 이메일을 사용할 수 있습니다.

```bash
git config --global user.name "내 이름"
git config --global user.email "내 GitHub 이메일"
git clone https://github.com/woojin-choe/gy24-AI-Service.git
cd gy24-AI-Service
```

`clone`은 최초에 한 번만 합니다. 이미 받은 저장소는 다시 내려받지 않고 `git pull`로 업데이트합니다. 업로드 인증이 필요하면 VS Code의 GitHub 로그인 또는 Git 인증 도구의 안내를 따르세요. GitHub 계정 비밀번호를 터미널 인증 비밀번호로 쓰지 않습니다.

## 2. 작업 시작: 최신 내용 받고 브랜치 만들기

먼저 `git status`로 커밋하지 않은 변경이 없는지 확인합니다. 변경이 있으면 현재 작업 브랜치에 커밋하거나 아래 임시 보관 방법을 사용한 뒤 진행하세요.

```bash
git status
git switch main
git pull
git switch -c docs/kia-plan
```

`main`은 팀의 통합본이고, 브랜치는 내 작업 공간입니다. `docs/kia-plan`은 예시이므로 새 작업마다 다른 이름을 사용하세요. 기존 브랜치로 돌아갈 때는 `git switch docs/kia-plan`처럼 `-c` 없이 실행합니다.

| 작업 | 브랜치 이름 예시 |
| --- | --- |
| 새 기능 | `feat/ieum-benefit-search` |
| 오류 수정 | `fix/ieum-login` |
| 기획안·문서 | `docs/kia-plan` |
| 폴더·설정 정리 | `chore/repo-cleanup` |

영문 소문자와 하이픈을 쓰고, 팀원과 겹치면 뒤에 이름을 붙입니다. 예: `docs/kia-plan-woojin`.

## 3. 작업 저장하고 올리기

파일을 수정하고 저장한 다음 변경 내용을 확인합니다.

```bash
git status
git diff
git add .
git diff --staged
git commit -m "docs: 기아 PBV 기획안 보완"
git push -u origin docs/kia-plan
```

위 예시는 `docs/kia-plan` 브랜치의 첫 업로드입니다. 이후 같은 브랜치에서는 아래 세 줄이면 됩니다.

```bash
git add .
git commit -m "메시지"
git push
```

`메시지`는 그대로 쓰지 말고 아래 규칙대로 바꿉니다. `git add .`은 현재 폴더 아래의 변경·추가·삭제를 함께 준비합니다. 원하지 않는 파일이 섞이면 `git add docs/git-guide.md`처럼 파일을 지정하세요. `git diff`는 아직 추가하지 않은 기존 파일 변경을, `git diff --staged`는 다음 커밋에 들어갈 내용을 보여줍니다. 새 파일 목록은 `git status`로 확인합니다.

| 명령 | 의미 |
| --- | --- |
| `git status` | 브랜치와 변경 파일 확인 |
| `git add .` | 다음 커밋에 넣을 변경 준비 |
| `git commit -m "메시지"` | 내 컴퓨터에 변경 이력 저장 |
| `git push` | 저장한 커밋을 GitHub에 업로드 |
| `git pull` | 현재 브랜치의 원격 변경을 받아 통합 |

파일을 저장하는 것, 커밋하는 것, 업로드하는 것은 각각 다른 단계입니다. `push` 후에도 PR을 합치기 전까지 `main`에는 반영되지 않습니다.

## 커밋 메시지 규칙

형식은 **`종류: 변경 내용`**입니다. 종류는 영문 소문자, 설명은 한국어로 써도 됩니다. 한 커밋에는 하나의 목적을 담고, 어떤 파일이나 기능이 어떻게 바뀌었는지 구체적으로 적습니다.

| 종류 | 언제 쓰나요? | 예시 |
| --- | --- | --- |
| `feat` | 기능 추가 | `feat: 이음 지원금 검색 기능 추가` |
| `fix` | 오류 수정 | `fix: 빈 검색어 입력 시 오류 수정` |
| `docs` | 문서·기획안 수정 | `docs: 기아 PBV 시장 조사 추가` |
| `style` | 동작에 영향 없는 코드 형식 변경 | `style: Python 들여쓰기 정리` |
| `refactor` | 동작을 유지하며 코드 구조 개선 | `refactor: 자격 판별 로직 분리` |
| `test` | 테스트 추가·수정 | `test: 지원금 자격 판별 테스트 추가` |
| `chore` | 설정·도구·폴더 정리 | `chore: 대회별 폴더 구조 정리` |

`수정`, `ㅋㅋ`, `최종`, `최종진짜최종`처럼 내용을 알 수 없는 메시지는 피합니다. UI 기능 추가는 `feat`, UI 오류 수정은 `fix`를 사용합니다. `style`은 코드 서식 변경을 뜻합니다.

## 4. GitHub에서 PR 올리기

PR(Pull Request)은 **내 브랜치의 변경을 `main`에 합쳐 달라는 검토 요청**입니다. 문서 수정도 같은 방식으로 올립니다.

1. `git push` 후 [저장소](https://github.com/woojin-choe/gy24-AI-Service)를 엽니다.
2. **Compare & pull request**를 누릅니다. 버튼이 없으면 **Pull requests → New pull request**로 이동합니다.
3. **base: `main`**, **compare: 내 작업 브랜치**인지 확인합니다.
4. 제목은 `docs: 기아 PBV 기획안 보완`처럼 커밋 규칙에 맞춰 적습니다.
5. 자동으로 나오는 양식에 변경 이유·내용·확인 방법을 채웁니다. 관련 이슈가 있으면 `Closes #이슈번호`를 적습니다.
6. **Files changed**에서 엉뚱한 파일이나 비밀값이 없는지 확인합니다.
7. 완성된 작업은 **Create pull request**, 진행 중인 작업은 **Draft pull request**로 만듭니다.
8. **Reviewers**에서 팀원을 지정합니다. 지정할 수 없으면 팀에 PR 링크를 공유해 리뷰를 요청합니다.

PR 본문 예시:

```markdown
## 변경 내용
- 제출 준비를 위해 기아 PBV 기획안에 시장 조사 자료 추가
- 조사 자료 출처와 확인 날짜 기록

## 확인한 방법
- Markdown 미리보기에서 표와 링크 확인

## 관련 이슈
없음
```

리뷰에서 수정 요청을 받으면 **같은 브랜치**에서 고치고 `add → commit → push`를 실행합니다. 기존 PR에 자동으로 반영되므로 새 PR을 만들 필요가 없습니다. 해결한 내용은 PR 댓글에 설명합니다.

## 5. 리뷰와 병합 후 최신 내용 받기

리뷰어는 변경 목적, 문서 출처·링크, 코드 실행 결과를 확인합니다. 수정이 필요하면 **Request changes**, 확인이 끝나면 **Approve**로 의견을 남깁니다.

다른 팀원 최소 1명의 승인과 필요한 실행·검증을 마친 뒤 **Squash and merge**를 사용합니다. 병합 화면의 커밋 제목도 `종류: 변경 내용`으로 정리하세요. Draft PR은 준비가 끝나면 **Ready for review**로 바꿉니다. 충돌이 있으면 아래 방법으로 먼저 해결합니다.

병합 뒤에는 다음 명령으로 팀의 최신 내용을 받습니다.

```bash
git switch main
git pull
```

다음 작업은 업데이트된 `main`에서 새 브랜치로 시작합니다. 병합된 브랜치는 새 작업에 재사용하지 않습니다. `Squash and merge`는 PR의 여러 커밋을 `main`의 한 커밋으로 합칩니다.

## 6. 자주 막히는 상황

### 변경 때문에 pull이나 브랜치 전환이 안 될 때

완성된 내용이면 현재 작업 브랜치에 커밋합니다. 아직 저장 이력으로 남기기 애매하면 임시 보관할 수 있습니다.

```bash
git stash push -u -m "진행 중 작업 임시 보관"
git switch main
git pull
git switch docs/kia-plan
git stash pop
```

브랜치 이름은 원래 작업하던 이름으로 바꾸세요. `-u`는 아직 추적하지 않는 새 파일도 보관합니다(무시된 파일은 제외). `stash pop`에서 충돌이 생기면 아래 방법으로 해결합니다. 변경 내용을 모르는 상태에서 강제 삭제나 `reset --hard`를 실행하지 마세요.

### push가 거절될 때

`non-fast-forward`라면 같은 원격 브랜치에 다른 커밋이 올라온 상황일 수 있습니다. 변경을 먼저 커밋하거나 임시 보관하고, **현재 작업 브랜치에서** 아래를 실행합니다.

```bash
git pull --no-rebase
git push
```

충돌이 발생하면 해결한 뒤 push합니다. `--force`로 덮어쓰지 않습니다. `Permission denied`, 인증 오류 또는 `Repository not found`라면 GitHub 로그인, 저장소 주소, 초대 수락 및 쓰기 권한을 확인합니다.

### 작업 중 main의 새 내용을 반영하거나 PR 충돌을 해결할 때

먼저 내 브랜치의 변경을 커밋하거나 임시 보관한 뒤 실행합니다.

```bash
git fetch origin
git switch docs/kia-plan
git merge origin/main
```

같은 부분을 서로 수정하면 충돌이 생깁니다. VS Code에서 파일을 열면 다음과 비슷한 표시가 보입니다.

```text
<<<<<<< HEAD
내 브랜치 내용
=======
main의 내용
>>>>>>> origin/main
```

팀원과 비교해 필요한 내용을 합치고, `<<<<<<<`, `=======`, `>>>>>>>` 표시를 전부 지웁니다. VS Code의 한쪽 선택 버튼을 누르기 전에 양쪽 내용을 읽으세요. 파일을 저장하고 결과를 확인한 다음 실행합니다.

```bash
git add .
git commit -m "chore: main 변경 반영 및 충돌 해결"
git push
```

위 커밋은 `merge` 또는 `pull --no-rebase`의 충돌 해결 기준입니다. `stash pop`에서 충돌이 났다면 파일을 고치고 `git add .` 후 실제 변경 목적에 맞게 커밋합니다. 해결을 진행하기 어렵다면 merge 중에는 `git merge --abort`로 이번 병합을 취소하고 팀원에게 도움을 요청할 수 있습니다.

### add에 원하지 않는 파일을 넣었을 때

```bash
git restore --staged 파일경로
```

파일 내용은 유지되고 커밋 준비 대상에서만 빠집니다. `.gitignore`는 아직 추적하지 않는 파일을 제외하는 규칙입니다. 이미 Git에 올라간 파일은 규칙만 추가해도 사라지지 않습니다. 비밀값을 이미 올렸다면 파일 삭제만으로 이력이 지워지지 않으므로 즉시 팀에 알리고 해당 키를 폐기·재발급합니다.

### nothing to commit이 나올 때

파일을 저장했는지, 올바른 폴더에서 실행 중인지 `git status`로 확인합니다. 변경이 없다면 새 커밋은 필요 없습니다. 이미 커밋한 내용을 아직 안 올렸다면 `git push`만 실행합니다.

## 매번 기억할 순서

**main에서 pull → 작업 브랜치 → 파일 수정 → status → add → commit → push → PR → 리뷰 → 병합 → main에서 pull**

GitHub에서 파일을 직접 수정해 커밋해도 내 컴퓨터에는 자동 반영되지 않습니다. 다음 작업 전에 반드시 최신 내용을 받으세요.
