# 모으다 보니 D-day (토스 미니앱) 기획서

플랫폼: Apps in Toss (앱인토스)
작성일: 2026-08-26
사업자: 기존 원가계산기/오늘의운세/척척계산기/번호조합기와 동일 사업자, 워크스페이스 재사용(사업자 등록 완료 상태 — 실제 광고 SDK 연동 가능)

> 이 문서는 브레인스토밍 세션에서 사용자와 합의한 MVP 범위를 기준으로 작성됨.

---

## 1. 프로젝트 개요

- **앱 이름**: 모으다 보니 D-day
- **appName(영문 식별자)**: `moeuda-dday`
- **목표**: "월급날만 기다리지 말고, 목표 달성날을 기다리세요" — 여러 개의 목표(날짜형 D-day, 저축형 D-day)를 동시에 등록·관리하는 미니앱. 토스 모으기(소액 저축) 기능과 심리적으로 맞닿아 재방문율을 높인다.
- **메인 헤드카피**: "월급날만 기다리지 말고, 목표 달성날을 기다리세요" / 서브: "하루에 딱 커피 한 잔값만 아껴도 D-day가 앞당겨져요."
- **MVP 범위**: 목표 리스트(날짜형+저축형) + 계산 결과 + 상세 리포트(리워드 광고) + 배너/전면 광고 + 목표별 푸시 알림(백엔드 포함)
- **수익화**: 배너(결과 하단) + 리워드 영상(상세 리포트 잠금 해제) + 전면 광고(재계산 3~5회당 1회)

---

## 2. 디자인 방향

돼지저금통 + D-day 카운트 + 진행률 바 컨셉의 아이콘(에셋 확보 완료, 6절 참고)에 맞춰 핑크/코랄 톤을 메인으로 사용한다. 기존 앱들의 블루(척척계산기)·앰버(번호조합기)와 구분되는 톤.

### 컬러 토큰

| 이름 | 값 | 용도 |
|---|---|---|
| Primary Coral Pink | `#FF7A8A` | 포인트, 버튼, 강조 숫자(D-day) |
| Accent Gold | `#F5B841` | 저축/코인 관련 강조 요소 |
| Dark Text | `#191F28` | 제목, 본문 |
| Secondary Text | `#8B95A1` | 설명, 보조 텍스트 |
| Divider | `#F2F4F6` | 카드 테두리, 구분선 |
| Background | `#FFFFFF` | 전체 배경 |
| Light Pink Background | `#FFEDF0` | 카드 배경, 진행률 바 트랙 |
| Success | `#20C997` | 목표 달성 등 긍정 상태 |
| Error | `#F04452` | 검증 오류 |

### 타이포그래피

- 시스템 기본 폰트(`-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`)
- D-day 숫자와 금액은 `tabular-nums`로 정렬

---

## 3. 기술 스택 & 폴더 구조

기존 프로젝트와 동일한 Granite(React Native)/apps-in-toss 프레임워크, TypeScript, 계산 로직(`calc.ts`)과 UI(`Screen.tsx`) 분리, 테스트 동반. 푸시 알림을 위해 pet-portrait-backend와 같은 패턴의 별도 Cloudflare Worker 백엔드를 신규로 둔다.

```
(프론트엔드)
src/
  _app.tsx
  pages/                        # createRoute 라우트 정의
    index.tsx                   # 홈(목표 리스트)
    goal-form.tsx                # 목표 추가/수정
    goal-detail.tsx               # 계산 결과 상세
    goal-report.tsx               # 상세 리포트(리워드 광고 잠금해제)
    settings.tsx                  # 알림 on/off
  features/
    goal-list/     GoalListScreen.tsx
    goal-form/      GoalFormScreen.tsx     validate.ts
    goal-detail/    GoalDetailScreen.tsx    calc.ts     # D-day/저축 계산
    goal-report/    GoalReportScreen.tsx    calc.ts     # 이자 시뮬레이션/절약 가이드
    settings/        SettingsScreen.tsx
  components/
    GoalCard.tsx
    ProgressBar.tsx
    AdContainer.tsx               # 배너
    RewardAdButton.tsx            # 리워드 영상 CTA
    InterstitialAdController.tsx  # 전면 광고 빈도 제어(3~5회당 1회)
  storage/
    goals.ts                      # AsyncStorage 로컬 CRUD
    notificationSync.ts           # 알림 대상 목표를 백엔드에 동기화
  theme/
    colors.ts
    typography.ts

(백엔드, 별도 Cloudflare Worker 프로젝트: moeuda-dday-backend)
src/
  index.ts        # API: 목표 동기화(등록/수정/삭제), 알림 동의 상태 저장
  cron.ts          # 매일 1회 실행 — D-7/D-1/D-day 대상 조회
  tossPush.ts       # mTLS 인증서 기반 Toss 푸시 API 클라이언트
wrangler.toml       # Cron Trigger 설정
```

