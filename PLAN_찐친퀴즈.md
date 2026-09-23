# 찐친 퀴즈 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서버·포인트 없이 공유 링크에 퀴즈를 담는 "나를 얼마나 알까?" 친구 퀴즈 토스 미니앱을 만들어 콘솔 테스트 푸시까지 완료한다.

**Architecture:** 앱인토스 RN(Granite) 미니앱. 핵심 로직(문제 은행·퀴즈 코드 인코딩·점수)은 `src/lib`의 순수 함수로 두고 jest로 검증한다. 화면 5개(홈/만들기/완성/풀기/결과)는 이 함수들만 호출한다.

**Tech Stack:** `@apps-in-toss/framework` 2.10.x, `@granite-js/react-native` 1.0.43, React Native 0.84, TypeScript, jest.

**Spec:** `C:\Users\User\-\SPEC_찐친퀴즈.md`

## Global Constraints

- 프로젝트 폴더: `C:\Users\User\jjinchin-quiz` (git 저장소 아님 — 형제 프로젝트들과 동일)
- 틀: `C:\Users\User\nearby-convenience-store`에서 설정 파일 복사
- 워크스페이스 77253, title `찐친 퀴즈`, titleEn `Best Friend Quiz`, appName `jjinchin-quiz`, 카테고리 3834 / 서브 72
- 저장소는 `Storage`(@apps-in-toss/framework)만 사용, AsyncStorage 금지
- 화면 안 자체 뒤로가기 버튼 금지, 자동 전면 광고 금지
- 광고: 개발 중 테스트 ID(`ait-ad-test-banner-id`, `ait-ad-test-rewarded-id`), 제출 직전에만 실제 ID
- `AdBanner` 컨테이너 높이 96 + `overflow:'hidden'`, `InlineAd`에 `impressFallbackOnMount`
- 문제 은행은 추가만 가능, id 1~255, 보기 2~4개
- 닉네임 1~8자(trim 후), 조사 토큰 `{이}`/`{은}`/`{의}`

---

### Task 1: 프로젝트 틀

**Files:** Create `C:\Users\User\jjinchin-quiz\` — `package.json`(name `jjinchin-quiz`), `granite.config.ts`, 설정 파일 일체(babel/tsconfig/eslint/jest/index/require.context/_404/_app) 복사

- [ ] nearby-convenience-store의 설정 파일 복사, `package.json` name 변경
- [ ] `granite.config.ts`: appName `jjinchin-quiz`, displayName `찐친 퀴즈`, primaryColor `#FF6B8A`, permissions `[]`, icon은 Task 8에서 채움
- [ ] `npm install`, Windows 경로 버그 2건 패치(`@granite-js/plugin-micro-frontend/dist/index.js`, `@apps-in-toss/plugin-compat/dist/index.js`에 `.replace(/\\/g, "/")`)
- [ ] `npx jest --passWithNoTests` 통과 확인

### Task 2: 문제 은행 (`src/lib/questions.ts`)

**Produces:**
```ts
export interface Question { id: number; text: string; options: string[] }
export const QUESTIONS: Question[];                 // 스펙 3절 40문제 그대로
export function getQuestion(id: number): Question | undefined;
export type RenderMode = 'self' | 'friend';
export function renderQuestion(text: string, mode: RenderMode, nickname: string): string;
export function pickRandomQuestionIds(count: number, exclude?: number[]): number[];
```
- [ ] 테스트 `src/lib/__tests__/questions.test.ts`: id 유일·1~255·보기 2~4개, `renderQuestion('{이} 좋아하는', 'friend', '민지') === '민지님이 좋아하는'`, self 모드 `내가`/`나는`/`나의`, `pickRandomQuestionIds(5)` 길이 5·중복 없음·exclude 제외
- [ ] 실패 확인 → 구현 → 통과

### Task 3: 퀴즈 코드 (`src/lib/quizCode.ts`)

