# ⚠️ 배포 & 운영 이슈 리포트 (2026-07-13 ~ 07-29)

> 이 문서는 홈페이지를 **GitHub → Cloudflare Pages → ccumgol.net**으로 배포하는 과정에서 실제로 발생한 문제들과 그 원인, 해결 과정을 기록합니다. 같은 구성을 가르치거나 재현할 때 반드시 마주치게 될 문제들이므로, 교육 자료로 활용하세요.
> 초기 제작 단계의 이슈는 [troubleshooting.md](./troubleshooting.md), 전체 절차는 [deployment-manual.md](./deployment-manual.md) 참고.

---

## 이슈 1. Cloudflare 빌드 실패: Hugo 버전 불일치 ★가장 중요★

### 현상
Pages 프로젝트를 만들고 첫 배포를 하자 24초 만에 **failure**. 빌드 로그에 다음 에러가 반복됨:

```text
hugo v0.147.7+extended linux/amd64
WARN  Module "blowfish" is not compatible with this Hugo version: 0.158.0/0.163.3 extended
Error: error building site: render: ... execute of template failed:
  at <site>: can't evaluate field Locale in type *langs.Language
Failed: build command exited with code: 1
```

### 원인
- 로컬 컴퓨터의 Hugo는 **v0.164.0**, Cloudflare Pages의 기본 Hugo는 **v0.147.7**.
- Blowfish 테마는 최소 v0.158.0을 요구. 구버전 Hugo에는 테마가 사용하는 `site.Language.Locale` 같은 기능이 없어서 템플릿 실행이 실패함.
- 에러 메시지(`can't evaluate field Locale`)만 보면 코드 문제처럼 보이지만, **진짜 원인은 로그 상단의 WARN 한 줄**(버전 비호환 경고)에 있었음. 빌드 로그는 항상 위에서부터 읽을 것.

### 해결
프로젝트 → Settings → **Variables and secrets** → 환경 변수 추가:

```
HUGO_VERSION = 0.164.0
```

이후 실패한 배포 화면에서 **Retry deployment** 클릭 → 빌드 11초, 배포 8초 만에 성공.

### 교훈
- **"내 컴퓨터에서는 되는데 배포하면 안 된다" = 십중팔구 환경(버전) 차이.**
- 배포 서비스의 기본 도구 버전은 로컬보다 낮은 경우가 많다. `HUGO_VERSION`은 처음부터 무조건 넣는 것을 표준 절차로 삼을 것.

---

## 이슈 2. "This project is disconnected from your Git account" (자동 배포 미작동)

### 현상
- 대시보드 상단에 노란 경고: *"This project is disconnected from your Git account. This may cause deployments to fail."*
- 이상하게도 **수동 재배포(Retry)는 성공**하는데, GitHub에 새 커밋을 푸시해도 **새 배포가 자동으로 생기지 않음**.

### 진단 방법 (실제로 사용한 방법)
빈 커밋을 만들어 푸시하고, 대시보드에 새 배포가 나타나는지 관찰:

```bash
git commit --allow-empty -m "chore: verify auto-deploy"
git push origin main
```

→ 2분을 기다려도 새 배포가 생기지 않음 = 자동 배포가 실제로 끊어져 있음을 확인.

### 원인
- Pages 프로젝트 생성 시 GitHub 연동(OAuth/앱 설치)이 **중간에 완료되지 않았음**.
- 이 상태에서는 Cloudflare의 GitHub 앱이 저장소를 읽을 수는 있어서(수동 빌드 성공) 문제가 없어 보이지만, **푸시 알림(webhook)이 Cloudflare에 전달되지 않아** 자동 배포만 조용히 실패함.

### 해결
1. 프로젝트 → **Settings** → Build → **Git repository** 옆 **Manage** 클릭
2. GitHub 로그인 후 **"Cloudflare Workers & Pages"** 앱 설치 화면에서 `myweb` 저장소 접근을 재승인
3. 노란 경고 배너가 사라진 것을 확인
4. 다시 빈 커밋 푸시 → **몇 초 만에 새 배포가 자동 생성**되고 성공 → 완전 복구 확인

