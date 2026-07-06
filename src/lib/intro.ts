import { safeSetItem } from "@/lib/storage";

export const INTRO_FIRST_OPEN_KEY = "smartbudget:intro-first-open:v1";

export function replayIntroSequence() {
  safeSetItem(INTRO_FIRST_OPEN_KEY, "0");
}