**Produces:**
```ts
export interface QuizData { nickname: string; items: { questionId: number; answer: number }[] }
export function encodeQuiz(quiz: QuizData): string;
export function decodeQuiz(code: string | undefined | null): QuizData | null;
```
바이트 `[1][N][닉네임 UTF-8][qid,ans]×5` → 키 `jjinchin` 반복 XOR → base64url(패딩 없음). UTF-8/base64url 직접 구현.
- [ ] 테스트: 한글/영문/이모지 닉네임 왕복, 빈 문자열·깨진 문자·버전 2·없는 qid·답 범위 초과·중복 qid·남는 바이트·4쌍·닉네임 9자 → null
- [ ] 실패 확인 → 구현 → 통과

### Task 4: 점수 (`src/lib/score.ts`)

**Produces:**
```ts
export function scoreAnswers(quiz: QuizData, friendAnswers: number[]): number;
export function gradeFor(score: number): string; // 5 찐친 인정 👑 / 3~4 꽤 아는 사이 😎 / 1~2 좀 더 친해져요 🙂 / 0 처음 뵙겠습니다… 🙇
export function encodeAnswers(a: number[]): string; // "01203"
export function decodeAnswers(s: string | undefined, quiz: QuizData): number[] | null;
```
- [ ] 테스트: 경계값 0/1/2/3/4/5, 답 문자열 왕복·길이/범위 오류 → null
- [ ] 실패 확인 → 구현 → 통과

### Task 5: 공통 모듈 (config / storage / share / ads / AdBanner)

**Produces:** `APP_NAME`, `OG_IMAGE_URL`; `MyQuizStore.get(): Promise<string|null>`, `MyQuizStore.set(code)`; `shareQuiz(quiz, code)`, `shareResult(nickname, score)`; `BANNER_AD_GROUP_ID`, `REWARDED_AD_GROUP_ID`, `preloadFullScreenAd`, `showFullScreen`; `<AdBanner />`
- [ ] 가까운편의점 ads.ts/AdBanner.tsx 패턴 이식(테스트 ID), share.ts는 `getTossShareLink` + `share`
- [ ] `tsc --noEmit` 통과

### Task 6: 홈 / 만들기 / 완성 화면

- [ ] `/`: 제목·설명, "내 퀴즈 만들기", 저장된 코드 있으면 "내 퀴즈 다시 공유하기", AdBanner
- [ ] `/create`: 닉네임 → 5문제(문제별 "다른 문제", self 모드 문장) → 답 선택 → "완성"(닉네임 유효 + 5개 답) → encode → `/done?d=`
- [ ] `/done`: 저장 후 "친구에게 보내기"
- [ ] `granite dev`로 router.gen.ts 갱신, tsc/eslint 통과

### Task 7: 풀기 / 결과 화면

- [ ] `/play?d=`: decode 실패 → 안내 + "나도 만들기". 성공 → 시작 화면 → 한 문제씩(friend 모드) → `/result?d=&a=`
- [ ] `/result`: 점수·등급, "결과 공유하기", "광고 보고 틀린 문제 확인하기"(리워드 성공 시 문제별 친구 답/정답 공개, 실패 시 안내), "나도 만들기", AdBanner
- [ ] tsc/eslint/jest 통과

### Task 8: 콘솔 등록 · 빌드 · 테스트 푸시

- [ ] 600x600 불투명 정사각형 아이콘 생성 → `image_upload_url` → `miniapp_create`
- [ ] OG 이미지 1200x630을 `-` 저장소(GitHub Pages)에 올리고 `OG_IMAGE_URL` 반영
- [ ] 광고 그룹 생성(배너 "찐친퀴즈 배너", 리워드 "찐친퀴즈 오답확인 리워드") — 실제 ID는 ads.ts 주석으로만 보관
- [ ] `ait build` → `bundle_upload` → PUT → `bundle_upload_complete` → CREATED 확인 → `bundle_test_push`
- [ ] 메모리에 프로젝트 상태 기록
