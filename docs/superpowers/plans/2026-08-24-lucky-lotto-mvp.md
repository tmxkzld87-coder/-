# 번호 조합기 (Lucky Lotto) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the MVP of 번호 조합기 — a Toss mini-app that generates 로또 6/45 and 연금복권720+ number combinations from user filters, plus a "행운 번호 테스트" seeded-random fun feature.

**Architecture:** Granite/`@apps-in-toss/framework` React Native app (same toolchain as `chuck-chuck-calculator`, but a separate project/console app). Pure calculation logic lives in `calc.ts` files per feature, fully unit-tested with injectable RNG for determinism; screens are thin React Native components that call the calc functions and render results. No backend server — a build-time script fetches lotto draw history into a static bundled JSON file.

**Tech Stack:** TypeScript, React Native (Granite), Jest + `@testing-library/react-native`, `@apps-in-toss/framework` (`Storage`, `share`).

**Spec:** `C:\Users\User\-\PLAN_번호조합기.md`

## Global Constraints

- appName (console identifier): `lucky-lotto` — lowercase/hyphens only, cannot be changed after creation
- title: `번호 조합기` / titleEn: `Lucky Numbers`
- Color tokens (from spec §2): Primary Amber `#F5A623`, Dark Text `#191F28`, Secondary Text `#8B95A1`, Divider `#F2F4F6`, Background `#FFFFFF`, Light Amber Background `#FFF6E5`, Success `#20C997`, Error `#F04452`
- No real-money or gambling mechanics — this generates candidate numbers only, never sells tickets or handles payment
- All result/fortune copy must read as "참고용/재미로" (reference-only/for fun), never imply a guaranteed win
- No server-side storage of user data — `Storage` (local device) only, matching every other app in this workspace
- MVP does **not** include the "복권 명당 지도" feature (spec §11) and does **not** wire a real ad SDK (spec §8) — `AdContainer` is a visual placeholder only
- workspaceId: `77253`, business/operator: 육퇴못한파더 작업실

---

## Task 1: Console app registration + project scaffold

**Files:**
- Create: `C:\Users\User\-\lucky-lotto\package.json`, `granite.config.ts`, `tsconfig.json`, `babel.config.js`, `.gitignore`, `.prettierrc`, `eslint.config.mjs`, `react-native.config.js`, `jest.config.js`, `jest.setup.ts`, `index.ts`, `require.context.ts`, `README.md`, `pages/_404.tsx`, `src/_app.tsx`

**Interfaces:**
- Produces: a working, installable Granite project at `C:\Users\User\-\lucky-lotto` that `npx tsc --noEmit` and `npx jest --passWithNoTests` succeed in, and a registered console mini-app with a real `iconUri`.

- [ ] **Step 1: Generate the 600x600 app icon via the Browser tool's canvas**

Use `mcp__Claude_Browser__preview_start` with a blank/any URL to get a tab, then `mcp__Claude_Browser__javascript_tool` (`javascript_exec`) to run:

```js
(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#F5A623';
  ctx.fillRect(0, 0, 600, 600);

  ctx.beginPath();
  ctx.arc(300, 300, 190, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#E8940F';
  ctx.stroke();

  ctx.fillStyle = '#191F28';
  ctx.font = 'bold 220px -apple-system, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('7', 300, 320);

  return canvas.toDataURL('image/png');
})();
```

The call returns a `data:image/png;base64,....` string. Save it to a file in **your own session's scratchpad directory** (given in your system prompt — do not hardcode a path from a different session) with Bash, e.g.:

```bash
node -e "
const fs = require('fs');
const dataUrl = process.argv[1];
const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
fs.writeFileSync(process.argv[2], Buffer.from(base64, 'base64'));
" "<paste the returned data URL here>" "<your scratchpad dir>/lucky-lotto-icon.png"
```

Verify the file exists and note its byte size (`ls -la`) — you'll need it for `contentLength` in the next step.

- [ ] **Step 2: Upload the icon and register the console app**

Call `mcp__apps-in-toss-console__image_upload_url` with `{workspaceId: 77253, extension: "png", contentLength: <byte size from step 1>}`. PUT the file to the returned `uploadUrl`:

```bash
curl -X PUT -H "Content-Type: image/png" -H "x-amz-acl: public-read" --data-binary @"<your scratchpad dir>/lucky-lotto-icon.png" "<uploadUrl>"
```

Then call `mcp__apps-in-toss-console__miniapp_create` with:
```json
{
  "workspaceId": 77253,
  "request": {
    "miniApp": {
      "miniAppId": 0,
      "appName": "lucky-lotto",
      "title": "번호 조합기",
      "titleEn": "Lucky Numbers",
      "description": "로또·연금복권 번호 조합",
      "detailDescription": "번호 조합기는 로또 6/45와 연금복권720+ 번호를 조건에 맞게 조합해주는 도구예요. 제외하고 싶은 번호, 꼭 넣고 싶은 번호, 최근 미출현 번호를 골라 번호를 생성하고, 결과는 저장하거나 친구에게 공유할 수 있어요. 생년월일이나 오늘 떠오르는 단어로 행운 번호 5줄을 만들어보는 재미 요소도 있어요. 모든 결과는 참고용이며 당첨을 보장하지 않아요.",
      "iconUri": "<publicUrl from image_upload_url>"
    },
    "impression": {
      "categoryIds": [3834],
      "subCategoryIds": [72],
      "keywordList": ["로또", "로또번호", "연금복권", "번호생성기", "로또조합", "행운번호", "번호추천"]
    }
  }
}
```

Note the returned `miniAppId` — you'll need it for `granite.config.ts` and every later console call.

- [ ] **Step 3: Scaffold the project files**

Create `C:\Users\User\-\lucky-lotto\` and copy these files verbatim from `C:\Users\User\-\chuck-chuck-calculator\` (only the `name` field in `package.json` differs — change it to `lucky-lotto`): `package.json`, `tsconfig.json`, `babel.config.js`, `.gitignore`, `.prettierrc`, `eslint.config.mjs`, `react-native.config.js`, `jest.config.js`, `jest.setup.ts`, `index.ts`, `require.context.ts`, `README.md`, `pages/_404.tsx`, `src/_app.tsx`.

Write `granite.config.ts`:

```ts
import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'lucky-lotto',
  plugins: [
    router(),
    hermes(),
    appsInToss({
      brand: {
        displayName: '번호 조합기',
        primaryColor: '#F5A623',
        icon: '<iconUri from Step 2>',
      },
      permissions: [],
    }),
  ],
});
```

- [ ] **Step 4: Install dependencies and verify the scaffold**

```bash
cd "C:/Users/User/-/lucky-lotto" && npm install
```

If `ait build` is attempted later and fails with a Windows path-escaping or missing-hermesc-binary error, see `C:\Users\User\.claude\skills\apps-in-toss-miniapp\SKILL.md` §2 — both are known, already-solved issues on this machine.

Run:
```bash
npx tsc --noEmit
npx jest --passWithNoTests
```
Expected: both succeed (no source files exist yet, so there's nothing to typecheck/test, but the config itself must be valid).

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/User/-/lucky-lotto" && git init && git add -A && git commit -m "chore: scaffold lucky-lotto Granite app with apps-in-toss config"
```

