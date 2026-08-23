# 척척 계산기 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the "척척 계산기" Apps in Toss React Native mini-app and ship a working MVP: Home screen (search, recent-use, frequently-used grid, full calculator list) plus one fully working calculator (원가·마진).

**Architecture:** A Granite-framework (React Native) project lives in `chuck-chuck-calculator/` at the repo root, alongside the existing planning docs. Granite uses file-based routing: each file under `chuck-chuck-calculator/src/pages/` is a screen, registered via `createRoute`. Calculation logic (`calc.ts`) is kept separate from screen components (`*Screen.tsx`) per calculator feature folder. The calculator list is data-driven from a single `data/calculators.ts` source of truth so the Home screen never needs editing when a new calculator is added later.

**Tech Stack:** Granite (`@granite-js/react-native`) / React Native 0.84 / React 19 / TypeScript (strict) / `@apps-in-toss/framework` / Jest + `@testing-library/react-native`.

**Spec:** [`PLAN_척척계산기.md`](../../../PLAN_척척계산기.md) (repo root) — sections 2 (design/color tokens), 3 (architecture), 5 (Home screen), 6-1 (원가·마진 calc formulas), 7 (roadmap), 10 (UX rules), 11 (common components) are the ones this plan implements.

## Global Constraints

These apply to every task below; verified against the real toolchain during planning (not assumptions from the spec doc).

