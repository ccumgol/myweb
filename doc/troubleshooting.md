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
