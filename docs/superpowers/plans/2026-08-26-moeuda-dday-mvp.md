# 모으다 보니 D-day Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the MVP of 모으다 보니 D-day — a Toss mini-app that lets users register multiple date-type and savings-type D-day goals, see live D-day/progress calculations, unlock an interest-simulation + spending-cut report behind a reward ad, and receive D-7/D-1/D-day push reminders via a new Cloudflare Worker backend.

**Architecture:** Frontend is a Granite/`@apps-in-toss/framework` React Native app (same toolchain as `chuck-chuck-calculator`/`pet-portrait`, separate project/console app). Pure calculation logic lives in `calc.ts` files per feature, fully unit-tested; screens are thin React Native components that call calc functions and local `Storage` CRUD. A new, separate Cloudflare Worker backend (`moeuda-dday-backend`, modeled on `pet-portrait-backend`) stores which goals have notifications enabled (title + target date, keyed by anonymous user key) and runs a daily Cron Trigger that matches goals at D-7/D-1/D-day and pushes reminders through Toss's mTLS-authenticated server API.

**Tech Stack:** TypeScript, React Native (Granite), Jest + `@testing-library/react-native` (frontend); Cloudflare Workers, D1 (SQLite), Vitest (backend); `@apps-in-toss/framework` (`Storage`, `InlineAd`, `loadFullScreenAd`/`showFullScreenAd`, `requestNotificationAgreement`, `User.getAnonymousKey`).

**Spec:** `C:\Users\User\-\PLAN_모으다보니Dday.md`

## Global Constraints

- appName (console identifier): `moeuda-dday` — lowercase/hyphens only, cannot be changed after creation
- title: `모으다 보니 D-day` / titleEn: `Moeuda D-day` (no English title was specified in the spec — this is a reasonable direct-transliteration choice, confirm with the user if they want something else before submitting for review)
- Color tokens (from spec §2): Primary Coral Pink `#FF7A8A`, Accent Gold `#F5B841`, Dark Text `#191F28`, Secondary Text `#8B95A1`, Divider `#F2F4F6`, Background `#FFFFFF`, Light Pink Background `#FFEDF0`, Success `#20C997`, Error `#F04452`
- workspaceId: `77253`, business/operator: 육퇴못한파더 작업실 (same workspace as chuck-chuck-calculator/menu-cost-calculator/lucky-lotto/today-fortune-daily — business registration already complete, so real ad SDK integration is in scope from the MVP per spec §8)
- MVP scope (spec §1, §13): goal list (date-type + savings-type) → calc result detail → reward-ad-gated detail report → banner + interstitial + reward ads → per-goal push notifications with a new backend. Nothing beyond spec §13's 11 steps is in scope (no social/community features, no multi-currency, no recurring/repeating goals).
- Local storage (`Storage`) is the source of truth for all goal data on-device. Only goals with `notifyEnabled === true` are synced to the backend, and only `id`/`title`/`targetDate` (never `targetAmount`/`currentAmount`/`monthlySaving`) — see spec §6.
- Ad placement rules (spec §8): banner is a fixed bottom placement on the goal detail screen, never refreshed on a button click (SDK's own cycle only); reward ad only shows after an explicit "상세 리포트 보기" tap, never forced; interstitial shows at most once per 3–5 recalculations in the report screen (this plan uses 4 as the fixed threshold, the midpoint of that range); real ad SDK (`InlineAd`, `loadFullScreenAd`/`showFullScreenAd`) is wired from the MVP, using Toss's shared test ad group IDs (`ait-ad-test-banner-id`, `ait-ad-test-rewarded-id`, `ait-ad-test-interstitial-id`) until real `adGroupId`s are issued post-review (same swap-in-later pattern as chuck-chuck-calculator's `AdContainer.tsx`).
- Copy style: all interest-simulation and spending-cut numbers in the report screen must read as reference-only estimates, never a guaranteed outcome — every such screen must carry a "참고용 계산이에요" disclaimer, matching the house style already used in `chuck-chuck-calculator`'s VAT breakdown note and `PLAN_번호조합기.md`'s "참고용/재미로" rule.
- **mTLS certificate — manual prerequisite, cannot be scripted or done via any available MCP tool.** Toss's server-to-server API (`https://apps-in-toss-api.toss.im`, used for `messenger/send-message`) requires a client certificate issued by Toss to the partner; the certificate's CN identifies the mini-app. No MCP tool in this workspace issues or manages this certificate (the `apps-in-toss-console` MCP server has no `mtls`/`certificate` tool), and the developer docs' own "서버 API 이용하기" page circularly points to a "mTLS 인증서 발급받기" document without exposing a self-service API — this mirrors the already-known pattern in `C:\Users\User\.claude\skills\apps-in-toss-miniapp\SKILL.md` §4 where business-registration and Toss Login terms agreement are console-web-only, human actions. **Before Task 11 can be completed, the user must**: (1) obtain the client certificate (`.pem`/`.crt`) and private key for `moeuda-dday` from Toss — check the 앱인토스 콘솔 (console.apps-in-toss.im) under the mini-app's server/API settings for a certificate-issuance flow, and if none is visible there, request it through the 채널톡 partner support channel linked from the developer docs; (2) hand the two files to whoever runs Task 11, who will upload them to Cloudflare via `wrangler mtls-certificate upload` (a scriptable CLI step once the files exist). Do not attempt to fabricate, self-sign, or skip this certificate — every `messenger/send-message` call will fail without it.
- Notification consent/campaign setup (spec §7's "메시지 템플릿은 사전에 콘솔에서 문구 검수·승인 필요") **is** scriptable via the `apps-in-toss-console` MCP server's `push_notification_agreement_create` / `push_template_create` / `push_send_scheduled` tools — see Task 12. This does not require a human console-web step, only the mTLS certificate above does.

---

## Task 1: Console app registration + icon + project scaffold

**Files:**
- Create: `C:\Users\User\-\moeuda-dday\package.json`, `granite.config.ts`, `tsconfig.json`, `babel.config.js`, `.gitignore`, `.prettierrc`, `eslint.config.mjs`, `react-native.config.js`, `jest.config.js`, `jest.setup.ts`, `index.ts`, `require.context.ts`, `README.md`, `pages/_404.tsx`, `src/_app.tsx`, `assets/icon.png`

**Interfaces:**
- Produces: a working, installable Granite project at `C:\Users\User\-\moeuda-dday` that `npx tsc --noEmit` and `npx jest --passWithNoTests` succeed in, and a registered console mini-app with a real `iconUri`.

- [ ] **Step 1: Check the source icon's actual dimensions**

```bash
node -e "
const fs = require('fs');
const buf = fs.readFileSync('C:/Users/User/Downloads/Gemini_Generated_Image_ia74eria74eria74.png');
const isPng = buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
console.log(JSON.stringify({ isPng, width, height, square: width === height }));
"
```

If `isPng` is false, or `square` is false, or the size isn't a clean value the console will accept (aim for 600x600, matching the icon spec used in `2026-08-24-lucky-lotto-mvp.md` Task 1 Step 1), proceed to Step 2 to resize/crop it. If it's already a square PNG at a reasonable size (e.g. 512–1024px), skip to Step 3 and use the source file as-is.

- [ ] **Step 2 (only if needed): Resize/crop to a 600x600 square PNG**

```bash
node -e "
const fs = require('fs');
const buf = fs.readFileSync('C:/Users/User/Downloads/Gemini_Generated_Image_ia74eria74eria74.png');
console.log(buf.toString('base64'));
" > "C:\Users\User\AppData\Local\Temp\claude\C--Users-User\03a42fc5-e624-470b-8b3d-fda794432d43\scratchpad\moeuda-icon-source-b64.txt"
```

Use `mcp__Claude_Browser__preview_start` with any blank URL, then `mcp__Claude_Browser__javascript_tool` (`javascript_exec`) with the base64 content pasted in to draw a cover-fit crop onto a 600x600 canvas:

```js
(() => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(600 / img.width, 600 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (600 - w) / 2, (600 - h) / 2, w, h);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = 'data:image/png;base64,<PASTE_BASE64_FROM_FILE_HERE>';
  });
})();
```

Save the returned data URL to the scratchpad, matching the lucky-lotto plan's pattern:

```bash
node -e "
const fs = require('fs');
const dataUrl = process.argv[1];
const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
fs.writeFileSync(process.argv[2], Buffer.from(base64, 'base64'));
" "<paste the returned data URL here>" "<your scratchpad dir>/moeuda-dday-icon.png"
```

- [ ] **Step 3: Upload the icon and register the console app**

Note the final icon file's byte size (`ls -la`), then call `mcp__apps-in-toss-console__image_upload_url` with `{workspaceId: 77253, extension: "png", contentLength: <byte size>}`. PUT the file to the returned `uploadUrl`:

```bash
curl -X PUT -H "Content-Type: image/png" -H "x-amz-acl: public-read" --data-binary @"<icon file path>" "<uploadUrl>"
```

Then call `mcp__apps-in-toss-console__miniapp_create` with:
```json
{
  "workspaceId": 77253,
  "request": {
    "miniApp": {
      "miniAppId": 0,
      "appName": "moeuda-dday",
      "title": "모으다 보니 D-day",
      "titleEn": "Moeuda D-day",
      "description": "여러 개의 D-day 목표를 한 번에 관리하는 저축·목표 관리 도구",
      "detailDescription": "모으다 보니 D-day는 시험일, 퇴사일 같은 날짜형 목표와, 여행 자금처럼 금액을 모으는 저축형 목표를 함께 등록하고 관리할 수 있는 미니앱이에요. 목표마다 남은 날짜와 진행률을 한눈에 확인하고, 이자를 반영하면 며칠이나 빨라지는지, 하루 지출을 줄이면 며칠이나 앞당길 수 있는지 참고용으로 시뮬레이션해볼 수 있어요. 목표일이 다가오면 D-7, D-1, D-day에 알림도 받을 수 있어요.",
      "iconUri": "<publicUrl from image_upload_url>"
    },
    "impression": {
      "categoryIds": [3834],
      "subCategoryIds": [72],
      "keywordList": ["디데이", "D-day", "저축", "목표관리", "저축계산기", "적금계산기", "목표저축"]
    }
  }
}
```

Note the returned `miniAppId` — needed for `granite.config.ts` and every later console call.

- [ ] **Step 4: Scaffold the project files**

Create `C:\Users\User\-\moeuda-dday\` and copy these files verbatim from `C:\Users\User\-\chuck-chuck-calculator\` (only the `name` field in `package.json` differs — change it to `moeuda-dday`): `package.json`, `tsconfig.json`, `babel.config.js`, `.gitignore`, `.prettierrc`, `eslint.config.mjs`, `react-native.config.js`, `jest.config.js`, `jest.setup.ts`, `index.ts`, `require.context.ts`, `README.md`, `pages/_404.tsx`, `src/_app.tsx`. Copy the (possibly resized) icon file to `assets/icon.png`.

Write `granite.config.ts`:

```ts
import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'moeuda-dday',
  plugins: [
    router(),
    hermes(),
    appsInToss({
      brand: {
        displayName: '모으다 보니 D-day',
        primaryColor: '#FF7A8A',
        icon: '<iconUri from Step 3>',
      },
      permissions: [],
    }),
  ],
});
```

- [ ] **Step 5: Install dependencies and verify the scaffold**

```bash
cd "C:/Users/User/-/moeuda-dday" && npm install
```

If `ait build` is attempted later and fails with a Windows path-escaping error or a missing hermesc win64 binary, see `C:\Users\User\.claude\skills\apps-in-toss-miniapp\SKILL.md` §2 — both are known, already-solved issues on this machine.

```bash
npx tsc --noEmit
npx jest --passWithNoTests
```
Expected: both succeed (no source files exist yet, so there's nothing to typecheck/test, but the config itself must be valid).

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/User/-/moeuda-dday" && git init && git add -A && git commit -m "chore: scaffold moeuda-dday Granite app with apps-in-toss config"
```

(Own repo, matching every sibling project — `PLAN_*.md` docs live in `-\`, but the code project itself is independently git-tracked.)

---

## Task 2: Design tokens/theme

**Files:**
- Create: `src/theme/colors.ts`, `src/theme/colors.test.ts`, `src/theme/typography.ts`, `src/theme/typography.test.ts`

**Interfaces:**
- Produces: `colors` (object), `fontSizes`/`fontWeights`/`tabularNums` — consumed by every component/screen task from here on.

- [ ] **Step 1: Write `src/theme/colors.test.ts` (failing first)**

```ts
import { colors } from './colors';

describe('colors', () => {
  it('defines every token as a 6-digit hex string', () => {
    for (const value of Object.values(colors)) {
      expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('defines the spec-required tokens', () => {
    expect(colors.primaryCoralPink).toBe('#FF7A8A');
    expect(colors.accentGold).toBe('#F5B841');
    expect(colors.lightPinkBackground).toBe('#FFEDF0');
  });
});
```

Run `cd "C:/Users/User/-/moeuda-dday" && npx jest src/theme/colors.test.ts` — expect a failure (module doesn't exist yet).

- [ ] **Step 2: Write `src/theme/colors.ts`**

```ts
export const colors = {
  primaryCoralPink: '#FF7A8A',
  accentGold: '#F5B841',
  darkText: '#191F28',
  secondaryText: '#8B95A1',
  divider: '#F2F4F6',
  background: '#FFFFFF',
  lightPinkBackground: '#FFEDF0',
  success: '#20C997',
  error: '#F04452',
} as const;

export type ColorToken = keyof typeof colors;
```

Run `npx jest src/theme/colors.test.ts` — expect pass.

- [ ] **Step 3: Write `src/theme/typography.test.ts` (failing first)**

```ts
import { fontSizes, fontWeights } from './typography';

describe('typography', () => {
  it('orders font sizes from smallest to largest as expected', () => {
    expect(fontSizes.caption).toBeLessThan(fontSizes.body);
    expect(fontSizes.body).toBeLessThan(fontSizes.title);
    expect(fontSizes.title).toBeLessThan(fontSizes.resultLarge);
  });

  it('defines bold and regular weights', () => {
    expect(fontWeights.bold).toBe('700');
    expect(fontWeights.regular).toBe('400');
  });
});
```

- [ ] **Step 4: Write `src/theme/typography.ts`**

```ts
import type { TextStyle } from 'react-native';

export const fontWeights = {
  bold: '700',
  regular: '400',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSizes = {
  caption: 13,
  body: 15,
  title: 22,
  resultLarge: 32,
} as const;

export const tabularNums: Pick<TextStyle, 'fontVariant'> = {
  fontVariant: ['tabular-nums'],
};
```

- [ ] **Step 5: Run both suites and typecheck**

```bash
npx jest src/theme
npx tsc --noEmit
```
Expected: 2 suites pass, 0 type errors.

- [ ] **Step 6: Commit**

```bash
git add src/theme && git commit -m "feat: add design tokens (colors, typography)"
```

---

## Task 3: Goal data model + local storage CRUD

**Files:**
- Create: `src/storage/goals.ts`, `src/storage/goals.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type GoalType = 'date' | 'money';
  export type Goal = {
    id: string;
    type: GoalType;
    title: string;
    targetDate?: string; // ISO 'YYYY-MM-DD' — user input for date-type, cached computed value for money-type
    targetAmount?: number;
    currentAmount?: number;
    monthlySaving?: number;
    notifyEnabled: boolean;
    createdAt: number;
  };
  export type NewGoalInput = Omit<Goal, 'id' | 'createdAt'>;
  export async function getGoals(): Promise<Goal[]>;
  export async function getGoal(id: string): Promise<Goal | undefined>;
  export async function createGoal(input: NewGoalInput): Promise<Goal>;
  export async function updateGoal(id: string, patch: Partial<NewGoalInput>): Promise<Goal | undefined>;
  export async function deleteGoal(id: string): Promise<void>;
  ```
- Consumed by: every screen task (5, 6, 7, 12) and by `GoalCard` (Task 5).

- [ ] **Step 1: Write `src/storage/goals.test.ts` (failing first)**

```ts
import { Storage } from '@apps-in-toss/framework';
import { createGoal, deleteGoal, getGoal, getGoals, updateGoal } from './goals';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(Storage);

describe('goals storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getGoals', () => {
    it('returns an empty array when nothing is stored', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      await expect(getGoals()).resolves.toEqual([]);
    });

    it('returns an empty array when the stored value is not valid JSON', async () => {
      mockedStorage.getItem.mockResolvedValue('not json');
      await expect(getGoals()).resolves.toEqual([]);
    });
  });

  describe('createGoal', () => {
    it('assigns an id and createdAt, then persists it', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      const goal = await createGoal({
        type: 'date',
        title: '수능',
        targetDate: '2027-11-18',
        notifyEnabled: false,
      });
      expect(goal.id).toEqual(expect.any(String));
      expect(goal.createdAt).toBe(1000);
      expect(mockedStorage.setItem).toHaveBeenCalledWith(
        'moeuda-dday-goals-v1',
        JSON.stringify([goal])
      );
    });
  });

  describe('getGoal', () => {
    it('finds a goal by id', async () => {
      const stored = [{ id: 'g1', type: 'date', title: '기존', notifyEnabled: false, createdAt: 100 }];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      await expect(getGoal('g1')).resolves.toMatchObject({ id: 'g1', title: '기존' });
      await expect(getGoal('missing')).resolves.toBeUndefined();
    });
  });

  describe('updateGoal', () => {
    it('patches an existing goal and persists the full list', async () => {
      const stored = [{ id: 'g1', type: 'date', title: '기존', notifyEnabled: false, createdAt: 100 }];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      const updated = await updateGoal('g1', { title: '수정됨' });
      expect(updated).toMatchObject({ id: 'g1', title: '수정됨' });
      const persisted = JSON.parse(mockedStorage.setItem.mock.calls[0]![1] as string);
      expect(persisted[0].title).toBe('수정됨');
    });

    it('returns undefined when the id does not exist', async () => {
      mockedStorage.getItem.mockResolvedValue(JSON.stringify([]));
      await expect(updateGoal('missing', { title: 'x' })).resolves.toBeUndefined();
    });
  });

  describe('deleteGoal', () => {
    it('removes the goal with the given id', async () => {
      const stored = [
        { id: 'g1', type: 'date', title: 'A', notifyEnabled: false, createdAt: 100 },
        { id: 'g2', type: 'date', title: 'B', notifyEnabled: false, createdAt: 200 },
      ];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      await deleteGoal('g1');
      const persisted = JSON.parse(mockedStorage.setItem.mock.calls[0]![1] as string);
      expect(persisted).toHaveLength(1);
      expect(persisted[0].id).toBe('g2');
    });
  });
});
```

Run `npx jest src/storage/goals.test.ts` — expect failure (module doesn't exist).

- [ ] **Step 2: Write `src/storage/goals.ts`**

```ts
import { Storage } from '@apps-in-toss/framework';

const STORAGE_KEY = 'moeuda-dday-goals-v1';

export type GoalType = 'date' | 'money';

export type Goal = {
  id: string;
  type: GoalType;
  title: string;
  targetDate?: string;
  targetAmount?: number;
  currentAmount?: number;
  monthlySaving?: number;
  notifyEnabled: boolean;
  createdAt: number;
};

export type NewGoalInput = Omit<Goal, 'id' | 'createdAt'>;

export async function getGoals(): Promise<Goal[]> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Goal[]) : [];
  } catch {
    return [];
  }
}

