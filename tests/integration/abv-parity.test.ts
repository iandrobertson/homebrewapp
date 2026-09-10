import { describe, expect, it } from "vitest";
import { Pool } from "pg";
import { calcAbv } from "@/lib/brewing/abv";

const pairs: Array<[number, number]> = [
  [1.04, 1.01],
  [1.05, 1.01],
  [1.055, 1.012],
  [1.06, 1.012],
  [1.07, 1.015],
  [1.09, 1.02],
  [1.12, 1.03],
];

describe("ABV SQL/TS parity", () => {
  it("matches the generated column for a table of gravities", async () => {
    const url = process.env.DATABASE_URL_MIGRATE;
    if (!url) throw new Error("DATABASE_URL_MIGRATE is not set");

    const pool = new Pool({ connectionString: url, max: 1 });
    try {
      for (const [og, fg] of pairs) {
        const sql = await pool.query<{ abv: string | null }>(
          `select round((( $1::numeric - $2::numeric ) * 131.25)::numeric, 2) as abv`,
          [og, fg],
        );
        const dbValue = sql.rows[0]?.abv == null ? null : Number(sql.rows[0].abv);
        expect(calcAbv(og, fg)).toBe(dbValue);
      }
    } finally {
      await pool.end();
    }
  });
});