### 교훈
- 수동 배포가 된다고 연동이 정상인 것이 아니다. **경고 배너는 반드시 해결하고 넘어갈 것.**
- "빈 커밋 푸시"는 자동 배포 파이프라인을 검증하는 가장 안전하고 확실한 방법이다.

---

## 이슈 3. www.ccumgol.net 접속 시 522 오류

### 현상
- `ccumgol.net`은 정상 서비스되는데, `www.ccumgol.net`은 **Error 522 (Connection timed out)**.

### 원인
- DNS에서 `www`는 원래 `ccumgol.net`의 별칭(CNAME)이었음.
- apex 도메인을 Pages로 교체하자 www 접속도 Pages 서버로 도착하긴 하지만, **Pages는 프로젝트에 "등록된" 도메인의 요청만 응답**함. `www.ccumgol.net`은 등록되지 않았으므로 응답을 받지 못해 522가 발생.
- 즉, DNS가 올바로 가리키는 것과 서비스가 그 이름을 받아주는 것은 **별개의 문제**.

### 해결
Custom domains에서 **`www.ccumgol.net`을 별도의 커스텀 도메인으로 추가** (apex와 동일한 절차). Cloudflare가 www의 CNAME을 `myweb-4j1.pages.dev`로 자동 교체했고, 몇 분 뒤 SSL까지 발급되어 정상화.

### 교훈
- 커스텀 도메인을 연결할 때는 **apex와 www를 한 세트로** 등록하는 것을 기본으로 할 것.
- 522는 "Cloudflare까지는 왔는데 뒤쪽(origin)이 응답하지 않는다"는 뜻이다.

---

## 이슈 4. 기존 도메인에 운영 중이던 워드프레스 사이트 발견

### 현상
`ccumgol.net`을 연결하려고 사전 점검을 해 보니, 도메인이 **이미 운영 중인 워드프레스 사이트**(별도 호스팅, A `88.223.84.188`)에 연결되어 있었음.

### 대응
- 연결을 강행하기 전에 **사용자(도메인 소유자)에게 상황을 보고하고 교체 여부를 확인**받음.
- 롤백에 대비해 기존 DNS 레코드 값을 문서로 기록:

| Type | Name | Content (기존 값) |
|------|------|-------------------|
| A | `@` | `88.223.84.188` |
| AAAA | `@` | `2a02:4780:2b:1780:0:3371:efb5:8` |
| CNAME | `www` | `ccumgol.net` |

### 교훈
- **도메인 연결은 되돌리기 번거로운 작업.** 반드시 (1) 현재 그 도메인에서 뭐가 서비스되는지 확인하고 (2) 기존 DNS 값을 기록한 뒤 (3) 소유자 확인을 받고 진행할 것.
- DNS만 바꾼 것이므로 워드프레스 데이터 자체는 원래 호스팅에 그대로 남아 있음. 위 값으로 복원하면 언제든 되돌릴 수 있음.

---

## 이슈 5. 로컬 미리보기 포트 충돌 (1313)

### 현상
`hugo server` 기본 포트(1313)로 접속했더니 **전혀 다른 프로젝트(다른 Hugo 사이트)** 가 표시됨.

### 원인
같은 컴퓨터에서 다른 Hugo 프로젝트의 서버가 이미 1313 포트를 점유 중이었음.

### 해결
이 프로젝트는 다른 포트로 실행:

```bash
hugo server --port 1717
```

### 교훈
- "내 수정사항이 반영이 안 돼요"의 흔한 원인 중 하나가 **엉뚱한 서버를 보고 있는 것**이다. 브라우저에 뜬 사이트가 정말 내 프로젝트인지(제목, 내용) 먼저 확인할 것.

---