export async function getGoal(id: string): Promise<Goal | undefined> {
  const goals = await getGoals();
  return goals.find((goal) => goal.id === id);
}

async function persistGoals(goals: Goal[]): Promise<void> {
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // Best-effort persistence — a failed save must never crash the goal screens.
  }
}

export async function createGoal(input: NewGoalInput): Promise<Goal> {
  const goals = await getGoals();
  const goal: Goal = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  await persistGoals([...goals, goal]);
  return goal;
}

export async function updateGoal(id: string, patch: Partial<NewGoalInput>): Promise<Goal | undefined> {
  const goals = await getGoals();
  const index = goals.findIndex((goal) => goal.id === id);
  if (index === -1) return undefined;
  const updated: Goal = { ...goals[index]!, ...patch };
  const next = [...goals];
  next[index] = updated;
  await persistGoals(next);
  return updated;
}

export async function deleteGoal(id: string): Promise<void> {
  const goals = await getGoals();
  await persistGoals(goals.filter((goal) => goal.id !== id));
}
```

- [ ] **Step 3: Run tests and typecheck**

```bash
npx jest src/storage/goals.test.ts
npx tsc --noEmit
```
Expected: all pass, 0 type errors.

- [ ] **Step 4: Commit**

```bash
git add src/storage/goals.ts src/storage/goals.test.ts && git commit -m "feat: add local Goal storage CRUD"
```

---

## Task 4: D-day/savings calc logic

**Files:**
- Create: `src/lib/date.ts`, `src/lib/date.test.ts`, `src/features/goal-detail/calc.ts`, `src/features/goal-detail/calc.test.ts`

**Interfaces:**
- Produces (`src/lib/date.ts`):
  ```ts
  export function toISODate(date: Date): string;
  export function parseISODate(iso: string): Date;
  export function startOfDay(date: Date): Date;
  export function diffInDays(later: Date, earlier: Date): number;
  export function addMonths(date: Date, months: number): Date;
  ```
- Produces (`src/features/goal-detail/calc.ts`):
  ```ts
  export type DateGoalStatus = 'ok' | 'pastDate';
  export type DateGoalResult = { status: DateGoalStatus; dDay: number | null };
  export function calculateDateGoal(targetDate: string, today: Date): DateGoalResult;

  export type MoneyGoalInput = { targetAmount: number; currentAmount: number; monthlySaving: number };
  export type MoneyGoalValidationError = { targetAmount?: string; currentAmount?: string; monthlySaving?: string };
  export function validateMoneyGoalInput(input: MoneyGoalInput): MoneyGoalValidationError;
  export function isMoneyGoalAchieved(targetAmount: number, currentAmount: number): boolean;
  export function calculateRemainingAmount(targetAmount: number, currentAmount: number): number;
  export function calculateProgressPercent(currentAmount: number, targetAmount: number): number;
  export function calculateMonthsNeeded(remainingAmount: number, monthlySaving: number): number;

  export type MoneyGoalResult =
    | { status: 'achieved' }
    | { status: 'ok'; remainingAmount: number; monthsNeeded: number; targetDate: string; dDay: number; progressPercent: number };
  export function calculateMoneyGoal(input: MoneyGoalInput, today: Date): MoneyGoalResult;
  ```
- Consumed by: `GoalCard`/`GoalFormScreen` (Task 5), `GoalDetailScreen` (Task 6), `GoalReportScreen` calc (Task 7), `validate.ts` (Task 5).

- [ ] **Step 1: Write `src/lib/date.test.ts` (failing first)**

```ts
import { addMonths, diffInDays, parseISODate, startOfDay, toISODate } from './date';

