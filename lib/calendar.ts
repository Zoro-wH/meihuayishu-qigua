import { Solar } from "lunar-javascript";
import type { CastingInput } from "./types";

const branches = "子丑寅卯辰巳午未申酉戌亥";

export type CalendarInfo = CastingInput & {
  solarLabel: string;
  lunarLabel: string;
  yearBranchName: string;
  hourBranchName: string;
  isLeapMonth: boolean;
};

function hourToBranch(hour: number): number {
  return (Math.floor((hour + 1) / 2) % 12) + 1;
}

function parseDateTimeLocal(value: string): [number, number, number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("请选择有效的起卦日期和时间");
  }
  return match.slice(1).map(Number) as [number, number, number, number, number];
}

export function deriveCalendarInfo(value: string): CalendarInfo {
  const [year, month, day, hour, minute] = parseDateTimeLocal(value);
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const yearInGanZhi = lunar.getYearInGanZhi();
  const yearBranchName = yearInGanZhi.slice(-1);
  const lunarMonth = Math.abs(lunar.getMonth());
  const lunarDay = lunar.getDay();
  const hourBranch = hourToBranch(hour);
  const hourBranchName = branches[hourBranch - 1];

  if (!yearBranchName || !branches.includes(yearBranchName) || lunarMonth < 1 || lunarMonth > 12) {
    throw new Error("无法从日期换算出有效的农历取数");
  }

  return {
    yearBranch: branches.indexOf(yearBranchName) + 1,
    lunarMonth,
    lunarDay,
    hourBranch,
    solarLabel: `${year}年${month}月${day}日 ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    lunarLabel: `${lunar.getYearInGanZhi()}年${lunarMonth}月${lunarDay}日 ${hourBranchName}时${lunar.getMonth() < 0 ? "（闰月）" : ""}`,
    yearBranchName,
    hourBranchName,
    isLeapMonth: lunar.getMonth() < 0,
  };
}

export function formatShanghaiDateTime(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}