## 이슈 6. (디자인 단계) 페이지 제목 중복과 "0001년 1월 1일" 날짜 표시

### 현상
1. 소개 페이지에 제목이 두 번 표시됨: 테마가 출력하는 "소개" + 본문 마크다운의 `# 소개 (About)`
2. 문의 페이지 상단에 **"0001년 1월 1일"** 이라는 이상한 날짜가 표시됨
3. 소개 페이지 하단에 "아직 게시된 글이 없습니다" 같은 빈 목록 문구가 나타남

### 원인
1. Blowfish 테마는 front matter의 `title`을 자동으로 페이지 제목(H1)으로 출력한다. 본문에 `#` 제목을 또 쓰면 중복된다.
2. `date`가 없는 페이지에서 테마가 날짜를 표시하려다 0값(0001-01-01)을 출력.
3. 폴더에 `_index.md`(언더스코어 있음)를 쓰면 그 폴더는 "글 목록 페이지(섹션)"가 된다. 소개/문의처럼 하위 글이 없는 단일 페이지가 섹션으로 만들어져 빈 목록이 표시된 것.

### 해결
1. 본문 첫 줄의 `#` 제목을 모두 삭제 (front matter의 `title`만 사용)
2. 단일 페이지 4곳(about, projects, lectures, contact)을 `_index.md` → `index.md`로 **이름 변경** (섹션 → 단일 페이지 전환)
3. front matter에 표시 옵션 추가:
   ```yaml
   showDate: false
   showAuthor: false
   ```

### 교훈
- Hugo에서 `_index.md`와 `index.md`는 **완전히 다른 의미**다: `_index.md` = 목록(섹션) 페이지, `index.md` = 단일(리프) 페이지.
- 테마가 자동으로 해 주는 것(제목, 날짜, 저자 표시)을 파악하고, 본문에서는 중복하지 말 것.

---

## 이슈 7. (디자인 단계) 직접 쓴 Tailwind 클래스가 적용되지 않는 문제

### 현상
홈 커스텀 레이아웃에 `bg-emerald-600` 같은 Tailwind 클래스를 쓰면 일부는 적용되고 일부는 무시되어 화면이 어수선해짐.

### 원인
Blowfish 테마의 CSS는 **테마 개발 시점에 미리 컴파일**되어 있다. 컴파일 당시 테마 템플릿에서 사용된 클래스만 CSS 파일에 존재하므로, 사용자가 새로 쓰는 임의의 Tailwind 클래스는 스타일이 아예 정의되어 있지 않다. (직접 Tailwind 재컴파일 환경을 구축하면 가능하지만 초보자에게는 복잡함)

### 해결
홈 화면 전용 스타일을 **순수 CSS**(`assets/css/custom.css`, `hp-` 접두사 클래스)로 작성하고, HTML에서는 그 클래스만 사용. 색상 테마는 Blowfish가 공식 지원하는 방식(CSS 변수 `--color-primary-*` 덮어쓰기)으로 교체.

### 교훈
- 테마를 커스터마이징할 때는 **테마가 공식으로 열어 준 확장 지점**(custom.css, extend-head.html, CSS 변수)을 쓰는 것이 가장 안전하다.

---

## 이슈 8. GitHub push 403 — 계정 불일치 (jiwumission vs ccumgol)

### 현상
정상 작동하던 `git push`가 갑자기 아래 오류로 거부됨:
```text
remote: Permission to ccumgol/myweb.git denied to jiwumission.
fatal: ... The requested URL returned error: 403
```

### 원인
이 컴퓨터에는 GitHub 계정이 둘(개인 `ccumgol`, 단체 `jiwumission`) 있는데, macOS 키체인에 저장된 자격증명이 **push 권한이 없는 `jiwumission`으로 바뀌어** 있었다. 세션 중간에 자격증명이 교체된 것.

