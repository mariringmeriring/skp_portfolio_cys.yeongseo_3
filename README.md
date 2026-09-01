# Tourism Content Archive

SK플래닛 관광 콘텐츠 제작 프로젝트의 조사, 제작물, SNS 분석과 최종 팀 프로젝트를 기록하는 반응형 정적 웹사이트입니다.

## 페이지

- `index.html`: 소개 및 메인 랜딩
- `brand.html`: NARU studio 브랜드 아이덴티티 및 CI 가이드
- `report.html`: 관광 자원 조사 및 콘텐츠 기획 자료
- `contents.html`: 카드뉴스 및 영상 아카이브
- `sns.html`: SNS 성과 분석 대시보드
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
