export const ADMIN_PIN = "2468";

export const STORAGE_KEYS = {
  members: "forgeFitness.members.v1",
  prices: "forgeFitness.prices.v1",
  admin: "forgeFitness.adminUnlocked.v1",
} as const;

export const DEFAULT_PRICES: MembershipPrices = {
  Monthly: 1800,
  Quarterly: 4800,
  "Half-Yearly": 9000,
  Yearly: 16800,
};

export const DURATION_MONTHS = {
  Monthly: 1,
  Quarterly: 3,
  "Half-Yearly": 6,
  Yearly: 12,
} as const;

export type MembershipDuration = keyof typeof DURATION_MONTHS;
export type MembershipType = "Basic" | "Standard" | "Premium";
export type MembershipPrices = Record<MembershipDuration, number>;

export const PLAN_INFO: Record<
  MembershipType,
  { description: string; features: string[] }
> = {
  Basic: {
    description: "The essentials to build your routine.",
    features: [
      "Full gym floor access",
      "Strength & cardio equipment",
      "Changing rooms & lockers",
    ],
  },
  Standard: {
    description: "More coaching. More ways to move.",
    features: [
      "Everything in Basic",
      "Group workout classes",
      "Fitness assessments",
    ],
  },
  Premium: {
    description: "A little extra for the big goals.",
    features: [
      "Everything in Standard",
      "Personal training options",
      "Priority class booking",
    ],
  },
};

export const MEMBERSHIP_TYPE_MULTIPLIER: Record<MembershipType, number> = {
  Basic: 1,
  Standard: 1.2,
  Premium: 1.5,
};
