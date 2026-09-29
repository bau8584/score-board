# 체육 점수판 — 프로젝트 지침서

> 이 문서는 **현재 구현 상태**를 기준으로 유지한다. 기능/구조를 바꾸면 이 문서도 함께 고칠 것.

## 프로젝트 개요
초등학교 체육 수업에서 태블릿으로 사용하는 점수판 웹앱.
교사가 경기 중 빠르고 직관적으로 조작할 수 있어야 한다.

## 기술 스택
- React 19 + Vite 8 + TypeScript
- Zustand (전역 상태) + `persist` 미들웨어(localStorage)로 영속화
- vite-plugin-pwa (PWA: 오프라인 동작, 홈화면 추가, 전체화면)
- Vitest (단위 테스트)
- 배포: **GitHub Pages** (`main` 푸시 시 GitHub Actions가 테스트 → 빌드 → 배포)
  - 주소: https://bau8584.github.io/score-board/ (Vite `base: '/score-board/'`)
- Dexie(IndexedDB)는 **사용하지 않음**. 이벤트 로그도 zustand persist에 저장한다.
  경기 이력 누적 저장 기능이 필요해지면 그때 도입.

## 명령어
```
npm run dev      # 개발 서버
npm test         # 단위 테스트 (vitest)
npm run lint     # ESLint (에러 0 유지)
npm run build    # 타입체크 + 프로덕션 빌드
```
PR/푸시 전에 `npm run lint && npm test && npm run build` 가 모두 통과해야 한다.

