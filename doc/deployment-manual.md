# 🚀 개인 홈페이지 제작부터 도메인 연결까지: 전 과정 따라하기 매뉴얼

> 이 문서는 **Hugo 정적 사이트를 GitHub에 올리고, Cloudflare Pages로 무료 배포한 뒤, 내 도메인(ccumgol.net)으로 서비스하기까지**의 전 과정을 초보자가 따라 할 수 있도록 정리한 매뉴얼입니다.
> 로컬 개발 환경과 프로젝트 구조에 대한 기초는 [manual.md](./manual.md)를, 이 과정에서 실제로 겪은 문제들은 [issue-report.md](./issue-report.md)를 함께 참고하세요.

---

## 0. 전체 그림 이해하기

먼저 우리가 만들 시스템의 흐름을 이해해야 합니다.

```text
[내 컴퓨터]                [GitHub]                  [Cloudflare Pages]           [방문자]
글 작성/디자인 수정   →   저장소에 코드 보관    →   자동으로 빌드 & 전 세계 배포   →   ccumgol.net 접속
   (git push)              (ccumgol/myweb)           (무료, 서버 관리 불필요)
```

| 구성 요소 | 역할 | 비용 |
|-----------|------|------|
| **Hugo** | 마크다운 글을 HTML 웹사이트로 변환하는 정적 사이트 생성기 | 무료 |
| **GitHub** | 코드와 글의 저장소. 버전 관리(수정 이력) 담당 | 무료 |
| **Cloudflare Pages** | GitHub의 코드를 받아 빌드하고 전 세계에 배포하는 호스팅 | 무료 |
| **커스텀 도메인** | `ccumgol.net` 같은 나만의 주소 | 도메인 등록비만 |

**핵심 원리**: 내 컴퓨터에서 `git push` 한 번이면, 약 40초 뒤 실제 사이트에 자동 반영됩니다. 서버를 사지도, 관리하지도 않습니다.

---

## 1. 준비물

1. **Hugo Extended 버전** 설치 (macOS 기준)
   ```bash
   brew install hugo
   hugo version   # "extended" 라는 단어가 보여야 함
   ```
2. **Git** 설치 (`git --version`으로 확인)
3. **GitHub 계정** (github.com)
4. **Cloudflare 계정** (dash.cloudflare.com)
5. (선택) 내 도메인. Cloudflare에서 직접 구매하거나, 타사 도메인을 Cloudflare로 이전 가능

---

## 2. 프로젝트 구조와 디자인 커스터마이징

이 프로젝트는 Hugo + **Blowfish 테마**를 기반으로 하되, 아래 파일들로 디자인을 완전히 커스터마이징했습니다. 테마 원본은 절대 수정하지 않고(서브모듈), **프로젝트 쪽에 같은 경로의 파일을 만들어 덮어쓰는 방식**을 씁니다. 이것이 Hugo의 표준 커스터마이징 방법입니다.

```text
myweb/
├── assets/
│   ├── css/custom.css                  # ★ 디자인 시스템 전체 (색상, 폰트, 홈 화면 스타일)
│   └── img/portrait.webp               # 프로필 사진 원본
├── layouts/
│   └── partials/
│       ├── extend-head.html            # ★ 웹폰트 로드 (고운바탕 + Pretendard)
│       └── home/custom.html            # ★ 홈페이지 레이아웃 (히어로, 가치, 활동, 강연...)
├── config/_default/
│   ├── hugo.toml                       # baseURL 등 핵심 설정
│   ├── languages.ko.toml               # 사이트 제목, 저자 정보
│   └── params.toml                     # 테마 옵션 (homepage.layout = "custom")
├── content/                            # 모든 글 (마크다운)
│   ├── about/index.md, blog/, ...
└── themes/blowfish/                    # 테마 원본 (git 서브모듈, 수정 금지)
```

### 현재 사이트 구조 스냅샷 (2026-07 기준)

사이트가 여러 코너로 성장했습니다. 상단 메뉴와 콘텐츠 섹션의 현재 지도는 다음과 같습니다.

**상단 메뉴 (`config/_default/menus.ko.toml`)**
- 소개 → `/about/`
- 강연 · 문의 → `/lectures/` (문의 내용이 이 페이지 하단에 통합됨)
- **성경배움터** (드롭다운, 자체 페이지 없는 우산 메뉴)
  - 성경공부 → `/bible-study/`
  - 새신자 성경공부 → `/new-believer/`
  - 지도로 보는 예수님의 생애 → `/bible-map/`
