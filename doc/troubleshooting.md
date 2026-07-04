# ⚠️ 프로젝트 문제 보고서 (Troubleshooting)

이 문서는 웹사이트 개발 및 구성 과정에서 발생했던 기술적 문제와 해결 과정을 기록합니다.

---

## 1. `resources.GetRemote` 액세스 거부 및 빌드 오류

### 🚨 현상 및 에러 메시지
`hugo server` 실행 시 웹사이트 빌드가 비정상적으로 종료되며 아래 에러 메시지가 출력되었습니다.

```text
ERROR error building site: render: [ko v1.0.0 guest] failed to render pages:
...
error calling GetRemote: access denied: "img/avatar.png" is not whitelisted in policy "security.http.urls"
```

### 🔍 원인 분석
1. Blowfish 테마의 작성자 템플릿(`layouts/partials/author.html`)은 `languages.ko.toml`에 등록된 저자 이미지(`[params.author] image`)를 렌더링하기 위해 먼저 `resources.Get`을 시도합니다.
2. `resources.Get`은 Hugo 프로젝트의 `assets/` 디렉토리를 기준으로 로컬 파일을 읽어 들입니다.
3. 초기 구성 시 아바타 이미지(`avatar.png`)가 `static/img/` 디렉토리에 있었기 때문에 `resources.Get`은 파일을 찾지 못하고 `nil`을 반환했습니다.
4. 템플릿 내의 조건문 분기 처리에 의해, 로컬 파일을 찾지 못했을 때 fallback으로 원격 리소스인 것처럼 `resources.GetRemote "img/avatar.png"`를 시도했습니다.
5. Hugo의 보안 정책(`security.http.urls`)에 등록되지 않은 임의의 로컬 경로에 대한 원격 호출 시도로 감지되어, 액세스 거부(Access Denied) 에러를 뿜으며 빌드가 뻗어버린 것입니다.

### ✅ 해결 방법
로컬 아바타 이미지의 위치를 `static/`이 아닌 `assets/`로 이동시켰습니다.
- **기존 경로:** `static/img/avatar.png`
- **변경 경로:** `assets/img/avatar.png`

이로써 `resources.Get`이 해당 이미지를 로컬 리소스로 성공적으로 인식하게 되었으며, 빌드가 정상적으로 완료되고 정상 동작함을 확인했습니다.

---

## 2. 홈 화면 UI 레이아웃 튜닝 및 최근 글 가독성 개선

### 🚨 요구 사항 및 현상
1. 프로필 하단에 메인 카피가 중복으로 노출되는 문제.
2. CTA(Call To Action) 버튼들의 정렬이 중앙이 아닌 좌측 정렬인 문제.
3. 핵심 가치 리스트가 세로형 텍스트 형태로만 노출되어 시각적 주목도가 떨어지고 반응형 정렬이 불가능한 구조.
4. '최근 글' 제목이 좌측 정렬이고, 각 글의 제목 텍스트 크기가 크며, 단어 수와 리딩 타임(분) 정보가 과도하게 노출되어 레이아웃이 복잡해 보임.

### ✅ 해결 및 튜닝 방법
- **메인 카피 중복 제거 및 버튼 중앙정렬:** [_index.md](file:///Users/gihyunpark/Desktop/Playground/myweb/content/_index.md)에서 중복되는 `lead` 숏코드 카피를 지우고, 버튼 컨테이너에 Tailwind의 `justify-center`를 적용해 중앙 정렬을 맞췄습니다.
- **반응형 핵심 가치 카드 제작:** [card.html](file:///Users/gihyunpark/Desktop/Playground/myweb/layouts/shortcodes/card.html) 숏코드를 신규 개발하고, [_index.md](file:///Users/gihyunpark/Desktop/Playground/myweb/content/_index.md)에 grid 레이아웃(`grid-cols-2 lg:grid-cols-3`)을 적용해 화면 폭에 맞춰 카드 수가 3개 -> 2개로 반응하며 최소 2열을 유지하도록 구축했습니다.
- **최근 글 제목 중앙 정렬:** 테마 템플릿을 오버라이딩하기 위해 [main.html](file:///Users/gihyunpark/Desktop/Playground/myweb/layouts/partials/recent-articles/main.html)을 생성하고 h2 태그에 `text-center` 클래스를 주입했습니다.
- **글제목 크기 축소:** 아티클 링크 파셜을 오버라이딩하여 [simple.html](file:///Users/gihyunpark/Desktop/Playground/myweb/layouts/partials/article-link/simple.html) 파일의 제목 폰트 크기를 `text-xl`에서 `text-lg`로 일괄 다운사이징했습니다.
- **단어 수 & 리딩 타임 비활성화:** [params.toml](file:///Users/gihyunpark/Desktop/Playground/myweb/config/_default/params.toml) 설정 파일의 `showReadingTime` 및 `showWordCount` 값을 `false`로 지정하여 요약 메타정보를 숨겼습니다.