### 해결
1. **키체인 접근**(Keychain Access) 앱에서 `github.com` 항목 삭제
2. 다시 `git push origin main` 실행 → `ccumgol` 계정으로 로그인 창이 뜨면 로그인
3. (대안) `ccumgol/myweb` 저장소에 `jiwumission`을 collaborator로 추가

### 교훈
- 한 컴퓨터에서 GitHub 계정을 여러 개 쓰면 자격증명이 엉킬 수 있다. 403 "denied to <계정>" 메시지의 **계정 이름을 반드시 확인**할 것.
- **보안:** AI 도우미는 자격증명·토큰을 대신 입력하지 않는다. 이 단계는 사람이 직접 처리한다.

---

## 이슈 9. curl로 라이브 사이트 확인 시 403 (Cloudflare 봇 차단)

### 현상
배포 확인차 `curl https://ccumgol.net/...`을 하면 403이 반환됨. 그런데 실제 브라우저로 접속하면 정상.

### 원인
Cloudflare가 자동화 도구(curl 등)의 접근을 **봇 챌린지로 차단**한 것. 사이트 문제가 아니라 정상적인 보안 동작. 응답 헤더에 `cf-mitigated: challenge`가 보임.

### 해결
- 배포 검증은 **실제 브라우저**로 하거나, 봇 차단이 없는 `*.pages.dev` 기본 주소(예: `myweb-4j1.pages.dev`)로 curl 확인.

### 교훈
- 라이브 도메인의 curl 403을 사이트 장애로 오해하지 말 것. 실제 방문자(브라우저)에게는 영향이 없다.

---

## 이슈 10. 노션 이미지 URL이 5분 만에 만료됨 (콘텐츠 이관 시)

### 현상
노션 페이지에서 가져온 이미지 링크(`prod-files-secure.s3...`)로 다운로드하면 잠시 뒤 XML `AccessDenied`(Request has expired)만 받아짐.

### 원인
노션이 첨부 이미지에 발급하는 서명 URL은 **약 5분 만에 만료**된다. 여러 페이지를 미리 가져와 두고 나중에 내려받으면 이미 만료됨.

### 해결
- **한 페이지씩** 처리: 페이지를 가져온 직후 곧바로 그 이미지를 다운로드 → webp 변환. 실패(파일이 XML) 시 해당 페이지를 다시 가져와 새 URL로 재시도.

### 교훈
- 만료성 서명 URL은 "가져오는 즉시 소비"가 원칙. 배치로 미리 쌓아두지 말 것.

---

## 이슈 11. `_index.md`와 `index.md`, 그리고 콘텐츠 어댑터

### 현상
소개·문의처럼 하위 글이 없는 단일 페이지가 "글 목록(섹션)"처럼 동작해 빈 목록이 표시됨. / 데이터에서 페이지를 자동 생성하려는데 방법이 필요함.

### 원인/해결
- Hugo에서 `_index.md`(언더스코어) = **목록(섹션) 페이지**, `index.md` = **단일 페이지**. 단일 페이지는 `index.md`로 만든다.
- 데이터(`data/quarters.json`) → 페이지 대량 생성은 **콘텐츠 어댑터**(`_content.gotmpl`, Hugo 0.126+)로 처리. 동전 137개 페이지가 이 방식으로 생성된다. `path`는 어댑터 파일이 위치한 폴더 기준 상대 경로다(폴더를 옮기면 URL도 함께 이동).

### 교훈
- 파일명 하나(`_` 유무)가 페이지 종류를 바꾼다. 콘텐츠 어댑터는 HUGO_VERSION이 충분히 높아야(0.126+) 동작하므로 Cloudflare의 `HUGO_VERSION`도 맞춰 둘 것.

---

## 이슈 12. (동전 코너) 지도 SVG에 알래스카를 덮는 유령 오브젝트

### 현상
미국 지도에서 알래스카·하와이 부근에 회색 선/도형이 걸쳐 보임.

