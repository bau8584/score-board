# 체육 점수판 — 프로젝트 지침서

## 프로젝트 개요
초등학교 체육 수업에서 태블릿으로 사용하는 점수판 웹앱.
교사가 경기 중 빠르고 직관적으로 조작할 수 있어야 한다.

## 기술 스택
- React 18 + Vite + TypeScript
- Zustand (전역 상태)
- Dexie.js (IndexedDB, 로컬 영속성)
- Cloudflare Pages 배포
- PWA 설정 필수 (오프라인 동작, 홈화면 추가)

## 디자인 원칙
- **태블릿 가로 모드** 최우선 최적화
- 터치 영역 최소 60px 이상
- 멀리서도 점수가 잘 보여야 함 → 점수 폰트 최대한 크게
- 다크 테마 고정 (배경 #0a0a0f 계열)
- 불필요한 UI 요소 최소화 — 경기 중 조작은 단순해야 함

## 탭 구조
상단 탭 3개: **일반 | 야구 | ⚙ 설정**

---

## 일반 탭

### 레이아웃
- 화면을 좌/우 **정확히 절반**으로 분할
- 각 팀 색상이 해당 영역 **전체를 가득 채움**
- 팀명(작게) + 점수(크게)만 영역 중앙에 표시
- 그 외 버튼 없음 — 화면이 색으로만 가득 차야 함

### 득점
- 해당 팀 색깔 영역 **어디든 터치 → +1점**
- 별도 득점 버튼 없음

### 감점
- 각 팀 영역 **하단 모서리**에 − 버튼 하나
- 누르면 1점 감소 (0점 이하 불가)
- 되돌리기와 통합 (별도 히스토리 없음)

### 타이머 (설정에서 켠 경우)
- 화면 상단 중앙에 **다이내믹 아일랜드 스타일 pill** 로 표시
- 평소엔 작게 시간만 표시
- 탭하면 커지면서 시작/정지 토글
- 카운트다운 종료 시 pill 빨갛게 점멸

---

## 야구 탭

### 서브탭
**점수판 | 기록표** 두 개

### 점수판 서브탭
- 양팀 총 득점 크게 표시
- 현재 회차 + 초/말 표시 (예: 3회 초)
- 공격 중인 팀 표시
- **다음 ▶** 버튼 → 초 → 말 → 다음 회 초 순서로 자동 진행
- **◀ 이전** 버튼
- 득점 +1 / − 버튼
- 회차 이동 시 카운터 자동 리셋
- 하단에 설정에서 켠 항목만 표시:
  - 각 항목은 도트 UI (탭으로 on/off)
  - 스트라이크 2개 / 볼 4개 / 아웃 3개 / 파울 4개

### 기록표 서브탭
- 진행한 회차만 동적으로 컬럼 생성 (9회 고정 아님)
- 초/말 구분된 셀
  - 초(top): A팀 점수 표시, B팀 셀은 —
  - 말(bottom): B팀 점수 표시, A팀 셀은 —
- 현재 진행 중인 셀 하이라이트
- 합계 자동 계산
- 하단에 이벤트 로그 (몇 회 초/말, 어느 팀, 득점)

---

## ⚙ 설정 탭

### 팀 설정
- 팀 A 색상 선택 (기본: 빨강)
- 팀 B 색상 선택 (기본: 파랑)
- 팀 A 이름 입력
  - 기본값: 색상 기반 자동 이름 (빨강팀, 파랑팀, 초록팀 …)
  - 직접 입력하면 그 이름 고정
  - 입력값 지우면 색상 기반 자동 이름으로 복귀
- 팀 B 이름 동일

### 타이머 설정
- 타이머 사용 여부 토글 (기본: 꺼짐)
- 카운트업 / 카운트다운 선택
- 카운트다운 선택 시 시간 설정 (분 단위)

### 야구 점수판 표시 항목
- 스트라이크 표시 토글 (기본: 켜짐)
- 볼 표시 토글 (기본: 켜짐)
- 아웃 표시 토글 (기본: 켜짐)
- 파울 표시 토글 (기본: 켜짐)
- 프리셋 버튼:
  - **야구** → 스트라이크 + 볼 + 아웃 + 파울 전체 켜기
  - **발야구** → 아웃만 켜기, 나머지 끄기

---

## 상태 관리 (Zustand store 구조 가이드)

```ts
// generalStore
{
  scores: { a: number, b: number }
  // 감점은 scores 직접 수정, 히스토리 없음
}

// baseballStore
{
  halves: { inn: number, top: boolean, ra: number, rb: number }[]
  cur: { inn: number, top: boolean }
  scores: { a: number, b: number }
  so: { s: number, o: number, b: number, f: number }  // 현재 카운트
  eventLog: { label: string, teamName: string, event: string }[]
}

// settingsStore
{
  teamA: { color: string, customName: string }
  teamB: { color: string, customName: string }
  timer: { enabled: boolean, mode: 'up' | 'down', minutes: number }
  baseball: { showStrike: boolean, showBall: boolean, showOut: boolean, showFoul: boolean }
}
```

## 영속성
- Zustand persist 미들웨어 + localStorage 사용
- Dexie.js는 야구 이벤트 로그처럼 누적 데이터에만 사용

## 색상 매핑 (색상명 → hex)
```ts
const COLOR_MAP = {
  빨강: '#e53935',
  파랑: '#1e88e5',
  초록: '#43a047',
  노랑: '#f9a825',
  보라: '#8e24aa',
  주황: '#fb8c00',
}
```

## 폴더 구조
```
src/
  components/
    general/      # 일반 탭 컴포넌트
    baseball/     # 야구 탭 컴포넌트
    settings/     # 설정 탭 컴포넌트
    ui/           # 공통 UI (pill 타이머 등)
  stores/
    generalStore.ts
    baseballStore.ts
    settingsStore.ts
  App.tsx
  main.tsx
```

## 개발 순서 권장
1. 설정 탭 + store 먼저 (팀명/색상/타이머/야구항목)
2. 일반 탭 점수판 (색 분할 레이아웃 + 터치 득점 + 감점)
3. 타이머 pill
4. 야구 탭 점수판
5. 야구 기록표
6. PWA 설정
7. Cloudflare Pages 배포 설정
