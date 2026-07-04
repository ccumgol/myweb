# 📘 Hugo & Blowfish 홈페이지 제작 매뉴얼

이 문서는 **박기현 | JIWU Mission Network · 편한IT** 홈페이지의 기술 스택, 프로젝트 구조, 로컬 실행 및 콘텐츠 작성 방법에 대해 설명합니다.

---

## 🛠️ 기술 스택 (Technology Stack)

- **정적 사이트 생성기(SSG):** [Hugo (Extended Version)](https://gohugo.io/)
- **테마(Theme):** [Blowfish (Tailwind CSS 기반)](https://blowfish.page/)
- **배포 및 저장소:** GitHub (`https://github.com/ccumgol/myweb.git`)

---

## 📁 프로젝트 구조 (Project Directory)

```text
myweb/
├── .git/
├── .gitignore               # GitHub 업로드 제외 규칙 정의
├── .gitmodules              # 테마 submodule 정보 관리
├── assets/
│   └── img/
│       └── avatar.webp      # 저자 프로필 이미지 (Hugo 최적화 적용)
├── config/
│   └── _default/
│       ├── hugo.toml        # 기본 Hugo 환경 설정 (한국어 설정 포함)
│       ├── languages.ko.toml# 한국어 사이트 메타데이터, 저자 소개 및 소셜 링크
│       ├── menus.ko.toml    # 네비게이션 메뉴 구조 정의
│       └── params.toml      # Blowfish 테마 기능 설정 (레이아웃, 최신글 리스팅 등)
├── content/
│   ├── _index.md            # 메인 홈 마크다운
│   ├── about/               # 소개 페이지
│   ├── projects/            # 프로젝트/활동 소개 페이지
│   ├── lectures/            # 강연/서비스 안내 페이지
│   ├── contact/             # 문의 페이지
│   └── blog/                # 블로그 섹션 및 포스트 파일들
├── static/
│   └── img/
│       └── line-art-thumbnail.png # 블로그 기본 썸네일 이미지
└── themes/
    └── blowfish/            # Blowfish 테마 저장소 (Submodule)
```

---

## 🚀 로컬 개발 서버 구동 방법

로컬 환경에서 실시간으로 웹사이트를 보며 편집하려면 다음 명령어를 실행합니다.

```bash
hugo server
```

- 웹 서버는 기본적으로 `http://localhost:1313`에서 제공됩니다.
- 소스코드를 수정하면 브라우저에 변경 사항이 실시간으로 반영(Live Reload)됩니다.

---

## ✍️ 콘텐츠 작성 가이드

### 1. 새 블로그 포스트 생성
`content/blog/` 폴더 아래에 마크다운(`.md`) 파일을 생성하고 다음 Front Matter 양식을 작성합니다.

```yaml
---
title: "포스트 제목 작성"
date: 2026-07-04T00:00:00+09:00 # 날짜 및 시간
categories: ["AI & IT 실전 매뉴얼"] # 카테고리 지정
featureimage: "/img/line-art-thumbnail.png" # 썸네일 경로
showHero: true # 상단 히어로 이미지 노출 여부
heroStyle: "basic" # 히어로 스타일 (basic, big 등)
draft: false # 임시저장 여부
---

여기에 본문 내용을 마크다운으로 자유롭게 작성합니다.
```

### 2. 버튼 및 레이아웃 숏코드(Shortcode) 활용
Blowfish 테마 및 커스텀 숏코드를 활용할 수 있습니다.
- **버튼 숏코드:**
  ```markdown
  {{< button href="https://example.com" target="_blank" >}}링크 버튼 텍스트{{< /button >}}
  ```
- **소개글 숏코드:**
  ```markdown
  {{< lead >}}
  가장 강조하고 싶은 메시지를 입력합니다.
  {{< /lead >}}
  ```
- **커스텀 카드 숏코드 (신규 추가):**
  그리드 레이아웃과 조합하여 반응형 카드 섹션을 구성할 수 있습니다.
  ```markdown
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
    {{< card title="카드 제목" text="카드 상세 내용 설명" >}}
  </div>
  ```