- **Color tokens** (spec section 2, exact hex values): Primary Blue `#3182F6`, Dark Text `#191F28`, Secondary Text `#8B95A1`, Divider `#F2F4F6`, Background `#FFFFFF`, Light Blue Background `#EAF3FF`, Success `#20C997`, Warning `#FFB020`, Error `#F04452`.
- **No `AsyncStorage`.** Confirmed via Apps in Toss docs: `AsyncStorage` causes a white-screen crash in the Toss app container. All local persistence MUST use `Storage` from `@apps-in-toss/framework` (`Storage.setItem/getItem/removeItem/clearItems`, all values are strings).
- **No custom `fontFamily`.** React Native cannot use a CSS-style font-family fallback stack (the spec's `-apple-system, ...` list is web-only). Leave `fontFamily` unset everywhere so RN falls back to the OS system font, which renders Korean correctly on both platforms without bundling font files. `typography.ts` defines only `fontWeight`, `fontSize`, and a `tabular-nums` style — no `fontFamily`.
- **Icons are Unicode glyph placeholders, not line-icon SVG assets.** The spec calls for custom line-style icons; no icon library or design assets exist yet, and adding one is out of scope for this plan. Each calculator gets one Unicode symbol (e.g. 🧾) rendered inside the `#EAF3FF` badge circle. Swapping in real icon assets is a follow-up plan, not a task here.
- **Rounding rules** (spec section 11): money values round to the nearest won (`Math.round`); percentages round to one decimal place.
- **granite.config.ts plugins gotcha:** running `npx ait init --template react-native` regenerates `granite.config.ts` with only the `appsInToss()` plugin, silently dropping `router()` and `hermes()` from the default scaffold. Without `router()`, new pages under `src/pages/` never get registered into `src/router.gen.ts`. Task 1 restores all three plugins together. Verified by direct testing: with only `appsInToss()`, a newly-added page never appeared in `router.gen.ts` even after the dev server had been running for 35s+.
- **`router.gen.ts` regenerates only through a live Metro bundle request, which is slow (60–90s+, sometimes longer) on first request** — verified directly (a `curl` to the bundle endpoint still hadn't returned after 30s). This is too slow and flaky to gate an automated task's pass/fail on. Whenever a task adds a new page, hand-edit `router.gen.ts` to add the corresponding `import` and the two `declare module` entries, matching the existing entries' exact shape. This keeps `tsc --noEmit` passing immediately; the file is otherwise genuinely auto-generated and a future real dev-server session will regenerate it for real (producing the same shape).
- **Two parallel `pages/` directories exist.** The Granite scaffold creates both `chuck-chuck-calculator/pages/` (root) and `chuck-chuck-calculator/src/pages/` — the root one holds one-line re-export shims per page (e.g. `export { Route } from 'pages/index';`, resolved via `tsconfig.json`'s `baseUrl: "src"`), because `router.gen.ts`'s generated imports (`'../pages/x'`) are relative to `src/router.gen.ts`'s own directory and land on the root `pages/` dir, not `src/pages/`. Every page added under `src/pages/` needs a matching root-level shim (mirror the existing `pages/index.tsx` pattern exactly), and every page deleted from `src/pages/` needs its root-level shim deleted too — verified in both directions (Task 6 hit the deletion case, Task 8 hit the addition case).
- **Console app registration is out of scope for this plan.** "척척계산기" is not yet registered in the Apps in Toss console (verified — only 오늘의운세, 원가계산기, 펫니버스 exist under this workspace). `granite.config.ts`'s `appName`/`displayName`/`icon` stay as scaffold defaults (`chuck-chuck-calculator` / placeholder icon). Registering the app and syncing these values is a separate follow-up task, needed only before real device/sandbox testing — `npm run dev` + `npm run typecheck` + `npm test` do not require it.
- **Untapped calculators show a "준비 중" alert, not a crash.** `data/calculators.ts` marks only `cost` as `implemented: true`. Tapping any other calculator (Home grid, Home list, or bottom-nav 기록/설정 tabs) calls `Alert.alert('준비 중이에요', ...)` instead of navigating, since those screens don't exist yet in this plan.
- **Search hides the 최근 사용 / 자주 쓰는 계산 sections.** While `searchQuery` is non-empty, Home shows only the filtered full list — matches the spec's "1초 안에 찾을 수 있어야 함" goal better than showing four sections of scroll at once. This is a plan-level ruling, not stated explicitly in the spec.
- **`자주 쓰는 계산` is a static curated set**, not usage-ranked: `['cost', 'discount', 'split-bill', 'travel-expense']`, exactly as spec section 5 names them. Usage-based ordering applies only to the 최근 사용 chips.
- All commands below run with the repo root (`C:\Users\User\-`) as the git working directory and `chuck-chuck-calculator/` as the npm project directory — `cd chuck-chuck-calculator` before any `npm`/`npx` command, `cd ..` (or a fresh shell at repo root) before any `git` command.

---

### Task 1: Scaffold the Granite project and Apps in Toss config

**Files:**
- Create: `chuck-chuck-calculator/` (entire scaffold, via CLI — see steps)
- Modify: `chuck-chuck-calculator/granite.config.ts`

**Interfaces:**
- Produces: a working `chuck-chuck-calculator/` npm project with `npm run typecheck`, `npm test`, `npm run dev` all functioning. Every later task's file paths are relative to this directory.

- [ ] **Step 1: Scaffold via the non-interactive CLI**

Run from the repo root (`C:\Users\User\-`):

```bash
npm create granite-app@"^1" chuck-chuck-calculator -- --tools eslint-prettier
```

Note the `--` separator before `--tools`: without it, `npm create` swallows the flag and the CLI falls back to its interactive wizard, which hangs (verified during Task 1 execution — the flag-less form throws the same `ERR_TTY_INIT_FAILED` as the no-flag form below).

This creates `chuck-chuck-calculator/` as a new subdirectory (it does not touch the existing `PLAN_척척계산기.md` / `SPEC_*.md` / `*.html` files at the repo root — verified in a scratch test). Do not answer any interactive prompts; the positional name + `--tools` flag skip them entirely.

- [ ] **Step 2: Install dependencies**

```bash
cd chuck-chuck-calculator
npm install
```

- [ ] **Step 3: Install the Apps in Toss framework package**

```bash
npm install @apps-in-toss/framework
```

- [ ] **Step 4: Initialize Apps in Toss config non-interactively**

```bash
npx ait init --template react-native --app-name chuck-chuck-calculator
```

This regenerates `granite.config.ts` and `src/_app.tsx` to use `AppsInToss.registerApp`. Do not run this without `--template`/`--app-name` — the no-flag form is an interactive `@clack/prompts` wizard that hangs forever without a real TTY (verified: it throws `ERR_TTY_INIT_FAILED` when piped).

- [ ] **Step 5: Restore the `router()` and `hermes()` plugins**

`ait init` overwrites `granite.config.ts` with only the `appsInToss()` plugin (verified — this silently breaks route registration for any page added later). Edit `chuck-chuck-calculator/granite.config.ts` to read exactly:

```ts
import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'chuck-chuck-calculator',
  plugins: [
    router(),
    hermes(),
    appsInToss({
      brand: {
        displayName: '척척 계산기',
        primaryColor: '#3182F6',
        icon: '', // 앱인토스 콘솔에 앱 등록 후 아이콘 URL로 교체 (이 플랜 범위 밖)
      },
      permissions: [],
    }),
  ],
});
```

(`@granite-js/plugin-router` and `@granite-js/plugin-hermes` are already present as devDependencies from Step 1's scaffold — no extra install needed.)

- [ ] **Step 6: Verify typecheck, tests, and dev server all work**

```bash
npm run typecheck
```
Expected: no output, exit code 0 (no type errors).

```bash
npm test
```
Expected: `No tests found, exiting with code 0` (no test files exist yet — that's fine for this step).

```bash
npm run dev
```
Expected: the Granite ASCII banner prints and the process keeps running with no error (Metro starts listening on port 8081). Let it run for ~10 seconds to confirm no crash, then stop it (Ctrl+C, or on Windows: `taskkill //F //IM node.exe //T`).

- [ ] **Step 7: Commit**

```bash
git add chuck-chuck-calculator
git commit -m "chore: scaffold chuck-chuck-calculator Granite app with Apps in Toss config"
```

---

### Task 2: Theme tokens

**Files:**
- Create: `chuck-chuck-calculator/src/theme/colors.ts`
- Create: `chuck-chuck-calculator/src/theme/typography.ts`
- Test: `chuck-chuck-calculator/src/theme/colors.test.ts`
- Test: `chuck-chuck-calculator/src/theme/typography.test.ts`

**Interfaces:**
- Produces: `colors` (object, keys: `primaryBlue, darkText, secondaryText, divider, background, lightBlueBackground, success, warning, error`, all hex strings) from `../theme/colors`; `fontWeights` (`{ bold: '700', regular: '400' }`), `fontSizes` (`{ title: 22, body: 15, caption: 13, resultLarge: 28 }`), `tabularNums` (`{ fontVariant: ['tabular-nums'] }`) from `../theme/typography`. Every later component/screen task imports these.

- [ ] **Step 1: Write the failing tests**

`chuck-chuck-calculator/src/theme/colors.test.ts`:

```ts
import { colors } from './colors';

describe('colors', () => {
  it('matches the spec color tokens exactly', () => {
    expect(colors).toEqual({
      primaryBlue: '#3182F6',
      darkText: '#191F28',
      secondaryText: '#8B95A1',
      divider: '#F2F4F6',
      background: '#FFFFFF',
      lightBlueBackground: '#EAF3FF',
      success: '#20C997',
      warning: '#FFB020',
      error: '#F04452',
    });
  });
});
```

`chuck-chuck-calculator/src/theme/typography.test.ts`:

```ts
import { fontWeights, fontSizes, tabularNums } from './typography';

describe('typography', () => {
  it('defines the expected font weights', () => {
    expect(fontWeights).toEqual({ bold: '700', regular: '400' });
  });

  it('defines the expected font sizes', () => {
    expect(fontSizes).toEqual({ title: 22, body: 15, caption: 13, resultLarge: 28 });
  });

  it('defines a tabular-nums style with no fontFamily override', () => {
    expect(tabularNums).toEqual({ fontVariant: ['tabular-nums'] });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/theme
```
Expected: FAIL — `Cannot find module './colors'` / `Cannot find module './typography'`.

- [ ] **Step 3: Implement `colors.ts`**

```ts
export const colors = {
  primaryBlue: '#3182F6',
  darkText: '#191F28',
  secondaryText: '#8B95A1',
  divider: '#F2F4F6',
  background: '#FFFFFF',
  lightBlueBackground: '#EAF3FF',
  success: '#20C997',
  warning: '#FFB020',
  error: '#F04452',
} as const;

export type ColorToken = keyof typeof colors;
```

- [ ] **Step 4: Implement `typography.ts`**

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

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- src/theme
```
Expected: PASS, 3 tests.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add chuck-chuck-calculator/src/theme
git commit -m "feat: add theme color and typography tokens"
```

---

### Task 3: Calculator data source (`data/calculators.ts`)

**Files:**
- Create: `chuck-chuck-calculator/src/data/calculators.ts`
- Test: `chuck-chuck-calculator/src/data/calculators.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type CalculatorId = 'cost' | 'discount' | 'split-bill' | 'salary' | 'travel-expense' | 'shipping-fee' | 'profit-rate' | 'vat'`; `type CalculatorMeta = { id: CalculatorId; name: string; description: string; icon: string; route: string; implemented: boolean }`; `calculators: CalculatorMeta[]` (8 entries); `FREQUENTLY_USED_IDS: CalculatorId[]` (4 entries); `findCalculator(id: CalculatorId): CalculatorMeta`; `searchCalculators(query: string): CalculatorMeta[]`. Home screen (Task 6) and the Cost feature (Task 7/8) both import from this file.

- [ ] **Step 1: Write the failing tests**

`chuck-chuck-calculator/src/data/calculators.test.ts`:

```ts
import { calculators, FREQUENTLY_USED_IDS, findCalculator, searchCalculators } from './calculators';

describe('calculators data', () => {
  it('has exactly 8 entries with unique ids', () => {
    expect(calculators).toHaveLength(8);
    expect(new Set(calculators.map((c) => c.id)).size).toBe(8);
  });

  it('marks only cost as implemented', () => {
    const implementedIds = calculators.filter((c) => c.implemented).map((c) => c.id);
    expect(implementedIds).toEqual(['cost']);
  });

  it('gives every calculator a name, description, icon and route', () => {
    for (const c of calculators) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.icon.length).toBeGreaterThan(0);
      expect(c.route.startsWith('/')).toBe(true);
    }
  });

  it('has 4 frequently-used ids that all exist in calculators', () => {
    expect(FREQUENTLY_USED_IDS).toEqual(['cost', 'discount', 'split-bill', 'travel-expense']);
    for (const id of FREQUENTLY_USED_IDS) {
      expect(() => findCalculator(id)).not.toThrow();
    }
  });

  describe('findCalculator', () => {
    it('returns the matching calculator', () => {
      expect(findCalculator('cost').name).toBe('원가 · 마진');
    });
  });

  describe('searchCalculators', () => {
    it('returns all calculators for an empty query', () => {
      expect(searchCalculators('')).toHaveLength(8);
      expect(searchCalculators('   ')).toHaveLength(8);
    });

    it('matches by name', () => {
      expect(searchCalculators('원가').map((c) => c.id)).toEqual(['cost']);
    });

    it('matches by description, case-insensitively', () => {
      expect(searchCalculators('인원별').map((c) => c.id)).toEqual(['split-bill']);
    });

    it('returns an empty array when nothing matches', () => {
      expect(searchCalculators('존재하지않음')).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/data
```
Expected: FAIL — `Cannot find module './calculators'`.

- [ ] **Step 3: Implement `calculators.ts`**

```ts
export type CalculatorId =
  | 'cost'
  | 'discount'
  | 'split-bill'
  | 'salary'
  | 'travel-expense'
  | 'shipping-fee'
  | 'profit-rate'
  | 'vat';

export type CalculatorMeta = {
  id: CalculatorId;
  name: string;
  description: string;
  icon: string;
  route: string;
  implemented: boolean;
};

export const calculators: CalculatorMeta[] = [
  { id: 'cost', name: '원가 · 마진', description: '원가율과 목표 판매가 계산', icon: '🧾', route: '/cost', implemented: true },
  { id: 'discount', name: '할인 · 세일', description: '할인 후 가격 계산', icon: '%', route: '/discount', implemented: false },
  { id: 'split-bill', name: '더치페이', description: '인원별 금액 계산', icon: '👥', route: '/split-bill', implemented: false },
  { id: 'salary', name: '급여 · 시급', description: '월급과 시급 계산', icon: '₩', route: '/salary', implemented: false },
  { id: 'travel-expense', name: '여행 경비', description: '여행 총비용과 1인당 비용 계산', icon: '🧳', route: '/travel-expense', implemented: false },
  { id: 'shipping-fee', name: '배송비', description: '배송비와 총 결제금액 계산', icon: '🚚', route: '/shipping-fee', implemented: false },
  { id: 'profit-rate', name: '수익률', description: '수익률과 마진 계산', icon: '📈', route: '/profit-rate', implemented: false },
  { id: 'vat', name: '부가세', description: '공급가와 부가세 계산', icon: '🏷️', route: '/vat', implemented: false },
];

export const FREQUENTLY_USED_IDS: CalculatorId[] = ['cost', 'discount', 'split-bill', 'travel-expense'];

export function findCalculator(id: CalculatorId): CalculatorMeta {
  const found = calculators.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Unknown calculator id: ${id}`);
  }
  return found;
}

export function searchCalculators(query: string): CalculatorMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return calculators;
  }
  return calculators.filter(
    (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/data
```
Expected: PASS, 8 tests.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add chuck-chuck-calculator/src/data
git commit -m "feat: add data-driven calculator list"
```

---

### Task 4: Recent-use storage (`storage/usage.ts`)

**Files:**
- Create: `chuck-chuck-calculator/src/storage/usage.ts`
- Test: `chuck-chuck-calculator/src/storage/usage.test.ts`

**Interfaces:**
- Consumes: `Storage` from `@apps-in-toss/framework` (methods used: `getItem(key: string): Promise<string | null>`, `setItem(key: string, value: string): Promise<void>`).
- Produces: `type UsageEntry = { calculatorId: string; lastUsedAt: number; useCount: number }`; `getRecentUsage(): Promise<UsageEntry[]>`; `recordUsage(calculatorId: string): Promise<UsageEntry[]>` (returns the updated list, sorted most-recently-used first). Home screen (Task 6) is the consumer.

- [ ] **Step 1: Write the failing tests**

`chuck-chuck-calculator/src/storage/usage.test.ts`:

```ts
import { Storage } from '@apps-in-toss/framework';
import { getRecentUsage, recordUsage } from './usage';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(Storage);

describe('usage storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getRecentUsage', () => {
    it('returns an empty array when nothing is stored', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      await expect(getRecentUsage()).resolves.toEqual([]);
    });

    it('returns an empty array when the stored value is not valid JSON', async () => {
      mockedStorage.getItem.mockResolvedValue('not json');
      await expect(getRecentUsage()).resolves.toEqual([]);
    });

    it('parses previously stored entries', async () => {
      const stored = [{ calculatorId: 'cost', lastUsedAt: 500, useCount: 2 }];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      await expect(getRecentUsage()).resolves.toEqual(stored);
    });
  });

  describe('recordUsage', () => {
    it('adds a new entry with useCount 1', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      const result = await recordUsage('cost');
      expect(result).toEqual([{ calculatorId: 'cost', lastUsedAt: 1000, useCount: 1 }]);
      expect(mockedStorage.setItem).toHaveBeenCalledWith('usage-history-v1', JSON.stringify(result));
    });

    it('increments useCount and refreshes lastUsedAt for an existing entry', async () => {
      const stored = [{ calculatorId: 'cost', lastUsedAt: 100, useCount: 1 }];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      const result = await recordUsage('cost');
      expect(result).toEqual([{ calculatorId: 'cost', lastUsedAt: 1000, useCount: 2 }]);
    });

    it('sorts most-recently-used first', async () => {
      const stored = [
        { calculatorId: 'cost', lastUsedAt: 100, useCount: 1 },
        { calculatorId: 'discount', lastUsedAt: 200, useCount: 1 },
      ];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      const result = await recordUsage('cost');
      expect(result.map((e) => e.calculatorId)).toEqual(['cost', 'discount']);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/storage
```
Expected: FAIL — `Cannot find module './usage'`.

- [ ] **Step 3: Implement `usage.ts`**

```ts
import { Storage } from '@apps-in-toss/framework';

const STORAGE_KEY = 'usage-history-v1';

export type UsageEntry = {
  calculatorId: string;
  lastUsedAt: number;
  useCount: number;
};

export async function getRecentUsage(): Promise<UsageEntry[]> {
  const raw = await Storage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UsageEntry[]) : [];
  } catch {
    return [];
  }
}

export async function recordUsage(calculatorId: string): Promise<UsageEntry[]> {
  const current = await getRecentUsage();
  const now = Date.now();
  const existing = current.find((e) => e.calculatorId === calculatorId);

  const updated = existing
    ? current.map((e) =>
        e.calculatorId === calculatorId ? { ...e, lastUsedAt: now, useCount: e.useCount + 1 } : e,
      )
    : [...current, { calculatorId, lastUsedAt: now, useCount: 1 }];

  updated.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  await Storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/storage
```
Expected: PASS, 6 tests.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add chuck-chuck-calculator/src/storage
git commit -m "feat: add recent-use tracking backed by Apps in Toss Storage"
```

---

### Task 5: Home-screen shared components

**Files:**
- Create: `chuck-chuck-calculator/src/components/Header.tsx`
- Create: `chuck-chuck-calculator/src/components/SearchBar.tsx`
- Create: `chuck-chuck-calculator/src/components/CalculatorCard.tsx`
- Create: `chuck-chuck-calculator/src/components/CalculatorListItem.tsx`
- Create: `chuck-chuck-calculator/src/components/BottomNavigation.tsx`
- Test: `chuck-chuck-calculator/src/components/Header.test.tsx`
- Test: `chuck-chuck-calculator/src/components/SearchBar.test.tsx`
- Test: `chuck-chuck-calculator/src/components/CalculatorCard.test.tsx`
- Test: `chuck-chuck-calculator/src/components/CalculatorListItem.test.tsx`
- Test: `chuck-chuck-calculator/src/components/BottomNavigation.test.tsx`

**Interfaces:**
- Consumes: `colors` / `fontSizes` / `fontWeights` from Task 2; `CalculatorMeta` type from Task 3.
- Produces: `Header({ title, subtitle? })`; `SearchBar({ value, onChangeText, placeholder? })` (renders a `TextInput` with `testID="search-bar-input"`); `CalculatorCard({ calculator, onPress })` (renders `TouchableOpacity` with `testID={`calculator-card-${calculator.id}`}`); `CalculatorListItem({ calculator, onPress })` (renders `TouchableOpacity` with `testID={`calculator-list-item-${calculator.id}`}`); `BottomNavigation({ activeTab, onTabPress })` where `activeTab: 'home' | 'history' | 'settings'` and `onTabPress: (tab: 'home' | 'history' | 'settings') => void`, each tab rendered with `testID={`bottom-nav-${tab}`}`. Home screen (Task 6) imports all five.

- [ ] **Step 1: Write the failing tests**

`chuck-chuck-calculator/src/components/Header.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Header } from './Header';

describe('Header', () => {
  it('renders the title and subtitle', () => {
    render(<Header title="척척 계산기" subtitle="필요한 계산, 한 번에" />);
    expect(screen.getByText('척척 계산기')).toBeTruthy();
    expect(screen.getByText('필요한 계산, 한 번에')).toBeTruthy();
  });

  it('omits the subtitle text when not provided', () => {
    render(<Header title="척척 계산기" />);
    expect(screen.queryByText('필요한 계산, 한 번에')).toBeNull();
  });
});
```

`chuck-chuck-calculator/src/components/SearchBar.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('shows the default placeholder and forwards text changes', () => {
    const onChangeText = jest.fn();
    render(<SearchBar value="" onChangeText={onChangeText} />);
    const input = screen.getByTestId('search-bar-input');
    expect(input.props.placeholder).toBe('어떤 계산을 할까요?');
    fireEvent.changeText(input, '원가');
    expect(onChangeText).toHaveBeenCalledWith('원가');
  });
});
```

`chuck-chuck-calculator/src/components/CalculatorCard.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CalculatorCard } from './CalculatorCard';
import { findCalculator } from '../data/calculators';