describe('date utils', () => {
  it('round-trips toISODate/parseISODate', () => {
    const date = new Date(2026, 7, 26);
    expect(toISODate(date)).toBe('2026-08-26');
    expect(toISODate(parseISODate('2026-08-26'))).toBe('2026-08-26');
  });

  it('computes diffInDays between two dates', () => {
    expect(diffInDays(new Date(2026, 7, 30), new Date(2026, 7, 26))).toBe(4);
    expect(diffInDays(new Date(2026, 7, 20), new Date(2026, 7, 26))).toBe(-6);
  });

  it('normalizes time-of-day before diffing', () => {
    const later = new Date(2026, 7, 27, 23, 59);
    const earlier = new Date(2026, 7, 26, 0, 1);
    expect(diffInDays(later, earlier)).toBe(1);
  });

  it('adds whole months', () => {
    expect(toISODate(addMonths(new Date(2026, 7, 26), 3))).toBe('2026-11-26');
  });

  it('startOfDay clears the time component', () => {
    const d = startOfDay(new Date(2026, 7, 26, 15, 30));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});
```

- [ ] **Step 2: Write `src/lib/date.ts`**

```ts
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function diffInDays(later: Date, earlier: Date): number {
  const laterDay = startOfDay(later).getTime();
  const earlierDay = startOfDay(earlier).getTime();
  return Math.round((laterDay - earlierDay) / 86_400_000);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  return result;
}
```

Run `npx jest src/lib/date.test.ts` — expect pass.

- [ ] **Step 3: Write `src/features/goal-detail/calc.test.ts` (failing first)**

```ts
import {
  calculateDateGoal,
  calculateMoneyGoal,
  calculateMonthsNeeded,
  calculateProgressPercent,
  calculateRemainingAmount,
  isMoneyGoalAchieved,
  validateMoneyGoalInput,
} from './calc';

const TODAY = new Date(2026, 7, 26); // 2026-08-26

describe('calculateDateGoal', () => {
  it('returns the day count for a future date', () => {
    expect(calculateDateGoal('2026-09-05', TODAY)).toEqual({ status: 'ok', dDay: 10 });
  });

  it('returns dDay 0 for today', () => {
    expect(calculateDateGoal('2026-08-26', TODAY)).toEqual({ status: 'ok', dDay: 0 });
  });

  it('flags a past date', () => {
    expect(calculateDateGoal('2026-08-20', TODAY)).toEqual({ status: 'pastDate', dDay: null });
  });
});

describe('validateMoneyGoalInput', () => {
  it('flags a non-positive target amount', () => {
    expect(validateMoneyGoalInput({ targetAmount: 0, currentAmount: 0, monthlySaving: 10000 }).targetAmount).toBeDefined();
  });

  it('flags a negative current amount', () => {
    expect(validateMoneyGoalInput({ targetAmount: 100000, currentAmount: -1, monthlySaving: 10000 }).currentAmount).toBeDefined();
  });

  it('flags a non-positive monthly saving', () => {
    expect(validateMoneyGoalInput({ targetAmount: 100000, currentAmount: 0, monthlySaving: 0 }).monthlySaving).toBeDefined();
  });

  it('passes for valid input', () => {
    expect(validateMoneyGoalInput({ targetAmount: 100000, currentAmount: 0, monthlySaving: 10000 })).toEqual({});
  });
});

describe('isMoneyGoalAchieved / calculateRemainingAmount / calculateProgressPercent / calculateMonthsNeeded', () => {
  it('detects achievement when current >= target', () => {
    expect(isMoneyGoalAchieved(100000, 100000)).toBe(true);
    expect(isMoneyGoalAchieved(100000, 99999)).toBe(false);
  });

  it('computes remaining amount, progress percent, and months needed', () => {
    expect(calculateRemainingAmount(100000, 40000)).toBe(60000);
    expect(calculateProgressPercent(40000, 100000)).toBe(40);
    expect(calculateMonthsNeeded(60000, 20000)).toBe(3);
    expect(calculateMonthsNeeded(61000, 20000)).toBe(4); // ceil
  });
});

describe('calculateMoneyGoal', () => {
  it('returns achieved when current already meets target', () => {
    expect(calculateMoneyGoal({ targetAmount: 100000, currentAmount: 100000, monthlySaving: 10000 }, TODAY)).toEqual({
      status: 'achieved',
    });
  });

  it('computes remaining amount, months needed, target date, dDay, and progress', () => {
    const result = calculateMoneyGoal({ targetAmount: 100000, currentAmount: 40000, monthlySaving: 20000 }, TODAY);
    expect(result).toEqual({
      status: 'ok',
      remainingAmount: 60000,
      monthsNeeded: 3,
      targetDate: '2026-11-26',
      dDay: 92,
      progressPercent: 40,
    });
  });
});
```

Run `npx jest src/features/goal-detail/calc.test.ts` — expect failure.

- [ ] **Step 4: Write `src/features/goal-detail/calc.ts`**

```ts
import { addMonths, diffInDays, parseISODate, startOfDay, toISODate } from '../../lib/date';

export type DateGoalStatus = 'ok' | 'pastDate';
export type DateGoalResult = { status: DateGoalStatus; dDay: number | null };

export function calculateDateGoal(targetDate: string, today: Date): DateGoalResult {
  const dDay = diffInDays(parseISODate(targetDate), today);
  if (dDay < 0) return { status: 'pastDate', dDay: null };
  return { status: 'ok', dDay };
}

export type MoneyGoalInput = { targetAmount: number; currentAmount: number; monthlySaving: number };

export type MoneyGoalValidationError = {
  targetAmount?: string;
  currentAmount?: string;
  monthlySaving?: string;
};

export function validateMoneyGoalInput(input: MoneyGoalInput): MoneyGoalValidationError {
  const errors: MoneyGoalValidationError = {};
  if (input.targetAmount <= 0) errors.targetAmount = '목표 금액을 입력해주세요.';
  if (input.currentAmount < 0) errors.currentAmount = '현재 저축액은 0원 이상이어야 해요.';
  if (input.monthlySaving <= 0) errors.monthlySaving = '월 저축 가능액을 입력해주세요.';
  return errors;
}

export function isMoneyGoalAchieved(targetAmount: number, currentAmount: number): boolean {
  return currentAmount >= targetAmount;
}

export function calculateRemainingAmount(targetAmount: number, currentAmount: number): number {
  return targetAmount - currentAmount;
}

export function calculateProgressPercent(currentAmount: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  return Math.round((currentAmount / targetAmount) * 100);
}

export function calculateMonthsNeeded(remainingAmount: number, monthlySaving: number): number {
  return Math.ceil(remainingAmount / monthlySaving);
}

export type MoneyGoalResult =
  | { status: 'achieved' }
  | {
      status: 'ok';
      remainingAmount: number;
      monthsNeeded: number;
      targetDate: string;
      dDay: number;
      progressPercent: number;
    };

export function calculateMoneyGoal(input: MoneyGoalInput, today: Date): MoneyGoalResult {
  if (isMoneyGoalAchieved(input.targetAmount, input.currentAmount)) {
    return { status: 'achieved' };
  }
  const base = startOfDay(today);
  const remainingAmount = calculateRemainingAmount(input.targetAmount, input.currentAmount);
  const monthsNeeded = calculateMonthsNeeded(remainingAmount, input.monthlySaving);
  const targetDateObj = addMonths(base, monthsNeeded);
  return {
    status: 'ok',
    remainingAmount,
    monthsNeeded,
    targetDate: toISODate(targetDateObj),
    dDay: diffInDays(targetDateObj, base),
    progressPercent: calculateProgressPercent(input.currentAmount, input.targetAmount),
  };
}
```

- [ ] **Step 5: Run tests and typecheck**

```bash
npx jest src/lib src/features/goal-detail
npx tsc --noEmit
```
Expected: all pass, 0 type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/date.ts src/lib/date.test.ts src/features/goal-detail/calc.ts src/features/goal-detail/calc.test.ts && git commit -m "feat: add date utils and D-day/savings calc logic"
```

---

## Task 5: Goal list + add/edit screens

**Files:**
- Create: `src/components/ProgressBar.tsx`, `src/components/ProgressBar.test.tsx`, `src/components/GoalCard.tsx`, `src/components/GoalCard.test.tsx`, `src/features/goal-form/validate.ts`, `src/features/goal-form/validate.test.ts`, `src/features/goal-form/GoalFormScreen.tsx`, `src/features/goal-list/GoalListScreen.tsx`, `src/pages/index.tsx`, `src/pages/goal-form.tsx`, `pages/index.tsx`, `pages/goal-form.tsx`

**Interfaces:**
- Produces: `<ProgressBar percent testID?>`, `<GoalCard goal today? onPress testID?>`, `validateGoalForm(input, today): GoalFormValidationError`, `<GoalFormScreen mode goalId? onSaved onCancel>`, `<GoalListScreen onAddGoal onOpenGoal>` — routes `/` and `/goal-form`.
- Consumes: `Goal`/`NewGoalInput`/CRUD from Task 3, `calculateDateGoal`/`calculateMoneyGoal`/`validateMoneyGoalInput`/`calculateProgressPercent` from Task 4.

- [ ] **Step 1: Write `src/components/ProgressBar.test.tsx` then `ProgressBar.tsx`**

```tsx
// src/components/ProgressBar.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders and clamps percent into 0-100', () => {
    render(<ProgressBar testID="bar" percent={150} />);
    expect(screen.getByTestId('bar')).toBeTruthy();
    expect(screen.getByTestId('bar-fill').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })])
    );
  });

  it('clamps negative percent to 0', () => {
    render(<ProgressBar testID="bar" percent={-10} />);
    expect(screen.getByTestId('bar-fill').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '0%' })])
    );
  });
});
```

```tsx
// src/components/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export type ProgressBarProps = { percent: number; testID?: string };

export function ProgressBar({ percent, testID }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View testID={testID} style={styles.track}>
      <View testID={testID ? `${testID}-fill` : undefined} style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, backgroundColor: colors.lightPinkBackground, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.primaryCoralPink },
});
```

Run `npx jest src/components/ProgressBar.test.tsx` — expect pass.

- [ ] **Step 2: Write `src/components/GoalCard.test.tsx` then `GoalCard.tsx`**

```tsx
// src/components/GoalCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GoalCard } from './GoalCard';
import type { Goal } from '../storage/goals';

const TODAY = new Date(2026, 7, 26);

describe('GoalCard', () => {
  it('renders a date-type goal with its D-day count', () => {
    const goal: Goal = {
      id: 'g1',
      type: 'date',
      title: '수능',
      targetDate: '2026-09-05',
      notifyEnabled: false,
      createdAt: 0,
    };
    render(<GoalCard testID="card" goal={goal} today={TODAY} onPress={jest.fn()} />);
    expect(screen.getByText('수능')).toBeTruthy();
    expect(screen.getByText('D-10')).toBeTruthy();
  });

  it('renders a money-type goal with progress bar', () => {
    const goal: Goal = {
      id: 'g2',
      type: 'money',
      title: '여행자금',
      targetAmount: 1000000,
      currentAmount: 400000,
      monthlySaving: 100000,
      notifyEnabled: false,
      createdAt: 0,
    };
    render(<GoalCard testID="card" goal={goal} today={TODAY} onPress={jest.fn()} />);
    expect(screen.getByText('여행자금')).toBeTruthy();
    expect(screen.getByTestId('card-progress')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const goal: Goal = { id: 'g1', type: 'date', title: 'A', targetDate: '2026-09-05', notifyEnabled: false, createdAt: 0 };
    render(<GoalCard testID="card" goal={goal} today={TODAY} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

```tsx
// src/components/GoalCard.tsx
import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { calculateDateGoal, calculateProgressPercent } from '../features/goal-detail/calc';
import type { Goal } from '../storage/goals';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights, tabularNums } from '../theme/typography';
import { ProgressBar } from './ProgressBar';

export type GoalCardProps = { goal: Goal; today?: Date; onPress: () => void; testID?: string };

export function GoalCard({ goal, today = new Date(), onPress, testID }: GoalCardProps) {
  const dDayResult = goal.targetDate ? calculateDateGoal(goal.targetDate, today) : null;
  const dDayLabel = !dDayResult
    ? '-'
    : dDayResult.status === 'pastDate'
      ? '지남'
      : dDayResult.dDay === 0
        ? 'D-day'
        : `D-${dDayResult.dDay}`;

  return (
    <TouchableOpacity testID={testID} style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{goal.title}</Text>
      <Text style={[styles.dDay, tabularNums]}>{dDayLabel}</Text>
      {goal.type === 'money' && goal.targetAmount !== undefined && goal.currentAmount !== undefined ? (
        <ProgressBar
          testID={testID ? `${testID}-progress` : undefined}
          percent={calculateProgressPercent(goal.currentAmount, goal.targetAmount)}
        />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  title: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 6 },
  dDay: { fontSize: fontSizes.resultLarge, fontWeight: fontWeights.bold, color: colors.primaryCoralPink, marginBottom: 8 },
});
```

- [ ] **Step 3: Run and commit shared components**

```bash
npx jest src/components
npx tsc --noEmit
git add src/components/ProgressBar.tsx src/components/ProgressBar.test.tsx src/components/GoalCard.tsx src/components/GoalCard.test.tsx && git commit -m "feat: add ProgressBar and GoalCard components"
```

- [ ] **Step 4: Write `src/features/goal-form/validate.test.ts` then `validate.ts`**

```ts
// src/features/goal-form/validate.test.ts
import { validateGoalForm } from './validate';

const TODAY = new Date(2026, 7, 26);

describe('validateGoalForm', () => {
  it('requires a title', () => {
    const errors = validateGoalForm(
      { type: 'date', title: '', targetDate: '2026-09-05', targetAmount: '', currentAmount: '', monthlySaving: '' },
      TODAY
    );
    expect(errors.title).toBeDefined();
  });

  it('flags a past target date for date-type goals', () => {
    const errors = validateGoalForm(
      { type: 'date', title: '시험', targetDate: '2026-08-01', targetAmount: '', currentAmount: '', monthlySaving: '' },
      TODAY
    );
    expect(errors.targetDate).toBe('이미 지난 날짜예요');
  });

  it('accepts a valid date-type goal', () => {
    const errors = validateGoalForm(
      { type: 'date', title: '시험', targetDate: '2026-09-05', targetAmount: '', currentAmount: '', monthlySaving: '' },
      TODAY
    );
    expect(errors).toEqual({});
  });

  it('flags invalid money-type numeric fields', () => {
    const errors = validateGoalForm(
      { type: 'money', title: '여행', targetDate: '', targetAmount: '0', currentAmount: '-1', monthlySaving: '0' },
      TODAY
    );
    expect(errors.targetAmount).toBeDefined();
    expect(errors.currentAmount).toBeDefined();
    expect(errors.monthlySaving).toBeDefined();
  });

  it('accepts a valid money-type goal', () => {
    const errors = validateGoalForm(
      { type: 'money', title: '여행', targetDate: '', targetAmount: '1000000', currentAmount: '0', monthlySaving: '100000' },
      TODAY
    );
    expect(errors).toEqual({});
  });
});
```

```ts
// src/features/goal-form/validate.ts
import { calculateDateGoal, validateMoneyGoalInput } from '../goal-detail/calc';
import type { GoalType } from '../../storage/goals';

export type GoalFormInput = {
  type: GoalType;
  title: string;
  targetDate: string;
  targetAmount: string;
  currentAmount: string;
  monthlySaving: string;
};

export type GoalFormValidationError = {
  title?: string;
  targetDate?: string;
  targetAmount?: string;
  currentAmount?: string;
  monthlySaving?: string;
};

export function validateGoalForm(input: GoalFormInput, today: Date): GoalFormValidationError {
  const errors: GoalFormValidationError = {};
  if (!input.title.trim()) {
    errors.title = '제목을 입력해주세요.';
  }

  if (input.type === 'date') {
    if (!input.targetDate) {
      errors.targetDate = '목표 날짜를 선택해주세요.';
    } else if (calculateDateGoal(input.targetDate, today).status === 'pastDate') {
      errors.targetDate = '이미 지난 날짜예요';
    }
    return errors;
  }

  const moneyErrors = validateMoneyGoalInput({
    targetAmount: Number(input.targetAmount) || 0,
    currentAmount: input.currentAmount === '' ? -1 : Number(input.currentAmount),
    monthlySaving: Number(input.monthlySaving) || 0,
  });
  return { ...errors, ...moneyErrors };
}
```

Note: `currentAmount === '' ? -1 : Number(...)` treats a blank field as invalid (negative), matching spec §9's "현재저축액 < 0" rule rather than silently treating blank as 0.

- [ ] **Step 5: Run and commit validation**

```bash
npx jest src/features/goal-form/validate.test.ts
npx tsc --noEmit
git add src/features/goal-form/validate.ts src/features/goal-form/validate.test.ts && git commit -m "feat: add goal form validation"
```

- [ ] **Step 6: Write `src/features/goal-form/GoalFormScreen.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { calculateMoneyGoal } from '../goal-detail/calc';
import { createGoal, getGoal, updateGoal, type GoalType } from '../../storage/goals';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';
import { validateGoalForm, type GoalFormValidationError } from './validate';

export type GoalFormScreenProps =
  | { mode: 'create'; onSaved: () => void; onCancel: () => void }
  | { mode: 'edit'; goalId: string; onSaved: () => void; onCancel: () => void };

export function GoalFormScreen(props: GoalFormScreenProps) {
  const [type, setType] = useState<GoalType>('date');
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlySaving, setMonthlySaving] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [errors, setErrors] = useState<GoalFormValidationError>({});

  useEffect(() => {
    if (props.mode !== 'edit') return;
    getGoal(props.goalId).then((goal) => {
      if (!goal) return;
      setType(goal.type);
      setTitle(goal.title);
      setTargetDate(goal.type === 'date' ? goal.targetDate ?? '' : '');
      setTargetAmount(goal.targetAmount !== undefined ? String(goal.targetAmount) : '');
      setCurrentAmount(goal.currentAmount !== undefined ? String(goal.currentAmount) : '');
      setMonthlySaving(goal.monthlySaving !== undefined ? String(goal.monthlySaving) : '');
      setNotifyEnabled(goal.notifyEnabled);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode]);

  const handleSave = async () => {
    const today = new Date();
    const validationErrors = validateGoalForm(
      { type, title, targetDate, targetAmount, currentAmount, monthlySaving },
      today
    );
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    let resolvedTargetDate: string | undefined;
    let achieved = false;
    if (type === 'money') {
      const result = calculateMoneyGoal(
        { targetAmount: Number(targetAmount), currentAmount: Number(currentAmount), monthlySaving: Number(monthlySaving) },
        today
      );
      achieved = result.status === 'achieved';
      resolvedTargetDate = result.status === 'ok' ? result.targetDate : undefined;
    } else {
      resolvedTargetDate = targetDate;
    }

    const input = {
      type,
      title: title.trim(),
      targetDate: resolvedTargetDate,
      targetAmount: type === 'money' ? Number(targetAmount) : undefined,
      currentAmount: type === 'money' ? Number(currentAmount) : undefined,
      monthlySaving: type === 'money' ? Number(monthlySaving) : undefined,
      // 알림 동의·백엔드 동기화는 Task 12(SettingsScreen)에서 연결한다 — 여기서는 로컬 플래그만 저장한다.
      notifyEnabled: achieved ? false : notifyEnabled,
    };

    if (props.mode === 'create') {
      await createGoal(input);
    } else {
      await updateGoal(props.goalId, input);
    }
    props.onSaved();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.header}>{props.mode === 'create' ? '목표 추가' : '목표 수정'}</Text>

      <View style={styles.typeRow}>
        <TouchableOpacity
          testID="type-date"
          style={[styles.typeButton, type === 'date' && styles.typeButtonActive]}
          onPress={() => setType('date')}>
          <Text style={[styles.typeButtonText, type === 'date' && styles.typeButtonTextActive]}>날짜형</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="type-money"
          style={[styles.typeButton, type === 'money' && styles.typeButtonActive]}
          onPress={() => setType('money')}>
          <Text style={[styles.typeButtonText, type === 'money' && styles.typeButtonTextActive]}>저축형</Text>
        </TouchableOpacity>
      </View>

      <Field label="제목" testID="input-title" value={title} onChangeText={setTitle} placeholder="예: 수능, 여행자금" error={errors.title} />

      {type === 'date' ? (
        <Field
          label="목표 날짜 (YYYY-MM-DD)"
          testID="input-target-date"
          value={targetDate}
          onChangeText={setTargetDate}
          placeholder="2027-01-01"
          error={errors.targetDate}
        />
      ) : (
        <>
          <Field
            label="목표 금액"
            testID="input-target-amount"
            value={targetAmount}
            onChangeText={(t) => setTargetAmount(t.replace(/[^0-9]/g, ''))}
            placeholder="0"
            keyboardType="number-pad"
            error={errors.targetAmount}
          />
          <Field
            label="현재 저축액"
            testID="input-current-amount"
            value={currentAmount}
            onChangeText={(t) => setCurrentAmount(t.replace(/[^0-9]/g, ''))}
            placeholder="0"
            keyboardType="number-pad"
            error={errors.currentAmount}
          />
          <Field
            label="월 저축 가능액"
            testID="input-monthly-saving"
            value={monthlySaving}
            onChangeText={(t) => setMonthlySaving(t.replace(/[^0-9]/g, ''))}
            placeholder="0"
            keyboardType="number-pad"
            error={errors.monthlySaving}
          />
        </>
      )}

      <TouchableOpacity testID="notify-toggle" style={styles.checkboxRow} onPress={() => setNotifyEnabled((v) => !v)}>
        <View style={[styles.checkbox, notifyEnabled && styles.checkboxChecked]} />
        <Text style={styles.checkboxLabel}>목표일이 다가오면 알림 받기</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="save-button" style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>저장하기</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="cancel-button" style={styles.cancelButton} onPress={props.onCancel}>
        <Text style={styles.cancelButtonText}>취소</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({
  label,
  testID,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
}: {
  label: string;
  testID: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={testID}
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        keyboardType={keyboardType ?? 'default'}
      />
      {error ? (
        <Text testID={`${testID}-error`} style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  header: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 20 },
  typeRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  typeButton: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  typeButtonActive: { backgroundColor: colors.primaryCoralPink, borderColor: colors.primaryCoralPink },
  typeButtonText: { color: colors.darkText, fontWeight: fontWeights.bold },
  typeButtonTextActive: { color: '#FFFFFF' },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: fontSizes.caption, color: colors.secondaryText, marginBottom: 6 },
  input: { height: 44, borderWidth: 1, borderColor: colors.divider, borderRadius: 8, paddingHorizontal: 12, fontSize: fontSizes.body, color: colors.darkText },
  inputError: { borderColor: colors.error },
  errorText: { fontSize: 12, color: colors.error, marginTop: 4 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.secondaryText, marginRight: 10 },
  checkboxChecked: { backgroundColor: colors.primaryCoralPink, borderColor: colors.primaryCoralPink },
  checkboxLabel: { fontSize: fontSizes.body, color: colors.darkText },
  saveButton: { height: 52, borderRadius: 14, backgroundColor: colors.primaryCoralPink, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  saveButtonText: { color: '#FFFFFF', fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  cancelButton: { height: 44, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: colors.secondaryText, fontSize: fontSizes.body },
});
```

- [ ] **Step 7: Write `src/features/goal-list/GoalListScreen.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GoalCard } from '../../components/GoalCard';
import { deleteGoal, getGoals, type Goal } from '../../storage/goals';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

export type GoalListScreenProps = {
  onAddGoal: () => void;
  onOpenGoal: (id: string) => void;
  onOpenSettings: () => void;
};

export function GoalListScreen({ onAddGoal, onOpenGoal, onOpenSettings }: GoalListScreenProps) {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    getGoals().then(setGoals);
  }, []);

  const handleDelete = (goal: Goal) => {
    Alert.alert('목표 삭제', `"${goal.title}" 목표를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteGoal(goal.id);
          setGoals(await getGoals());
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>모으다 보니 D-day</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity testID="settings-button" onPress={onOpenSettings} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>설정</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="add-goal-button" onPress={onAddGoal} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>+ 추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyHeadline}>월급날만 기다리지 말고,{'\n'}목표 달성날을 기다리세요</Text>
          <Text style={styles.emptySubline}>하루에 딱 커피 한 잔값만 아껴도 D-day가 앞당겨져요.</Text>
          <TouchableOpacity testID="empty-add-goal-button" style={styles.emptyCta} onPress={onAddGoal}>
            <Text style={styles.emptyCtaText}>첫 목표 만들기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          testID="goal-list"
          data={goals}
          keyExtractor={(goal) => goal.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GoalCard
              testID={`goal-card-${item.id}`}
              goal={item}
              onPress={() => onOpenGoal(item.id)}
              onLongPress={() => handleDelete(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.darkText },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerButton: { paddingVertical: 6, paddingHorizontal: 10 },
  headerButtonText: { color: colors.primaryCoralPink, fontWeight: fontWeights.bold, fontSize: fontSizes.caption },
  list: { paddingTop: 12, paddingBottom: 32 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyHeadline: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.darkText, textAlign: 'center', marginBottom: 12 },
  emptySubline: { fontSize: fontSizes.body, color: colors.secondaryText, textAlign: 'center', marginBottom: 24 },
  emptyCta: { height: 52, paddingHorizontal: 24, borderRadius: 14, backgroundColor: colors.primaryCoralPink, alignItems: 'center', justifyContent: 'center' },
  emptyCtaText: { color: '#FFFFFF', fontSize: fontSizes.body, fontWeight: fontWeights.bold },
});
```

Note: `GoalCard`'s `onLongPress` prop is added here — go back and add an optional `onLongPress?: () => void` prop to `src/components/GoalCard.tsx`'s `GoalCardProps` and wire it onto the `TouchableOpacity`, since Step 2 didn't anticipate delete-by-long-press. Re-run `npx jest src/components/GoalCard.test.tsx` after the edit to confirm the existing tests still pass (the prop is optional, so no test changes needed).

- [ ] **Step 8: Wire up routes**

```tsx
// src/pages/index.tsx
import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { GoalListScreen } from '../features/goal-list/GoalListScreen';

export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return (
    <GoalListScreen
      onAddGoal={() => navigation.navigate('/goal-form', { mode: 'create' })}
      onOpenGoal={(id) => navigation.navigate('/goal-detail', { id })}
      onOpenSettings={() => navigation.navigate('/settings', {})}
    />
  );
}
```

```tsx
// src/pages/goal-form.tsx
import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { GoalFormScreen } from '../features/goal-form/GoalFormScreen';

export const Route = createRoute('/goal-form', {
  validateParams: (params) => params as { mode: 'create' } | { mode: 'edit'; id: string },
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const onSaved = () => navigation.navigate('/', {});
  const onCancel = () => navigation.goBack();
  if (params.mode === 'edit') {
    return <GoalFormScreen mode="edit" goalId={params.id} onSaved={onSaved} onCancel={onCancel} />;
  }
  return <GoalFormScreen mode="create" onSaved={onSaved} onCancel={onCancel} />;
}
```

```ts
// pages/index.tsx
export { Route } from 'pages/index';
```
```ts
// pages/goal-form.tsx
export { Route } from 'pages/goal-form';
```

Note: `/goal-detail` and `/settings` aren't registered yet (Tasks 6 and 12 add them) — `navigation.navigate` calls to those routes will fail until then. Run `npx granite dev` for ~15s and kill it after Task 6/12 add their route files, to regenerate `src/router.gen.ts`; until then, typecheck may flag the string-literal route names as not-yet-known — that's expected mid-plan and resolves once all pages exist.

- [ ] **Step 9: Regenerate router types, typecheck, test**

```bash
npx granite dev &
sleep 15
kill %1
npx tsc --noEmit
npx jest src/features/goal-form src/features/goal-list src/components/GoalCard.test.tsx
npx eslint src/features/goal-form src/features/goal-list src/pages
```
Expected: router.gen.ts regenerated, tests pass. Some route-name type errors are expected until Task 6/12 land (see Step 8 note) — confirm no *other* type errors remain.

- [ ] **Step 10: Commit**

```bash
git add src/components/GoalCard.tsx src/features/goal-form src/features/goal-list src/pages/index.tsx src/pages/goal-form.tsx pages/index.tsx pages/goal-form.tsx src/router.gen.ts && git commit -m "feat: add goal list and add/edit screens"
```

---

## Task 6: Goal detail screen + banner ad

**Files:**
- Create: `src/components/AdContainer.tsx`, `src/features/goal-detail/GoalDetailScreen.tsx`, `src/pages/goal-detail.tsx`, `pages/goal-detail.tsx`

**Interfaces:**
- Produces: `<AdContainer>`, `<GoalDetailScreen goal onEdit onOpenReport>` — route `/goal-detail`.
- Consumes: `Goal`/`getGoal` (Task 3), `calculateDateGoal`/`calculateRemainingAmount`/`calculateProgressPercent`/`calculateMonthsNeeded`/`isMoneyGoalAchieved` (Task 4).

- [ ] **Step 1: Write `src/components/AdContainer.tsx`**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InlineAd } from '@apps-in-toss/framework';

// 콘솔에서 발급받은 배너 광고 그룹 ID로 교체할 것. 실 groupId가 반영되기 전까지는
// 정책 위반 방지를 위해 반드시 테스트 ID를 쓴다 (chuck-chuck-calculator/AdContainer.tsx와 동일 패턴).
const AD_GROUP_ID = 'ait-ad-test-banner-id';

// 결과 상세 화면 하단에 항상 고정 배치한다(PLAN_모으다보니Dday.md §8).
// 재계산/저장 등 버튼 클릭에 새로고침을 연동하지 않는다 — SDK 자체 주기에만 맡긴다.
export function AdContainer() {
  return (
    <View testID="ad-container" style={styles.container}>
      <InlineAd
        adGroupId={AD_GROUP_ID}
        impressFallbackOnMount
        onNoFill={(payload) => console.warn('배너 광고 재고 없음', payload)}
        onAdFailedToRender={(payload) => console.warn('배너 광고 렌더 실패', payload)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: 96, overflow: 'hidden' },
});
```

- [ ] **Step 2: Write `src/features/goal-detail/GoalDetailScreen.tsx`**

```tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AdContainer } from '../../components/AdContainer';
import { ProgressBar } from '../../components/ProgressBar';
import type { Goal } from '../../storage/goals';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights, tabularNums } from '../../theme/typography';
import {
  calculateDateGoal,
  calculateMonthsNeeded,
  calculateProgressPercent,
  calculateRemainingAmount,
  isMoneyGoalAchieved,
} from './calc';

export type GoalDetailScreenProps = {
  goal: Goal;
  today?: Date;
  onEdit: () => void;
  onOpenReport: () => void;
};

function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

export function GoalDetailScreen({ goal, today = new Date(), onEdit, onOpenReport }: GoalDetailScreenProps) {
  const achieved = goal.type === 'money' && goal.targetAmount !== undefined && goal.currentAmount !== undefined
    ? isMoneyGoalAchieved(goal.targetAmount, goal.currentAmount)
    : false;

  const dateResult = !achieved && goal.targetDate ? calculateDateGoal(goal.targetDate, today) : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{goal.title}</Text>
        <TouchableOpacity testID="edit-button" onPress={onEdit}>
          <Text style={styles.editLink}>수정</Text>
        </TouchableOpacity>
      </View>

      {achieved ? (
        <View testID="achieved-card" style={styles.achievedCard}>
          <Text style={styles.achievedText}>이미 목표를 달성했어요! 🎉</Text>
        </View>
      ) : dateResult?.status === 'pastDate' ? (
        <View testID="past-date-card" style={styles.pastDateCard}>
          <Text style={styles.pastDateText}>목표일이 지났어요</Text>
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <Text testID="d-day-value" style={[styles.heroValue, tabularNums]}>
              {dateResult?.dDay === 0 ? 'D-day' : `D-${dateResult?.dDay ?? '-'}`}
            </Text>
            {goal.type === 'money' && goal.targetDate ? (
              <Text style={styles.heroSub}>목표일: {goal.targetDate}</Text>
            ) : null}
          </View>

          {goal.type === 'money' && goal.targetAmount !== undefined && goal.currentAmount !== undefined && goal.monthlySaving !== undefined ? (
            <MoneyGoalStats targetAmount={goal.targetAmount} currentAmount={goal.currentAmount} monthlySaving={goal.monthlySaving} />
          ) : null}

          <TouchableOpacity testID="open-report-button" style={styles.reportButton} onPress={onOpenReport}>
            <Text style={styles.reportButtonText}>상세 리포트 보기</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.adSlot}>
        <AdContainer />
      </View>
    </ScrollView>
  );
}

function MoneyGoalStats({
  targetAmount,
  currentAmount,
  monthlySaving,
}: {
  targetAmount: number;
  currentAmount: number;
  monthlySaving: number;
}) {
  const remainingAmount = calculateRemainingAmount(targetAmount, currentAmount);
  const progressPercent = calculateProgressPercent(currentAmount, targetAmount);
  const monthsNeeded = calculateMonthsNeeded(remainingAmount, monthlySaving);

  return (
    <View style={styles.statsCard}>
      <ProgressBar testID="detail-progress" percent={progressPercent} />
      <Text testID="progress-percent" style={styles.statsPercent}>
        {progressPercent}% 달성
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>남은 금액</Text>
          <Text testID="remaining-amount" style={[styles.statValue, tabularNums]}>
            {formatWon(remainingAmount)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>필요 개월 수</Text>
          <Text testID="months-needed" style={[styles.statValue, tabularNums]}>
            {monthsNeeded}개월
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.darkText },
  editLink: { color: colors.primaryCoralPink, fontWeight: fontWeights.bold, fontSize: fontSizes.caption },
  achievedCard: { margin: 20, padding: 24, borderRadius: 16, backgroundColor: colors.lightPinkBackground, alignItems: 'center' },
  achievedText: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText },
  pastDateCard: { margin: 20, padding: 24, borderRadius: 16, backgroundColor: colors.divider, alignItems: 'center' },
  pastDateText: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.secondaryText },
  hero: { alignItems: 'center', paddingVertical: 32 },
  heroValue: { fontSize: 48, fontWeight: fontWeights.bold, color: colors.primaryCoralPink },
  heroSub: { fontSize: fontSizes.caption, color: colors.secondaryText, marginTop: 8 },
  statsCard: { marginHorizontal: 20, padding: 18, borderRadius: 16, backgroundColor: colors.lightPinkBackground, marginBottom: 20 },
  statsPercent: { fontSize: fontSizes.caption, color: colors.darkText, fontWeight: fontWeights.bold, marginTop: 8, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1 },
  statLabel: { fontSize: 12, color: colors.secondaryText, marginBottom: 4 },
  statValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText },
  reportButton: { height: 52, borderRadius: 14, backgroundColor: colors.accentGold, alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 20 },
  reportButtonText: { color: '#FFFFFF', fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  adSlot: { marginTop: 'auto' },
});
```

Write a test alongside it, `src/features/goal-detail/GoalDetailScreen.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GoalDetailScreen } from './GoalDetailScreen';
import type { Goal } from '../../storage/goals';

