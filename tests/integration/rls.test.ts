import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";

const migrateUrl = process.env.DATABASE_URL_MIGRATE!;
const appUrl = process.env.DATABASE_URL_APP!;

const migrate = new Pool({ connectionString: migrateUrl, max: 2 });
const app = new Pool({ connectionString: appUrl, max: 4 });

const ids = {
  portland: "",
  seattle: "",
  alice: "rls-alice",
  bob: "rls-bob",
  carol: "rls-carol",
  mallory: "rls-mallory",
  aliceIpa: "",
  malloryStout: "",
};

async function asUser(client: PoolClient, userId: string, chapterId: string) {
  await client.query("select set_config('app.current_user_id', $1, true), set_config('app.current_chapter_id', $2, true)", [
    userId,
    chapterId,
  ]);
}

beforeAll(async () => {
  await migrate.query(`
    delete from recipe_shares where shared_by_user_id like 'rls-%' or shared_with_user_id like 'rls-%';
    delete from recipes where owner_id like 'rls-%';
    delete from users where id like 'rls-%';
  `);

  const chapters = await migrate.query<{ id: string; slug: string }>(
    "select id, slug from chapters where slug in ('portland', 'seattle')",
  );
  ids.portland = chapters.rows.find((c) => c.slug === "portland")?.id ?? "";
  ids.seattle = chapters.rows.find((c) => c.slug === "seattle")?.id ?? "";
  if (!ids.portland || !ids.seattle) {
    throw new Error("Seed chapters portland and seattle are required");
  }

  const now = new Date().toISOString();
  for (const [id, name, chapter] of [
    [ids.alice, "Alice", ids.portland],
    [ids.bob, "Bob", ids.portland],
    [ids.carol, "Carol", ids.portland],
    [ids.mallory, "Mallory", ids.seattle],
  ] as const) {
    await migrate.query(
      `insert into users (id, name, email, email_verified, chapter_id, terms_accepted_at, created_at, updated_at)
       values ($1, $2, $3, true, $4, $5, $5, $5)`,
      [id, name, `${id}@example.test`, chapter, now],
    );
  }

  const aliceRecipe = await migrate.query<{ id: string }>(
    `insert into recipes (chapter_id, owner_id, name, batch_size_liters, original_gravity, final_gravity)
     values ($1, $2, 'Alice IPA', 19, 1.060, 1.012) returning id`,
    [ids.portland, ids.alice],
  );
  ids.aliceIpa = aliceRecipe.rows[0]!.id;

  const malloryRecipe = await migrate.query<{ id: string }>(
    `insert into recipes (chapter_id, owner_id, name, batch_size_liters, original_gravity, final_gravity)
     values ($1, $2, 'Mallory Stout', 19, 1.070, 1.018) returning id`,
    [ids.seattle, ids.mallory],
  );
  ids.malloryStout = malloryRecipe.rows[0]!.id;
});

afterAll(async () => {
  await migrate.query(`
    delete from recipe_shares where shared_by_user_id like 'rls-%' or shared_with_user_id like 'rls-%';
    delete from recipes where owner_id like 'rls-%';
    delete from users where id like 'rls-%';
  `);
  await migrate.end();
  await app.end();
});

describe("role hardening", () => {
  it("brew_app cannot bypass RLS", async () => {
    const row = await app.query<{ rolbypassrls: boolean }>(
      "select rolbypassrls from pg_roles where rolname = current_user",
    );
    expect(row.rows[0]?.rolbypassrls).toBe(false);
  });

  it("tenant tables have RLS forced", async () => {
    const rows = await migrate.query<{ relname: string; relforcerowsecurity: boolean }>(
      `select c.relname, c.relforcerowsecurity
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname in ('chapters','users','recipes','recipe_shares','audit_log')`,
    );
    expect(rows.rows).toHaveLength(5);
    expect(rows.rows.every((r) => r.relforcerowsecurity)).toBe(true);
  });
});

describe("fail closed", () => {
  it("returns no recipes without tenant context", async () => {
    const rows = await app.query("select id from recipes");
    expect(rows.rowCount).toBe(0);
  });
});

describe("cross-chapter isolation", () => {
  it("Alice cannot read Mallory's recipe", async () => {
    const client = await app.connect();
    try {
      await client.query("begin");
      await asUser(client, ids.alice, ids.portland);
      const rows = await client.query("select id from recipes where id = $1", [ids.malloryStout]);
      expect(rows.rowCount).toBe(0);
      await client.query("rollback");
    } finally {
      client.release();
    }
  });

  it("Alice cannot insert into Seattle", async () => {
    const client = await app.connect();
    try {
      await client.query("begin");
      await asUser(client, ids.alice, ids.portland);
      await expect(
        client.query(
          `insert into recipes (chapter_id, owner_id, name, batch_size_liters)
           values ($1, $2, 'Forged', 19)`,
          [ids.seattle, ids.alice],
        ),
      ).rejects.toThrow(/row-level security/);
      await client.query("rollback");
    } finally {
      client.release();
    }
  });
});

describe("sharing", () => {
  it("Bob can read Alice's IPA after she shares it", async () => {
    const alice = await app.connect();
    const bob = await app.connect();
    try {
      await alice.query("begin");
      await asUser(alice, ids.alice, ids.portland);
      await alice.query(
        `insert into recipe_shares (recipe_id, chapter_id, shared_by_user_id, shared_with_user_id)
         values ($1, $2, $3, $4)`,
        [ids.aliceIpa, ids.portland, ids.alice, ids.bob],
      );
      await alice.query("commit");

      await bob.query("begin");
      await asUser(bob, ids.bob, ids.portland);
      const rows = await bob.query("select name from recipes where id = $1", [ids.aliceIpa]);
      expect(rows.rows[0]?.name).toBe("Alice IPA");
      await bob.query("rollback");
    } finally {
      alice.release();
      bob.release();
    }
  });

  it("Alice cannot share with Mallory in another chapter", async () => {
    const client = await app.connect();
    try {
      await client.query("begin");
      await asUser(client, ids.alice, ids.portland);
      await expect(
        client.query(
          `insert into recipe_shares (recipe_id, chapter_id, shared_by_user_id, shared_with_user_id)
           values ($1, $2, $3, $4)`,
          [ids.aliceIpa, ids.portland, ids.alice, ids.mallory],
        ),
      ).rejects.toThrow(/row-level security/);
      await client.query("rollback");
    } finally {
      client.release();
    }
  });

  it("Bob cannot edit a shared recipe", async () => {
    const client = await app.connect();
    try {
      await client.query("begin");
      await asUser(client, ids.bob, ids.portland);
      const updated = await client.query("update recipes set name = 'Hijacked' where id = $1", [ids.aliceIpa]);
      expect(updated.rowCount).toBe(0);
      await client.query("rollback");
    } finally {
      client.release();
    }
  });
});

describe("credential tables", () => {
  it("brew_app cannot read sessions", async () => {
    await expect(app.query("select * from sessions")).rejects.toThrow();
  });
});