describe('CalculatorCard', () => {
  it('renders the calculator name/description and fires onPress', () => {
    const onPress = jest.fn();
    const calculator = findCalculator('cost');
    render(<CalculatorCard calculator={calculator} onPress={onPress} />);
    expect(screen.getByText('원가 · 마진')).toBeTruthy();
    fireEvent.press(screen.getByTestId('calculator-card-cost'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

`chuck-chuck-calculator/src/components/CalculatorListItem.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CalculatorListItem } from './CalculatorListItem';
import { findCalculator } from '../data/calculators';

describe('CalculatorListItem', () => {
  it('renders the calculator name/description and fires onPress', () => {
    const onPress = jest.fn();
    const calculator = findCalculator('vat');
    render(<CalculatorListItem calculator={calculator} onPress={onPress} />);
    expect(screen.getByText('부가세')).toBeTruthy();
    fireEvent.press(screen.getByTestId('calculator-list-item-vat'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

`chuck-chuck-calculator/src/components/BottomNavigation.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BottomNavigation } from './BottomNavigation';

describe('BottomNavigation', () => {
  it('fires onTabPress with the tapped tab id', () => {
    const onTabPress = jest.fn();
    render(<BottomNavigation activeTab="home" onTabPress={onTabPress} />);
    fireEvent.press(screen.getByTestId('bottom-nav-history'));
    expect(onTabPress).toHaveBeenCalledWith('history');
  });

  it('renders all three tabs', () => {
    render(<BottomNavigation activeTab="home" onTabPress={jest.fn()} />);
    expect(screen.getByTestId('bottom-nav-home')).toBeTruthy();
    expect(screen.getByTestId('bottom-nav-history')).toBeTruthy();
    expect(screen.getByTestId('bottom-nav-settings')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/components
```
Expected: FAIL — each test file's target component module doesn't exist yet.

- [ ] **Step 3: Implement `Header.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

export type HeaderProps = {
  title: string;
  subtitle?: string;
};

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.darkText },
  subtitle: { fontSize: fontSizes.caption, color: colors.secondaryText, marginTop: 4 },
});
```

- [ ] **Step 4: Implement `SearchBar.tsx`**

```tsx
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes } from '../theme/typography';

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = '어떤 계산을 할까요?' }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <TextInput
        testID="search-bar-input"
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: colors.lightBlueBackground,
    paddingHorizontal: 16,
  },
  input: { height: 44, fontSize: fontSizes.body, color: colors.darkText },
});
```

- [ ] **Step 5: Implement `CalculatorCard.tsx`**

```tsx
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import type { CalculatorMeta } from '../data/calculators';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

export type CalculatorCardProps = {
  calculator: CalculatorMeta;
  onPress: () => void;
};

export function CalculatorCard({ calculator, onPress }: CalculatorCardProps) {
  return (
    <TouchableOpacity testID={`calculator-card-${calculator.id}`} style={styles.card} onPress={onPress}>
      <View style={styles.iconBadge}>
        <Text style={styles.iconText}>{calculator.icon}</Text>
      </View>
      <Text style={styles.name}>{calculator.name}</Text>
      <Text style={styles.description} numberOfLines={1}>
        {calculator.description}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightBlueBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: { fontSize: 18 },
  name: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 2 },
  description: { fontSize: fontSizes.caption, color: colors.secondaryText },
});
```

- [ ] **Step 6: Implement `CalculatorListItem.tsx`**

```tsx
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import type { CalculatorMeta } from '../data/calculators';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

export type CalculatorListItemProps = {
  calculator: CalculatorMeta;
  onPress: () => void;
};

export function CalculatorListItem({ calculator, onPress }: CalculatorListItemProps) {
  return (
    <TouchableOpacity
      testID={`calculator-list-item-${calculator.id}`}
      style={styles.row}
      onPress={onPress}>
      <View style={styles.iconBadge}>
        <Text style={styles.iconText}>{calculator.icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{calculator.name}</Text>
        <Text style={styles.description}>{calculator.description}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightBlueBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 18 },
  textContainer: { flex: 1 },
  name: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText },
  description: { fontSize: fontSizes.caption, color: colors.secondaryText, marginTop: 2 },
  arrow: { fontSize: fontSizes.title, color: colors.secondaryText },
});
```

- [ ] **Step 7: Implement `BottomNavigation.tsx`**

```tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