### 원인
SVG 안에 `id="path67"`인 요소가 있었는데, 주(州)가 아니라 원본 지도에서 알래스카·하와이 인셋(별도 박스)을 감싸던 **테두리 프레임 잔재**(`fill="none" stroke="#A9A9A9"`)였다.

### 해결
- `layouts/partials/quarter-us-svg.html`에서 해당 `path67` 라인을 삭제. 진단은 브라우저에서 `getBBox()`로 바닥 영역 요소를 나열해 정체불명 요소를 찾아냈다.

### 교훈
- Inkscape 등으로 만든 SVG에는 주(州) 외의 장식/프레임/`sodipodi` 메타데이터가 섞여 있을 수 있다. 이상한 도형이 보이면 요소 목록을 훑어 잔재를 제거한다.

---

## 이슈 13. (동전 코너) 상세→뒤로가기 시 큰 이미지가 화면에 남음

### 현상
개별 동전 상세 페이지에 들어갔다가 브라우저 뒤로가기를 하면, 확대된 큰 동전 이미지가 목록 화면 위에 계속 떠 있음.

### 원인
Blowfish 테마는 `img:not(.nozoom)` 즉 **모든 이미지에 medium-zoom(클릭 확대)** 을 자동 적용한다. 확대된 상태에서 뒤로가기를 하면 브라우저 캐시(bfcache)에 확대 오버레이가 남아 잔상으로 보인다.

### 해결 (최종 채택)
이미지의 **역할별로 확대 On/Off를 분리**했다:
- **갤러리 썸네일·지도 패널 동전**(`.q-card img`, `.q-pcoin img`): `nozoom` 유지 → 클릭하면 **확대가 아니라 상세 페이지로 이동**해야 하므로 zoom을 끈다. (이걸 안 끄면 zoom이 링크 클릭을 가로채 큰 이미지만 뜨는 게 원래 증상이었다.)
- **상세 페이지 대표 동전**(`.q-hero img`): `nozoom` 제거 → 클릭하면 **라이트박스로 확대**(모바일·데스크탑 공통). `cursor:zoom-in`으로 확대 가능함을 표시.
- **뒤로가기 잔상 방지**: `layouts/partials/quarter-styles.html`에 스크립트 추가 — `pageshow`(bfcache 복원)/`pagehide`에서 남아 있는 `.medium-zoom-overlay`·`--opened`·`--hidden` 상태를 정리.

### 교훈
- 테마가 전역으로 거는 기능(여기선 `img:not(.nozoom)` medium-zoom)은 커스텀 코너 이미지에도 적용된다. **이미지가 "링크"인지 "확대 대상"인지**에 따라 zoom을 켜고 끄는 걸 명시적으로 제어할 것. 링크 안의 이미지에 zoom이 걸리면 클릭이 가로채진다.

---

## 이슈 14. (동전 코너) 모바일에서 갤러리 동전 그림이 왼쪽으로 치우침

### 현상
모바일에서 시리즈 갤러리의 동전 이미지가 카드 안에서 가운데가 아니라 왼쪽으로 쏠려 보임.

### 원인
`.q-card img`가 `display:block`인데 좌우 `margin`이 0이었다. 블록 이미지는 부모의 `text-align:center`로는 가운데 정렬되지 않는다(그건 인라인 요소용). 카드 폭이 넓은 모바일에서 특히 티가 났다.

### 해결
- `.q-card img`, `.q-hero img`에 `display:block; margin-inline:auto;` 추가 → 블록 이미지를 가운데 정렬. (측정: 좌우 여백 26px로 동일)

### 교훈
- **블록 이미지 가운데 정렬은 `margin:0 auto`(또는 `margin-inline:auto`)로 한다.** `text-align:center`는 인라인/인라인블록에만 먹는다.

---

## 이슈 15. 다국어(한/영) 사이트 구성 시 만난 함정 3가지

