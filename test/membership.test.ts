import { describe, expect, it } from "vitest";
import { DEFAULT_PRICES } from "../src/config";
import {
  calculateMembershipFee,
  createMembershipId,
  getMembershipExpiryDate,
  getMembershipStatus,
  toLocalDateString,
} from "../src/membership";

describe("calculateMembershipFee", () => {
  it("applies the selected membership type multiplier", () => {
    expect(calculateMembershipFee("Monthly", "Basic", DEFAULT_PRICES)).toBe(1800);
    expect(calculateMembershipFee("Monthly", "Standard", DEFAULT_PRICES)).toBe(2160);
    expect(calculateMembershipFee("Monthly", "Premium", DEFAULT_PRICES)).toBe(2700);
  });

  it("rounds fees to whole rupees", () => {
    const prices = { ...DEFAULT_PRICES, Monthly: 1001 };
    expect(calculateMembershipFee("Monthly", "Standard", prices)).toBe(1201);
  });
});

describe("getMembershipExpiryDate", () => {
  it("ends the membership on the day before the next period", () => {
    expect(toLocalDateString(getMembershipExpiryDate("2026-10-11", "Monthly"))).toBe(
      "2026-11-10",
    );
    expect(toLocalDateString(getMembershipExpiryDate("2026-10-11", "Quarterly"))).toBe(
      "2027-01-10",
    );
  });

  it("clamps dates at the end of shorter months", () => {
    expect(toLocalDateString(getMembershipExpiryDate("2025-01-31", "Monthly"))).toBe(
      "2025-02-27",
    );
  });

  it("handles leap years", () => {
    expect(toLocalDateString(getMembershipExpiryDate("2024-01-31", "Monthly"))).toBe(
      "2024-02-28",
    );
  });
});

describe("getMembershipStatus", () => {
  it("distinguishes upcoming, active, and expired memberships", () => {
    expect(
      getMembershipStatus({ startDate: "2026-10-12", plan: "Monthly" }, new Date(2026, 9, 11)),
    ).toBe("upcoming");
    expect(
      getMembershipStatus({ startDate: "2026-10-11", plan: "Monthly" }, new Date(2026, 9, 11)),
    ).toBe("active");
    expect(
      getMembershipStatus({ startDate: "2026-09-01", plan: "Monthly" }, new Date(2026, 9, 11)),
    ).toBe("expired");
  });
});

describe("createMembershipId", () => {
  it("creates a unique, formatted membership ID", () => {
    const values = ["abcdef-01", "123456-78"];
    const id = createMembershipId(["FF-2026-ABCDEF01"], 2026, () => values.shift()!);
    expect(id).toBe("FF-2026-12345678");
  });
});