export type BottomTab = 'home' | 'history' | 'settings';

export type BottomNavigationProps = {
  activeTab: BottomTab;
  onTabPress: (tab: BottomTab) => void;
};

const TABS: { id: BottomTab; label: string }[] = [
  { id: 'home', label: '홈' },
  { id: 'history', label: '기록' },
  { id: 'settings', label: '설정' },
];

export function BottomNavigation({ activeTab, onTabPress }: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          testID={`bottom-nav-${tab.id}`}
          style={styles.tab}
          onPress={() => onTabPress(tab.id)}>
          <Text style={[styles.label, tab.id === activeTab && styles.labelActive]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  label: { fontSize: fontSizes.caption, color: colors.secondaryText },
  labelActive: { color: colors.primaryBlue, fontWeight: fontWeights.bold },
});
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm test -- src/components
```
Expected: PASS, 8 tests across 5 files.

- [ ] **Step 9: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 10: Commit**

```bash
git add chuck-chuck-calculator/src/components
git commit -m "feat: add Home-screen shared components"
```

---

### Task 6: Home screen

**Files:**
- Create: `chuck-chuck-calculator/src/features/home/HomeScreen.tsx`
- Create: `chuck-chuck-calculator/src/pages/index.tsx` (overwrites the scaffold demo page)
- Test: `chuck-chuck-calculator/src/features/home/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: `calculators`, `searchCalculators`, `findCalculator`, `FREQUENTLY_USED_IDS` (Task 3); `getRecentUsage`, `recordUsage` (Task 4); `Header`, `SearchBar`, `CalculatorCard`, `CalculatorListItem`, `BottomNavigation` (Task 5).
- Produces: `HomeScreen({ onNavigateToCalculator: (route: string) => void })` — a presentational component with no dependency on the router, so it's testable without mocking Granite's navigation. `src/pages/index.tsx` is a thin wrapper that supplies the real `navigation.navigate` call.

