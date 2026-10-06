# Tourism Content Archive

SK플래닛 관광 콘텐츠 제작 프로젝트의 조사, 제작물, SNS 분석과 최종 팀 프로젝트를 기록하는 반응형 정적 웹사이트입니다.

## 페이지

- `index.html`: 소개 및 메인 랜딩
- `brand.html`: NARU studio 브랜드 아이덴티티 및 CI 가이드
- `report.html`: 관광 자원 조사 및 콘텐츠 기획 자료
- `contents.html`: 카드뉴스 및 영상 아카이브
- 카드뉴스 이미지: `assets/images/contents/naru-cardnews-01.jpg`부터 `03.jpg`까지 순서대로 표시
- `sns.html`: SNS 성과 분석 대시보드
- `spoton.html`: 스마트폰 프레임 안에서 실행되는 SPOT:ON 인터랙티브 서비스 미리보기
- `final.html`: 팀 프로젝트 케이스 스터디

## 콘텐츠 수정

- 공통 색상과 간격: `assets/css/variables.css`
- NARU studio CI 원본: `assets/images/common/naru-logo.png`
- 공통 레이아웃: `assets/css/common.css`
- 페이지별 디자인: `assets/css/pages.css`
- 모바일·태블릿 대응: `assets/css/responsive.css`
- 메뉴와 필터 동작: `assets/js/main.js`
- 이미지: `assets/images/` 아래 페이지별 폴더를 만든 뒤 HTML의 플레이스홀더를 `<img>` 요소로 교체
- 영상: `assets/videos/contents/`에 넣거나 외부 영상 주소 연결

## GitHub Pages 배포

1. 이 폴더를 GitHub 저장소에 업로드합니다.
2. 저장소의 **Settings → Pages**로 이동합니다.
3. **Build and deployment**에서 `Deploy from a branch`를 선택합니다.
4. 배포할 브랜치의 `/ (root)` 폴더를 선택하고 저장합니다.

모든 링크와 에셋 경로가 상대경로로 작성되어 프로젝트형 GitHub Pages 주소에서도 별도 수정 없이 동작합니다.

## SNS 자동 연동

- YouTube 채널: `UC4Co3TmVcyKtfOuZgTMJvpw`
- Instagram 계정: `naru.studio.busan`
- `.github/workflows/sync-youtube.yml`이 두 플랫폼 데이터를 매일 00:00(KST)에 함께 갱신합니다.
- YouTube Data API v3 키를 저장소의 **Settings → Secrets and variables → Actions**에서 `YOUTUBE_API_KEY`라는 이름으로 등록해야 합니다.
- Instagram 전문 계정을 Meta 앱과 연결한 뒤 장기 액세스 토큰과 Instagram User ID를 각각 `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`라는 Actions Secret으로 등록해야 합니다. 토큰에는 계정·미디어·인사이트 조회 권한이 필요합니다.
- 키 등록 후 Actions의 **Sync social dashboards → Run workflow**를 한 번 실행하면 최초 데이터가 바로 생성됩니다.
- 동기화 결과는 `data/youtube.json`, `data/instagram.json`에 저장되며 SNS 페이지가 캐시 없이 읽습니다.
- 한 플랫폼의 인증 정보가 아직 없으면 해당 플랫폼만 건너뛰고 다른 플랫폼의 동기화는 계속됩니다.
