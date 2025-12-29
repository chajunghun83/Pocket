# 🗂️ Pocket 프로젝트 구조

> **작성일**: 2025-12-29  
> **프로젝트**: 개인 자산 관리 앱 (Pocket)

---

## 📊 메뉴 및 경로 구조

```
Pocket App (http://localhost:3000)
│
├─ 🏠 대시보드 (Dashboard)
│   ├─ 경로: /
│   ├─ 파일: src/pages/Dashboard.jsx
│   └─ 설명: 전체 자산 현황 및 요약 정보
│
├─ 📒 가계부 (Budget)
│   ├─ 경로: /budget
│   ├─ 파일: src/pages/Budget.jsx
│   └─ 설명: 수입/고정지출/변동지출 관리 (3열 구조)
│
├─ 💳 부채 관리 (Debt)
│   ├─ 경로: /debt
│   ├─ 파일: src/pages/Debt.jsx
│   └─ 설명: 대출, 카드론 등 부채 추적
│
├─ 📈 주식 관리 (Stock)
│   ├─ 경로: /stock
│   ├─ 파일: src/pages/Stock.jsx
│   └─ 설명: 보유 주식 및 투자 현황
│
└─ ⚙️ 설정 (Settings)
    ├─ 경로: /settings
    ├─ 파일: src/pages/Settings.jsx
    └─ 설명: 사용자 설정 및 환경 설정
```

---

## 📁 전체 프로젝트 디렉토리 구조

```
C:\work\Pocket\
│
├─ 📄 설정 파일
│   ├─ .env                    # Supabase 환경변수 (보안 파일)
│   ├─ .gitignore              # Git 제외 파일 목록
│   ├─ env-template.txt        # .env 파일 템플릿
│   ├─ package.json            # 프로젝트 의존성 관리
│   ├─ package-lock.json       # 의존성 버전 잠금
│   ├─ vite.config.js          # Vite 설정
│   └─ index.html              # HTML 진입점
│
├─ 📚 문서
│   ├─ README.md               # 프로젝트 소개
│   ├─ home.md                 # 환경 설정 체크리스트
│   ├─ prd.md                  # 제품 요구사항 문서
│   ├─ backup_251229.md        # 백업 문서
│   └─ project-structure.md    # 이 문서 (프로젝트 구조)
│
├─ 📂 public\                  # 정적 파일
│
└─ 📂 src\                     # 소스 코드
    │
    ├─ main.jsx                # 앱 진입점 (React 렌더링)
    ├─ App.jsx                 # 라우팅 설정
    │
    ├─ 📂 pages\               # 페이지 컴포넌트
    │   ├─ Dashboard.jsx       # 🏠 대시보드 페이지
    │   ├─ Budget.jsx          # 📒 가계부 페이지
    │   ├─ Debt.jsx            # 💳 부채 관리 페이지
    │   ├─ Stock.jsx           # 📈 주식 관리 페이지
    │   └─ Settings.jsx        # ⚙️ 설정 페이지
    │
    ├─ 📂 components\          # 재사용 가능한 컴포넌트
    │   └─ Layout.jsx          # 전체 레이아웃 (네비게이션 포함)
    │
    ├─ 📂 data\                # 데이터 관리
    │   └─ dummyData.js        # 더미 데이터 (개발용)
    │
    └─ 📂 styles\              # 스타일
        └─ index.css           # 전역 스타일
```

---

## 🛣️ 라우팅 흐름

### 1. 진입점 (main.jsx)
```
main.jsx → React Router 설정 → App.jsx 로드
```

### 2. 라우팅 (App.jsx)
```jsx
Routes
  └─ Route path="/" → Layout (공통 레이아웃)
      ├─ index → Dashboard (/)
      ├─ budget → Budget (/budget)
      ├─ debt → Debt (/debt)
      ├─ stock → Stock (/stock)
      └─ settings → Settings (/settings)
```

### 3. 레이아웃 (Layout.jsx)
```
Layout
├─ 상단 네비게이션 바
├─ 사이드바 메뉴
│   ├─ 대시보드 (/)
│   ├─ 가계부 (/budget)
│   ├─ 부채 관리 (/debt)
│   ├─ 주식 관리 (/stock)
│   └─ 설정 (/settings)
└─ 메인 콘텐츠 영역 (각 페이지 렌더링)
```

---

## 📦 주요 라이브러리

| 라이브러리 | 용도 | 버전 |
|-----------|------|------|
| **React** | UI 프레임워크 | ^18.3.1 |
| **React Router** | 페이지 라우팅 | ^7.1.1 |
| **Vite** | 빌드 도구 | ^5.4.21 |
| **Supabase** | 백엔드 (데이터베이스, 인증) | ^2.49.2 |
| **Recharts** | 차트/그래프 | ^2.15.0 |
| **Lucide React** | 아이콘 | ^0.469.0 |

---

## 🔐 환경변수 (.env)

```bash
VITE_SUPABASE_URL=https://gzxbckioutctwxbevqmk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

> **주의**: `.env` 파일은 GitHub에 올라가지 않습니다! (`.gitignore`에 포함됨)

---

## 🎯 현재 상태

- ✅ **Phase 1**: 환경 설정 완료
- ✅ **Phase 2**: React 프로젝트 생성 완료
- ✅ **Phase 3**: UI 개발 완료 (더미 데이터)
- ⏳ **Phase 4**: Supabase 연동 (다음 단계)
- ⏳ **Phase 5**: 배포

---

## 🚀 개발 서버 실행

```bash
# 패키지 설치 (최초 1회)
npm install

# 개발 서버 시작
npm run dev

# 접속
http://localhost:3000
```

---

## 📝 파일별 주요 기능

### 페이지 컴포넌트

#### 1. Dashboard.jsx (대시보드)
- 전체 자산 요약
- 월별 수입/지출 차트
- 부채 현황
- 주식 포트폴리오 요약

#### 2. Budget.jsx (가계부)
- **3열 구조**: 수입 | 고정지출 | 변동지출
- 항목 추가/수정/삭제
- 카테고리별 분류
- 월별 집계

#### 3. Debt.jsx (부채 관리)
- 부채 목록 관리
- 상환 일정 추적
- 이자 계산
- 상환 진행률 표시

#### 4. Stock.jsx (주식 관리)
- 보유 주식 목록
- 매수/매도 기록
- 수익률 계산
- 포트폴리오 분석

#### 5. Settings.jsx (설정)
- 사용자 프로필
- 알림 설정
- 데이터 백업/복원
- 테마 설정

---

## 🔄 Git 작업 흐름

### 작업 시작 전
```bash
git pull  # 최신 코드 가져오기
```

### 작업 완료 후
```bash
git add .
git commit -m "작업 내용 설명"
git push
```

---

## 📞 도움이 필요하면

- GitHub 저장소: https://github.com/chajunghun83/Pocket
- Supabase 프로젝트: https://gzxbckioutctwxbevqmk.supabase.co

---

**마지막 업데이트**: 2025-12-29