- [ ] **Step 1: Write the failing test**

`chuck-chuck-calculator/src/features/home/HomeScreen.test.tsx`:

```tsx
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { HomeScreen } from './HomeScreen';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(Storage);

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getItem.mockResolvedValue(null);
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows all 8 calculators in the full list by default', () => {
    render(<HomeScreen onNavigateToCalculator={jest.fn()} />);
    expect(screen.getByTestId('calculator-list-item-vat')).toBeTruthy();
    expect(screen.getByTestId('calculator-list-item-cost')).toBeTruthy();
  });

  it('filters the full list when searching, and hides the frequently-used grid', () => {
    render(<HomeScreen onNavigateToCalculator={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId('search-bar-input'), '원가');
    expect(screen.getByTestId('calculator-list-item-cost')).toBeTruthy();
    expect(screen.queryByTestId('calculator-list-item-vat')).toBeNull();
    expect(screen.queryByTestId('calculator-card-cost')).toBeNull();
  });

  it('navigates and records usage when tapping the implemented (cost) calculator', async () => {
    const onNavigateToCalculator = jest.fn();
    render(<HomeScreen onNavigateToCalculator={onNavigateToCalculator} />);
    fireEvent.press(screen.getByTestId('calculator-list-item-cost'));
    // handlePressCalculator is async (awaits recordUsage before navigating), and
    // RTL's fireEvent.press does not await the handler's returned promise, so both
    // assertions must wait for the microtask to flush.
    await waitFor(() => expect(onNavigateToCalculator).toHaveBeenCalledWith('/cost'));
    expect(mockedStorage.setItem).toHaveBeenCalled();
  });

  it('shows a "준비 중" alert instead of navigating for an unimplemented calculator', () => {
    const onNavigateToCalculator = jest.fn();
    render(<HomeScreen onNavigateToCalculator={onNavigateToCalculator} />);
    fireEvent.press(screen.getByTestId('calculator-list-item-vat'));
    expect(onNavigateToCalculator).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('준비 중이에요', expect.any(String));
  });

  it('shows recent-use chips only after a usage record exists', async () => {
    mockedStorage.getItem.mockResolvedValue(
      JSON.stringify([{ calculatorId: 'cost', lastUsedAt: 1, useCount: 1 }]),
    );
    render(<HomeScreen onNavigateToCalculator={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('recent-usage-chip-cost')).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/features/home
```
Expected: FAIL — `Cannot find module './HomeScreen'`.

- [ ] **Step 3: Implement `HomeScreen.tsx`**

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { CalculatorCard } from '../../components/CalculatorCard';
import { CalculatorListItem } from '../../components/CalculatorListItem';
import { BottomNavigation, type BottomTab } from '../../components/BottomNavigation';
import { searchCalculators, findCalculator, FREQUENTLY_USED_IDS } from '../../data/calculators';
import { getRecentUsage, recordUsage, type UsageEntry } from '../../storage/usage';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

export type HomeScreenProps = {
  onNavigateToCalculator: (route: string) => void;
};