- **동전으로 배우는 미국** (드롭다운) → `/coins/` (하위: Quarter 시리즈 5개 앵커)
- 블로그 → `/blog/`

**콘텐츠 섹션 (`content/`)**
| 섹션 | URL | 성격 | 특이사항 |
|---|---|---|---|
| about | /about/ | 단일 페이지 | 소개+활동/프로젝트 통합 |
| lectures | /lectures/ | 단일 페이지 | 강연+문의 통합 |
| bible-study | /bible-study/ | 목록+글 | 노션에서 이관, 목록에 마커/구분선 |
| new-believer | /new-believer/ | 목록+글 | 6부×학생/인도자 12편 + 인쇄용 디자인 HTML(`static/new-believer/design/`) |
| bible-map | /bible-map/ | 목록+글 | 인터랙티브 성경지도(예수님의 생애). `mapframe` 숏코드로 `static/bible-map/*.html` iframe 임베드 + 사건별 교재 HTML(`static/bible-map/study/`) |
| coins | /coins/ | 허브+데이터생성 | `data/quarters.json` → 콘텐츠 어댑터로 137개 자동 생성. 한/영 이중언어 |
| blog | /blog/ | 목록+글 | 한국어 전용 |

**다국어**: 한국어(기본, `/`) + 영어(`/en/`). 영어는 홈·About·Talks&Contact·Coins만 제공(성경 관련·블로그는 한국어 전용). 언어 전환 버튼은 Blowfish 내장.

**정적 인터랙티브 자산**: `static/bible-map/`(지도·교재 HTML), `static/new-believer/design/`(인쇄용 교재 HTML)는 Hugo가 처리하지 않는 **자립형 HTML**이라 `static/`에 두고 URL로 직접 서비스한다.

### 디자인 핵심 결정 사항 (왜 이렇게 했나)

- **서체**: 제목은 명조(고운바탕), 본문은 Pretendard. 사역자의 진정성이 느껴지는 조합.
- **색상**: 회백색(스톤) 바탕에 **테라코타(흙빛 주황) 단일 강조색**. `custom.css` 상단에서 Blowfish의 CSS 변수(`--color-primary-*`)를 덮어써서 사이트 전체(버튼, 링크, 내부 페이지)에 일괄 적용됨.
- **홈 화면**: `params.toml`의 `[homepage] layout = "custom"` 설정 → Hugo가 `layouts/partials/home/custom.html`을 홈으로 렌더링.
- **주의**: 홈 커스텀 HTML에는 Tailwind 클래스 대신 **순수 CSS 클래스(`hp-*`)** 를 사용했습니다. Blowfish는 CSS가 미리 컴파일되어 있어, 테마가 안 쓰는 Tailwind 클래스를 새로 쓰면 스타일이 적용되지 않기 때문입니다. (자세한 내용은 이슈 리포트 6번)

### 색상이나 문구를 바꾸고 싶다면

| 바꾸고 싶은 것 | 수정할 파일 |
|----------------|-------------|
| 강조 색상 | `assets/css/custom.css`의 `--color-primary-*` 값들 |
| 홈 화면 문구 | `layouts/partials/home/custom.html` |
| 사이트 제목, 저자 소개 | `config/_default/languages.ko.toml` |
| 메뉴 구성 | `config/_default/menus.ko.toml` |
| 소개/강연/문의 내용 | `content/각폴더/index.md` |

---

## 3. 로컬에서 미리보기

수정할 때마다 실제 사이트에 올리기 전에 내 컴퓨터에서 확인합니다.

```bash
cd ~/Desktop/Playground/myweb
hugo server
```

- 브라우저에서 `http://localhost:1313` 접속
- 파일을 저장하면 브라우저가 **자동 새로고침**됩니다 (라이브 리로드)
- 종료는 터미널에서 `Ctrl + C`
- 이미 1313 포트를 다른 프로젝트가 쓰고 있다면: `hugo server --port 1717`

---

## 4. GitHub에 올리기

### 4-1. GitHub에서 저장소 만들기

1. github.com 로그인 → 우측 상단 **+** → **New repository**
2. 이름: `myweb`, Public 선택, README 등 추가 옵션은 모두 체크 해제 → **Create repository**

### 4-2. 로컬 저장소를 GitHub에 연결하고 푸시