jest.mock('@apps-in-toss/framework', () => ({ InlineAd: () => null }));

const TODAY = new Date(2026, 7, 26);

describe('GoalDetailScreen', () => {
  it('shows the D-day for a date-type goal', () => {
    const goal: Goal = { id: 'g1', type: 'date', title: '수능', targetDate: '2026-09-05', notifyEnabled: false, createdAt: 0 };
    render(<GoalDetailScreen goal={goal} today={TODAY} onEdit={jest.fn()} onOpenReport={jest.fn()} />);
    expect(screen.getByTestId('d-day-value')).toHaveTextContent('D-10');
  });

  it('shows the achieved card when a money goal is already met', () => {
    const goal: Goal = {
      id: 'g2',
      type: 'money',
      title: '여행',
      targetAmount: 100000,
      currentAmount: 100000,
      monthlySaving: 10000,
      notifyEnabled: false,
      createdAt: 0,
    };
    render(<GoalDetailScreen goal={goal} today={TODAY} onEdit={jest.fn()} onOpenReport={jest.fn()} />);
    expect(screen.getByTestId('achieved-card')).toBeTruthy();
  });

  it('shows progress stats for an unmet money goal and calls onOpenReport', () => {
    const onOpenReport = jest.fn();
    const goal: Goal = {
      id: 'g3',
      type: 'money',
      title: '여행',
      targetAmount: 1000000,
      currentAmount: 400000,
      monthlySaving: 200000,
      targetDate: '2026-11-26',
      notifyEnabled: false,
      createdAt: 0,
    };
    render(<GoalDetailScreen goal={goal} today={TODAY} onEdit={jest.fn()} onOpenReport={onOpenReport} />);
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('40% 달성');
    fireEvent.press(screen.getByTestId('open-report-button'));
    expect(onOpenReport).toHaveBeenCalled();
  });

  it('shows the past-date card for an overdue date-type goal', () => {
    const goal: Goal = { id: 'g4', type: 'date', title: '지난 일정', targetDate: '2026-01-01', notifyEnabled: false, createdAt: 0 };
    render(<GoalDetailScreen goal={goal} today={TODAY} onEdit={jest.fn()} onOpenReport={jest.fn()} />);
    expect(screen.getByTestId('past-date-card')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Wire up the route**

```tsx
// src/pages/goal-detail.tsx
import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import { getGoal, type Goal } from '../storage/goals';
import { GoalDetailScreen } from '../features/goal-detail/GoalDetailScreen';

export const Route = createRoute('/goal-detail', {
  validateParams: (params) => params as { id: string },
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  const { id } = Route.useParams();
  const [goal, setGoal] = useState<Goal | undefined>(undefined);

  useEffect(() => {
    getGoal(id).then(setGoal);
  }, [id]);

  if (!goal) return null;

  return (
    <GoalDetailScreen
      goal={goal}
      onEdit={() => navigation.navigate('/goal-form', { mode: 'edit', id: goal.id })}
      onOpenReport={() => navigation.navigate('/goal-report', { id: goal.id })}
    />
  );
}
```

```ts
// pages/goal-detail.tsx
export { Route } from 'pages/goal-detail';
```

- [ ] **Step 4: Regenerate routes, typecheck, test**

```bash
npx granite dev &
sleep 15
kill %1
npx tsc --noEmit
npx jest src/features/goal-detail src/components/AdContainer.tsx
```
Expected: pass. `/goal-report` is still unregistered until Task 7 — same expected-interim-error note as Task 5 Step 8.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdContainer.tsx src/features/goal-detail/GoalDetailScreen.tsx src/features/goal-detail/GoalDetailScreen.test.tsx src/pages/goal-detail.tsx pages/goal-detail.tsx src/router.gen.ts && git commit -m "feat: add goal detail screen with banner ad"
```

---

## Task 7: Reward-ad-gated detail report screen

**Files:**
- Create: `src/components/RewardAdButton.tsx`, `src/features/goal-report/calc.ts`, `src/features/goal-report/calc.test.ts`, `src/features/goal-report/GoalReportScreen.tsx`, `src/pages/goal-report.tsx`, `pages/goal-report.tsx`

**Interfaces:**
- Produces:
  ```ts
  export const DEFAULT_ANNUAL_INTEREST_RATE_PERCENT = 3.5;
  export function calculateInterestAdjustedMonths(input: MoneyGoalInput, annualInterestRatePercent: number): number;
  export function calculateShortenedDays(baseMonthsNeeded: number, adjustedMonthsNeeded: number, today: Date): number;
  export type SpendingCutPreset = { id: string; label: string; dailyAmount: number };
  export const SPENDING_CUT_PRESETS: SpendingCutPreset[];
  export function calculateSpendingCutAdjustedMonths(input: MoneyGoalInput, dailyCutAmount: number): number;
  ```
  and `<RewardAdButton label onRewardEarned testID?>`.
- Consumes: `MoneyGoalInput`/`isMoneyGoalAchieved`/`calculateRemainingAmount`/`calculateMonthsNeeded` (Task 4), `addMonths`/`diffInDays`/`startOfDay` (Task 4's `lib/date.ts`), `getGoal` (Task 3).

- [ ] **Step 1: Write `src/features/goal-report/calc.test.ts` (failing first)**

```ts
import {
  calculateInterestAdjustedMonths,
  calculateShortenedDays,
  calculateSpendingCutAdjustedMonths,
  SPENDING_CUT_PRESETS,
} from './calc';

const TODAY = new Date(2026, 7, 26);

describe('calculateInterestAdjustedMonths', () => {
  it('returns 0 when the goal is already achieved', () => {
    expect(calculateInterestAdjustedMonths({ targetAmount: 100000, currentAmount: 100000, monthlySaving: 10000 }, 3.5)).toBe(0);
  });

  it('returns fewer or equal months than a 0% rate would need', () => {
    const input = { targetAmount: 1000000, currentAmount: 0, monthlySaving: 100000 };
    const noInterestMonths = calculateInterestAdjustedMonths(input, 0);
    const withInterestMonths = calculateInterestAdjustedMonths(input, 3.5);
    expect(noInterestMonths).toBe(10); // 1,000,000 / 100,000
    expect(withInterestMonths).toBeLessThanOrEqual(noInterestMonths);
  });
});

describe('calculateShortenedDays', () => {
  it('returns 0 when months needed are unchanged', () => {
    expect(calculateShortenedDays(10, 10, TODAY)).toBe(0);
  });

  it('returns a positive day count when adjusted months are fewer', () => {
    expect(calculateShortenedDays(10, 9, TODAY)).toBeGreaterThan(0);
  });
});

describe('SPENDING_CUT_PRESETS', () => {
  it('includes the coffee preset from the spec', () => {
    const coffee = SPENDING_CUT_PRESETS.find((p) => p.id === 'coffee');
    expect(coffee?.dailyAmount).toBe(4500);
  });
});

describe('calculateSpendingCutAdjustedMonths', () => {
  it('returns 0 when the goal is already achieved', () => {
    expect(calculateSpendingCutAdjustedMonths({ targetAmount: 100000, currentAmount: 100000, monthlySaving: 10000 }, 4500)).toBe(0);
  });

  it('reduces months needed compared to the base monthly saving', () => {
    const input = { targetAmount: 1000000, currentAmount: 0, monthlySaving: 100000 };
    const base = Math.ceil(1000000 / 100000);
    const withCut = calculateSpendingCutAdjustedMonths(input, 4500);
    expect(withCut).toBeLessThan(base);
  });
});
```

- [ ] **Step 2: Write `src/features/goal-report/calc.ts`**

```ts
import { addMonths, diffInDays, startOfDay } from '../../lib/date';
import { calculateRemainingAmount, isMoneyGoalAchieved, type MoneyGoalInput } from '../goal-detail/calc';

export const DEFAULT_ANNUAL_INTEREST_RATE_PERCENT = 3.5;

// 세후 이자율을 월 저축액에 단리로 반영 — 매달 잔액에 월 이율만큼의 이자를 더해 적립한다.
export function calculateInterestAdjustedMonths(input: MoneyGoalInput, annualInterestRatePercent: number): number {
  if (isMoneyGoalAchieved(input.targetAmount, input.currentAmount)) return 0;
  const monthlyRate = annualInterestRatePercent / 100 / 12;
  let balance = input.currentAmount;
  let months = 0;
  while (balance < input.targetAmount && months < 1200) {
    balance += input.monthlySaving + balance * monthlyRate;
    months += 1;
  }
  return months;
}

export function calculateShortenedDays(baseMonthsNeeded: number, adjustedMonthsNeeded: number, today: Date): number {
  const base = startOfDay(today);
  const baseDate = addMonths(base, baseMonthsNeeded);
  const adjustedDate = addMonths(base, adjustedMonthsNeeded);
  return diffInDays(baseDate, adjustedDate);
}

export type SpendingCutPreset = { id: string; label: string; dailyAmount: number };

export const SPENDING_CUT_PRESETS: SpendingCutPreset[] = [
  { id: 'coffee', label: '커피 한 잔', dailyAmount: 4500 },
  { id: 'delivery', label: '배달 앱 할증', dailyAmount: 3000 },
  { id: 'snack', label: '편의점 간식', dailyAmount: 2500 },
];

// 하루 절약액을 30일 기준 월 저축액 증가분으로 환산한다.
export function calculateSpendingCutAdjustedMonths(input: MoneyGoalInput, dailyCutAmount: number): number {
  if (isMoneyGoalAchieved(input.targetAmount, input.currentAmount)) return 0;
  const remainingAmount = calculateRemainingAmount(input.targetAmount, input.currentAmount);
  const boostedMonthlySaving = input.monthlySaving + dailyCutAmount * 30;
  return Math.ceil(remainingAmount / boostedMonthlySaving);
}
```

Run `npx jest src/features/goal-report/calc.test.ts` — expect pass.

- [ ] **Step 3: Commit calc logic**

```bash
npx tsc --noEmit
git add src/features/goal-report/calc.ts src/features/goal-report/calc.test.ts && git commit -m "feat: add interest simulation and spending-cut calc logic"
```

- [ ] **Step 4: Write `src/components/RewardAdButton.tsx`**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

// 콘솔에서 발급받은 리워드 광고 그룹 ID로 교체할 것 — 실 groupId 반영 전까지는 테스트 ID 사용.
const REWARDED_AD_GROUP_ID = 'ait-ad-test-rewarded-id';

export type RewardAdButtonProps = {
  label: string;
  onRewardEarned: () => void;
  testID?: string;
};

export function RewardAdButton({ label, onRewardEarned, testID }: RewardAdButtonProps) {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const unregisterRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!loadFullScreenAd.isSupported()) return;
    unregisterRef.current = loadFullScreenAd({
      options: { adGroupId: REWARDED_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') setIsAdLoaded(true);
      },
      onError: () => setIsAdLoaded(false),
    });
    return () => unregisterRef.current?.();
  }, []);

  const handlePress = () => {
    if (!isAdLoaded || !showFullScreenAd.isSupported()) return;
    setIsShowing(true);
    showFullScreenAd({
      options: { adGroupId: REWARDED_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'userEarnedReward') {
          onRewardEarned();
        }
        if (event.type === 'dismissed' || event.type === 'failedToShow') {
          setIsShowing(false);
          setIsAdLoaded(false);
        }
      },
      onError: () => setIsShowing(false),
    });
  };

  return (
    <TouchableOpacity testID={testID} style={styles.button} onPress={handlePress} disabled={!isAdLoaded || isShowing}>
      {isShowing ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{isAdLoaded ? label : '광고 준비 중...'}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { height: 52, borderRadius: 14, backgroundColor: colors.primaryCoralPink, alignItems: 'center', justifyContent: 'center', marginHorizontal: 20 },
  label: { color: '#FFFFFF', fontSize: fontSizes.body, fontWeight: fontWeights.bold },
});
```

Write `src/components/RewardAdButton.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RewardAdButton } from './RewardAdButton';

const mockLoadFullScreenAd = jest.fn();
const mockShowFullScreenAd = jest.fn();

jest.mock('@apps-in-toss/framework', () => ({
  loadFullScreenAd: Object.assign((...args: unknown[]) => mockLoadFullScreenAd(...args), { isSupported: () => true }),
  showFullScreenAd: Object.assign((...args: unknown[]) => mockShowFullScreenAd(...args), { isSupported: () => true }),
}));

describe('RewardAdButton', () => {
  beforeEach(() => {
    mockLoadFullScreenAd.mockReset();
    mockShowFullScreenAd.mockReset();
    mockLoadFullScreenAd.mockReturnValue(() => {});
  });

  it('is disabled until the ad finishes loading, then shows it and grants the reward', () => {
    let loadOnEvent: ((event: { type: string }) => void) | undefined;
    mockLoadFullScreenAd.mockImplementation(({ onEvent }) => {
      loadOnEvent = onEvent;
      return () => {};
    });
    const onRewardEarned = jest.fn();
    render(<RewardAdButton testID="reward-btn" label="30초 광고 보고 리포트 보기" onRewardEarned={onRewardEarned} />);

    expect(screen.getByTestId('reward-btn').props.accessibilityState?.disabled ?? true).toBeTruthy();

    loadOnEvent?.({ type: 'loaded' });

    let showOnEvent: ((event: { type: string; data?: { unitType: string; unitAmount: number } }) => void) | undefined;
    mockShowFullScreenAd.mockImplementation(({ onEvent }) => {
      showOnEvent = onEvent;
      return () => {};
    });
    fireEvent.press(screen.getByTestId('reward-btn'));
    showOnEvent?.({ type: 'userEarnedReward', data: { unitType: 'coin', unitAmount: 1 } });

    expect(onRewardEarned).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: Run and commit**

```bash
npx jest src/components/RewardAdButton.test.tsx
npx tsc --noEmit
git add src/components/RewardAdButton.tsx src/components/RewardAdButton.test.tsx && git commit -m "feat: add RewardAdButton component"
```

- [ ] **Step 6: Write `src/features/goal-report/GoalReportScreen.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RewardAdButton } from '../../components/RewardAdButton';
import { calculateMonthsNeeded, calculateRemainingAmount, type MoneyGoalInput } from '../goal-detail/calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights, tabularNums } from '../../theme/typography';
import {
  calculateInterestAdjustedMonths,
  calculateShortenedDays,
  calculateSpendingCutAdjustedMonths,
  DEFAULT_ANNUAL_INTEREST_RATE_PERCENT,
  SPENDING_CUT_PRESETS,
} from './calc';

export type GoalReportScreenProps = {
  input: MoneyGoalInput;
  today?: Date;
  onRecalculate?: () => void;
};

export function GoalReportScreen({ input, today = new Date(), onRecalculate }: GoalReportScreenProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const baseMonthsNeeded = useMemo(
    () => calculateMonthsNeeded(calculateRemainingAmount(input.targetAmount, input.currentAmount), input.monthlySaving),
    [input]
  );

  const interestAdjustedMonths = useMemo(
    () => calculateInterestAdjustedMonths(input, DEFAULT_ANNUAL_INTEREST_RATE_PERCENT),
    [input]
  );
  const interestShortenedDays = calculateShortenedDays(baseMonthsNeeded, interestAdjustedMonths, today);

  const selectedPreset = SPENDING_CUT_PRESETS.find((p) => p.id === selectedPresetId) ?? null;
  const spendingCutAdjustedMonths = selectedPreset
    ? calculateSpendingCutAdjustedMonths(input, selectedPreset.dailyAmount)
    : baseMonthsNeeded;
  const spendingCutShortenedDays = calculateShortenedDays(baseMonthsNeeded, spendingCutAdjustedMonths, today);

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId((current) => (current === id ? null : id));
    onRecalculate?.();
  };

  if (!unlocked) {
    return (
      <View style={styles.lockedScreen}>
        <Text style={styles.lockedTitle}>30초 광고 보고{'\n'}이자 적용 시 D-day 단축 리포트 확인하기</Text>
        <RewardAdButton testID="unlock-report-button" label="광고 보고 리포트 잠금 해제" onRewardEarned={() => setUnlocked(true)} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.header}>상세 리포트</Text>
      <Text style={styles.disclaimer}>아래 수치는 참고용 계산이에요. 실제 저축 결과를 보장하지 않아요.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>이자 적용 시뮬레이션</Text>
        <Text style={styles.cardSub}>세후 연 {DEFAULT_ANNUAL_INTEREST_RATE_PERCENT}% 단리 기준</Text>
        <Text testID="interest-shortened-days" style={[styles.highlight, tabularNums]}>
          {interestShortenedDays > 0 ? `${interestShortenedDays}일 단축` : '단축 효과 없음'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>지출 절감 가이드</Text>
        <View style={styles.presetRow}>
          {SPENDING_CUT_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              testID={`preset-${preset.id}`}
              style={[styles.presetChip, selectedPresetId === preset.id && styles.presetChipActive]}
              onPress={() => handleSelectPreset(preset.id)}>
              <Text style={[styles.presetChipText, selectedPresetId === preset.id && styles.presetChipTextActive]}>
                {preset.label} (일 {preset.dailyAmount.toLocaleString('ko-KR')}원)
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text testID="spending-cut-shortened-days" style={[styles.highlight, tabularNums]}>
          {selectedPreset && spendingCutShortenedDays > 0 ? `${spendingCutShortenedDays}일 단축` : '항목을 선택해보세요'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lockedScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  lockedTitle: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.darkText, textAlign: 'center', marginBottom: 24 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  header: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 4 },
  disclaimer: { fontSize: 11, color: colors.secondaryText, marginBottom: 20 },
  card: { padding: 18, borderRadius: 16, backgroundColor: colors.lightPinkBackground, marginBottom: 16 },
  cardTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 4 },
  cardSub: { fontSize: 12, color: colors.secondaryText, marginBottom: 12 },
  highlight: { fontSize: 22, fontWeight: fontWeights.bold, color: colors.primaryCoralPink },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.divider },
  presetChipActive: { backgroundColor: colors.accentGold },
  presetChipText: { fontSize: 12, color: colors.darkText, fontWeight: fontWeights.bold },
  presetChipTextActive: { color: '#FFFFFF' },
});
```

Write `src/features/goal-report/GoalReportScreen.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GoalReportScreen } from './GoalReportScreen';

jest.mock('@apps-in-toss/framework', () => ({
  loadFullScreenAd: Object.assign((params: { onEvent: (e: { type: string }) => void }) => {
    params.onEvent({ type: 'loaded' });
    return () => {};
  }, { isSupported: () => true }),
  showFullScreenAd: Object.assign((params: { onEvent: (e: { type: string }) => void }) => {
    params.onEvent({ type: 'userEarnedReward', data: { unitType: 'coin', unitAmount: 1 } });
    return () => {};
  }, { isSupported: () => true }),
}));

const TODAY = new Date(2026, 7, 26);
const INPUT = { targetAmount: 1000000, currentAmount: 0, monthlySaving: 100000 };

describe('GoalReportScreen', () => {
  it('is locked until the reward ad grants a reward, then shows the report', () => {
    render(<GoalReportScreen input={INPUT} today={TODAY} />);
    expect(screen.getByTestId('unlock-report-button')).toBeTruthy();
    fireEvent.press(screen.getByTestId('unlock-report-button'));
    expect(screen.getByTestId('interest-shortened-days')).toBeTruthy();
  });

  it('recalculates shortened days when a spending-cut preset is selected', () => {
    render(<GoalReportScreen input={INPUT} today={TODAY} />);
    fireEvent.press(screen.getByTestId('unlock-report-button'));
    fireEvent.press(screen.getByTestId('preset-coffee'));
    expect(screen.getByTestId('spending-cut-shortened-days')).toHaveTextContent(/일 단축/);
  });

  it('calls onRecalculate on every preset tap', () => {
    const onRecalculate = jest.fn();
    render(<GoalReportScreen input={INPUT} today={TODAY} onRecalculate={onRecalculate} />);
    fireEvent.press(screen.getByTestId('unlock-report-button'));
    fireEvent.press(screen.getByTestId('preset-coffee'));
    expect(onRecalculate).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 7: Wire up the route**

```tsx
// src/pages/goal-report.tsx
import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import { getGoal, type Goal } from '../storage/goals';
import { GoalReportScreen } from '../features/goal-report/GoalReportScreen';

export const Route = createRoute('/goal-report', {
  validateParams: (params) => params as { id: string },
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const [goal, setGoal] = useState<Goal | undefined>(undefined);

  useEffect(() => {
    getGoal(id).then(setGoal);
  }, [id]);

  if (!goal || goal.type !== 'money' || goal.targetAmount === undefined || goal.currentAmount === undefined || goal.monthlySaving === undefined) {
    return null;
  }

  return (
    <GoalReportScreen
      input={{ targetAmount: goal.targetAmount, currentAmount: goal.currentAmount, monthlySaving: goal.monthlySaving }}
    />
  );
}
```

```ts
// pages/goal-report.tsx
export { Route } from 'pages/goal-report';
```

- [ ] **Step 8: Regenerate routes, typecheck, test, commit**

```bash
npx granite dev &
sleep 15
kill %1
npx tsc --noEmit
npx jest src/features/goal-report
git add src/features/goal-report src/pages/goal-report.tsx pages/goal-report.tsx src/router.gen.ts && git commit -m "feat: add reward-ad-gated detail report screen"
```

---

## Task 8: Interstitial ad frequency-cap controller

**Files:**
- Create: `src/storage/recalcCounter.ts`, `src/storage/recalcCounter.test.ts`, `src/components/InterstitialAdController.tsx`, `src/components/InterstitialAdController.test.tsx`
- Modify: `src/features/goal-report/GoalReportScreen.tsx`

**Interfaces:**
- Produces: `incrementRecalcCount(): Promise<number>`, `resetRecalcCount(): Promise<void>`, `useInterstitialAdController(): { loadAd: () => void; notifyRecalculation: () => Promise<void> }`.
- Consumes: nothing new — wraps `@apps-in-toss/framework`'s `loadFullScreenAd`/`showFullScreenAd` (already used in Task 7) and a new `Storage`-backed counter.

- [ ] **Step 1: Write `src/storage/recalcCounter.test.ts` then `recalcCounter.ts`**

```ts
// src/storage/recalcCounter.test.ts
import { Storage } from '@apps-in-toss/framework';
import { incrementRecalcCount, resetRecalcCount } from './recalcCounter';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: { getItem: jest.fn(), setItem: jest.fn() },
}));

const mockedStorage = jest.mocked(Storage);

describe('recalcCounter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts at 0 and increments', async () => {
    mockedStorage.getItem.mockResolvedValue(null);
    await expect(incrementRecalcCount()).resolves.toBe(1);
  });

  it('increments from a previously stored count', async () => {
    mockedStorage.getItem.mockResolvedValue('3');
    await expect(incrementRecalcCount()).resolves.toBe(4);
  });

  it('resets the stored count to 0', async () => {
    await resetRecalcCount();
    expect(mockedStorage.setItem).toHaveBeenCalledWith('moeuda-dday-recalc-count-v1', '0');
  });

  it('treats a corrupt stored value as 0', async () => {
    mockedStorage.getItem.mockResolvedValue('not-a-number');
    await expect(incrementRecalcCount()).resolves.toBe(1);
  });
});
```

```ts
// src/storage/recalcCounter.ts
import { Storage } from '@apps-in-toss/framework';

const STORAGE_KEY = 'moeuda-dday-recalc-count-v1';

async function getRecalcCount(): Promise<number> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function incrementRecalcCount(): Promise<number> {
  const next = (await getRecalcCount()) + 1;
  try {
    await Storage.setItem(STORAGE_KEY, String(next));
  } catch {
    // best-effort — a failed save just means the next call recomputes from a stale base
  }
  return next;
}

export async function resetRecalcCount(): Promise<void> {
  try {
    await Storage.setItem(STORAGE_KEY, '0');
  } catch {
    // best-effort
  }
}
```

Run `npx jest src/storage/recalcCounter.test.ts` — expect pass.

- [ ] **Step 2: Commit the counter**

```bash
npx tsc --noEmit
git add src/storage/recalcCounter.ts src/storage/recalcCounter.test.ts && git commit -m "feat: add recalculation counter for interstitial ad frequency cap"
```

- [ ] **Step 3: Write `src/components/InterstitialAdController.tsx`**

```tsx
import { useCallback, useRef } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';
import { incrementRecalcCount, resetRecalcCount } from '../storage/recalcCounter';

// 콘솔에서 발급받은 전면 광고 그룹 ID로 교체할 것 — 실 groupId 반영 전까지는 테스트 ID 사용.
const INTERSTITIAL_AD_GROUP_ID = 'ait-ad-test-interstitial-id';

// 재계산 3~5회당 1회만 노출한다는 spec 규칙(PLAN_모으다보니Dday.md §8)의 중간값.
const SHOW_EVERY_N_RECALCULATIONS = 4;

export function useInterstitialAdController() {
  const isAdLoadedRef = useRef(false);

  const loadAd = useCallback(() => {
    if (!loadFullScreenAd.isSupported()) return;
    loadFullScreenAd({
      options: { adGroupId: INTERSTITIAL_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') isAdLoadedRef.current = true;
      },
      onError: () => {
        isAdLoadedRef.current = false;
      },
    });
  }, []);

  const notifyRecalculation = useCallback(async () => {
    const count = await incrementRecalcCount();
    if (count < SHOW_EVERY_N_RECALCULATIONS) return;
    await resetRecalcCount();

    if (!isAdLoadedRef.current || !showFullScreenAd.isSupported()) {
      loadAd();
      return;
    }

    showFullScreenAd({
      options: { adGroupId: INTERSTITIAL_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'dismissed' || event.type === 'failedToShow') {
          isAdLoadedRef.current = false;
          loadAd();
        }
      },
      onError: () => {
        isAdLoadedRef.current = false;
        loadAd();
      },
    });
  }, [loadAd]);

  return { loadAd, notifyRecalculation };
}
```

Write `src/components/InterstitialAdController.test.tsx`:

```tsx
import { renderHook, act } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { useInterstitialAdController } from './InterstitialAdController';

const mockLoadFullScreenAd = jest.fn();
const mockShowFullScreenAd = jest.fn();

jest.mock('@apps-in-toss/framework', () => ({
  Storage: { getItem: jest.fn(), setItem: jest.fn() },
  loadFullScreenAd: Object.assign((...args: unknown[]) => mockLoadFullScreenAd(...args), { isSupported: () => true }),
  showFullScreenAd: Object.assign((...args: unknown[]) => mockShowFullScreenAd(...args), { isSupported: () => true }),
}));

const mockedStorage = jest.mocked(Storage);

describe('useInterstitialAdController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadFullScreenAd.mockImplementation(({ onEvent }) => {
      onEvent({ type: 'loaded' });
      return () => {};
    });
    mockedStorage.getItem.mockResolvedValue('0');
  });

  it('does not show an ad before the 4th recalculation', async () => {
    mockedStorage.getItem.mockResolvedValue('2');
    const { result } = renderHook(() => useInterstitialAdController());
    await act(async () => {
      await result.current.notifyRecalculation();
    });
    expect(mockShowFullScreenAd).not.toHaveBeenCalled();
  });

  it('shows the ad on the 4th recalculation and resets the counter', async () => {
    mockedStorage.getItem.mockResolvedValue('3');
    const { result } = renderHook(() => useInterstitialAdController());
    act(() => result.current.loadAd());
    await act(async () => {
      await result.current.notifyRecalculation();
    });
    expect(mockShowFullScreenAd).toHaveBeenCalledTimes(1);
    expect(mockedStorage.setItem).toHaveBeenCalledWith('moeuda-dday-recalc-count-v1', '0');
  });
});
```

- [ ] **Step 4: Run and commit**

```bash
npx jest src/components/InterstitialAdController.test.tsx
npx tsc --noEmit
git add src/components/InterstitialAdController.tsx src/components/InterstitialAdController.test.tsx && git commit -m "feat: add interstitial ad frequency-cap controller"
```

- [ ] **Step 5: Modify `GoalReportScreen.tsx` to wire in the controller**

In `src/features/goal-report/GoalReportScreen.tsx`, replace the `onRecalculate?: () => void` prop usage with the controller so recalculation-triggered ads work end-to-end without a screen needing to pass a handler down manually:

```tsx
// add to the imports
import { useInterstitialAdController } from '../../components/InterstitialAdController';

// inside GoalReportScreen, replace the props type and remove the onRecalculate prop:
export type GoalReportScreenProps = {
  input: MoneyGoalInput;
  today?: Date;
};

export function GoalReportScreen({ input, today = new Date() }: GoalReportScreenProps) {
  const { notifyRecalculation } = useInterstitialAdController();
  // ...unchanged state...

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId((current) => (current === id ? null : id));
    notifyRecalculation();
  };
  // ...rest unchanged...
}
```

Update `src/pages/goal-report.tsx` — no change needed, it never passed `onRecalculate`. Update `src/features/goal-report/GoalReportScreen.test.tsx`'s third test (`calls onRecalculate on every preset tap`) to instead assert the interstitial path is exercised without erroring:

```tsx
  it('does not throw when a spending-cut preset is tapped repeatedly', () => {
    render(<GoalReportScreen input={INPUT} today={TODAY} />);
    fireEvent.press(screen.getByTestId('unlock-report-button'));
    fireEvent.press(screen.getByTestId('preset-coffee'));
    fireEvent.press(screen.getByTestId('preset-delivery'));
    expect(screen.getByTestId('spending-cut-shortened-days')).toBeTruthy();
  });
```

Also add `Storage: { getItem: jest.fn().mockResolvedValue('0'), setItem: jest.fn() }` to that test file's `jest.mock('@apps-in-toss/framework', ...)` factory, since `GoalReportScreen` now transitively uses `Storage` through the controller.

- [ ] **Step 6: Run full suite, typecheck, commit**

```bash
npx jest src/features/goal-report
npx tsc --noEmit
git add src/features/goal-report/GoalReportScreen.tsx src/features/goal-report/GoalReportScreen.test.tsx && git commit -m "feat: wire interstitial ad controller into report recalculation"
```

---

## Task 9: Backend Worker scaffold (goal sync API + storage)

**Files:**
- Create (new project `C:\Users\User\moeuda-dday-backend\`): `package.json`, `tsconfig.json`, `wrangler.toml`, `.gitignore`, `migrations/0001_init.sql`, `src/types.ts`, `src/validation.ts`, `src/validation.test.ts`, `src/db.ts`, `src/index.ts`

**Interfaces:**
- Produces:
  ```ts
  export type GoalRow = { id: string; anonKey: string; title: string; targetDate: string };
  export type SyncGoalRequest = GoalRow;
  export type DeleteGoalRequest = { id: string; anonKey: string };
  export function parseSyncGoalRequest(body: unknown): SyncGoalRequest | null;
  export function parseDeleteGoalRequest(body: unknown): DeleteGoalRequest | null;
  export interface Env { DB: D1Database; }
  export async function upsertGoal(db: D1Database, goal: SyncGoalRequest): Promise<void>;
  export async function deleteGoalRow(db: D1Database, id: string, anonKey: string): Promise<void>;
  export async function listAllGoals(db: D1Database): Promise<GoalRow[]>;
  ```
  A deployed Worker at `POST /goals` (upsert) and `DELETE /goals` (delete by id+anonKey).
- Consumed by: Task 10 (`GoalRow`), Task 11 (`Env`), Task 12 (frontend calls `POST`/`DELETE /goals`).

- [ ] **Step 1: Scaffold the project**

```bash
mkdir -p "C:/Users/User/moeuda-dday-backend/src" "C:/Users/User/moeuda-dday-backend/migrations"
```

Write `C:\Users\User\moeuda-dday-backend\package.json`:

```json
{
  "name": "moeuda-dday-backend",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250101.0",
    "typescript": "^5.8.3",
    "vitest": "^2.1.9",
    "wrangler": "^4.0.0"
  }
}
```

Write `C:\Users\User\moeuda-dday-backend\tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts"]
}
```

Write `C:\Users\User\moeuda-dday-backend\.gitignore`:

```
node_modules/
.dev.vars
.wrangler/
```

Write `C:\Users\User\moeuda-dday-backend\migrations\0001_init.sql`:

```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  anon_key TEXT NOT NULL,
  title TEXT NOT NULL,
  target_date TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_goals_target_date ON goals (target_date);
```

- [ ] **Step 2: Create the D1 database**

```bash
cd "C:/Users/User/moeuda-dday-backend" && npx wrangler d1 create moeuda-dday-db
```

Note the printed `database_id`. Write `wrangler.toml`:

```toml
name = "moeuda-dday-backend"
main = "src/index.ts"
compatibility_date = "2026-01-01"

[[d1_databases]]
binding = "DB"
database_name = "moeuda-dday-db"
database_id = "<PASTE database_id FROM wrangler d1 create OUTPUT>"
```

Apply the migration to both the local dev DB and the remote one:

```bash
npx wrangler d1 execute moeuda-dday-db --local --file=migrations/0001_init.sql
npx wrangler d1 execute moeuda-dday-db --remote --file=migrations/0001_init.sql
```

- [ ] **Step 3: Write `src/types.ts`**

```ts
export type GoalRow = {
  id: string;
  anonKey: string;
  title: string;
  targetDate: string; // ISO 'YYYY-MM-DD'
};

export type SyncGoalRequest = GoalRow;

export type DeleteGoalRequest = {
  id: string;
  anonKey: string;
};
```

- [ ] **Step 4: Write `src/validation.test.ts` (failing first)**

```ts
import { describe, expect, it } from 'vitest';
import { parseDeleteGoalRequest, parseSyncGoalRequest } from './validation';

describe('parseSyncGoalRequest', () => {
  it('accepts a well-formed payload', () => {
    const result = parseSyncGoalRequest({ id: 'g1', anonKey: 'a1', title: '수능', targetDate: '2027-11-18' });
    expect(result).toEqual({ id: 'g1', anonKey: 'a1', title: '수능', targetDate: '2027-11-18' });
  });

  it('rejects a non-object body', () => {
    expect(parseSyncGoalRequest(null)).toBeNull();
    expect(parseSyncGoalRequest('x')).toBeNull();
  });

  it('rejects a missing or malformed targetDate', () => {
    expect(parseSyncGoalRequest({ id: 'g1', anonKey: 'a1', title: 'x', targetDate: '2027/11/18' })).toBeNull();
    expect(parseSyncGoalRequest({ id: 'g1', anonKey: 'a1', title: 'x' })).toBeNull();
  });

  it('rejects an empty id, anonKey, or title', () => {
    expect(parseSyncGoalRequest({ id: '', anonKey: 'a1', title: 'x', targetDate: '2027-11-18' })).toBeNull();
    expect(parseSyncGoalRequest({ id: 'g1', anonKey: '', title: 'x', targetDate: '2027-11-18' })).toBeNull();
    expect(parseSyncGoalRequest({ id: 'g1', anonKey: 'a1', title: '', targetDate: '2027-11-18' })).toBeNull();
  });
});

describe('parseDeleteGoalRequest', () => {
  it('accepts a well-formed payload', () => {
    expect(parseDeleteGoalRequest({ id: 'g1', anonKey: 'a1' })).toEqual({ id: 'g1', anonKey: 'a1' });
  });

  it('rejects a missing field', () => {
    expect(parseDeleteGoalRequest({ id: 'g1' })).toBeNull();
    expect(parseDeleteGoalRequest(null)).toBeNull();
  });
});
```

- [ ] **Step 5: Write `src/validation.ts`**

```ts
import type { DeleteGoalRequest, SyncGoalRequest } from './types';

export function parseSyncGoalRequest(body: unknown): SyncGoalRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const { id, anonKey, title, targetDate } = body as Record<string, unknown>;
  if (typeof id !== 'string' || !id) return null;
  if (typeof anonKey !== 'string' || !anonKey) return null;
  if (typeof title !== 'string' || !title) return null;
  if (typeof targetDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return null;
  return { id, anonKey, title, targetDate };
}

export function parseDeleteGoalRequest(body: unknown): DeleteGoalRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const { id, anonKey } = body as Record<string, unknown>;
  if (typeof id !== 'string' || !id) return null;
  if (typeof anonKey !== 'string' || !anonKey) return null;
  return { id, anonKey };
}
```

Run `npx vitest run` — expect pass.

- [ ] **Step 6: Write `src/db.ts`**

```ts
import type { GoalRow, SyncGoalRequest } from './types';

export interface Env {
  DB: D1Database;
}

export async function upsertGoal(db: D1Database, goal: SyncGoalRequest): Promise<void> {
  await db
    .prepare(
      `INSERT INTO goals (id, anon_key, title, target_date, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET anon_key = excluded.anon_key, title = excluded.title, target_date = excluded.target_date, updated_at = excluded.updated_at`
    )
    .bind(goal.id, goal.anonKey, goal.title, goal.targetDate, Date.now())
    .run();
}

export async function deleteGoalRow(db: D1Database, id: string, anonKey: string): Promise<void> {
  await db.prepare('DELETE FROM goals WHERE id = ? AND anon_key = ?').bind(id, anonKey).run();
}

export async function listAllGoals(db: D1Database): Promise<GoalRow[]> {
  const { results } = await db
    .prepare('SELECT id, anon_key as anonKey, title, target_date as targetDate FROM goals')
    .all<GoalRow>();
  return results;
}
```

- [ ] **Step 7: Write `src/index.ts`**

```ts
import type { Env } from './db';
import { deleteGoalRow, upsertGoal } from './db';
import { parseDeleteGoalRequest, parseSyncGoalRequest } from './validation';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/goals' && request.method === 'POST') {
      const goal = parseSyncGoalRequest(await safeJson(request));
      if (!goal) return jsonResponse({ error: 'invalid goal payload' }, 400);
      await upsertGoal(env.DB, goal);
      return jsonResponse({ ok: true });
    }

    if (url.pathname === '/goals' && request.method === 'DELETE') {
      const target = parseDeleteGoalRequest(await safeJson(request));
      if (!target) return jsonResponse({ error: 'invalid delete payload' }, 400);
      await deleteGoalRow(env.DB, target.id, target.anonKey);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: 'not found' }, 404);
  },
};