## 디자인 원칙
- **태블릿 가로 모드** 최우선 (manifest도 landscape)
- 터치 영역 최소 60px 이상
- 멀리서도 점수가 잘 보이도록 점수 폰트 최대한 크게
- 테마: **다크(기본, 배경 #0a0a0f 계열) / 라이트** 설정에서 선택 (리퀴드 글래스 스타일 컨트롤)
- 불필요한 UI 최소화 — 경기 중 조작은 단순해야 함
- 경기 중 화면이 꺼지지 않도록 Wake Lock 사용 (`src/hooks/useWakeLock.ts`)

## 화면 구조
탭 없음. 화면 전체가 점수판이고, 컨트롤은 떠 있는(floating) 버튼으로 둔다.
- **좌상단 `모드 ▾`** 드롭다운: 일반 / 야구 / 킨볼 / 컬링
- **우상단 `⚙`**: 설정 모달
- 모드 목록은 `src/stores/uiStore.ts`의 `MODES` 배열에 한 줄 추가 + `App.tsx`의 `BOARDS`에 컴포넌트 등록으로 확장

## 모드별 동작

### 일반
- 화면 좌/우 정확히 절반, 팀 색이 영역 전체를 채움. 팀명(작게) + 점수(크게)
- 팀 영역 **어디든 터치 → +1점**, 하단 모서리 **− 버튼**으로 −1 (0 미만 불가)
- `↺ 초기화` 버튼 (확인창 후 점수 0)
- 설정에서 켜면 **세트 카운터**(중앙 플로팅, 탭 +1 / 우클릭·롱프레스 −1 / ↺ 초기화)
- 설정에서 켜면 상단 중앙 **타이머 pill** 표시

### 야구
- 시작 시 **선공 팀 선택** 오버레이 → 경기 시작
- 공격 팀이 항상 왼쪽에 위치, **공격 팀만 득점 가능**, 감점은 현재 이닝 시작 점수 아래로 불가
- 상단 `N회 초/말` 표시, 공수 전환 버튼(수비팀 색), 아웃 3개 도달 시 공수 전환 확인 팝업
- 초 → 말 → 다음 회 초 순으로 진행, 전환 시 S/B/O/F 카운트 자동 리셋
- 카운트 규칙: 스트라이크 3 = 아웃, 볼 4 = 볼넷(아웃 아님), 파울은 2스트라이크 전까지만 스트라이크 +1(파울 수는 계속 누적), 아웃 3에서 더 누르면 0
- 표시 항목(S/B/O/F)은 설정에서 개별 on/off
- **기록표** 오버레이: 진행한 회차만 동적 컬럼, 초/말 구분 셀(공격 안 하는 쪽은 —), 현재 진행 칸 하이라이트, 합계 자동, 셀 직접 수정(총점 자동 보정), 이벤트 로그

### 킨볼 (3팀: 핑크/그레이/블랙)
- 팀별 점수 ±, 파울(해당 팀 제외 나머지 두 팀 +1)
- 세트 승리 방식: **점수제**(목표 점수 도달) / **시간제**(제한 시간 종료 시 최고점 팀, 동점이면 무승부 재경기)
- 선승 세트 수 설정, 세트 획득 현황 점 표시, 시간제 카운트다운 알림음(on/off)

### 컬링
- 팀 영역 터치 → 엔드 득점 입력, 무득점(블랭크) 엔드, 되돌리기, 초기화
- 득점당한 팀이 다음 엔드 **후공(해머 🔨)**, 해머 수동 변경 가능
- 총 엔드 수는 설정에서 조절, 엔드별 기록표 + 합계

## 설정 (⚙ 모달)
- **팀 A/B**: 색상 6종 선택(기본 빨강/파랑), 이름 입력
  - 이름을 비우거나 공백만 두면 색상 기반 자동 이름("빨강팀")으로 복귀. 입력하면 그 이름 고정
- **타이머**: 사용 여부(기본 꺼짐), 모드 = 카운트업 / 카운트다운 / 현재 시각, 카운트다운은 분·초 설정
  - pill 탭 → 확장되어 시작/정지, 카운트다운 종료 시 pill 점멸 + 종료 팝업 + 알림음
- **야구 표시 항목**: 스트라이크/볼/아웃/파울 토글, 프리셋 `야구`(전체 on) / `발야구`(아웃만 on)
- **일반 점수판**: 세트 카운터 표시
- **킨볼**: 목표 점수, 시간(분/초), 선승 세트, 알림음
- **컬링**: 총 엔드 수
- **테마**: 다크 / 라이트

## 상태 관리 (Zustand store, 모두 persist)
| 파일 | localStorage 키 | 내용 |
|---|---|---|
| `generalStore.ts` | `general-store` | `scores`, `sets` |
| `baseballStore.ts` | `baseball-store` | `phase`, `firstAttacker`, `cur`, `scores`, `halfStart`, `halves`, `so`, `eventLog` |
| `kinballStore.ts` | `kinball-store` | `scores`, `setsWon`, `gameMode` |
| `curlingStore.ts` | `curling-store` | `ends`, `hammer` (합계는 `totals()`로 파생 계산) |
| `settingsStore.ts` | `settings-store` | `teamA/B`, `timer`, `baseball`, `kinball`, `curling`, `theme`, `setCounter` |
| `uiStore.ts` | `ui-store` | 현재 `mode` (저장된 모드가 사라졌으면 일반으로 복귀) |

- 저장 키 이름/구조를 바꾸면 기존 사용자의 저장 데이터가 깨지므로 주의 (필요 시 `merge`/`version` 처리)
- 야구 점수: `scores`는 누적 총점, `halfStart`는 현재 이닝 시작 시점 스냅샷 → 이닝 득점 = `scores − halfStart`

## 색상 매핑 (`src/lib/colors.ts`)
```ts
const COLOR_MAP = {
  빨강: '#e53935', 파랑: '#1e88e5', 초록: '#43a047',
  노랑: '#f9a825', 보라: '#8e24aa', 주황: '#fb8c00',
}
```

## 폴더 구조
```
src/
  components/
    general/  baseball/  kinball/  curling/  settings/   # 모드별 컴포넌트
    ui/                # 공통 UI (TimerPill, Toggle, ColorSwatch)
  hooks/               # useWakeLock 등
  lib/                 # colors, sound(Web Audio 효과음)
  stores/              # zustand 스토어
  styles/              # 모드별 CSS (base / baseball / general / kinball / curling / timer / settings)
  __tests__/           # vitest 단위 테스트
  App.tsx  main.tsx
public/
  icon.svg  favicon.svg  icons/   # 앱 아이콘 (PWA용 PNG 포함)
```
- CSS는 모드별 파일로 분리. 새 모드 스타일은 `styles/<모드>.css`를 만들고 `main.tsx`에서 import.
- 공통(레이아웃·플로팅 버튼·설정 모달)은 `styles/base.css`.

## PWA
- `vite.config.ts`의 `VitePWA` 설정 (autoUpdate, 전체화면, landscape, 아이콘 3종 + maskable)
- 새 버전 배포 후에는 **앱을 한 번 닫았다 열면** 자동 갱신됨
- 홈화면 추가: 크롬(안드로이드) 메뉴 → "앱 설치", 사파리(iPad) 공유 → "홈 화면에 추가"

## 테스트 / 코드 품질
- 규칙 로직이 있는 스토어(야구 카운트·이닝, 컬링 해머, 팀 이름 규칙)는 테스트로 보호한다. 규칙을 바꾸면 테스트도 같이 수정.
- lint 에러 0 유지. React 훅 lint(`set-state-in-effect`)를 부득이하게 끄는 곳은 이유를 주석으로 남긴다.
