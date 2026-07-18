import { describe, expect, it } from "vitest";

import { koreanMatch } from "../src/keywords";

// Palette item values are `crossLocaleKeywords` output — "<ko> <en>".
const PROJECT = "프로젝트 Project";
const NOTIFICATIONS = "알림 Notifications";
const ERRORS = "오류 Errors";
const SETTINGS = "설정 Settings";

describe("koreanMatch", () => {
  it("matches a full choseong query against Korean content", () => {
    expect(koreanMatch("ㅍㄹㅈㅌ", PROJECT)).toBe(true);
  });

  it("matches a partial choseong prefix", () => {
    expect(koreanMatch("ㅍㄹ", PROJECT)).toBe(true);
    expect(koreanMatch("ㅍㄹㅈ", PROJECT)).toBe(true);
  });

  it("respects choseong order (not just membership)", () => {
    expect(koreanMatch("ㅈㅍ", PROJECT)).toBe(false);
  });

  it("does not match when a choseong consonant is absent", () => {
    expect(koreanMatch("ㅅㅈ", PROJECT)).toBe(false);
  });

  it("ignores whitespace in a spaced choseong query", () => {
    expect(koreanMatch("ㅍㄹ ㅈㅌ", PROJECT)).toBe(true);
  });

  it("matches double-consonant choseong", () => {
    expect(koreanMatch("ㅃㄹ", "빠른 검색 Quick search")).toBe(true);
  });

  it("treats a committed Korean word as text, not fuzzy initials", () => {
    // "알림" and "오류" share the initials ㅇㄹ; a full-syllable query must not
    // collide across them the way a bare "ㅇㄹ" choseong query would.
    expect(koreanMatch("알림", NOTIFICATIONS)).toBe(true);
    expect(koreanMatch("알림", ERRORS)).toBe(false);
  });

  it("matches a bare shared-initials choseong query across both", () => {
    expect(koreanMatch("ㅇㄹ", NOTIFICATIONS)).toBe(true);
    expect(koreanMatch("ㅇㄹ", ERRORS)).toBe(true);
  });

  it("matches a Korean substring mid-word", () => {
    expect(koreanMatch("로젝", PROJECT)).toBe(true);
  });

  it("matches Latin content case-insensitively", () => {
    expect(koreanMatch("proj", PROJECT)).toBe(true);
    expect(koreanMatch("PROJECT", PROJECT)).toBe(true);
    expect(koreanMatch("set", SETTINGS)).toBe(true);
  });

  it("does not match an absent Latin query", () => {
    expect(koreanMatch("xyz", PROJECT)).toBe(false);
  });

  it("matches a mixed-locale value from either side", () => {
    expect(koreanMatch("ㅇㄹ", NOTIFICATIONS)).toBe(true);
    expect(koreanMatch("notif", NOTIFICATIONS)).toBe(true);
  });

  it("returns false for an empty or whitespace-only query", () => {
    expect(koreanMatch("", PROJECT)).toBe(false);
    expect(koreanMatch("   ", PROJECT)).toBe(false);
  });
});
