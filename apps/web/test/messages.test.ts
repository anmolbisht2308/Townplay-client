import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import hi from "../messages/hi.json";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keys(v as object, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("messages", () => {
  it("has the same keys in English and Hindi", () => {
    expect(keys(hi).sort()).toEqual(keys(en).sort());
  });

  it("has no empty strings", () => {
    for (const m of [en, hi]) {
      expect(JSON.stringify(m)).not.toMatch(/:""/);
    }
  });
});
