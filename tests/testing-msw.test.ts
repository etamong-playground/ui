import { describe, it, expect } from "vitest";
import {
  createMeHandler,
  createMeSignedOutHandler,
  defaultMockHandlers,
  httperrBody,
  mockHttperrRef,
} from "../src/testing-msw";

describe("mockHttperrRef", () => {
  it("returns an 8-char lowercase hex string", () => {
    for (let i = 0; i < 50; i++) {
      const r = mockHttperrRef();
      expect(r).toMatch(/^[0-9a-f]{8}$/);
    }
  });
});

describe("httperrBody", () => {
  it("matches the {error, ref} shape", () => {
    const body = httperrBody("nope");
    expect(body.error).toBe("nope");
    expect(body.ref).toMatch(/^[0-9a-f]{8}$/);
  });
  it("uses a caller-supplied ref when given", () => {
    expect(httperrBody("nope", "deadbeef").ref).toBe("deadbeef");
  });
});

describe("createMeHandler / createMeSignedOutHandler / defaultMockHandlers", () => {
  it("createMeHandler defaults to a signed-in user at /api/v1/me", () => {
    const h = createMeHandler();
    expect(h.info.method).toBe("GET");
    expect(String(h.info.path)).toContain("/api/v1/me");
  });
  it("createMeHandler accepts a custom path", () => {
    const h = createMeHandler({}, "/custom/me");
    expect(String(h.info.path)).toContain("/custom/me");
  });
  it("createMeSignedOutHandler returns a handler at the same default path", () => {
    const h = createMeSignedOutHandler();
    expect(h.info.method).toBe("GET");
  });
  it("defaultMockHandlers bundles /me + /healthz", () => {
    const list = defaultMockHandlers();
    expect(list).toHaveLength(2);
    expect(String(list[0].info.path)).toContain("/api/v1/me");
    expect(String(list[1].info.path)).toContain("/healthz");
  });
});