async function safeJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
```

- [ ] **Step 8: Install, typecheck, test, smoke-test locally**

```bash
cd "C:/Users/User/moeuda-dday-backend" && npm install
npx tsc --noEmit
npx vitest run
```

```bash
npx wrangler dev &
sleep 5
curl -s -X POST http://localhost:8787/goals -H "Content-Type: application/json" -d '{"id":"g1","anonKey":"a1","title":"test","targetDate":"2027-01-01"}'
curl -s -X DELETE http://localhost:8787/goals -H "Content-Type: application/json" -d '{"id":"g1","anonKey":"a1"}'
kill %1
```
Expected: both curls return `{"ok":true}`.

- [ ] **Step 9: Deploy and record the URL**

```bash
npx wrangler deploy
```

Note the exact `https://moeuda-dday-backend.<subdomain>.workers.dev` URL printed — `pet-portrait-backend` has had workers.dev subdomain-naming quirks before, so don't assume the URL pattern without confirming it from this actual output. This URL is needed by Task 12's `src/config.ts` on the frontend.

- [ ] **Step 10: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold moeuda-dday-backend Worker with D1 goal sync API"
```

---

## Task 10: Backend cron task (D-7/D-1/D-day matching logic)

**Files:**
- Create (backend project): `src/notifyMatcher.ts`, `src/notifyMatcher.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type NotificationTarget = { id: string; anonKey: string; title: string; daysRemaining: 7 | 1 | 0 };
  export function selectGoalsToNotify(goals: GoalRow[], todayISO: string): NotificationTarget[];
  ```
- Consumes: `GoalRow` (Task 9). Consumed by: Task 11's `scheduled` handler.

- [ ] **Step 1: Write `src/notifyMatcher.test.ts` (failing first)**

```ts
import { describe, expect, it } from 'vitest';
import { selectGoalsToNotify } from './notifyMatcher';
import type { GoalRow } from './types';