---

## 4. 화면 구성

### 4-1. 홈 (목표 리스트)
- 등록된 목표 카드 리스트 — 카드마다 제목, D-day 숫자(크게), 진행률 바
- 빈 상태: 메인 헤드카피 + "첫 목표 만들기" CTA
- 우상단 "+" 로 목표 추가 진입, 카드 탭 시 상세로 이동

### 4-2. 목표 추가/수정
1. 타입 선택: **날짜형**(예: 시험일, 퇴사일) / **저축형**(목표 금액 모으기)
2. 날짜형 입력: 제목, 목표 날짜
3. 저축형 입력: 제목, 목표 금액, 현재 저축액, 월 저축 가능액
4. 알림 받기 토글(끄면 4-2 저장 시 백엔드 동기화 생략)
5. [저장하기] → 홈으로 복귀, 새 카드 표시

### 4-3. 계산 결과 상세
1. 히어로: D-day 숫자 크게 표시 (저축형은 예상 목표일자도 함께)
2. 저축형만: 진행률(%), 남은 금액, 필요 개월 수
3. 하단 고정 배너 광고
4. "상세 리포트 보기" CTA (리워드 광고 진입)

### 4-4. 상세 리포트 (리워드 영상 시청 후 잠금 해제)
1. 진입 팝업: "30초 광고 보고 [이자 적용 시 D-day 단축 리포트] 확인하기"
2. 리워드 영상 시청 완료 시:
   - 예적금 이자(세후) 적용 시뮬레이션: "이자 적용 시 모아야 할 일수 N일 단축"
   - 지출 절감 가이드: 프리셋 절약 항목(예: 커피 한 잔 4,500원) 선택 시 단축 일수 재계산

### 4-5. 설정
- 목표별 알림 on/off 리스트
- 최초 알림 켜기 시 알림 수신 동의 UI 노출(스마트 발송 사전 동의 플로우)

---

## 5. 계산 로직

```
[날짜형]
D-day = targetDate − 오늘 (일수)
검증: targetDate가 과거면 "이미 지난 날짜예요"

[저축형]
남은금액 = targetAmount − currentAmount
필요개월수 = ceil(남은금액 ÷ monthlySaving)
목표일자 = 오늘 + 필요개월수 개월
D-day = 목표일자 − 오늘 (일수)
진행률(%) = currentAmount ÷ targetAmount × 100
검증: targetAmount ≤ 0, currentAmount < 0, monthlySaving ≤ 0 → 인라인 오류
      currentAmount ≥ targetAmount → "이미 목표를 달성했어요!" 상태로 전환(D-day 계산 생략)

[상세 리포트 — 이자 시뮬레이션] (저축형에서만 노출)
세후 이자율(기본값 연 3.5%, 사용자 조정 가능)을 월 저축액에 단리로 반영해
단축된 필요개월수를 재계산 → 단축 일수 = 기존 D-day − 이자 적용 D-day

[상세 리포트 — 지출 절감 가이드]
프리셋 절약액(예: 커피 4,500원/일)을 monthlySaving에 더해 재계산 →
단축 일수 = 기존 D-day − 절감 적용 D-day
```

---

## 6. 데이터 구조

```
Goal {
  id, type: 'date' | 'money', title,
  targetDate?: string,          // 날짜형에서 사용자가 입력, 저축형은 계산 결과를 캐시
  targetAmount?: number, currentAmount?: number, monthlySaving?: number,
  notifyEnabled: boolean,
  createdAt
}
```

- 로컬 저장(AsyncStorage)이 기준(Source of Truth). `notifyEnabled === true`인 목표만 `anonKey` 기준으로 백엔드에 동기화(제목·targetDate·최종 수정 시각).
- 저축형은 저축액/월저축액이 바뀔 때마다 목표일자를 재계산해 백엔드에도 갱신 동기화.

---

## 7. 백엔드 & 푸시 알림