### 배경
한국어(기본, `/`) + 영어(`/en/`) 2개 언어를 Blowfish로 구성. `config/_default/languages.ko.toml`과 짝으로 `languages.en.toml`, `menus.en.toml`을 추가. 언어 전환 버튼은 Blowfish 내장(`translations.html`)이 **번역본이 있는 페이지에서 자동 표시**된다.

### 함정과 해결
1. **콘텐츠 어댑터는 언어별로 따로 필요** — `content/coins/quarter/_content.gotmpl`(데이터→페이지 자동 생성)은 **기본 언어에만** 적용된다. 영어 페이지도 생성하려면 `_content.en.gotmpl`을 별도로 둬야 한다(내용은 `site.Language.Lang`로 분기해 동일하게 유지 가능). 이걸 안 하면 영문 상세 페이지가 하나도 안 생긴다.
2. **링크는 `relURL`이 아니라 `relLangURL`** — `relURL "/coins/quarter/"`는 항상 `/coins/quarter/`를 주지만, 영어 페이지의 링크는 `/en/coins/quarter/`여야 한다. 언어 접두어가 필요한 내부 링크는 `relLangURL`로 만든다.
3. **JS로 그리는 텍스트의 언어 처리 + 캐시** — 지도 패널처럼 JS(`quarter-map.js`)가 그리는 부분은 템플릿에서 **언어별로 이미 번역된 문자열을 데이터로 넘겨** JS는 그대로 출력하게 했다(JS 안에 한국어 매핑을 두지 않음). 또한 JS 파일을 수정하면 **브라우저가 옛 JS를 캐시**해 바뀐 내용이 안 보일 수 있다 — 서버가 주는 파일(`curl`)로 최종 확인하고, 검증은 하드 리로드로.

### 교훈
- 하드코딩된 템플릿 문구는 `{{ if eq .Site.Language.Lang "en" }}…{{ else }}…{{ end }}`로 분기하거나 i18n 테이블을 쓴다. 홈처럼 문구가 템플릿에 박혀 있으면 이중언어 분기를 넣어야 한다.
- "안 바뀐 것처럼 보임"의 흔한 범인은 **브라우저 JS/CSS 캐시**다. 소스·서버 응답이 맞으면 프로덕션은 정상이다.

### 2단계 완료: 동전 137개 상세 본문 영문 번역
`data/quarters.json`에 `title_en/summary_en/body_en/reverse_design_en/facts_en`를 채워 영문 동전 상세를 완전 영문화했다. 크레딧(`sources`/`image_credit`)은 규칙적이라 데이터 대신 템플릿에서 영문 치환(`replace`)했다.

**작업 방식과 함정:**
- 137개를 8개 배치로 나눠 **병렬 서브에이전트**로 번역, 각자 배치 JSON 파일을 쓰게 하고 슬러그 기준으로 병합했다.
- **함정 1 (임시 파일 소실):** 처음엔 세션 스크래치패드(`/private/tmp/.../scratchpad`)에 배치 파일을 썼는데, **세션 경계에서 스크래치패드가 통째로 초기화**되어 완료된 번역과 작업 기록까지 전부 사라졌다. → 재작업 시 **저장소 안 폴더(`tmp_coins_en/`, .gitignore 등록)**에 저장해 해결. 교훈: 여러 턴에 걸치는 산출물은 세션 스크래치패드에 두지 말 것.
- **함정 2 (data/ 오염):** 백업본 `data/quarters.json.bak`을 `data/` 안에 두었더니 Hugo가 이를 데이터로 로드하려다 빌드가 깨졌다(`unmarshal of format ""`). `data/`에는 순수 데이터 파일만 둘 것 — 백업·임시 파일 금지.
- **함정 3 (세션 사용량 한도):** 8개 병렬 서브에이전트 중 일부가 "session limit"로 실패할 수 있다. 리셋 후 재실행하면 된다.

---

## 이슈 16. 특정 섹션 목록에만 스타일 적용하기 (성경공부 제목 마커)

