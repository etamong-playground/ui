import { describe, expect, it } from "vitest";

import {
  isInAppBrowser,
  inAppBreakout,
  INAPP_BROWSER_UA_SUBSTRINGS,
} from "../src/inAppBreakout";

const IN_APP: Record<string, string> = {
  KakaoTalk:
    "Mozilla/5.0 (Linux; Android 13; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 KAKAOTALK 10.5.0",
  Instagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 300.0.0.0",
  Facebook:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/450.0.0]",
  LINE: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 Line/13.4.0",
  Naver: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 NAVER(inapp; search; 1200; 12.3.5)",
  Band: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Mobile Safari/537.36 BAND/13.0.0",
};

const REAL_BROWSER: Record<string, string> = {
  "Chrome mobile":
    "Mozilla/5.0 (Linux; Android 13; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "SFSafariViewController":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Samsung Internet":
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
  Whale: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Whale/3.21 Mobile Safari/537.36",
  // "streamline/" must NOT match the " line/" needle.
  "streamline word": "SomeApp streamline/1.0 Safari/537.36",
};

describe("isInAppBrowser", () => {
  it.each(Object.entries(IN_APP))("matches %s", (_name, ua) => {
    expect(isInAppBrowser(ua)).toBe(true);
  });

  it.each(Object.entries(REAL_BROWSER))("does not match %s", (_name, ua) => {
    expect(isInAppBrowser(ua)).toBe(false);
  });

  it("is false for empty / missing UA", () => {
    expect(isInAppBrowser("")).toBe(false);
  });

  it("every whitelisted needle is itself detected", () => {
    for (const needle of INAPP_BROWSER_UA_SUBSTRINGS) {
      expect(isInAppBrowser(`prefix ${needle} suffix`)).toBe(true);
    }
  });
});

describe("inAppBreakout", () => {
  it("returns not-in-app for a normal browser UA (jsdom default)", () => {
    // jsdom's navigator.userAgent is a plain non-in-app UA, so no redirect.
    expect(inAppBreakout("https://x.m.etamong.com/auth/login")).toBe(
      "not-in-app",
    );
  });
});