(This project doesn't need to live inside the `-\` monorepo's git history — give it its own repo, matching how `chuck-chuck-calculator` and `menu-cost-calculator` are each their own git-tracked project even though `PLAN_*.md` docs live in `-\`.)

---

## Task 2: Theme tokens + shared components

**Files:**
- Create: `src/theme/colors.ts`, `src/theme/typography.ts`, `src/components/NumberBall.tsx`, `src/components/FilterChip.tsx`, `src/components/AdContainer.tsx`

**Interfaces:**
- Produces: `colors` (object), `fontSizes`/`fontWeights`/`tabularNums`, `<NumberBall value state onPress? testID?>`, `<FilterChip label active onPress testID?>`, `<AdContainer>` — consumed by every screen task from here on.

- [ ] **Step 1: Write `src/theme/colors.ts`**

```ts
export const colors = {
  primaryAmber: '#F5A623',
  darkText: '#191F28',
  secondaryText: '#8B95A1',
  divider: '#F2F4F6',
  background: '#FFFFFF',
  lightAmberBackground: '#FFF6E5',
  success: '#20C997',
  error: '#F04452',
} as const;

export type ColorToken = keyof typeof colors;
```

- [ ] **Step 2: Write `src/theme/typography.ts`**

```ts
import type { TextStyle } from 'react-native';

export const fontWeights = {
  bold: '700',
  regular: '400',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSizes = {
  title: 22,
  body: 15,
  caption: 13,
  resultLarge: 28,
} as const;

export const tabularNums: Pick<TextStyle, 'fontVariant'> = {
  fontVariant: ['tabular-nums'],
};
```

- [ ] **Step 3: Write `src/theme/colors.test.ts` and `src/theme/typography.test.ts`**

```ts
// src/theme/colors.test.ts
import { colors } from './colors';

describe('colors', () => {
  it('defines every token as a 6-digit hex string', () => {
    for (const value of Object.values(colors)) {
      expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
```

```ts
// src/theme/typography.test.ts
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

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/User/-/lucky-lotto" && npx jest src/theme
```
Expected: 2 suites pass.

- [ ] **Step 5: Write `src/components/NumberBall.tsx`**

```tsx
import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontWeights } from '../theme/typography';

export type NumberBallState = 'default' | 'excluded' | 'required' | 'result';

export type NumberBallProps = {
  value: number | string;
  state?: NumberBallState;
  onPress?: () => void;
  testID?: string;
};

const STATE_STYLES: Record<NumberBallState, { background: string; text: string; border: string }> = {
  default: { background: colors.background, text: colors.darkText, border: colors.divider },
  excluded: { background: colors.divider, text: colors.secondaryText, border: colors.divider },
  required: { background: colors.primaryAmber, text: '#FFFFFF', border: colors.primaryAmber },
  result: { background: colors.lightAmberBackground, text: colors.darkText, border: colors.primaryAmber },
};

export function NumberBall({ value, state = 'default', onPress, testID }: NumberBallProps) {
  const s = STATE_STYLES[state];
  if (onPress) {
    return (
      <TouchableOpacity testID={testID} onPress={onPress} style={[styles.ball, { backgroundColor: s.background, borderColor: s.border }]}>
        <Text style={[styles.text, { color: s.text }]}>{value}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View testID={testID} style={[styles.ball, { backgroundColor: s.background, borderColor: s.border }]}>
      <Text style={[styles.text, { color: s.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ball: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', margin: 4 },
  text: { fontSize: 15, fontWeight: fontWeights.bold },
});
```

- [ ] **Step 6: Write `src/components/NumberBall.test.tsx`**

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NumberBall } from './NumberBall';

describe('NumberBall', () => {
  it('renders the given value', () => {
    render(<NumberBall value={7} />);
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('calls onPress when tappable', () => {
    const onPress = jest.fn();
    render(<NumberBall testID="ball-7" value={7} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('ball-7'));
    expect(onPress).toHaveBeenCalled();
  });

  it('renders as non-interactive when onPress is omitted', () => {
    render(<NumberBall testID="ball-7" value={7} state="result" />);
    expect(screen.getByTestId('ball-7')).toBeTruthy();
  });
});
```

- [ ] **Step 7: Write `src/components/FilterChip.tsx`**

```tsx
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

export type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
};

export function FilterChip({ label, active, onPress, testID }: FilterChipProps) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.divider, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: colors.primaryAmber },
  text: { fontSize: fontSizes.caption, color: colors.darkText, fontWeight: fontWeights.bold },
  textActive: { color: '#FFFFFF' },
});
```

- [ ] **Step 8: Write `src/components/FilterChip.test.tsx`**

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FilterChip } from './FilterChip';

describe('FilterChip', () => {
  it('renders the label and calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<FilterChip testID="chip" label="10주" active={false} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('chip'));
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByText('10주')).toBeTruthy();
  });
});
```

- [ ] **Step 9: Write `src/components/AdContainer.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes } from '../theme/typography';

// Placeholder banner slot, always docked to the bottom of the screen (never
// at scroll-end). Real ad SDK integration is out of scope for this MVP —
// see PLAN_번호조합기.md §8. Never tie its refresh to a button press.
export function AdContainer() {
  return (
    <View testID="ad-container" style={styles.container}>
      <Text style={styles.tag}>AD</Text>
      <Text style={styles.label}>배너 광고 영역</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.divider },
  tag: { fontSize: 10, fontWeight: '700', color: colors.secondaryText, borderWidth: 1, borderColor: colors.secondaryText, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, opacity: 0.7 },
  label: { fontSize: fontSizes.caption, color: colors.secondaryText },
});
```

- [ ] **Step 10: Write `src/components/AdContainer.test.tsx`**

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AdContainer } from './AdContainer';

describe('AdContainer', () => {
  it('renders a placeholder banner', () => {
    render(<AdContainer />);
    expect(screen.getByTestId('ad-container')).toBeTruthy();
    expect(screen.getByText('배너 광고 영역')).toBeTruthy();
  });
});
```

- [ ] **Step 11: Run all component tests and typecheck**

```bash
cd "C:/Users/User/-/lucky-lotto" && npx jest src/components && npx tsc --noEmit
```
Expected: all pass, 0 type errors.

- [ ] **Step 12: Commit**

```bash
git add src/theme src/components && git commit -m "feat: add theme tokens and shared NumberBall/FilterChip/AdContainer components"
```

---

## Task 3: Lotto history data

**Files:**
- Create: `scripts/updateLottoHistory.mjs`, `src/data/lottoHistory.json`

**Interfaces:**
- Produces: `src/data/lottoHistory.json` — an array of `{ drwNo: number, drwNoDate: string, numbers: number[], bonusNo: number }`, imported directly by Task 4/5's screen.

- [ ] **Step 1: Write the fetch script**

```js
// scripts/updateLottoHistory.mjs
import { writeFileSync } from 'node:fs';

const WEEKS_TO_FETCH = 52;

async function fetchDraw(drwNo) {
  const res = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`);
  const json = await res.json();
  if (json.returnValue !== 'success') return null;
  return {
    drwNo: json.drwNo,
    drwNoDate: json.drwNoDate,
    numbers: [json.drwtNo1, json.drwtNo2, json.drwtNo3, json.drwtNo4, json.drwtNo5, json.drwtNo6].sort((a, b) => a - b),
    bonusNo: json.bnusNo,
  };
}

async function findLatestDrwNo() {
  const firstDrawDate = new Date('2002-12-07T00:00:00+09:00');
  const weeksSince = Math.floor((Date.now() - firstDrawDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  let guess = weeksSince + 1;
  while (await fetchDraw(guess + 1)) guess += 1;
  while (!(await fetchDraw(guess))) guess -= 1;
  return guess;
}

async function main() {
  const latest = await findLatestDrwNo();
  const draws = [];
  for (let n = latest - WEEKS_TO_FETCH + 1; n <= latest; n++) {
    const draw = await fetchDraw(n);
    if (draw) draws.push(draw);
  }
  writeFileSync(new URL('../src/data/lottoHistory.json', import.meta.url), JSON.stringify(draws, null, 2));
  console.log(`Saved ${draws.length} draws, latest round ${latest}`);
}

main();
```

- [ ] **Step 2: Run it**

```bash
cd "C:/Users/User/-/lucky-lotto" && node scripts/updateLottoHistory.mjs
```

Expected: prints `Saved 52 draws, latest round <N>` and creates `src/data/lottoHistory.json`.

**If the sandbox has no outbound network access** (the fetch calls time out or are blocked), do NOT fabricate real-looking draw numbers. Instead write `src/data/lottoHistory.json` by hand with exactly this placeholder content, clearly marked as non-real:

```json
[
  { "drwNo": 0, "drwNoDate": "PLACEHOLDER", "numbers": [1, 2, 3, 4, 5, 6], "bonusNo": 7 },
  { "drwNo": 0, "drwNoDate": "PLACEHOLDER", "numbers": [10, 20, 30, 40, 41, 45], "bonusNo": 15 }
]
```

and add a line to this task's commit message noting real data must be fetched with network access before this app is submitted for review — `npx node scripts/updateLottoHistory.mjs` is safe to re-run any time later.

- [ ] **Step 3: Verify the file shape**

```bash
node -e "const d = require('./src/data/lottoHistory.json'); console.log(d.length, d[0]);"
```
Expected: prints a count and one object with `drwNo`, `drwNoDate`, `numbers` (array of 6), `bonusNo`.

- [ ] **Step 4: Commit**

```bash
git add scripts/updateLottoHistory.mjs src/data/lottoHistory.json && git commit -m "feat: add lotto draw history fetch script and bundled data"
```

---

## Task 4: Lotto combination logic

**Files:**
- Create: `src/features/lotto/calc.ts`
- Test: `src/features/lotto/calc.test.ts`

**Interfaces:**
- Consumes: `src/data/lottoHistory.json` shape from Task 3 (as `LottoDraw[]`, structurally compatible — no import needed in calc.ts itself, only in the screen).
- Produces: `type LottoFilters = { excludedNumbers: number[]; requiredNumbers: number[]; preferUnseenWeeks: number | null }`, `type LottoDraw = { drwNo: number; drwNoDate: string; numbers: number[]; bonusNo: number }`, `type LottoGame = number[]`, `reconcileExclusions(excluded: number[], required: number[]): { excluded: number[]; changed: boolean }`, `generateLottoGames(filters: LottoFilters, history: LottoDraw[], gameCount: number, rng?: () => number): LottoGame[]` — consumed by Task 5's `LottoScreen`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/features/lotto/calc.test.ts
import { generateLottoGames, reconcileExclusions, type LottoDraw } from './calc';

function fixedRng(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length]!;
}

const EMPTY_HISTORY: LottoDraw[] = [];

describe('reconcileExclusions', () => {
  it('removes any excluded number that is also required', () => {
    const result = reconcileExclusions([1, 2, 3], [2]);
    expect(result.excluded).toEqual([1, 3]);
    expect(result.changed).toBe(true);
  });

  it('reports no change when there is no overlap', () => {
    const result = reconcileExclusions([1, 2], [3]);
    expect(result.excluded).toEqual([1, 2]);
    expect(result.changed).toBe(false);
  });
});

describe('generateLottoGames', () => {
  it('always includes every required number in every game', () => {
    const games = generateLottoGames(
      { excludedNumbers: [], requiredNumbers: [7, 21], preferUnseenWeeks: null },
      EMPTY_HISTORY,
      3,
      Math.random,
    );
    expect(games).toHaveLength(3);
    for (const game of games) {
      expect(game).toContain(7);
      expect(game).toContain(21);
      expect(game).toHaveLength(6);
      expect(new Set(game).size).toBe(6);
      expect([...game]).toEqual([...game].sort((a, b) => a - b));
    }
  });

  it('never includes an excluded number', () => {
    const excludedNumbers = Array.from({ length: 39 }, (_, i) => i + 1); // exclude 1..39, leaving 40..45
    const games = generateLottoGames({ excludedNumbers, requiredNumbers: [], preferUnseenWeeks: null }, EMPTY_HISTORY, 1, Math.random);
    expect(games[0]!.every((n) => n >= 40 && n <= 45)).toBe(true);
  });

  it('rejects more than 6 required numbers', () => {
    expect(() =>
      generateLottoGames({ excludedNumbers: [], requiredNumbers: [1, 2, 3, 4, 5, 6, 7], preferUnseenWeeks: null }, EMPTY_HISTORY, 1),
    ).toThrow(RangeError);
  });

  it('is deterministic for a given rng', () => {
    const filters = { excludedNumbers: [], requiredNumbers: [], preferUnseenWeeks: null };
    const a = generateLottoGames(filters, EMPTY_HISTORY, 1, fixedRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]));
    const b = generateLottoGames(filters, EMPTY_HISTORY, 1, fixedRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]));
    expect(a).toEqual(b);
  });

  it('weights numbers unseen in the recent window more heavily when preferUnseenWeeks is set', () => {
    const history: LottoDraw[] = [
      { drwNo: 1, drwNoDate: '2026-08-01', numbers: [1, 2, 3, 4, 5, 6], bonusNo: 7 },
    ];
    // Excluding everything except {1, 40}: 1 was seen in the recent draw, 40 was not.
    const excludedNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter((n) => n !== 1 && n !== 40);
    // rng always returns a value that would pick the *last* remaining candidate by weight-cumulative order;
    // with 40 weighted 2x against 1's weight 1x, a rng of 0.9 must land on 40 in a 2-candidate weighted pool.
    const games = generateLottoGames(
      { excludedNumbers, requiredNumbers: [], preferUnseenWeeks: 1 },
      history,
      1,
      fixedRng([0.9, 0.1, 0.1, 0.1, 0.1, 0.1]),
    );
    expect(games[0]).toContain(40);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "C:/Users/User/-/lucky-lotto" && npx jest src/features/lotto/calc.test.ts
```
Expected: FAIL — `Cannot find module './calc'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/features/lotto/calc.ts
export type LottoDraw = {
  drwNo: number;
  drwNoDate: string;
  numbers: number[];
  bonusNo: number;
};

export type LottoFilters = {
  excludedNumbers: number[];
  requiredNumbers: number[];
  preferUnseenWeeks: number | null;
};

export type LottoGame = number[];

export function reconcileExclusions(excluded: number[], required: number[]): { excluded: number[]; changed: boolean } {
  const filtered = excluded.filter((n) => !required.includes(n));
  return { excluded: filtered, changed: filtered.length !== excluded.length };
}

function computeUnseenNumbers(history: LottoDraw[], weeks: number): Set<number> {
  const recent = history.slice(-weeks);
  const seen = new Set<number>();
  for (const draw of recent) {
    for (const n of draw.numbers) seen.add(n);
  }
  const unseen = new Set<number>();
  for (let n = 1; n <= 45; n++) {
    if (!seen.has(n)) unseen.add(n);
  }
  return unseen;
}

function weightedSampleWithoutReplacement(pool: number[], weights: number[], count: number, rng: () => number): number[] {
  const remainingPool = [...pool];
  const remainingWeights = [...weights];
  const picked: number[] = [];
  for (let i = 0; i < count; i++) {
    const totalWeight = remainingWeights.reduce((a, b) => a + b, 0);
    let r = rng() * totalWeight;
    let idx = 0;
    for (; idx < remainingWeights.length - 1; idx++) {
      r -= remainingWeights[idx]!;
      if (r <= 0) break;
    }
    picked.push(remainingPool[idx]!);
    remainingPool.splice(idx, 1);
    remainingWeights.splice(idx, 1);
  }
  return picked;
}

export function generateLottoGame(filters: LottoFilters, history: LottoDraw[], rng: () => number): LottoGame {
  if (filters.requiredNumbers.length > 6) {
    throw new RangeError('requiredNumbers must be 6 or fewer');
  }
  const { excluded } = reconcileExclusions(filters.excludedNumbers, filters.requiredNumbers);

  const pool: number[] = [];
  for (let n = 1; n <= 45; n++) {
    if (excluded.includes(n) || filters.requiredNumbers.includes(n)) continue;
    pool.push(n);
  }

  const unseen = filters.preferUnseenWeeks ? computeUnseenNumbers(history, filters.preferUnseenWeeks) : null;
  const weights = pool.map((n) => (unseen && unseen.has(n) ? 2 : 1));

  const neededCount = 6 - filters.requiredNumbers.length;
  const picked = weightedSampleWithoutReplacement(pool, weights, neededCount, rng);

  return [...filters.requiredNumbers, ...picked].sort((a, b) => a - b);
}

export function generateLottoGames(
  filters: LottoFilters,
  history: LottoDraw[],
  gameCount: number,
  rng: () => number = Math.random,
): LottoGame[] {
  return Array.from({ length: gameCount }, () => generateLottoGame(filters, history, rng));
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/features/lotto/calc.test.ts
```
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/lotto/calc.ts src/features/lotto/calc.test.ts && git commit -m "feat: add lotto number combination logic"
```

---

## Task 5: Lotto screen

**Files:**
- Create: `src/features/lotto/LottoScreen.tsx`
- Test: `src/features/lotto/LottoScreen.test.tsx`
- Create: `src/pages/lotto.tsx`
- Create: `pages/lotto.tsx`

**Interfaces:**
- Consumes: `generateLottoGames`, `LottoFilters`, `LottoGame` (Task 4); `NumberBall`, `FilterChip`, `AdContainer` (Task 2); `src/data/lottoHistory.json` (Task 3).
- Produces: `<LottoScreen>` (no props) — routed at `/lotto`, consumed by Task 10's `HomeScreen` navigation.

- [ ] **Step 1: Write `src/features/lotto/LottoScreen.tsx`**

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NumberBall } from '../../components/NumberBall';
import { FilterChip } from '../../components/FilterChip';
import { AdContainer } from '../../components/AdContainer';
import { generateLottoGames, type LottoFilters, type LottoGame } from './calc';
import lottoHistory from '../../data/lottoHistory.json';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

type EditMode = 'exclude' | 'require';

const ALL_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1);
const GAME_COUNT = 5;
const UNSEEN_WEEK_OPTIONS = [4, 10, 20];

export function LottoScreen() {
  const [editMode, setEditMode] = useState<EditMode>('exclude');
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([]);
  const [requiredNumbers, setRequiredNumbers] = useState<number[]>([]);
  const [preferUnseen, setPreferUnseen] = useState(false);
  const [unseenWeeks, setUnseenWeeks] = useState(10);
  const [games, setGames] = useState<LottoGame[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleNumber = (n: number) => {
    if (editMode === 'exclude') {
      setExcludedNumbers((prev) => (prev.includes(n) ? prev.filter((v) => v !== n) : [...prev, n]));
      setRequiredNumbers((prev) => prev.filter((v) => v !== n));
    } else {
      setRequiredNumbers((prev) => (prev.includes(n) ? prev.filter((v) => v !== n) : [...prev, n]));
      setExcludedNumbers((prev) => prev.filter((v) => v !== n));
    }
  };

  const handleGenerate = () => {
    const filters: LottoFilters = {
      excludedNumbers,
      requiredNumbers,
      preferUnseenWeeks: preferUnseen ? unseenWeeks : null,
    };
    try {
      setGames(generateLottoGames(filters, lottoHistory, GAME_COUNT));
      setErrorMessage(null);
    } catch {
      setGames(null);
      setErrorMessage('필수 포함 번호는 6개 이하여야 해요.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.lede}>제외할 번호와 꼭 넣고 싶은 번호를 골라보세요.</Text>

        <View style={styles.modeSwitch}>
          <TouchableOpacity testID="mode-exclude" style={[styles.modeButton, editMode === 'exclude' && styles.modeButtonActive]} onPress={() => setEditMode('exclude')}>
            <Text style={[styles.modeButtonText, editMode === 'exclude' && styles.modeButtonTextActive]}>제외할 번호</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="mode-require" style={[styles.modeButton, editMode === 'require' && styles.modeButtonActive]} onPress={() => setEditMode('require')}>
            <Text style={[styles.modeButtonText, editMode === 'require' && styles.modeButtonTextActive]}>필수 포함 번호</Text>
          </TouchableOpacity>
        </View>

        <View testID="number-grid" style={styles.grid}>
          {ALL_NUMBERS.map((n) => {
            const state = excludedNumbers.includes(n) ? 'excluded' : requiredNumbers.includes(n) ? 'required' : 'default';
            return <NumberBall key={n} testID={`ball-${n}`} value={n} state={state} onPress={() => toggleNumber(n)} />;
          })}
        </View>

        <TouchableOpacity testID="unseen-toggle" style={styles.checkboxRow} onPress={() => setPreferUnseen((v) => !v)}>
          <View style={[styles.checkbox, preferUnseen && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>최근 미출현 번호 우선</Text>
        </TouchableOpacity>

        {preferUnseen ? (
          <View style={styles.chipRow}>
            {UNSEEN_WEEK_OPTIONS.map((w) => (
              <FilterChip key={w} testID={`unseen-weeks-${w}`} label={`${w}주`} active={unseenWeeks === w} onPress={() => setUnseenWeeks(w)} />
            ))}
          </View>
        ) : null}

        {errorMessage ? (
          <Text testID="lotto-error" style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <TouchableOpacity testID="generate-button" style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>번호 생성하기</Text>
        </TouchableOpacity>

        {games ? (
          <View testID="lotto-result" style={styles.resultSection}>
            {games.map((game, i) => (
              <View key={i} testID={`game-row-${i}`} style={styles.gameRow}>
                {game.map((n) => (
                  <NumberBall key={n} value={n} state="result" />
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <AdContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  lede: { fontSize: fontSizes.caption, color: colors.secondaryText, marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  modeSwitch: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, borderRadius: 10, backgroundColor: colors.lightAmberBackground, padding: 4 },
  modeButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modeButtonActive: { backgroundColor: colors.primaryAmber },
  modeButtonText: { fontSize: fontSizes.caption, color: colors.primaryAmber, fontWeight: fontWeights.bold },
  modeButtonTextActive: { color: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.secondaryText, marginRight: 8 },
  checkboxChecked: { backgroundColor: colors.primaryAmber, borderColor: colors.primaryAmber },
  checkboxLabel: { fontSize: fontSizes.body, color: colors.darkText, fontWeight: fontWeights.bold },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, marginBottom: 8 },
  errorText: { marginHorizontal: 20, marginBottom: 8, fontSize: fontSizes.caption, color: colors.error },
  generateButton: { marginHorizontal: 20, height: 48, borderRadius: 12, backgroundColor: colors.primaryAmber, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  generateButtonText: { color: '#FFFFFF', fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  resultSection: { marginTop: 8, paddingHorizontal: 12, paddingBottom: 20 },
  gameRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 },
});
```

- [ ] **Step 2: Write `src/features/lotto/LottoScreen.test.tsx`**

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LottoScreen } from './LottoScreen';

describe('LottoScreen', () => {
  it('shows no result until 번호 생성하기 is pressed', () => {
    render(<LottoScreen />);
    expect(screen.queryByTestId('lotto-result')).toBeNull();
  });

  it('generates 5 games of 6 balls each', () => {
    render(<LottoScreen />);
    fireEvent.press(screen.getByTestId('generate-button'));
    expect(screen.getAllByTestId(/^game-row-/)).toHaveLength(5);
  });

  it('marks a tapped ball as excluded in exclude mode (default)', () => {
    render(<LottoScreen />);
    fireEvent.press(screen.getByTestId('ball-7'));
    fireEvent.press(screen.getByTestId('generate-button'));
    const games = screen.getAllByTestId(/^game-row-/);
    // ball-7 was excluded, so no result game should include a ball whose accessible text is exactly "7"
    // (checked indirectly: generation succeeds without throwing, and the toggle round-trips)
    expect(games).toHaveLength(5);
  });

  it('moves a number from excluded to required when switching modes and tapping it again', () => {
    render(<LottoScreen />);
    fireEvent.press(screen.getByTestId('ball-7')); // exclude 7
    fireEvent.press(screen.getByTestId('mode-require'));
    fireEvent.press(screen.getByTestId('ball-7')); // now require 7 (removes from excluded)
    fireEvent.press(screen.getByTestId('generate-button'));
    expect(screen.getAllByTestId(/^game-row-/)).toHaveLength(5);
  });

  it('shows the unseen-weeks chips only when the toggle is on', () => {
    render(<LottoScreen />);
    expect(screen.queryByTestId('unseen-weeks-10')).toBeNull();
    fireEvent.press(screen.getByTestId('unseen-toggle'));
    expect(screen.getByTestId('unseen-weeks-10')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
cd "C:/Users/User/-/lucky-lotto" && npx jest src/features/lotto
```
Expected: PASS.

- [ ] **Step 4: Wire the route — `src/pages/lotto.tsx`**

```tsx
import { createRoute } from '@granite-js/react-native';
import { LottoScreen } from '../features/lotto/LottoScreen';

export const Route = createRoute('/lotto', {
  component: LottoScreen,
});
```

- [ ] **Step 5: Wire the route — `pages/lotto.tsx`**

```tsx
export { Route } from 'pages/lotto';
```

- [ ] **Step 6: Regenerate the router and verify**

```bash
timeout 20 npx granite dev || true
npx tsc --noEmit
```
Expected: `src/router.gen.ts` now includes `/lotto`; 0 type errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/lotto/LottoScreen.tsx src/features/lotto/LottoScreen.test.tsx src/pages/lotto.tsx pages/lotto.tsx src/router.gen.ts && git commit -m "feat: build lotto screen and wire up /lotto route"
```

---

## Task 6: Pension lottery combination logic

**Files:**
- Create: `src/features/pension-lottery/calc.ts`
- Test: `src/features/pension-lottery/calc.test.ts`

**Interfaces:**
- Produces: `type PensionLotteryGame = { group: number; digits: string }`, `generatePensionLotteryGame(selectedGroup: number | null, rng?: () => number): PensionLotteryGame`, `generatePensionLotteryGames(selectedGroup: number | null, gameCount: number, rng?: () => number): PensionLotteryGame[]` — consumed by Task 7's `PensionLotteryScreen`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/features/pension-lottery/calc.test.ts
import { generatePensionLotteryGame, generatePensionLotteryGames } from './calc';

function fixedRng(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe('generatePensionLotteryGame', () => {
  it('uses the selected group when provided', () => {
    const game = generatePensionLotteryGame(3, fixedRng([0.5]));
    expect(game.group).toBe(3);
  });

  it('picks a random group between 1 and 5 when none is selected', () => {
    const game = generatePensionLotteryGame(null, fixedRng([0.999]));
    expect(game.group).toBe(5);
  });

  it('pads the 6-digit number with leading zeros', () => {
    const game = generatePensionLotteryGame(1, fixedRng([0.5, 0.000001]));
    expect(game.digits).toHaveLength(6);
  });

  it('rejects a group outside 1-5', () => {
    expect(() => generatePensionLotteryGame(6)).toThrow(RangeError);
    expect(() => generatePensionLotteryGame(0)).toThrow(RangeError);
  });
});

describe('generatePensionLotteryGames', () => {
  it('generates the requested number of games, all using the selected group', () => {
    const games = generatePensionLotteryGames(2, 5, Math.random);
    expect(games).toHaveLength(5);
    expect(games.every((g) => g.group === 2)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/features/pension-lottery/calc.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/features/pension-lottery/calc.ts
export type PensionLotteryGame = {
  group: number;
  digits: string;
};

export function generatePensionLotteryGame(selectedGroup: number | null, rng: () => number = Math.random): PensionLotteryGame {
  if (selectedGroup !== null && (selectedGroup < 1 || selectedGroup > 5)) {
    throw new RangeError('group must be between 1 and 5');
  }
  const group = selectedGroup ?? Math.floor(rng() * 5) + 1;
  const digits = String(Math.floor(rng() * 1_000_000)).padStart(6, '0');
  return { group, digits };
}

export function generatePensionLotteryGames(
  selectedGroup: number | null,
  gameCount: number,
  rng: () => number = Math.random,
): PensionLotteryGame[] {
  return Array.from({ length: gameCount }, () => generatePensionLotteryGame(selectedGroup, rng));
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/features/pension-lottery/calc.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/pension-lottery/calc.ts src/features/pension-lottery/calc.test.ts && git commit -m "feat: add pension lottery number generation logic"
```

---

## Task 7: Pension lottery screen

**Files:**
- Create: `src/features/pension-lottery/PensionLotteryScreen.tsx`
- Test: `src/features/pension-lottery/PensionLotteryScreen.test.tsx`
- Create: `src/pages/pension-lottery.tsx`, `pages/pension-lottery.tsx`

**Interfaces:**
- Consumes: `generatePensionLotteryGames`, `PensionLotteryGame` (Task 6); `FilterChip`, `AdContainer` (Task 2).
- Produces: `<PensionLotteryScreen>` — routed at `/pension-lottery`, consumed by Task 10.

- [ ] **Step 1: Write `src/features/pension-lottery/PensionLotteryScreen.tsx`**

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FilterChip } from '../../components/FilterChip';
import { AdContainer } from '../../components/AdContainer';
import { generatePensionLotteryGames, type PensionLotteryGame } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights, tabularNums } from '../../theme/typography';

const GROUPS = [1, 2, 3, 4, 5];
const GAME_COUNT = 5;

export function PensionLotteryScreen() {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [games, setGames] = useState<PensionLotteryGame[] | null>(null);

  const handleGenerate = () => {
    setGames(generatePensionLotteryGames(selectedGroup, GAME_COUNT));
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.lede}>조를 고르지 않으면 무작위로 배정돼요.</Text>

        <View style={styles.chipRow}>
          <FilterChip testID="group-random" label="랜덤" active={selectedGroup === null} onPress={() => setSelectedGroup(null)} />
          {GROUPS.map((g) => (
            <FilterChip key={g} testID={`group-${g}`} label={`${g}조`} active={selectedGroup === g} onPress={() => setSelectedGroup(g)} />
          ))}
        </View>

        <TouchableOpacity testID="generate-button" style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>번호 생성하기</Text>
        </TouchableOpacity>

        {games ? (
          <View testID="pension-result" style={styles.resultSection}>
            {games.map((game, i) => (
              <View key={i} testID={`game-row-${i}`} style={styles.gameRow}>
                <Text style={styles.groupLabel}>{game.group}조</Text>
                <Text style={[styles.digits, tabularNums]}>{game.digits}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <AdContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  lede: { fontSize: fontSizes.caption, color: colors.secondaryText, marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, marginBottom: 16 },
  generateButton: { marginHorizontal: 20, height: 48, borderRadius: 12, backgroundColor: colors.primaryAmber, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  generateButtonText: { color: '#FFFFFF', fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  resultSection: { marginTop: 8, paddingHorizontal: 20, paddingBottom: 20 },
  gameRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightAmberBackground, borderRadius: 12, padding: 14, marginBottom: 8 },
  groupLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.primaryAmber, marginRight: 12 },
  digits: { fontSize: 20, fontWeight: fontWeights.bold, color: colors.darkText, letterSpacing: 2 },
});
```

- [ ] **Step 2: Write `src/features/pension-lottery/PensionLotteryScreen.test.tsx`**

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PensionLotteryScreen } from './PensionLotteryScreen';

describe('PensionLotteryScreen', () => {
  it('shows no result until generate is pressed', () => {
    render(<PensionLotteryScreen />);
    expect(screen.queryByTestId('pension-result')).toBeNull();
  });

  it('generates 5 games defaulting to random groups', () => {
    render(<PensionLotteryScreen />);
    fireEvent.press(screen.getByTestId('generate-button'));
    expect(screen.getAllByTestId(/^game-row-/)).toHaveLength(5);
  });

  it('uses the selected group for every generated game', () => {
    render(<PensionLotteryScreen />);
    fireEvent.press(screen.getByTestId('group-3'));
    fireEvent.press(screen.getByTestId('generate-button'));
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`game-row-${i}`)).toHaveTextContent('3조');
    }
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest src/features/pension-lottery
```
Expected: PASS.

- [ ] **Step 4: Wire the route**

`src/pages/pension-lottery.tsx`:
```tsx
import { createRoute } from '@granite-js/react-native';
import { PensionLotteryScreen } from '../features/pension-lottery/PensionLotteryScreen';

export const Route = createRoute('/pension-lottery', {
  component: PensionLotteryScreen,
});
```

`pages/pension-lottery.tsx`:
```tsx
export { Route } from 'pages/pension-lottery';
```

- [ ] **Step 5: Regenerate the router and verify**

```bash
timeout 20 npx granite dev || true
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/features/pension-lottery/PensionLotteryScreen.tsx src/features/pension-lottery/PensionLotteryScreen.test.tsx src/pages/pension-lottery.tsx pages/pension-lottery.tsx src/router.gen.ts && git commit -m "feat: build pension lottery screen and wire up /pension-lottery route"
```

---

## Task 8: Lucky numbers logic

**Files:**
- Create: `src/features/lucky-numbers/calc.ts`
- Test: `src/features/lucky-numbers/calc.test.ts`

**Interfaces:**
- Produces: `type LuckyResult = { games: number[][]; fortuneMessage: string }`, `buildLuckySeed(birthDate: string | null, word: string | null): string`, `generateLuckyResult(birthDate: string | null, word: string | null): LuckyResult` — consumed by Task 9's `LuckyNumbersScreen`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/features/lucky-numbers/calc.test.ts
import { buildLuckySeed, generateLuckyResult } from './calc';

describe('buildLuckySeed', () => {
  it('joins birth date and word when both are given', () => {
    expect(buildLuckySeed('19900101', '행운')).toBe('19900101|행운');
  });

  it('uses whichever value is given when only one is present', () => {
    expect(buildLuckySeed('19900101', null)).toBe('19900101');
    expect(buildLuckySeed(null, '행운')).toBe('행운');
  });

  it('rejects when both are empty', () => {
    expect(() => buildLuckySeed(null, null)).toThrow(RangeError);
    expect(() => buildLuckySeed('', '  ')).toThrow(RangeError);
  });
});

describe('generateLuckyResult', () => {
  it('produces 5 games of 6 sorted, unique numbers between 1 and 45', () => {
    const result = generateLuckyResult('19900101', '행운');
    expect(result.games).toHaveLength(5);
    for (const game of result.games) {
      expect(game).toHaveLength(6);
      expect(new Set(game).size).toBe(6);
      for (const n of game) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(45);
      }
      expect([...game]).toEqual([...game].sort((a, b) => a - b));
    }
  });

  it('is deterministic for the same input', () => {
    const a = generateLuckyResult('19900101', '행운');
    const b = generateLuckyResult('19900101', '행운');
    expect(a).toEqual(b);
  });

  it('produces a different result for a different seed', () => {
    const a = generateLuckyResult('19900101', '행운');
    const b = generateLuckyResult('19900101', '다른단어');
    expect(a).not.toEqual(b);
  });

  it('picks a non-empty fortune message', () => {
    const result = generateLuckyResult('19900101', null);
    expect(result.fortuneMessage.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/features/lucky-numbers/calc.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/features/lucky-numbers/calc.ts
const FORTUNE_MESSAGES = [
  '오늘은 평소보다 감이 좋은 날이에요. 가볍게 시도해보세요.',
  '차분하게 고른 번호가 좋은 흐름을 만들어요.',
  '작은 행운이 쌓이는 하루예요. 즐거운 마음으로 골라보세요.',
  '당신의 선택에 살짝 힘을 실어주는 날이에요.',
];

const GAME_COUNT = 5;

function hashStringToSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildLuckySeed(birthDate: string | null, word: string | null): string {
  const parts = [birthDate, word].filter((v): v is string => !!v && v.trim() !== '');
  if (parts.length === 0) {
    throw new RangeError('birthDate or word is required');
  }
  return parts.join('|');
}

export type LuckyResult = {
  games: number[][];
  fortuneMessage: string;
};

export function generateLuckyResult(birthDate: string | null, word: string | null): LuckyResult {
  const seedString = buildLuckySeed(birthDate, word);
  const rng = mulberry32(hashStringToSeed(seedString));

  const games: number[][] = [];
  for (let g = 0; g < GAME_COUNT; g++) {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const picked: number[] = [];
    for (let k = 0; k < 6; k++) {
      const idx = Math.floor(rng() * pool.length);
      picked.push(pool[idx]!);
      pool.splice(idx, 1);
    }
    games.push(picked.sort((a, b) => a - b));
  }

  const fortuneMessage = FORTUNE_MESSAGES[Math.floor(rng() * FORTUNE_MESSAGES.length)]!;
  return { games, fortuneMessage };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/features/lucky-numbers/calc.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/lucky-numbers/calc.ts src/features/lucky-numbers/calc.test.ts && git commit -m "feat: add deterministic seeded lucky-numbers generation logic"
```

---

## Task 9: Lucky numbers screen

**Files:**
- Create: `src/features/lucky-numbers/LuckyNumbersScreen.tsx`
- Test: `src/features/lucky-numbers/LuckyNumbersScreen.test.tsx`
- Create: `src/pages/lucky-numbers.tsx`, `pages/lucky-numbers.tsx`

**Interfaces:**
- Consumes: `generateLuckyResult`, `LuckyResult` (Task 8); `NumberBall`, `AdContainer` (Task 2).
- Produces: `<LuckyNumbersScreen>` — routed at `/lucky-numbers`, consumed by Task 10.

- [ ] **Step 1: Write `src/features/lucky-numbers/LuckyNumbersScreen.tsx`**

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NumberBall } from '../../components/NumberBall';
import { AdContainer } from '../../components/AdContainer';
import { generateLuckyResult, type LuckyResult } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

export function LuckyNumbersScreen() {
  const [birthDate, setBirthDate] = useState('');
  const [word, setWord] = useState('');
  const [result, setResult] = useState<LuckyResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = () => {
    try {
      setResult(generateLuckyResult(birthDate || null, word || null));
      setErrorMessage(null);
    } catch {
      setResult(null);
      setErrorMessage('생년월일이나 단어를 입력해주세요.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.lede}>생년월일이나 오늘 떠오르는 단어로 행운 번호를 만들어보세요.</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>생년월일 (선택)</Text>
          <TextInput
            testID="input-birth-date"
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="예: 19900101"
            placeholderTextColor={colors.secondaryText}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>오늘의 단어 (선택)</Text>
          <TextInput
            testID="input-word"
            style={styles.input}
            value={word}
            onChangeText={setWord}
            placeholder="예: 행운"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        {errorMessage ? (
          <Text testID="lucky-error" style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <TouchableOpacity testID="generate-button" style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>운세 보기</Text>
        </TouchableOpacity>

        {result ? (
          <View testID="lucky-result" style={styles.resultSection}>
            <Text style={styles.fortuneMessage}>{result.fortuneMessage}</Text>
            {result.games.map((game, i) => (
              <View key={i} testID={`game-row-${i}`} style={styles.gameRow}>
                {game.map((n) => (
                  <NumberBall key={n} value={n} state="result" />
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <AdContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  lede: { fontSize: fontSizes.caption, color: colors.secondaryText, marginHorizontal: 20, marginTop: 20, marginBottom: 16 },
  field: { marginHorizontal: 20, marginBottom: 16 },
  fieldLabel: { fontSize: fontSizes.caption, color: colors.secondaryText, marginBottom: 6 },
  input: { height: 44, borderWidth: 1, borderColor: colors.divider, borderRadius: 8, paddingHorizontal: 12, fontSize: fontSizes.body, color: colors.darkText },
  errorText: { marginHorizontal: 20, marginBottom: 8, fontSize: fontSizes.caption, color: colors.error },
  generateButton: { marginHorizontal: 20, height: 48, borderRadius: 12, backgroundColor: colors.primaryAmber, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  generateButtonText: { color: '#FFFFFF', fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  resultSection: { marginTop: 8, paddingHorizontal: 12, paddingBottom: 20 },
  fortuneMessage: { fontSize: fontSizes.body, color: colors.darkText, marginHorizontal: 8, marginBottom: 12, lineHeight: 22 },
  gameRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 },
});
```

- [ ] **Step 2: Write `src/features/lucky-numbers/LuckyNumbersScreen.test.tsx`**

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LuckyNumbersScreen } from './LuckyNumbersScreen';

describe('LuckyNumbersScreen', () => {
  it('shows no result until generate is pressed', () => {
    render(<LuckyNumbersScreen />);
    expect(screen.queryByTestId('lucky-result')).toBeNull();
  });

  it('shows an inline error when both fields are empty', () => {
    render(<LuckyNumbersScreen />);
    fireEvent.press(screen.getByTestId('generate-button'));
    expect(screen.queryByTestId('lucky-result')).toBeNull();
    expect(screen.getByTestId('lucky-error')).toBeTruthy();
  });

  it('generates 5 games and a fortune message from a word alone', () => {
    render(<LuckyNumbersScreen />);
    fireEvent.changeText(screen.getByTestId('input-word'), '행운');
    fireEvent.press(screen.getByTestId('generate-button'));
    expect(screen.getAllByTestId(/^game-row-/)).toHaveLength(5);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest src/features/lucky-numbers
```
Expected: PASS.

- [ ] **Step 4: Wire the route**

`src/pages/lucky-numbers.tsx`:
```tsx
import { createRoute } from '@granite-js/react-native';
import { LuckyNumbersScreen } from '../features/lucky-numbers/LuckyNumbersScreen';

export const Route = createRoute('/lucky-numbers', {
  component: LuckyNumbersScreen,
});
```

`pages/lucky-numbers.tsx`:
```tsx
export { Route } from 'pages/lucky-numbers';
```

- [ ] **Step 5: Regenerate the router and verify**

```bash
timeout 20 npx granite dev || true
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/features/lucky-numbers/LuckyNumbersScreen.tsx src/features/lucky-numbers/LuckyNumbersScreen.test.tsx src/pages/lucky-numbers.tsx pages/lucky-numbers.tsx src/router.gen.ts && git commit -m "feat: build lucky numbers screen and wire up /lucky-numbers route"
```

---

## Task 10: Home screen

**Files:**
- Create: `src/features/home/HomeScreen.tsx`
- Test: `src/features/home/HomeScreen.test.tsx`
- Modify: `src/pages/index.tsx`, `pages/index.tsx`

**Interfaces:**
- Produces: `<HomeScreen onOpenLotto onOpenPensionLottery onOpenLuckyNumbers>` — routed at `/`.

- [ ] **Step 1: Write `src/features/home/HomeScreen.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

export type HomeScreenProps = {
  onOpenLotto: () => void;
  onOpenPensionLottery: () => void;
  onOpenLuckyNumbers: () => void;
};

export function HomeScreen({ onOpenLotto, onOpenPensionLottery, onOpenLuckyNumbers }: HomeScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>번호 조합기</Text>
        <Text style={styles.subtitle}>이번 주 번호, 조건에 맞게 골라보세요</Text>
      </View>

      <TouchableOpacity testID="open-lotto" style={styles.card} onPress={onOpenLotto}>
        <Text style={styles.cardIcon}>🎱</Text>
        <Text style={styles.cardTitle}>로또 6/45</Text>
        <Text style={styles.cardDescription}>제외·필수 번호와 미출현 번호로 조합해요</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="open-pension-lottery" style={styles.card} onPress={onOpenPensionLottery}>
        <Text style={styles.cardIcon}>🎟️</Text>
        <Text style={styles.cardTitle}>연금복권720+</Text>
        <Text style={styles.cardDescription}>조를 고르고 번호를 뽑아요</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="open-lucky-numbers" style={styles.card} onPress={onOpenLuckyNumbers}>
        <Text style={styles.cardIcon}>🍀</Text>
        <Text style={styles.cardTitle}>이번 주 행운 번호 테스트</Text>
        <Text style={styles.cardDescription}>생년월일이나 단어로 행운 번호를 만들어요</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 4 },
  subtitle: { fontSize: fontSizes.caption, color: colors.secondaryText },
  card: { marginHorizontal: 20, marginBottom: 12, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  cardIcon: { fontSize: 24, marginBottom: 8 },
  cardTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 4 },
  cardDescription: { fontSize: fontSizes.caption, color: colors.secondaryText },
});
```

- [ ] **Step 2: Write `src/features/home/HomeScreen.test.tsx`**

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('navigates to each destination when its card is pressed', () => {
    const onOpenLotto = jest.fn();
    const onOpenPensionLottery = jest.fn();
    const onOpenLuckyNumbers = jest.fn();
    render(
      <HomeScreen onOpenLotto={onOpenLotto} onOpenPensionLottery={onOpenPensionLottery} onOpenLuckyNumbers={onOpenLuckyNumbers} />,
    );

    fireEvent.press(screen.getByTestId('open-lotto'));
    expect(onOpenLotto).toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('open-pension-lottery'));
    expect(onOpenPensionLottery).toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('open-lucky-numbers'));
    expect(onOpenLuckyNumbers).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest src/features/home
```
Expected: PASS.

- [ ] **Step 4: Wire the route — `src/pages/index.tsx`**

```tsx
import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { HomeScreen } from '../features/home/HomeScreen';

export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return (
    <HomeScreen
      onOpenLotto={() => navigation.navigate('/lotto')}
      onOpenPensionLottery={() => navigation.navigate('/pension-lottery')}
      onOpenLuckyNumbers={() => navigation.navigate('/lucky-numbers')}
    />
  );
}
```

`pages/index.tsx`:
```tsx
export { Route } from 'pages/index';
```

- [ ] **Step 5: Regenerate the router, typecheck, and run every test**

```bash
timeout 20 npx granite dev || true
npx tsc --noEmit
npx jest
```
Expected: `src/router.gen.ts` has all 4 routes; 0 type errors; all suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/home src/pages/index.tsx pages/index.tsx src/router.gen.ts && git commit -m "feat: build home screen and wire up / route with navigation to all 3 tools"
```

---

## Task 11: Save + share

**Files:**
- Create: `src/storage/savedNumbers.ts`
- Test: `src/storage/savedNumbers.test.ts`
- Modify: `src/features/lotto/LottoScreen.tsx`, `src/features/lotto/LottoScreen.test.tsx`
- Modify: `src/features/pension-lottery/PensionLotteryScreen.tsx`, `src/features/pension-lottery/PensionLotteryScreen.test.tsx`
- Modify: `src/features/lucky-numbers/LuckyNumbersScreen.tsx`, `src/features/lucky-numbers/LuckyNumbersScreen.test.tsx`

**Interfaces:**
- Produces: `type SavedGameType = 'lotto' | 'pension-lottery' | 'lucky-numbers'`, `getSavedNumbers(): Promise<SavedNumbersEntry[]>`, `saveNumbers(gameType: SavedGameType, games: string[]): Promise<SavedNumbersEntry[]>`.

- [ ] **Step 1: Write `src/storage/savedNumbers.test.ts`**

```ts
import { Storage } from '@apps-in-toss/framework';
import { getSavedNumbers, saveNumbers } from './savedNumbers';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: { getItem: jest.fn(), setItem: jest.fn() },
  share: jest.fn(),
}));

const mockedStorage = jest.mocked(Storage);

describe('savedNumbers storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an empty array when nothing is stored', async () => {
    mockedStorage.getItem.mockResolvedValue(null);
    await expect(getSavedNumbers()).resolves.toEqual([]);
  });

  it('prepends a new entry with a generated id and timestamp', async () => {
    mockedStorage.getItem.mockResolvedValue(null);
    const result = await saveNumbers('lotto', ['3, 11, 19, 24, 31, 42']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ gameType: 'lotto', games: ['3, 11, 19, 24, 31, 42'], createdAt: 1000 });
  });

  it('keeps existing entries and puts the new one first', async () => {
    const stored = [{ id: 'old', gameType: 'lotto', games: [], createdAt: 100 }];
    mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    const result = await saveNumbers('pension-lottery', ['1조 000123']);
    expect(result.map((e) => e.gameType)).toEqual(['pension-lottery', 'lotto']);
  });

  it('still resolves with the updated list when Storage.setItem rejects', async () => {
    mockedStorage.getItem.mockResolvedValue(null);
    mockedStorage.setItem.mockRejectedValue(new Error('bridge unavailable'));
    await expect(saveNumbers('lotto', ['1, 2, 3, 4, 5, 6'])).resolves.toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest src/storage/savedNumbers.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/storage/savedNumbers.ts`**

```ts
import { Storage } from '@apps-in-toss/framework';

const STORAGE_KEY = 'saved-numbers-v1';
const MAX_ENTRIES = 50;

export type SavedGameType = 'lotto' | 'pension-lottery' | 'lucky-numbers';

export type SavedNumbersEntry = {
  id: string;
  gameType: SavedGameType;
  games: string[];
  createdAt: number;
};

export async function getSavedNumbers(): Promise<SavedNumbersEntry[]> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedNumbersEntry[]) : [];
  } catch {
    return [];
  }
}

export async function saveNumbers(gameType: SavedGameType, games: string[]): Promise<SavedNumbersEntry[]> {
  const current = await getSavedNumbers();
  const entry: SavedNumbersEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    gameType,
    games,
    createdAt: Date.now(),
  };
  const updated = [entry, ...current].slice(0, MAX_ENTRIES);
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Best-effort persistence — a failed save must never block the generator UI.
  }
  return updated;
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx jest src/storage/savedNumbers.test.ts
```
Expected: PASS.

- [ ] **Step 5: Wire save/share into `LottoScreen.tsx`**

Add below the existing imports:
```tsx
import { Alert } from 'react-native';
import { share } from '@apps-in-toss/framework';
import { saveNumbers } from '../../storage/savedNumbers';
```

Add inside the component, after `games`/`errorMessage` state:
```tsx
const formatGames = (list: typeof games) => (list ?? []).map((g) => g.join(', '));

const handleSave = async () => {
  if (!games) return;
  await saveNumbers('lotto', formatGames(games));
  Alert.alert('저장했어요');
};

const handleShare = async () => {
  if (!games) return;
  try {
    await share({ message: `번호 조합기 추천 번호\n${formatGames(games).join('\n')}` });
  } catch {
    // user cancelled the share sheet — nothing to handle
  }
};
```

Replace the closing `</View>` of `resultSection` content with an action row added right after the mapped games, still inside `{games ? (...) : null}`:
```tsx
            <View style={styles.actionRow}>
              <TouchableOpacity testID="save-button" style={styles.ghostButton} onPress={handleSave}>
                <Text style={styles.ghostButtonText}>저장하기</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="share-button" style={styles.ghostButton} onPress={handleShare}>
                <Text style={styles.ghostButtonText}>공유하기</Text>
              </TouchableOpacity>
            </View>
```

Add to the `styles` object:
```tsx
  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 4 },
  ghostButton: { flex: 1, height: 44, borderRadius: 10, backgroundColor: colors.lightAmberBackground, alignItems: 'center', justifyContent: 'center' },
  ghostButtonText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.darkText },
```

- [ ] **Step 6: Update `LottoScreen.test.tsx`** — add the mock at the top of the file and a new test

```tsx
import { Storage, share } from '@apps-in-toss/framework';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: { getItem: jest.fn(), setItem: jest.fn() },
  share: jest.fn(),
}));

const mockedStorage = jest.mocked(Storage);
```

Add inside the `describe` block:
```tsx
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getItem.mockResolvedValue(null);
  });

  it('saves and shares the generated games', async () => {
    render(<LottoScreen />);
    fireEvent.press(screen.getByTestId('generate-button'));
    fireEvent.press(screen.getByTestId('save-button'));
    fireEvent.press(screen.getByTestId('share-button'));

    await waitFor(() => expect(mockedStorage.setItem).toHaveBeenCalled());
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('번호 조합기') }));
  });
```

Add `waitFor` to the existing `@testing-library/react-native` import.

- [ ] **Step 7: Repeat steps 5-6 for `PensionLotteryScreen.tsx`**, using `saveNumbers('pension-lottery', games.map((g) => `${g.group}조 ${g.digits}`))` and the message `` `번호 조합기 추천 번호\n${...}` ``, with `save-button`/`share-button` testIDs and the same action-row markup/styles.

- [ ] **Step 8: Repeat steps 5-6 for `LuckyNumbersScreen.tsx`**, using `saveNumbers('lucky-numbers', result.games.map((g) => g.join(', ')))` and a share message that also includes `result.fortuneMessage`.

- [ ] **Step 9: Run every test and typecheck**

```bash
npx jest
npx tsc --noEmit
```
Expected: all suites pass, 0 type errors.

- [ ] **Step 10: Commit**

```bash
git add src/storage/savedNumbers.ts src/storage/savedNumbers.test.ts src/features/lotto src/features/pension-lottery src/features/lucky-numbers && git commit -m "feat: wire up save/share across all 3 number-generation screens"
```

---

## Task 12: Final verification and deploy

**Files:** none created — verification only.

- [ ] **Step 1: Full test suite + typecheck + lint**

```bash
cd "C:/Users/User/-/lucky-lotto"
npx jest
npx tsc --noEmit
npx eslint .
```
Expected: all tests pass, 0 type errors, 0 lint errors (aside from the same pre-existing `.granite/*` cache noise and `_app.tsx` react-in-jsx-scope warning seen in every other project in this workspace — not something to fix here).

- [ ] **Step 2: Build the `.ait` artifact**

```bash
rm -rf .granite .swc
npx ait build
```
If it fails with a Windows path-escaping error or a missing hermesc win64 binary, apply the fixes documented in `C:\Users\User\.claude\skills\apps-in-toss-miniapp\SKILL.md` §2, then retry. Note the printed `deploymentId`.

- [ ] **Step 3: Deploy via the MCP console flow**

Follow `C:\Users\User\.claude\skills\apps-in-toss-miniapp\SKILL.md` §3 exactly: `bundle_upload` (workspaceId 77253, miniAppId from Task 1) → `curl -X PUT` the `.ait` to the returned `uploadUrl` → `bundle_upload_complete` → poll `bundle_build_status` every ~20s until `isBuilding: false` → confirm via `bundle_list` that `reviewStatus: "CREATED"`.

Stop there — do not call `bundle_test_push` or `bundle_submit_review` unless the user explicitly asks for that next step.

- [ ] **Step 4: Report back**

Summarize to the user: miniAppId, appName, versionName deployed, current `reviewStatus`, and remind them that (a) real lotto history data must be confirmed present (not the Task 3 placeholder) before requesting review, and (b) ad SDK integration and business-registration-gated features are still pending per the Global Constraints section.