### 현상/요구
성경공부 목록에서 글들이 서로 잘 구분되지 않아, 제목 앞에 눈에 띄는 마커(🁢)와 항목 간 구분선을 넣고 싶었다. 그런데 목록 마크업(`.article-link--simple`)은 블로그 등 **다른 목록과 공용**이라 전역 CSS로 바꾸면 다른 페이지에도 영향이 간다.

### 해결
Blowfish의 **페이지별 훅** `layouts/partials/extend-head-uncached.html`(head.html이 페이지마다 비캐시로 호출)을 이용해, `{{ if eq .Section "bible-study" }}`일 때만 `<style>`를 주입했다. 스타일이 그 섹션 페이지에만 출력되므로 자연스럽게 스코프가 잡힌다.
- 마커: `.article-link--simple h2::before { content:"🁢"; color:var(--accent-text); }` (테라코타 타일)
- 구분: `.article-link--simple { border-top:1px solid var(--line); }` + 첫 항목은 `border-top:0`
- 참고: `extend-head.html`은 `partialCached ... .Site`라 **사이트 단위 캐시**여서 페이지별 분기가 안 된다. 페이지별로 달라야 하면 반드시 `extend-head-uncached.html`을 쓸 것.

### 교훈
- 공용 컴포넌트의 스타일을 특정 섹션에서만 바꾸려면, 전역 CSS 대신 **그 섹션 페이지에서만 로드되는 스타일 주입 지점**을 찾는 게 깔끔하다. body에 섹션 클래스가 없을 때 특히 유용.

### 추가: 썸네일 오른쪽 정렬 + 높이 고정 (같은 섹션 스코프)
성경공부 목록에서 썸네일 있는/없는 글이 불균형해 보여, 썸네일을 **오른쪽 고정 박스**(데스크톱 168×104, 모바일 상단 전체폭)로 재배치했다. 같은 `extend-head-uncached.html`에 CSS 추가.
- **오른쪽 이동:** 마크업은 썸네일이 먼저 나오므로, flex `order`로 뒤집었다 — 내용 `order:1`, 썸네일 `order:2`, `flex-direction:row`.
- **함정 (`min-height`):** 테마의 `.thumbnail { width:300px; min-height:180px }` 때문에 내 `height:104px`가 안 먹었다(min-height가 height를 이김). `min-height:0`을 함께 줘서 해결. **height만 바꿔도 안 되면 min-height/max-height를 의심할 것.**
- 이미지는 `position:absolute; inset-0; w/h-full; object-cover`라 컨테이너 크기만 잡아주면 꽉 찬다.

---

## 이슈 17. 드롭다운 상위 메뉴에 자체 페이지가 없어도 되는가 / 푸터 워터마크 제거

### 푸터 "Hugo & Blowfish로 제공됨" 제거
`config/_default/params.toml`의 `[footer] showThemeAttribution = true` → `false`로 변경. (테마 파일을 건드릴 필요 없이 옵션으로 처리)

### 성경공부를 상위 드롭다운("성경배움터") 하위로 이동 + "새신자 성경공부" 신설
- Blowfish 데스크톱 메뉴(`desktop-menu.html`)는 `.HasChildren`이면 드롭다운으로 렌더링하고, **상위 항목에 `url`이 없으면 링크 대신 토글(tabindex=0)로** 표시한다. 즉 상위 "성경배움터"는 자체 페이지 없이 `identifier`만 주고 하위만 두면 된다(동전 코너는 `/coins/` 랜딩이 있었지만, 여기선 굳이 만들지 않음).
- 메뉴 구성(`menus.ko.toml`): 상위 `identifier = "bible"`, 하위 2개는 `parent = "bible"` + `pageRef`.
- 기존 `/bible-study/`는 **URL·콘텐츠·섹션 스코프 CSS(`.Section=="bible-study"`)를 그대로 유지**(이동하면 링크와 CSS가 깨짐). 새 코너는 별도 섹션 `content/new-believer/`(URL `/new-believer/`)로 신설.