const TODAY_ISO = '2026-08-26';

function goal(id: string, targetDate: string): GoalRow {
  return { id, anonKey: `anon-${id}`, title: `목표 ${id}`, targetDate };
}

describe('selectGoalsToNotify', () => {
  it('matches goals exactly 7, 1, and 0 days out', () => {
    const goals = [
      goal('d7', '2026-09-02'),
      goal('d1', '2026-08-27'),
      goal('d0', '2026-08-26'),
      goal('d3', '2026-08-29'),
      goal('past', '2026-08-01'),
    ];
    const targets = selectGoalsToNotify(goals, TODAY_ISO);
    expect(targets.map((t) => t.id).sort()).toEqual(['d0', 'd1', 'd7']);
  });

  it('reports the correct daysRemaining per target', () => {
    const targets = selectGoalsToNotify([goal('d7', '2026-09-02')], TODAY_ISO);
    expect(targets[0]).toEqual({ id: 'd7', anonKey: 'anon-d7', title: '목표 d7', daysRemaining: 7 });
  });

  it('returns an empty array when nothing matches', () => {
    expect(selectGoalsToNotify([goal('d3', '2026-08-29')], TODAY_ISO)).toEqual([]);
  });
});
```

- [ ] **Step 2: Write `src/notifyMatcher.ts`**

```ts
import type { GoalRow } from './types';