```bash
cd ~/Desktop/Playground/myweb

# 처음 한 번만: 원격 저장소 연결
git remote add origin https://github.com/ccumgol/myweb.git

# 변경사항 커밋
git add -A
git commit -m "feat: 홈페이지 초기 구성"

# GitHub로 업로드
git push -u origin main
```

### 4-3. ⚠️ 서브모듈 주의사항

이 프로젝트의 테마(`themes/blowfish`)는 **git 서브모듈**입니다. 다른 컴퓨터에서 이 저장소를 받을 때는 반드시:

```bash
git clone --recursive https://github.com/ccumgol/myweb.git
# 이미 clone 했다면:
git submodule update --init --recursive
```

`--recursive` 없이 받으면 테마 폴더가 비어 있어 빌드가 실패합니다.

---

## 5. Cloudflare Pages로 배포하기

### 5-1. Pages 프로젝트 만들기

1. **dash.cloudflare.com** 로그인
2. 왼쪽 메뉴 **Compute(또는 Workers & Pages)** → **Workers & Pages** 클릭
3. 우측 상단 **Create application** → **Pages** 탭 → **Connect to Git**
4. **GitHub 연결 승인 화면**이 뜨면:
   - GitHub 로그인 → "Cloudflare Workers & Pages" 앱 설치 화면에서
   - **Only select repositories** → `myweb` 선택 → **Install & Authorize**
   - ⚠️ 이 승인 과정을 중간에 닫아버리면 "Git 연동 끊김" 문제가 생깁니다 (이슈 리포트 2번)
5. 저장소 목록에서 `ccumgol/myweb` 선택 → **Begin setup**

### 5-2. 빌드 설정 (가장 중요한 부분!)

| 항목 | 입력값 |
|------|--------|
| Project name | `myweb` (사이트 주소가 `myweb-xxx.pages.dev`가 됨) |
| Production branch | `main` |
| Framework preset | `Hugo` |
| Build command | `hugo` |
| Build output directory | `public` |

**그리고 반드시 환경 변수를 추가해야 합니다:**

| 변수 이름 | 값 |
|-----------|-----|
| `HUGO_VERSION` | `0.164.0` |

> 🚨 **왜 필수인가**: Cloudflare의 기본 Hugo 버전(0.147.x)은 Blowfish 테마가 요구하는 최소 버전(0.158.0)보다 낮습니다. 이 변수 없이 배포하면 `can't evaluate field Locale...` 같은 에러와 함께 **빌드가 100% 실패합니다.** 내 컴퓨터의 `hugo version`과 같은 버전을 넣으세요. (이슈 리포트 1번)
>
> 프로젝트 생성 후에 추가하려면: 프로젝트 → **Settings** → **Variables and secrets** → **Add** → Type: Text, 이름/값 입력 → **Save**

6. **Save and Deploy** 클릭

### 5-3. 배포 확인

1. 배포 페이지에서 진행 단계가 보입니다: `initialize → clone repo → build → deploy`
2. 모두 초록 체크가 되고 로그 마지막에 **"Success: Your site was deployed!"** 가 나오면 성공
3. `https://myweb-xxx.pages.dev` 주소를 클릭해 사이트 확인
4. **실패했다면**: 해당 배포의 **Details** → **Build log**에서 빨간 에러 메시지를 읽으세요. 원인 수정 후 **Retry deployment** 버튼으로 재시도할 수 있습니다.

### 5-4. 자동 배포 테스트

설정이 잘 됐는지는 이렇게 확인합니다:

```bash
git commit --allow-empty -m "chore: 자동 배포 테스트"
git push origin main
```

푸시 후 Cloudflare 대시보드의 Deployments 탭에 **몇 초 안에 새 배포가 자동으로 나타나야** 정상입니다. 나타나지 않으면 Git 연동이 끊긴 것입니다 (이슈 리포트 2번).

---

## 6. 커스텀 도메인 연결하기

`myweb-xxx.pages.dev` 대신 내 도메인으로 서비스하는 단계입니다.
(전제: 도메인이 같은 Cloudflare 계정에 등록되어 있으면 모든 과정이 자동입니다.)

### 6-1. 기존 사이트 확인 (중요!)

도메인에 이미 다른 사이트(예: 워드프레스)가 연결되어 있다면, **연결 즉시 기존 사이트는 그 주소에서 내려갑니다.** 반드시 먼저 확인하고, 복구에 필요한 기존 DNS 값을 기록해 두세요.

- Cloudflare → 해당 도메인 → **DNS** 메뉴에서 현재 `@`(A/AAAA)와 `www` 레코드 값을 메모/캡처