Toss 푸시는 파트너 서버가 mTLS 인증서로 Toss API(`send-test-message`/대량 발송 API)를 직접 호출하는 구조라 클라이언트 단독으로는 개인화 알림을 보낼 수 없다. pet-portrait-backend와 동일한 패턴으로 신규 Cloudflare Worker(`moeuda-dday-backend`)를 둔다.

- **동기화 API**: 프론트엔드가 알림 켠 목표를 등록/수정/삭제할 때 호출 — `anonKey`, 목표 제목, `targetDate` 저장
- **Cron Trigger(매일 1회)**: 오늘 기준 `targetDate − 오늘 ∈ {7, 1, 0}`인 목표를 조회해 D-7/D-1/D-day 알림 발송
- **알림 동의**: 최초로 알림을 켜는 시점에 스마트 발송 사전 동의 UI를 요청하고, 동의 결과 콜백을 저장해 이후 발송 여부를 결정
- 메시지 템플릿은 사전에 콘솔에서 문구 검수·승인 필요(운영 배포 전 확인)

---

## 8. 광고 배치 원칙

기존 프로젝트(척척계산기 등)와 동일한 원칙을 따른다:
- 결과 상세 화면 하단 고정 배너, 네이티브 "목표 달성 팁" 톤으로 자연스럽게 배치
- 배너 새로고침을 버튼 클릭에 연동하지 않음(광고 SDK 자체 주기에만 맡김)
- 리워드 영상은 "상세 리포트 보기" CTA를 명시적으로 눌렀을 때만 노출, 강제 시청 없음
- 전면 광고는 재계산/다시 계산하기를 3~5회 반복할 때 1회만 노출(빈도 제한 적용, 매번 띄우지 않음)
- 사업자 등록이 완료된 워크스페이스이므로 MVP부터 실제 광고 SDK(AdMob 등) 연동

---

## 9. 검증 규칙

- 제목 미입력 시 저장 불가
- 날짜형: 목표 날짜가 과거면 "이미 지난 날짜예요" 인라인 오류
- 저축형: 목표금액 ≤ 0, 현재저축액 < 0, 월저축가능액 ≤ 0 → 각 입력창 아래 인라인 오류(음수는 입력 단계부터 방지)
- 저축형: 현재저축액 ≥ 목표금액이면 "이미 목표를 달성했어요!" 상태(축하 카드, D-day 계산 생략)

---

## 10. 공통 컴포넌트

`GoalCard`(리스트 카드, 타입별 표시 분기), `ProgressBar`, `AdContainer`, `RewardAdButton`, `InterstitialAdController` — 기존 프로젝트와 별도 프로젝트라 코드는 공유하지 않지만 톤(디자인 토큰 기반, 계산 로직과 UI 분리, 테스트 동반)은 동일하게 따른다.

---

## 11. 아이콘 에셋

돼지저금통 + "D-day 034 일 남음" + 진행률 바(85%) 컨셉의 아이콘 이미지 확보 완료(`C:\Users\User\Downloads\Gemini_Generated_Image_ia74eria74eria74.png`). 프로젝트 스캐폴딩 시 `assets/icon.png`로 복사해 콘솔 앱 아이콘으로 사용한다.

## 12. 메인 화면 카피

- **헤드카피(확정, 옵션 A)**: "월급날만 기다리지 말고, 목표 달성날을 기다리세요"
- **서브카피**: "하루에 딱 커피 한 잔값만 아껴도 D-day가 앞당겨져요."

---

## 13. 구현 순서

1. 콘솔 앱 신규 등록(앱 이름 확정, 아이콘 업로드)
2. 프론트엔드 프로젝트 스캐폴딩(Granite) — 디자인 토큰, 공통 컴포넌트
3. 목표 CRUD(로컬 저장) + 홈/추가·수정 화면
4. D-day/저축 계산 로직 + 결과 상세 화면
5. 배너 광고 연동
6. 리워드 광고 + 상세 리포트 화면(이자 시뮬레이션, 절약 가이드)
7. 전면 광고(재계산 빈도 제한) 연동
8. 백엔드 프로젝트 스캐폴딩(Cloudflare Worker) — 목표 동기화 API
9. Toss 푸시 API mTLS 연동 + Cron Trigger
10. 알림 동의 UI + 설정 화면(알림 on/off)
11. 모바일 UX 검증

각 단계 완료 시마다 이전 기능이 정상 동작하는지 확인 후 다음 단계로 진행한다.