export type NotificationTarget = { id: string; anonKey: string; title: string; daysRemaining: 7 | 1 | 0 };

export function selectGoalsToNotify(goals: GoalRow[], todayISO: string): NotificationTarget[] {
  const today = parseISODateUTC(todayISO);
  const targets: NotificationTarget[] = [];
  for (const goal of goals) {
    const target = parseISODateUTC(goal.targetDate);
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    if (diffDays === 7 || diffDays === 1 || diffDays === 0) {
      targets.push({ id: goal.id, anonKey: goal.anonKey, title: goal.title, daysRemaining: diffDays });
    }
  }
  return targets;
}

function parseISODateUTC(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}
```

- [ ] **Step 3: Run, typecheck, commit**

```bash
npx vitest run
npx tsc --noEmit
git add src/notifyMatcher.ts src/notifyMatcher.test.ts && git commit -m "feat: add D-7/D-1/D-day goal matching logic"
```

---

## Task 11: Toss push API client (mTLS) wired into the cron task

**Files:**
- Create (backend project): `src/tossPush.ts`, `src/tossPush.test.ts`
- Modify: `src/db.ts` (extend `Env`), `src/index.ts` (add `scheduled` handler), `wrangler.toml` (mTLS binding + cron trigger)

**Interfaces:**
- Produces:
  ```ts
  export type PushTarget = { anonKey: string; title: string; daysRemaining: 7 | 1 | 0 };
  export function dDayLabel(daysRemaining: 7 | 1 | 0): string;
  export async function sendGoalReminder(target: PushTarget, env: PushEnv): Promise<boolean>;
  export interface PushEnv { TOSS_MTLS: Fetcher; }
  ```
- Consumes: `selectGoalsToNotify`/`NotificationTarget` (Task 10), `listAllGoals` (Task 9).

- [ ] **Step 0: Manual prerequisite — confirm the mTLS certificate exists**

Before writing any code in this task, confirm with the user that the `moeuda-dday` client certificate (`.pem`/`.crt`) and private key have been obtained from Toss, per the Global Constraints section above. If not yet available, stop here and hand this blocker back — do not fabricate a certificate or skip mTLS.

- [ ] **Step 1: Upload the certificate to Cloudflare**

```bash
cd "C:/Users/User/moeuda-dday-backend"
npx wrangler mtls-certificate upload --cert <path-to-cert.pem> --key <path-to-key.pem> --name moeuda-dday-toss-mtls
```

Note the printed certificate `id` — this is scriptable once the cert files exist, unlike the certificate issuance itself.

- [ ] **Step 2: Add the mTLS binding and cron trigger to `wrangler.toml`**

```toml
name = "moeuda-dday-backend"
main = "src/index.ts"
compatibility_date = "2026-01-01"

[[d1_databases]]
binding = "DB"
database_name = "moeuda-dday-db"
database_id = "<same database_id as Task 9>"

[[mtls_certificates]]
binding = "TOSS_MTLS"
certificate_id = "<id from Step 1>"

[triggers]
crons = ["0 22 * * *"] # 매일 07:00 KST (UTC 22:00 전날) — D-7/D-1/D-day 알림 발송
```

- [ ] **Step 3: Write `src/tossPush.test.ts` (failing first)**

```ts
import { describe, expect, it, vi } from 'vitest';
import { dDayLabel, sendGoalReminder, type PushEnv } from './tossPush';

describe('dDayLabel', () => {
  it('labels 7 and 1 days as "N일" and 0 as "오늘"', () => {
    expect(dDayLabel(7)).toBe('7일');
    expect(dDayLabel(1)).toBe('1일');
    expect(dDayLabel(0)).toBe('오늘');
  });
});

describe('sendGoalReminder', () => {
  it('posts to the send-message endpoint via the mTLS fetcher and returns true on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ resultType: 'SUCCESS' }), { status: 200 }));
    const env: PushEnv = { TOSS_MTLS: { fetch: fetchMock } as unknown as Fetcher };

    const result = await sendGoalReminder({ anonKey: 'a1', title: '수능', daysRemaining: 7 }, env);

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/messenger/send-message',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-anon-key': 'a1' }),
      })
    );
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body).toEqual({
      templateSetCode: 'MOEUDA_DDAY_ALERT',
      context: { goalTitle: '수능', dDayLabel: '7일' },
    });
  });

  it('returns false when the API reports failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ resultType: 'FAIL' }), { status: 200 }));
    const env: PushEnv = { TOSS_MTLS: { fetch: fetchMock } as unknown as Fetcher };
    const result = await sendGoalReminder({ anonKey: 'a1', title: '수능', daysRemaining: 0 }, env);
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 4: Write `src/tossPush.ts`**

```ts
export interface PushEnv {
  TOSS_MTLS: Fetcher;
}

export type PushTarget = { anonKey: string; title: string; daysRemaining: 7 | 1 | 0 };

const TOSS_API_BASE = 'https://apps-in-toss-api.toss.im';
// 콘솔에서 등록한 기능성 캠페인(type=SERVER) 코드 — Task 12에서 이 값으로 생성한다.
const TEMPLATE_SET_CODE = 'MOEUDA_DDAY_ALERT';

export function dDayLabel(daysRemaining: 7 | 1 | 0): string {
  return daysRemaining === 0 ? '오늘' : `${daysRemaining}일`;
}

export async function sendGoalReminder(target: PushTarget, env: PushEnv): Promise<boolean> {
  const response = await env.TOSS_MTLS.fetch(`${TOSS_API_BASE}/api-partner/v1/apps-in-toss/messenger/send-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-anon-key': target.anonKey,
    },
    body: JSON.stringify({
      templateSetCode: TEMPLATE_SET_CODE,
      context: {
        goalTitle: target.title,
        dDayLabel: dDayLabel(target.daysRemaining),
      },
    }),
  });
  const data = (await response.json()) as { resultType: 'SUCCESS' | 'FAIL' };
  return data.resultType === 'SUCCESS';
}
```

Run `npx vitest run` — expect pass.

- [ ] **Step 5: Modify `src/db.ts` to extend `Env` with the mTLS binding**

```ts
// replace the existing Env interface with:
export interface Env {
  DB: D1Database;
  TOSS_MTLS: Fetcher;
}
```

- [ ] **Step 6: Modify `src/index.ts` to add the `scheduled` handler**

```ts
// add to the imports at the top:
import { listAllGoals } from './db';
import { selectGoalsToNotify } from './notifyMatcher';
import { sendGoalReminder } from './tossPush';

// replace `export default { async fetch(...) { ... } };` with:
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // ...unchanged from Task 9...
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runDailyNotifications(env));
  },
};

async function runDailyNotifications(env: Env): Promise<void> {
  const todayISO = new Date().toISOString().slice(0, 10);
  const goals = await listAllGoals(env.DB);
  const targets = selectGoalsToNotify(goals, todayISO);
  for (const target of targets) {
    await sendGoalReminder(target, env);
  }
}
```

- [ ] **Step 7: Typecheck, run all tests, deploy**

```bash
npx tsc --noEmit
npx vitest run
npx wrangler deploy
```
Expected: 0 type errors, all vitest suites pass, deploy succeeds (the `[[mtls_certificates]]` and `[triggers]` blocks require Steps 0–2 to be complete — if the certificate isn't uploaded yet, `wrangler deploy` will fail on the `certificate_id` reference; stop and report that blocker rather than removing the binding to force a deploy).

- [ ] **Step 8: Commit**

```bash
git add src/tossPush.ts src/tossPush.test.ts src/db.ts src/index.ts wrangler.toml && git commit -m "feat: add mTLS Toss push client and wire it into the daily cron"
```

---

## Task 12: Notification consent UI + settings screen

**Files:**
- Create (frontend): `src/config.ts`, `src/storage/notificationSync.ts`, `src/storage/notificationSync.test.ts`, `src/features/settings/SettingsScreen.tsx`, `src/pages/settings.tsx`, `pages/settings.tsx`
- Modify (frontend): `src/features/goal-form/GoalFormScreen.tsx`, `src/features/goal-list/GoalListScreen.tsx`

**Interfaces:**
- Produces:
  ```ts
  export const BACKEND_BASE_URL: string;
  export async function getAnonKey(): Promise<string>;
  export async function syncGoalNotification(goal: { id: string; title: string; targetDate: string }): Promise<void>;
  export async function deleteGoalNotification(goalId: string): Promise<void>;
  export async function requestConsentIfNeeded(): Promise<boolean>; // resolves true if consent is granted (new or already-agreed)
  ```
- Consumes: `Goal`/`updateGoal`/`getGoals` (Task 3), backend `POST`/`DELETE /goals` (Task 9).

- [ ] **Step 1: Create the console-side notification agreement and functional campaign**

Call `mcp__apps-in-toss-console__push_notification_agreement_create`:
```json
{
  "workspaceId": 77253,
  "miniAppId": "<from Task 1>",
  "request": {
    "sendMethod": "CONDITION_BASED",
    "agreementName": "목표 D-day 알림 동의",
    "notificationTiming": "등록한 목표의 D-7, D-1, D-day가 되었을 때",
    "sendCondition": "목표일이 다가오면 알려드릴까요?"
  }
}
```
Note the returned `termsId`.

Call `mcp__apps-in-toss-console__push_template_create` with `type: "SERVER"`, `termsId` from above, and a title/content that fit the console's length rules (title ≤7 chars, no trailing period; content ≤25 chars counting each `{{var}}` as 2 chars, must end in "요.", no `!`/`~`/emoji):
```json
{
  "workspaceId": 77253,
  "miniAppId": "<from Task 1>",
  "request": {
    "name": "moeuda-dday D-day 알림",
    "type": "SERVER",
    "templateSetGroupRequest": {
      "code": "MOEUDA_DDAY_ALERT",
      "name": "D-day 알림",
      "contentReachType": "FUNCTIONAL",
      "termsId": "<termsId from above>",
      "templateSetList": [
        {
          "code": "MOEUDA_DDAY_ALERT",
          "status": "ACTIVE",
          "pushTemplateRequest": {
            "title": "D-데이 알림",
            "msg": "{{goalTitle}} 목표까지 {{dDayLabel}} 남았어요."
          }
        }
      ]
    }
  }
}
```
Confirm the exact `code` field the tool echoes back matches the literal `MOEUDA_DDAY_ALERT` used in `src/tossPush.ts` (Task 11) and in the `requestNotificationAgreement` call below — if the console assigns a different code, update `TEMPLATE_SET_CODE` in `src/tossPush.ts` to match and re-deploy the backend.

Because this is a `type: "SERVER"` template, it does not go through the NORMAL/REGULAR AI auto-review path — request review explicitly:
```
mcp__apps-in-toss-console__push_send_scheduled({ workspaceId: 77253, miniAppId: <id>, templateSetGroupNo: <from push_template_create response> })
```
Poll `mcp__apps-in-toss-console__push_template_list` (filtering by `reviewStatus`) until it reports approved. Report the review outcome to the user before proceeding — if rejected, the copy needs revision before this task can continue.

- [ ] **Step 2: Write `src/config.ts`**

```ts
// Task 9's `wrangler deploy` output — replace with the actual printed URL if different.
export const BACKEND_BASE_URL = 'https://moeuda-dday-backend.<subdomain>.workers.dev';
```

- [ ] **Step 3: Write `src/storage/notificationSync.test.ts` (failing first)**

```ts
import { Storage, User, requestNotificationAgreement } from '@apps-in-toss/framework';
import {
  deleteGoalNotification,
  getAnonKey,
  requestConsentIfNeeded,
  syncGoalNotification,
} from './notificationSync';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: { getItem: jest.fn(), setItem: jest.fn() },
  User: { getAnonymousKey: jest.fn() },
  requestNotificationAgreement: jest.fn(),
}));

const mockedStorage = jest.mocked(Storage);
const mockedUser = jest.mocked(User);
const mockedRequestConsent = jest.mocked(requestNotificationAgreement);

const originalFetch = global.fetch;

describe('notificationSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('getAnonKey', () => {
    it('fetches and caches the anonymous key', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      mockedUser.getAnonymousKey.mockResolvedValue({ type: 'HASH', hash: 'anon-123' });
      await expect(getAnonKey()).resolves.toBe('anon-123');
      expect(mockedStorage.setItem).toHaveBeenCalledWith('moeuda-dday-anon-key-v1', 'anon-123');
    });

    it('returns the cached key without calling the SDK again', async () => {
      mockedStorage.getItem.mockResolvedValue('cached-anon');
      await expect(getAnonKey()).resolves.toBe('cached-anon');
      expect(mockedUser.getAnonymousKey).not.toHaveBeenCalled();
    });
  });

  describe('syncGoalNotification / deleteGoalNotification', () => {
    it('POSTs the goal to the backend with the anon key', async () => {
      mockedStorage.getItem.mockResolvedValue('anon-123');
      await syncGoalNotification({ id: 'g1', title: '수능', targetDate: '2027-11-18' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/goals'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ id: 'g1', anonKey: 'anon-123', title: '수능', targetDate: '2027-11-18' }),
        })
      );
    });

    it('DELETEs the goal from the backend with the anon key', async () => {
      mockedStorage.getItem.mockResolvedValue('anon-123');
      await deleteGoalNotification('g1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/goals'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ id: 'g1', anonKey: 'anon-123' }),
        })
      );
    });
  });

  describe('requestConsentIfNeeded', () => {
    it('resolves true when the user grants new consent', async () => {
      mockedRequestConsent.mockImplementation(({ onEvent }) => {
        onEvent({ type: 'newAgreement' });
        return () => {};
      });
      await expect(requestConsentIfNeeded()).resolves.toBe(true);
    });

    it('resolves true when the user already agreed', async () => {
      mockedRequestConsent.mockImplementation(({ onEvent }) => {
        onEvent({ type: 'alreadyAgreed' });
        return () => {};
      });
      await expect(requestConsentIfNeeded()).resolves.toBe(true);
    });

    it('resolves false when the user rejects', async () => {
      mockedRequestConsent.mockImplementation(({ onEvent }) => {
        onEvent({ type: 'agreementRejected' });
        return () => {};
      });
      await expect(requestConsentIfNeeded()).resolves.toBe(false);
    });

    it('resolves false when the SDK errors', async () => {
      mockedRequestConsent.mockImplementation(({ onError }) => {
        onError(new Error('bridge unavailable'));
        return () => {};
      });
      await expect(requestConsentIfNeeded()).resolves.toBe(false);
    });
  });
});
```

- [ ] **Step 4: Write `src/storage/notificationSync.ts`**

```ts
import { Storage, User, requestNotificationAgreement } from '@apps-in-toss/framework';
import { BACKEND_BASE_URL } from '../config';

const ANON_KEY_STORAGE_KEY = 'moeuda-dday-anon-key-v1';
// Task 12 Step 1에서 콘솔에 등록한 기능성 캠페인 코드 — src/tossPush.ts(백엔드)의 TEMPLATE_SET_CODE와 반드시 일치해야 한다.
const NOTIFICATION_TEMPLATE_CODE = 'MOEUDA_DDAY_ALERT';

export async function getAnonKey(): Promise<string> {
  try {
    const cached = await Storage.getItem(ANON_KEY_STORAGE_KEY);
    if (cached) return cached;
  } catch {
    // fall through to fetch a fresh key
  }
  const result = await User.getAnonymousKey();
  try {
    await Storage.setItem(ANON_KEY_STORAGE_KEY, result.hash);
  } catch {
    // best-effort cache — sync calls still work with the freshly-fetched key this run
  }
  return result.hash;
}

export type NotifySyncGoal = { id: string; title: string; targetDate: string };