### 6-2. 도메인 추가

1. Workers & Pages → `myweb` 프로젝트 → **Custom domains** 탭
2. **Set up a custom domain** 클릭
3. `ccumgol.net` 입력 → **Continue**
4. "Confirm new DNS record" 화면에서 기존 레코드가 새 CNAME(`myweb-xxx.pages.dev`)으로 교체된다는 안내 확인 → **Activate domain**
5. 상태가 `Initializing` → 몇 분 뒤 `Active` (SSL 인증서 자동 발급)

### 6-3. www 주소도 함께 연결

`www.ccumgol.net`으로 접속하는 사람들을 위해 **같은 과정을 한 번 더**, 이번엔 `www.ccumgol.net`을 입력해서 추가합니다.

> ⚠️ apex(ccumgol.net)만 연결하면 www 주소는 **522 오류**가 납니다. www가 DNS상 apex의 별칭(CNAME)이어도, Pages는 "등록된 도메인"만 응답하기 때문입니다. (이슈 리포트 3번)

### 6-4. Hugo의 baseURL 설정

사이트 주소가 확정되면 `config/_default/hugo.toml`에서:

```toml
baseURL = "https://ccumgol.net/"
```

이후 커밋 & 푸시하면 RSS, 사이트맵, SNS 공유 링크가 올바른 절대 주소로 생성됩니다.

```bash
git add config/_default/hugo.toml
git commit -m "chore: set baseURL to https://ccumgol.net/"
git push origin main
```

### 6-5. 최종 확인 체크리스트

- [ ] `https://ccumgol.net` 접속 → 새 사이트가 보이는가
- [ ] `https://www.ccumgol.net` 접속 → 같은 사이트가 보이는가
- [ ] `http://`(암호화 안 된 주소)로 접속 → `https://`로 자동 이동하는가
- [ ] 소개/블로그/문의 등 하위 페이지가 모두 열리는가

---

## 7. 일상 운영: 글 쓰고 발행하기

이제 평소에는 이 순서만 반복하면 됩니다.

### 7-1. 새 글 작성

`content/blog/` 폴더에 마크다운 파일을 만듭니다. 예: `content/blog/my-new-post.md`

```markdown
---
title: "글 제목"
date: 2026-07-14
categories: ["IT칼럼"]
tags: ["AI", "교육"]
summary: "목록과 홈 화면에 보일 한 줄 요약입니다."
---

여기부터 본문을 마크다운으로 작성합니다.

## 소제목

내용...
```

### 7-2. 확인하고 발행

```bash
# 1) 로컬 미리보기
hugo server        # localhost:1313 에서 확인 후 Ctrl+C

# 2) 발행 (이 세 줄이 전부!)
git add -A
git commit -m "post: 새 글 제목"
git push origin main
```

푸시 후 **약 40초**면 ccumgol.net에 반영됩니다. 반영 여부는 Cloudflare 대시보드의 Deployments 탭이나, 그냥 사이트 새로고침으로 확인하세요.

---

## 8. 비상 대응 (롤백)

### 사이트가 이상하게 배포됐을 때
Cloudflare → myweb → Deployments → 정상이었던 이전 배포의 **⋯ 메뉴** → **Rollback to this deployment**

### 기존 워드프레스로 도메인을 되돌려야 할 때
Cloudflare → ccumgol.net 도메인 → DNS에서 아래 값으로 복원:

| Type | Name | Content |
|------|------|---------|
| A | `@` | `88.223.84.188` |
| AAAA | `@` | `2a02:4780:2b:1780:0:3371:efb5:8` |
| CNAME | `www` | `ccumgol.net` |

(그리고 Pages 프로젝트의 Custom domains에서 해당 도메인 제거)

---

## 9. 자주 쓰는 명령어 모음

```bash
hugo server                      # 로컬 미리보기 (localhost:1313)
hugo server --port 1717          # 포트가 겹칠 때
hugo                             # 실제 빌드 테스트 (public/ 폴더 생성)
hugo version                     # 내 Hugo 버전 확인 (HUGO_VERSION 값 결정용)

git status                       # 어떤 파일이 바뀌었나
git add -A                       # 모든 변경 담기
git commit -m "메시지"            # 저장 (스냅샷)
git push origin main             # GitHub 업로드 = 자동 배포 시작
git log --oneline -5             # 최근 이력 5개

git submodule update --init --recursive   # 테마 폴더가 비었을 때
```
