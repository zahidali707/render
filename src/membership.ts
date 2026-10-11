import {
  DURATION_MONTHS,
  MEMBERSHIP_TYPE_MULTIPLIER,
  type MembershipDuration,
  type MembershipPrices,
  type MembershipType,
} from "./config";

export type MembershipStatus = "active" | "upcoming" | "expired";

export interface MembershipDatesInput {
  startDate: string;
  plan: MembershipDuration;
}

export function calculateMembershipFee(
  duration: MembershipDuration,
  type: MembershipType,
  prices: MembershipPrices,
): number {
  return Math.round(prices[duration] * MEMBERSHIP_TYPE_MULTIPLIER[type]);
}

export function getMembershipExpiryDate(
  startDate: string,
  plan: MembershipDuration,
): Date {
  const [year, month, day] = startDate.split("-").map(Number);
  const targetMonth = month - 1 + DURATION_MONTHS[plan];
  const firstOfTargetMonth = new Date(year, targetMonth, 1);
  const targetDay = Math.min(day, new Date(year, targetMonth + 1, 0).getDate());

  return new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth(),
    targetDay - 1,
  );
}

export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getMembershipStatus(
  member: MembershipDatesInput,
  today = new Date(),
): MembershipStatus {
  const currentDate = new Date(today);
  currentDate.setHours(0, 0, 0, 0);
  const startDate = new Date(`${member.startDate}T00:00:00`);
  const expiryDate = getMembershipExpiryDate(member.startDate, member.plan);

  if (currentDate < startDate) return "upcoming";
  if (currentDate > expiryDate) return "expired";
  return "active";
}

export function createMembershipId(
  existingIds: Iterable<string>,
  year = new Date().getFullYear(),
  createUuid = () =>
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random()}-${Math.random()}`,
): string {
  const knownIds = new Set(existingIds);
  let id: string;

  do {
    id = `FF-${year}-${createUuid().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  } while (knownIds.has(id));

  return id;
}
