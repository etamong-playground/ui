import { describe, expect, it } from "vitest";
import { defaultFilter } from "cmdk";

import { paletteFilter } from "../src/CommandPalette";

// Representative palette item values — `crossLocaleKeywords` output ("<ko> <en>").
const ITEMS = [
  "개요 Overview",
  "커맨드 팔레트 Command Palette",
  "알림 Notifications",
  "버전 Versions",
  "오류 Errors",
];

describe("paletteFilter", () => {
  // The whole point of the composition: choseong search is *added* without
  // disturbing cmdk's own scoring — so ranking for real (non-choseong) queries
  // stays exactly what cmdk produced.
  it("returns cmdk's score verbatim for Latin queries", () => {
    for (const q of ["o", "over", "com", "version", "err", "xyz"]) {
      for (const v of ITEMS) {
        expect(paletteFilter(v, q)).toBe(defaultFilter(v, q));
      }
    }
  });

  it("returns cmdk's score verbatim for full-syllable Korean queries", () => {
    for (const q of ["알림", "버전", "로젝", "없는말"]) {
      for (const v of ITEMS) {
        expect(paletteFilter(v, q)).toBe(defaultFilter(v, q));
      }
    }
  });

  it("adds choseong hits that cmdk structurally misses", () => {
    // cmdk can't match bare jamo against syllables — it scores them 0.
    expect(defaultFilter("버전 Versions", "ㅂㅈ")).toBe(0);
    expect(paletteFilter("버전 Versions", "ㅂㅈ")).toBe(1);
    expect(paletteFilter("커맨드 팔레트 Command Palette", "ㅋㅁㄷ")).toBe(1);
  });

  it("never scores below cmdk (visible set is a superset)", () => {
    for (const q of ["o", "알림", "ㅂㅈ", "com", "ㅇㄹ"]) {
      for (const v of ITEMS) {
        expect(paletteFilter(v, q)).toBeGreaterThanOrEqual(defaultFilter(v, q));
      }
    }
  });
});
