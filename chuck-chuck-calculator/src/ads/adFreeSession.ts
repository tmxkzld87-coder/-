import { Storage } from '@apps-in-toss/framework';

const STORAGE_KEY = 'ad-free-until-v1';
export const AD_FREE_MINUTES = 30;

// 보상형 광고를 끝까지 보면 이 시각(ms epoch)까지 배너/전면형 광고를 숨긴다.
export async function getAdFreeUntil(): Promise<number> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export async function isAdFreeActive(): Promise<boolean> {
  return (await getAdFreeUntil()) > Date.now();
}

export async function grantAdFreeMinutes(minutes: number = AD_FREE_MINUTES): Promise<number> {
  const until = Date.now() + minutes * 60_000;
  try {
    await Storage.setItem(STORAGE_KEY, String(until));
  } catch {
    // Best-effort persistence — a failed write just means the reward doesn't stick, not a crash.
  }
  return until;
}