### 교훈
- 우산 메뉴가 필요할 때 반드시 허브 랜딩 페이지를 만들 필요는 없다. 테마가 URL 없는 상위 항목을 드롭다운 토글로 렌더링하는지 확인하고, 그렇다면 `identifier`+children만으로 충분하다.
- 이미 배포된 섹션은 URL을 함부로 바꾸지 말 것(북마크·내부 링크·섹션 스코프 CSS가 모두 그 경로에 묶여 있다). 새 항목은 형제 섹션으로 추가한다.

---

## 이슈 18. 인터랙티브 콘텐츠(성경지도)를 사이트에 붙이는 패턴 + 지도 라이선스

### 배경
"지도로 보는 예수님의 생애"(`/bible-map/`)는 Leaflet 기반의 **인터랙티브 지도 HTML**을 다른 프로젝트에서 만들어 올리는 방식이다. Hugo 마크다운에 직접 넣기 어려운 자립형 웹앱을 어떻게 섹션에 통합하는가가 관건.

### 채택한 구조
- **자립형 지도/교재는 `static/`에 둔다** — `static/bible-map/<국면>.html`(지도), `static/bible-map/study/<코드>.html`(사건별 교재). Hugo가 처리하지 않고 URL 그대로 서비스된다.
- **iframe 숏코드로 임베드** — `layouts/shortcodes/mapframe.html`이 `{{</* mapframe src="/bible-map/x.html" height="82vh" */>}}` 형태로 반응형 iframe을 만든다. 마크다운 본문에서 지도를 자연스럽게 삽입.
- **에피소드 페이지(마크다운)** 는 지도 iframe + 사용법 + 교재 링크 + 출처를 담는 얇은 래퍼. 아직 안 만든 국면은 "(준비중)" 제목의 placeholder 페이지로 두고 `weight`로 순서를 잡는다.
- **목록 마커**: 이 섹션은 목록 스코프 CSS(`extend-head-uncached.html`) 대신 **제목 텍스트에 마커(🁢)를 직접** 넣어, 목록·페이지·탭·메뉴 어디서나 동일하게 보이게 했다.

### 외부 지도 라이선스 (중요)
- 배경 지도는 위키미디어 공용의 CC BY-SA 4.0 자료(‘The Ministry of Jesus’)를 경량화·표시 추가해 사용했다. **CC BY-SA는 2차적 저작물도 같은 라이선스로 공개**해야 하므로, 각 지도 페이지 하단에 (1) 원저작자·원본 링크, (2) 라이선스 링크, (3) 변경 사항, (4) 결과물도 CC BY-SA 4.0로 제공한다는 문구를 명시했다.

### 교훈
- 마크다운으로 표현하기 힘든 인터랙티브 콘텐츠는 **`static/`의 자립형 HTML + iframe 숏코드**로 붙이는 게 깔끔하다(테마·빌드와 독립).
- 외부 지도·이미지·폰트를 쓸 때는 **라이선스를 먼저 확인**하고, CC BY-SA류는 출처·변경·동일 라이선스 표기를 반드시 남길 것.

---

## 요약: 초보자에게 강조할 5가지

1. **배포 실패의 1순위 용의자는 버전 차이다.** `HUGO_VERSION` 환경 변수를 항상 설정하라.
2. **빌드 로그를 위에서부터 읽어라.** 마지막 빨간 에러보다 상단의 WARN에 진짜 원인이 있는 경우가 많다.
3. **경고 배너를 무시하지 마라.** "수동으로는 되는데"에 속으면 자동화가 조용히 죽어 있다. 빈 커밋 푸시로 검증하라.
4. **도메인 연결 전에 기존 DNS 값을 기록하라.** 되돌릴 길을 만들어 두고 바꿔라. apex와 www는 한 세트다.
5. **테마 원본은 건드리지 마라.** 같은 경로에 파일을 만들어 덮어쓰는 것이 Hugo의 방식이다.
