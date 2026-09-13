/**
 * Daily reward job — apply Mon–Fri trading credits (2× cap → Trading wallet)
 * and network credits (3× cap → Network wallet, 24/7).
 *
 * Usage:
 *   npm run rewards:daily
 *   npm run rewards:daily -- --date=2026-09-11
 *
 * Calendar is evaluated in Asia/Dubai (see config/rewards.ts → rewardsClock).
 * Idempotent per user / type / periodKey — safe to re-run.
 */

import { resolveJobDate, runDailyRewardJob } from "../lib/rewards";

function readDateFlag() {
  const raw = process.argv.slice(2).find((arg) => arg.startsWith("--date="));
  return raw ? raw.slice("--date=".length) : null;
}

async function main() {
  const date = resolveJobDate(readDateFlag());
  const result = await runDailyRewardJob({ date });
  console.log("Whealth Grid daily rewards");
  console.log(`  timezone     ${result.timezone}`);
  console.log(`  date         ${result.dateKey}${result.tradingDay ? "" : " (weekend — trading skipped)"}`);
  console.log(`  trading $    ${result.tradingCredits.toFixed(4)}`);
  console.log(`  network $    ${result.networkCredits.toFixed(4)}`);
  console.log(`  users        ${result.usersTouched}`);
  console.log(`  skipped cap  ${result.skippedCap}`);
  console.log(`  skipped dup  ${result.skippedDuplicate}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