export async function syncGoalNotification(goal: NotifySyncGoal): Promise<void> {
  const anonKey = await getAnonKey();
  await fetch(`${BACKEND_BASE_URL}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: goal.id, anonKey, title: goal.title, targetDate: goal.targetDate }),
  });
}

export async function deleteGoalNotification(goalId: string): Promise<void> {
  const anonKey = await getAnonKey();
  await fetch(`${BACKEND_BASE_URL}/goals`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: goalId, anonKey }),
  });
}

export function requestConsentIfNeeded(): Promise<boolean> {
  return new Promise((resolve) => {
    const cleanup = requestNotificationAgreement({
      options: { templateCode: NOTIFICATION_TEMPLATE_CODE },
      onEvent: ({ type }) => {
        resolve(type === 'newAgreement' || type === 'alreadyAgreed');
        cleanup();
      },
      onError: () => {
        resolve(false);
        cleanup();
      },
    });
  });
}
```

Note: `User.getAnonymousKey` is documented with a `@apps-in-toss/web-framework` import example in the developer docs; every other `User`/SDK-level function this codebase uses (`Storage`, `share`, `requestReview`, `loadFullScreenAd`, `requestNotificationAgreement`) is imported from `@apps-in-toss/framework` for React Native, so this plan assumes the same holds for `User.getAnonymousKey`. If `npx tsc --noEmit` in Step 6 reports it missing from `@apps-in-toss/framework`'s type exports, check the installed package's `.d.ts` for the correct RN entry point before falling back to any workaround.

- [ ] **Step 5: Run tests, typecheck, commit**

```bash
npx jest src/storage/notificationSync.test.ts
npx tsc --noEmit
git add src/config.ts src/storage/notificationSync.ts src/storage/notificationSync.test.ts && git commit -m "feat: add anon key, backend sync, and notification consent helpers"
```

- [ ] **Step 6: Write `src/features/settings/SettingsScreen.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteGoalNotification, requestConsentIfNeeded, syncGoalNotification } from '../../storage/notificationSync';
import { getGoals, updateGoal, type Goal } from '../../storage/goals';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

export function SettingsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    getGoals().then(setGoals);
  }, []);

  const handleToggle = async (goal: Goal) => {
    const nextEnabled = !goal.notifyEnabled;

    if (nextEnabled) {
      const consented = await requestConsentIfNeeded();
      if (!consented) return;
      if (!goal.targetDate) {
        Alert.alert('목표일이 없어서 알림을 켤 수 없어요.');
        return;
      }
      await syncGoalNotification({ id: goal.id, title: goal.title, targetDate: goal.targetDate });
    } else {
      await deleteGoalNotification(goal.id);
    }

    await updateGoal(goal.id, { notifyEnabled: nextEnabled });
    setGoals(await getGoals());
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>알림 설정</Text>
      {goals.length === 0 ? (
        <Text style={styles.emptyText}>등록된 목표가 없어요.</Text>
      ) : (
        <FlatList
          testID="settings-goal-list"
          data={goals}
          keyExtractor={(goal) => goal.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <TouchableOpacity
                testID={`settings-toggle-${item.id}`}
                style={[styles.toggle, item.notifyEnabled && styles.toggleActive]}
                onPress={() => handleToggle(item)}>
                <Text style={[styles.toggleText, item.notifyEnabled && styles.toggleTextActive]}>
                  {item.notifyEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 20 },
  header: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.darkText, marginHorizontal: 20, marginBottom: 16 },
  emptyText: { fontSize: fontSizes.body, color: colors.secondaryText, marginHorizontal: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowTitle: { fontSize: fontSizes.body, color: colors.darkText },
  toggle: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.divider },
  toggleActive: { backgroundColor: colors.primaryCoralPink },
  toggleText: { fontSize: 12, fontWeight: fontWeights.bold, color: colors.secondaryText },
  toggleTextActive: { color: '#FFFFFF' },
});
```

Write `src/features/settings/SettingsScreen.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from './SettingsScreen';
import { getGoals, updateGoal } from '../../storage/goals';
import { deleteGoalNotification, requestConsentIfNeeded, syncGoalNotification } from '../../storage/notificationSync';

jest.mock('../../storage/goals');
jest.mock('../../storage/notificationSync');

const mockedGetGoals = jest.mocked(getGoals);
const mockedUpdateGoal = jest.mocked(updateGoal);
const mockedRequestConsent = jest.mocked(requestConsentIfNeeded);
const mockedSync = jest.mocked(syncGoalNotification);
const mockedDelete = jest.mocked(deleteGoalNotification);

const GOAL = { id: 'g1', type: 'date' as const, title: '수능', targetDate: '2027-11-18', notifyEnabled: false, createdAt: 0 };

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetGoals.mockResolvedValue([GOAL]);
    mockedUpdateGoal.mockResolvedValue({ ...GOAL, notifyEnabled: true });
  });

  it('requests consent and syncs when turning notifications on', async () => {
    mockedRequestConsent.mockResolvedValue(true);
    render(<SettingsScreen />);
    await waitFor(() => screen.getByTestId('settings-toggle-g1'));
    fireEvent.press(screen.getByTestId('settings-toggle-g1'));
    await waitFor(() => expect(mockedSync).toHaveBeenCalledWith({ id: 'g1', title: '수능', targetDate: '2027-11-18' }));
    expect(mockedUpdateGoal).toHaveBeenCalledWith('g1', { notifyEnabled: true });
  });

  it('does not sync when consent is declined', async () => {
    mockedRequestConsent.mockResolvedValue(false);
    render(<SettingsScreen />);
    await waitFor(() => screen.getByTestId('settings-toggle-g1'));
    fireEvent.press(screen.getByTestId('settings-toggle-g1'));
    await waitFor(() => expect(mockedRequestConsent).toHaveBeenCalled());
    expect(mockedSync).not.toHaveBeenCalled();
    expect(mockedUpdateGoal).not.toHaveBeenCalled();
  });

  it('deletes the backend record when turning notifications off', async () => {
    mockedGetGoals.mockResolvedValue([{ ...GOAL, notifyEnabled: true }]);
    render(<SettingsScreen />);
    await waitFor(() => screen.getByTestId('settings-toggle-g1'));
    fireEvent.press(screen.getByTestId('settings-toggle-g1'));
    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('g1'));
  });
});
```

- [ ] **Step 7: Wire up the route**

```tsx
// src/pages/settings.tsx
import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { SettingsScreen } from '../features/settings/SettingsScreen';

export const Route = createRoute('/settings', {
  component: SettingsScreen,
});
```

```ts
// pages/settings.tsx
export { Route } from 'pages/settings';
```

- [ ] **Step 8: Modify `GoalFormScreen.tsx` to wire in consent + sync**

In `src/features/goal-form/GoalFormScreen.tsx`, add the imports and replace the tail of `handleSave`:

```tsx
// add to the imports
import { deleteGoalNotification, requestConsentIfNeeded, syncGoalNotification } from '../../storage/notificationSync';

// replace the notifyEnabled resolution and the save/onSaved tail of handleSave with:
    let finalNotifyEnabled = achieved ? false : notifyEnabled;
    if (finalNotifyEnabled && !achieved) {
      const consented = await requestConsentIfNeeded();
      finalNotifyEnabled = consented;
    }

    const input = {
      type,
      title: title.trim(),
      targetDate: resolvedTargetDate,
      targetAmount: type === 'money' ? Number(targetAmount) : undefined,
      currentAmount: type === 'money' ? Number(currentAmount) : undefined,
      monthlySaving: type === 'money' ? Number(monthlySaving) : undefined,
      notifyEnabled: finalNotifyEnabled,
    };

    const savedGoal = props.mode === 'create' ? await createGoal(input) : await updateGoal(props.goalId, input);
    if (savedGoal) {
      if (finalNotifyEnabled && savedGoal.targetDate) {
        await syncGoalNotification({ id: savedGoal.id, title: savedGoal.title, targetDate: savedGoal.targetDate });
      } else if (!finalNotifyEnabled && props.mode === 'edit') {
        await deleteGoalNotification(savedGoal.id);
      }
    }
    props.onSaved();
```

- [ ] **Step 9: Modify `GoalListScreen.tsx` to clean up notifications on delete**

In `src/features/goal-list/GoalListScreen.tsx`, add the import and update `handleDelete`'s `onPress`:

```tsx
// add to the imports
import { deleteGoalNotification } from '../../storage/notificationSync';

// inside handleDelete's Alert.alert onPress:
        onPress: async () => {
          if (goal.notifyEnabled) {
            await deleteGoalNotification(goal.id);
          }
          await deleteGoal(goal.id);
          setGoals(await getGoals());
        },
```

- [ ] **Step 10: Regenerate routes, typecheck, run full test suite**

```bash
npx granite dev &
sleep 15
kill %1
npx tsc --noEmit
npx jest
npx eslint .
```
Expected: 0 type errors, all suites pass (this is the first point every route exists, so any leftover route-name type errors from Tasks 5–7's interim notes should now be gone), only the pre-existing `.granite/*`/`_app.tsx` lint noise remains.

- [ ] **Step 11: Commit**

```bash
git add src/features/settings src/pages/settings.tsx pages/settings.tsx src/features/goal-form/GoalFormScreen.tsx src/features/goal-list/GoalListScreen.tsx src/router.gen.ts && git commit -m "feat: add notification consent flow and settings screen"
```

---

## Task 13: Mobile UX verification / final build + deploy

**Files:** none created — verification and deployment only.

- [ ] **Step 1: Full frontend test suite + typecheck + lint**

```bash
cd "C:/Users/User/-/moeuda-dday"
npx jest
npx tsc --noEmit
npx eslint .
```
Expected: all tests pass, 0 type errors, 0 lint errors aside from the pre-existing `.granite/*` cache noise and `_app.tsx` react-in-jsx-scope warning seen in every other project in this workspace.

- [ ] **Step 2: Confirm the backend is live and current**

```bash
cd "C:/Users/User/moeuda-dday-backend"
npx tsc --noEmit
npx vitest run
npx wrangler deploy
```
Redeploy even if Task 11 already deployed once, in case Task 12 changed the `TEMPLATE_SET_CODE`/campaign code. Confirm the D1-backed `POST /goals` smoke test from Task 9 Step 8 still works against the live URL:

```bash
curl -s -X POST "<workers.dev URL from Task 9>/goals" -H "Content-Type: application/json" -d '{"id":"smoke-test","anonKey":"smoke","title":"smoke","targetDate":"2030-01-01"}'
```
Expected: `{"ok":true}`. Then clean it up:
```bash
curl -s -X DELETE "<workers.dev URL>/goals" -H "Content-Type: application/json" -d '{"id":"smoke-test","anonKey":"smoke"}'
```

- [ ] **Step 3: Build the frontend `.ait` artifact**

```bash
cd "C:/Users/User/-/moeuda-dday"
rm -rf .granite .swc
npx ait build
```
If it fails with a Windows path-escaping error or a missing hermesc win64 binary, apply the fixes documented in `C:\Users\User\.claude\skills\apps-in-toss-miniapp\SKILL.md` §2, then retry. Note the printed `deploymentId`.

- [ ] **Step 4: Deploy via the MCP console flow**

Follow `C:\Users\User\.claude\skills\apps-in-toss-miniapp\SKILL.md` §3 exactly: `bundle_upload` (workspaceId 77253, miniAppId from Task 1) → `curl -X PUT` the `.ait` to the returned `uploadUrl` → `bundle_upload_complete` → poll `bundle_build_status` every ~20s until `isBuilding: false` → confirm via `bundle_list` that `reviewStatus: "CREATED"`.

Stop there — do not call `bundle_test_push` or `bundle_submit_review` unless the user explicitly asks for that next step.

- [ ] **Step 5: Manual mobile UX pass**

Since this app has no automated E2E/device testing in this workspace (matching every sibling project), do a manual pass via the console's QR test flow covering: empty state → add date-type goal → add money-type goal → goal list D-day/progress display → goal detail (both types, including the achieved-state card) → reward ad unlock → report screen preset recalculation (confirm the interstitial doesn't show before the 4th recalculation and does on the 4th) → settings toggle (confirm the consent UI appears on first enable) → banner ad renders at the bottom of goal detail without auto-refreshing on button taps.

- [ ] **Step 6: Report back**

Summarize to the user: frontend miniAppId/appName/versionName deployed and current `reviewStatus`; backend Worker URL and cron schedule; and remind them that (a) the mTLS certificate must be in place and verified working (a real `send-message` call succeeding, not just `wrangler deploy` succeeding) before D-day push notifications will actually reach users, (b) real ad `adGroupId`s must be swapped in for the three `ait-ad-test-*` placeholders before requesting review, and (c) the push template/agreement copy (Task 12 Step 1) needs final review-approval confirmation if it wasn't already approved during that task.

---

## Self-Review

**Spec coverage** — every section of `PLAN_모으다보니Dday.md` maps to a task:
- §1 개요/§13 구현순서 → Global Constraints + task ordering (1:1 with the 11-step spec list, split further for TDD granularity)
- §2 디자인 방향 → Task 2
- §3 기술 스택/폴더 구조 → Task 1 (frontend scaffold) + Task 9 (backend scaffold); folder layout matches spec §3 exactly (`storage/notificationSync.ts`, `features/goal-report/calc.ts`, backend `src/index.ts`/`cron.ts`-equivalent split across Tasks 10–11/`tossPush.ts`)
- §4 화면 구성 (4-1 through 4-5) → Tasks 5 (4-1, 4-2), 6 (4-3), 7 (4-4), 12 (4-5)
- §5 계산 로직 → Task 4 (date/money base calc + validation), Task 7 (interest simulation + spending-cut guide)
- §6 데이터 구조 → Task 3 (`Goal` type), Task 9 (`GoalRow`/sync payload restricted to id/title/targetDate)
- §7 백엔드 & 푸시 알림 → Tasks 9, 10, 11, 12 (sync API, matching logic, mTLS client, consent + template review)
- §8 광고 배치 원칙 → Tasks 6 (banner), 7 (reward), 8 (interstitial frequency cap) + Global Constraints
- §9 검증 규칙 → Task 4 (`validateMoneyGoalInput`) + Task 5 (`validateGoalForm`, past-date check)
- §10 공통 컴포넌트 → `GoalCard`/`ProgressBar` (Task 5), `AdContainer` (Task 6), `RewardAdButton` (Task 7), `InterstitialAdController` (Task 8)
- §11 아이콘 에셋 → Task 1
- §12 메인 화면 카피 → Task 5's `GoalListScreen` empty state

No gaps found requiring a new task; the only spec line not literally implemented is §7's "메시지 템플릿은... 운영 배포 전 확인" — this plan treats that confirmation as part of Task 12 Step 1 and Task 13 Step 6, rather than a separate task, since it's a one-time review-status check, not new code.

**Placeholder scan** — every code block in every task is complete, runnable code; no `TODO`, `// ...implement...`, or "similar to Task N" stand-ins appear anywhere except the two places where a value is genuinely only known at execution time (an `iconUri`/`certificate_id`/`database_id` placeholder to paste in after a prior step's tool call returns it) — these are explicitly marked with `<...>` and instructions for what to paste, not left as unresolved logic.

**Type/signature consistency across tasks:**
- `Goal`/`GoalType`/`NewGoalInput` (Task 3) are used with the identical shape in Tasks 4–8, 12.
- `MoneyGoalInput`/`calculateRemainingAmount`/`calculateMonthsNeeded`/`calculateProgressPercent`/`isMoneyGoalAchieved` (Task 4) are reused verbatim (not redefined) in `GoalCard` (5), `GoalDetailScreen` (6), and `goal-report/calc.ts` (7) — confirmed no duplicate/divergent local reimplementations.
- `GoalRow` is defined once in the backend's `src/types.ts` (Task 9) and imported by `notifyMatcher.ts` (Task 10) and `db.ts`/`index.ts` (Task 9/11) rather than redefined.
- `TEMPLATE_SET_CODE`/`NOTIFICATION_TEMPLATE_CODE` literal `'MOEUDA_DDAY_ALERT'` is the same string in backend `tossPush.ts` (Task 11), the console `push_template_create` call (Task 12 Step 1), and frontend `notificationSync.ts` (Task 12 Step 4) — Task 12 Step 1 explicitly calls out reconciling this if the console assigns a different code.
- `Env`/`PushEnv` in the backend are extended (Task 11 modifies Task 9's `Env`) rather than redeclared incompatibly.
- Route params (`{ mode, id }` for `/goal-form`, `{ id }` for `/goal-detail`/`/goal-report`) are declared once via `validateParams` per route and consumed identically by every `navigation.navigate` call across Tasks 5–7, matching the verified real pattern from `pet-portrait`'s `src/pages/*.tsx`.

**Guessed/inferred items** (flagged for the user, not silently assumed): the `titleEn` string (Task 1), the exact interstitial threshold "4" within the spec's stated 3–5 range (Global Constraints), the simple-interest accrual formula's month-by-month compounding shape (Task 7 — spec only says "단리로 반영" without a worked formula), and `User.getAnonymousKey`'s import path for React Native (Task 12 Step 4 note) since the developer docs only showed a `@apps-in-toss/web-framework` example for that one function.
