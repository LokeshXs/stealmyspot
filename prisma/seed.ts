/**
 * The board ships empty on purpose — the first bid opens at $1.
 *
 * Wired up so there's somewhere obvious to add fixtures later. To exercise
 * pagination locally, use `pnpm tsx scripts/seed-demo.ts` instead, which is
 * explicitly a dev-only tool and is never run by `prisma db seed`.
 */
async function main() {
  console.log("Seed: nothing to insert — the board starts empty.");
}

main();
