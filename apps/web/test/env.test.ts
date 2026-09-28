import { describe, expect, it } from "vitest";
import { parseServerEnv } from "../src/env";

describe("server env", () => {
  it("defaults API_URL locally and rejects a bad URL", () => {
    expect(parseServerEnv({}).API_URL).toBe("http://localhost:4000");
    expect(() => parseServerEnv({ API_URL: "not a url" })).toThrow();
  });
});