export function HomeScreen({ onNavigateToCalculator }: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentUsage, setRecentUsage] = useState<UsageEntry[]>([]);

  useEffect(() => {
    getRecentUsage().then(setRecentUsage);
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const filteredCalculators = useMemo(() => searchCalculators(searchQuery), [searchQuery]);
  const frequentlyUsed = useMemo(() => FREQUENTLY_USED_IDS.map(findCalculator), []);

  const handlePressCalculator = async (calculatorId: string) => {
    const calculator = findCalculator(calculatorId as Parameters<typeof findCalculator>[0]);
    if (!calculator.implemented) {
      Alert.alert('준비 중이에요', `${calculator.name} 계산기는 곧 만나보실 수 있어요.`);
      return;
    }
    const updated = await recordUsage(calculator.id);
    setRecentUsage(updated);
    onNavigateToCalculator(calculator.route);
  };

  const handleTabPress = (tab: BottomTab) => {
    if (tab === 'home') {
      return;
    }
    Alert.alert('준비 중이에요', '해당 탭은 곧 만나보실 수 있어요.');
  };

  return (
    <View style={styles.screen}>
      <ScrollView>
        <Header title="척척 계산기" subtitle="필요한 계산, 한 번에" />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {!isSearching && recentUsage.length > 0 ? (
          <ScrollView horizontal style={styles.recentRow} showsHorizontalScrollIndicator={false}>
            {recentUsage.map((entry) => {
              const calculator = findCalculator(entry.calculatorId as Parameters<typeof findCalculator>[0]);
              return (
                <TouchableOpacity
                  key={entry.calculatorId}
                  testID={`recent-usage-chip-${entry.calculatorId}`}
                  style={styles.chip}
                  onPress={() => handlePressCalculator(entry.calculatorId)}>
                  <Text style={styles.chipText}>{calculator.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {!isSearching ? (
          <View style={styles.frequentGrid}>
            {frequentlyUsed.map((calculator) => (
              <CalculatorCard
                key={calculator.id}
                calculator={calculator}
                onPress={() => handlePressCalculator(calculator.id)}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.fullListSection}>
          {filteredCalculators.map((calculator) => (
            <CalculatorListItem
              key={calculator.id}
              calculator={calculator}
              onPress={() => handlePressCalculator(calculator.id)}
            />
          ))}
        </View>
      </ScrollView>
      <BottomNavigation activeTab="home" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  recentRow: { paddingLeft: 20, marginBottom: 16 },
  chip: {
    backgroundColor: colors.lightBlueBackground,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipText: { fontSize: fontSizes.caption, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  frequentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  fullListSection: { marginTop: 8 },
});
```

- [ ] **Step 4: Replace the scaffold demo page with the real Home page**

Overwrite `chuck-chuck-calculator/src/pages/index.tsx`:

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
      onNavigateToCalculator={(route) => {
        // '/cost' isn't registered in router.gen.ts until Task 8 adds src/pages/cost.tsx —
        // see this plan's Global Constraints on the router.gen.ts regeneration gotcha.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation.navigate(route as any);
      }}
    />
  );
}
```

- [ ] **Step 5: Delete the now-unused scaffold demo page**

The scaffold's `src/pages/about.tsx` is unused by this plan; delete it so `router.gen.ts` doesn't need to keep an entry no screen links to. The Granite scaffold also creates a second, git-tracked `pages/` directory at the project root (sibling to `src/`) with one-line re-export shims per page (e.g. `chuck-chuck-calculator/pages/about.tsx` contains `export { Route } from 'pages/about';`, resolved via `tsconfig.json`'s `baseUrl: "src"`); delete that mirror too, or `npm run typecheck` fails on a dangling re-export:

```bash
rm chuck-chuck-calculator/src/pages/about.tsx
rm chuck-chuck-calculator/pages/about.tsx
```

Then edit `chuck-chuck-calculator/src/router.gen.ts` (hand-edit, per Global Constraints) to remove the `about` entries, leaving:

```ts
/* eslint-disable */
// This file is auto-generated by @granite-js/react-native. DO NOT EDIT.
import { Route as _IndexRoute } from '../pages/';

declare module '@granite-js/react-native' {
  interface RegisterScreenInput {
    '/': (typeof _IndexRoute)['_inputType'];
  }

  interface RegisterScreen {
    '/': (typeof _IndexRoute)['_outputType'];
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
npm test -- src/features/home
```
Expected: PASS, 5 tests.

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck
```
Expected: no errors (the single `as any` cast in Step 4 is intentional and documented — do not attempt to eliminate it by widening other types).

- [ ] **Step 8: Commit**

```bash
git add chuck-chuck-calculator/src
git commit -m "feat: build Home screen with search, recent-use, and full calculator list"
```

---

### Task 7: 원가·마진 calculation logic

**Files:**
- Create: `chuck-chuck-calculator/src/features/cost/calc.ts`
- Test: `chuck-chuck-calculator/src/features/cost/calc.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type CostInputs = { materialCost: number; subMaterialCost?: number; laborCost?: number; otherCost?: number }`; `type CostCalcInput = (CostInputs & { mode: 'marginToPrice'; marginRatePercent: number }) | (CostInputs & { mode: 'priceToMargin'; sellingPrice: number })`; `type CostCalcResult = { totalCost: number; sellingPrice: number; costRatePercent: number; marginRatePercent: number; expectedProfit: number }`; `calculateCost(input: CostCalcInput): CostCalcResult` (throws `RangeError` for `marginRatePercent >= 100` or `sellingPrice <= 0`). Task 8's `CostScreen` is the consumer.

- [ ] **Step 1: Write the failing tests**

`chuck-chuck-calculator/src/features/cost/calc.test.ts`:

```ts
import { calculateCost } from './calc';

describe('calculateCost', () => {
  it('mode marginToPrice: derives selling price from cost + target margin', () => {
    const result = calculateCost({
      mode: 'marginToPrice',
      materialCost: 3000,
      subMaterialCost: 500,
      marginRatePercent: 30,
    });
    expect(result).toEqual({
      totalCost: 3500,
      sellingPrice: 5000,
      costRatePercent: 70,
      marginRatePercent: 30,
      expectedProfit: 1500,
    });
  });

  it('mode priceToMargin: derives margin rate from cost + given selling price', () => {
    const result = calculateCost({
      mode: 'priceToMargin',
      materialCost: 3000,
      subMaterialCost: 500,
      sellingPrice: 5000,
    });
    expect(result).toEqual({
      totalCost: 3500,
      sellingPrice: 5000,
      costRatePercent: 70,
      marginRatePercent: 30,
      expectedProfit: 1500,
    });
  });

  it('treats missing optional costs as zero', () => {
    const result = calculateCost({ mode: 'marginToPrice', materialCost: 1000, marginRatePercent: 50 });
    expect(result.totalCost).toBe(1000);
    expect(result.sellingPrice).toBe(2000);
  });

  it('rejects a margin rate of 100 or more', () => {
    expect(() =>
      calculateCost({ mode: 'marginToPrice', materialCost: 1000, marginRatePercent: 100 }),
    ).toThrow(RangeError);
  });

  it('rejects a selling price of 0 or less', () => {
    expect(() =>
      calculateCost({ mode: 'priceToMargin', materialCost: 1000, sellingPrice: 0 }),
    ).toThrow(RangeError);
  });

  it('rounds money to the nearest won and percentages to one decimal', () => {
    const result = calculateCost({ mode: 'marginToPrice', materialCost: 1000, marginRatePercent: 33 });
    // 1000 / (1 - 0.33) = 1492.5373...
    expect(result.sellingPrice).toBe(1493);
    expect(Number.isInteger(result.sellingPrice)).toBe(true);
    expect(result.costRatePercent).toBe(67);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/features/cost/calc.test.ts
```
Expected: FAIL — `Cannot find module './calc'`.

- [ ] **Step 3: Implement `calc.ts`**

```ts
const MAX_MARGIN_RATE_PERCENT = 100;

export type CostInputs = {
  materialCost: number;
  subMaterialCost?: number;
  laborCost?: number;
  otherCost?: number;
};

export type CostCalcInput =
  | (CostInputs & { mode: 'marginToPrice'; marginRatePercent: number })
  | (CostInputs & { mode: 'priceToMargin'; sellingPrice: number });

export type CostCalcResult = {
  totalCost: number;
  sellingPrice: number;
  costRatePercent: number;
  marginRatePercent: number;
  expectedProfit: number;
};

function roundToWon(value: number): number {
  return Math.round(value);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function sumTotalCost(inputs: CostInputs): number {
  return inputs.materialCost + (inputs.subMaterialCost ?? 0) + (inputs.laborCost ?? 0) + (inputs.otherCost ?? 0);
}

export function calculateCost(input: CostCalcInput): CostCalcResult {
  const totalCost = sumTotalCost(input);

  let sellingPrice: number;
  if (input.mode === 'marginToPrice') {
    if (input.marginRatePercent >= MAX_MARGIN_RATE_PERCENT) {
      throw new RangeError('marginRatePercent must be less than 100');
    }
    sellingPrice = roundToWon(totalCost / (1 - input.marginRatePercent / 100));
  } else {
    if (input.sellingPrice <= 0) {
      throw new RangeError('sellingPrice must be greater than 0');
    }
    sellingPrice = input.sellingPrice;
  }

  const costRatePercent = sellingPrice === 0 ? 0 : roundToOneDecimal((totalCost / sellingPrice) * 100);
  const marginRatePercent =
    sellingPrice === 0 ? 0 : roundToOneDecimal(((sellingPrice - totalCost) / sellingPrice) * 100);
  const expectedProfit = roundToWon(sellingPrice - totalCost);

  return { totalCost, sellingPrice, costRatePercent, marginRatePercent, expectedProfit };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/features/cost/calc.test.ts
```
Expected: PASS, 6 tests.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add chuck-chuck-calculator/src/features/cost/calc.ts chuck-chuck-calculator/src/features/cost/calc.test.ts
git commit -m "feat: add cost/margin calculation logic"
```

---

### Task 8: 원가·마진 calculator screen

**Files:**
- Create: `chuck-chuck-calculator/src/components/NumberInput.tsx`
- Create: `chuck-chuck-calculator/src/components/ResultCard.tsx`
- Create: `chuck-chuck-calculator/src/features/cost/CostScreen.tsx`
- Create: `chuck-chuck-calculator/src/pages/cost.tsx`
- Test: `chuck-chuck-calculator/src/features/cost/CostScreen.test.tsx`

**Interfaces:**
- Consumes: `calculateCost` (Task 7); `colors`, `fontSizes`, `fontWeights`, `tabularNums` (Task 2).
- Produces: `NumberInput({ label, value, onChangeValue, placeholder?, testID? })` (strips non-digit characters before calling `onChangeValue`); `ResultCard({ label, value, emphasis? })`; `CostScreen()` — a full-screen component with no props, registered at route `/cost`.

- [ ] **Step 1: Write the failing test**

`chuck-chuck-calculator/src/features/cost/CostScreen.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CostScreen } from './CostScreen';

describe('CostScreen', () => {
  it('shows no result until the required inputs are filled in', () => {
    render(<CostScreen />);
    expect(screen.queryByTestId('cost-result')).toBeNull();
  });

  it('computes the result live in marginToPrice mode (default)', () => {
    render(<CostScreen />);
    fireEvent.changeText(screen.getByTestId('input-material-cost'), '3000');
    fireEvent.changeText(screen.getByTestId('input-sub-material-cost'), '500');
    fireEvent.changeText(screen.getByTestId('input-margin-rate'), '30');

    expect(screen.getByText('70%')).toBeTruthy();
    expect(screen.getByText('5,000원')).toBeTruthy();
    expect(screen.getByText('1,500원')).toBeTruthy();
  });

  it('computes the same result in priceToMargin mode for equivalent inputs', () => {
    render(<CostScreen />);
    fireEvent.press(screen.getByTestId('mode-price-to-margin'));
    fireEvent.changeText(screen.getByTestId('input-material-cost'), '3000');
    fireEvent.changeText(screen.getByTestId('input-sub-material-cost'), '500');
    fireEvent.changeText(screen.getByTestId('input-selling-price'), '5000');

    expect(screen.getByText('70%')).toBeTruthy();
    expect(screen.getByText('5,000원')).toBeTruthy();
    expect(screen.getByText('1,500원')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/features/cost/CostScreen.test.tsx
```
Expected: FAIL — `Cannot find module './CostScreen'`.

- [ ] **Step 3: Implement `NumberInput.tsx`**

```tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes } from '../theme/typography';

export type NumberInputProps = {
  label: string;
  value: string;
  onChangeValue: (digitsOnly: string) => void;
  placeholder?: string;
  testID?: string;
};

export function NumberInput({ label, value, onChangeValue, placeholder, testID }: NumberInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        style={styles.input}
        value={value}
        onChangeText={(text) => onChangeValue(text.replace(/[^0-9]/g, ''))}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        keyboardType="number-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, paddingHorizontal: 20 },
  label: { fontSize: fontSizes.caption, color: colors.secondaryText, marginBottom: 6 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: fontSizes.body,
    color: colors.darkText,
  },
});
```

- [ ] **Step 4: Implement `ResultCard.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights, tabularNums } from '../theme/typography';

export type ResultCardProps = {
  label: string;
  value: string;
  emphasis?: 'default' | 'success';
};

export function ResultCard({ label, value, emphasis = 'default' }: ResultCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, tabularNums, emphasis === 'success' && styles.successValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 20 },
  label: { fontSize: fontSizes.caption, color: colors.secondaryText, marginBottom: 4 },
  value: { fontSize: fontSizes.resultLarge, fontWeight: fontWeights.bold, color: colors.darkText },
  successValue: { color: colors.success },
});
```

- [ ] **Step 5: Implement `CostScreen.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NumberInput } from '../../components/NumberInput';
import { ResultCard } from '../../components/ResultCard';
import { calculateCost, type CostCalcInput } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

type Mode = 'marginToPrice' | 'priceToMargin';

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

export function CostScreen() {
  const [mode, setMode] = useState<Mode>('marginToPrice');
  const [materialCost, setMaterialCost] = useState('');
  const [subMaterialCost, setSubMaterialCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [marginRatePercent, setMarginRatePercent] = useState('');
  const [sellingPriceInput, setSellingPriceInput] = useState('');

  const result = useMemo(() => {
    if (materialCost === '') {
      return null;
    }
    if (mode === 'marginToPrice' && marginRatePercent === '') {
      return null;
    }
    if (mode === 'priceToMargin' && sellingPriceInput === '') {
      return null;
    }

    const base = {
      materialCost: toNumber(materialCost),
      subMaterialCost: toNumber(subMaterialCost),
      laborCost: toNumber(laborCost),
      otherCost: toNumber(otherCost),
    };
    const input: CostCalcInput =
      mode === 'marginToPrice'
        ? { ...base, mode, marginRatePercent: toNumber(marginRatePercent) }
        : { ...base, mode, sellingPrice: toNumber(sellingPriceInput) };

    try {
      return calculateCost(input);
    } catch {
      return null;
    }
  }, [mode, materialCost, subMaterialCost, laborCost, otherCost, marginRatePercent, sellingPriceInput]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.modeSwitch}>
        <TouchableOpacity
          testID="mode-margin-to-price"
          style={[styles.modeButton, mode === 'marginToPrice' && styles.modeButtonActive]}
          onPress={() => setMode('marginToPrice')}>
          <Text style={[styles.modeButtonText, mode === 'marginToPrice' && styles.modeButtonTextActive]}>
            마진율로 판매가 구하기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="mode-price-to-margin"
          style={[styles.modeButton, mode === 'priceToMargin' && styles.modeButtonActive]}
          onPress={() => setMode('priceToMargin')}>
          <Text style={[styles.modeButtonText, mode === 'priceToMargin' && styles.modeButtonTextActive]}>
            판매가로 마진율 구하기
          </Text>
        </TouchableOpacity>
      </View>

      <NumberInput testID="input-material-cost" label="재료비" value={materialCost} onChangeValue={setMaterialCost} placeholder="0" />
      <NumberInput testID="input-sub-material-cost" label="부자재비 (선택)" value={subMaterialCost} onChangeValue={setSubMaterialCost} placeholder="0" />
      <NumberInput testID="input-labor-cost" label="인건비 (선택)" value={laborCost} onChangeValue={setLaborCost} placeholder="0" />
      <NumberInput testID="input-other-cost" label="기타비용 (선택)" value={otherCost} onChangeValue={setOtherCost} placeholder="0" />

      {mode === 'marginToPrice' ? (
        <NumberInput
          testID="input-margin-rate"
          label="목표 마진율 (%)"
          value={marginRatePercent}
          onChangeValue={setMarginRatePercent}
          placeholder="0"
        />
      ) : (
        <NumberInput
          testID="input-selling-price"
          label="판매가"
          value={sellingPriceInput}
          onChangeValue={setSellingPriceInput}
          placeholder="0"
        />
      )}

      {result ? (
        <View testID="cost-result" style={styles.resultSection}>
          <ResultCard label="원가율" value={`${result.costRatePercent}%`} />
          <ResultCard label="판매가" value={formatWon(result.sellingPrice)} />
          <ResultCard label="예상 이익" value={formatWon(result.expectedProfit)} emphasis="success" />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 20 },
  modeSwitch: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: colors.lightBlueBackground,
    padding: 4,
  },
  modeButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modeButtonActive: { backgroundColor: colors.primaryBlue },
  modeButtonText: { fontSize: fontSizes.caption, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  modeButtonTextActive: { color: colors.background },
  resultSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
});
```

- [ ] **Step 6: Add the route page**

`chuck-chuck-calculator/src/pages/cost.tsx`:

```tsx
import { createRoute } from '@granite-js/react-native';
import { CostScreen } from '../features/cost/CostScreen';

export const Route = createRoute('/cost', {
  component: CostScreen,
});
```

- [ ] **Step 7: Hand-edit `router.gen.ts` to register `/cost`**

Per Global Constraints (live regeneration is too slow to gate this task on), edit `chuck-chuck-calculator/src/router.gen.ts` to:

```ts
/* eslint-disable */
// This file is auto-generated by @granite-js/react-native. DO NOT EDIT.
import { Route as _IndexRoute } from '../pages/';
import { Route as _CostRoute } from '../pages/cost';

declare module '@granite-js/react-native' {
  interface RegisterScreenInput {
    '/': (typeof _IndexRoute)['_inputType'];
    '/cost': (typeof _CostRoute)['_inputType'];
  }

  interface RegisterScreen {
    '/': (typeof _IndexRoute)['_outputType'];
    '/cost': (typeof _CostRoute)['_outputType'];
  }
}
```

Now that `/cost` is registered, the `as any` cast added in Task 6 Step 4 is no longer strictly required — leave it in place (harmless, and a future calculator's route will hit the same gap again before its own page task lands).

- [ ] **Step 8: Run the test to verify it passes**

```bash
npm test -- src/features/cost/CostScreen.test.tsx
```
Expected: PASS, 3 tests.

- [ ] **Step 9: Run the full test suite, typecheck, and lint**

```bash
npm test
npm run typecheck
npm run lint
```
Expected: all pass — every test file from Tasks 2–8 (theme, data, storage, components, HomeScreen, cost calc, CostScreen) green, zero type errors, zero lint errors.

- [ ] **Step 10: Verify the dev server still boots**

```bash
npm run dev
```
Expected: Granite banner prints, Metro listens on port 8081, no crash. Stop it after ~10s.

- [ ] **Step 11: Commit**

```bash
git add chuck-chuck-calculator/src
git commit -m "feat: build 원가·마진 calculator screen and wire up /cost route"
```

---

## Out of scope for this plan (tracked in `PLAN_척척계산기.md` section 13 for follow-up plans)

할인, 더치페이, 급여, 배송비, 수익률, 부가세, 여행경비 계산기; 기록 탭; 설정 탭; 광고 영역; Apps in Toss console 앱 등록 및 아이콘/appName 실제 값 동기화; 실기기/샌드박스 테스트.
