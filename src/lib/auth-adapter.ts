import type { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";
import type { Kysely } from "kysely";
import type { Database } from "@/db/types";
import { randomUUID } from "crypto";

function toAdapterUser(user: {
  id: string;
  email: string;
  username: string;
  email_verified_at: string | null;
  avatar_url: string | null;
}): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    name: user.username,
    emailVerified: user.email_verified_at
      ? new Date(user.email_verified_at)
      : null,
    image: user.avatar_url ?? null,
  };
}

export function createKyselyAdapter(db: Kysely<Database>): Adapter {
  return {
    async createUser(user) {
      const id = randomUUID();
      const now = new Date().toISOString();

      await db
        .insertInto("users")
        .values({
          id,
          email: user.email,
          username: user.name ?? user.email.split("@")[0],
          password_hash: null,
          avatar_url: user.image ?? null,
          email_verified_at: user.emailVerified
            ? user.emailVerified.toISOString()
            : null,
          created_at: now,
          updated_at: now,
        })
        .execute();

      await db
        .insertInto("user_preferences")
        .values({
          id: randomUUID(),
          user_id: id,
          pinned_project_ids: "[]",
          active_organization_id: null,
          updated_at: now,
        })
        .execute();

      return {
        id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        image: user.image,
      };
    },

    async getUser(id) {
      const user = await db
        .selectFrom("users")
        .where("id", "=", id)
        .selectAll()
        .executeTakeFirst();
      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email) {
      const user = await db
        .selectFrom("users")
        .where("email", "=", email)
        .selectAll()
        .executeTakeFirst();
      return user ? toAdapterUser(user) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await db
        .selectFrom("accounts")
        .where("provider", "=", provider)
        .where("provider_account_id", "=", providerAccountId)
        .select("user_id")
        .executeTakeFirst();

      if (!account) return null;

      const user = await db
        .selectFrom("users")
        .where("id", "=", account.user_id)
        .selectAll()
        .executeTakeFirst();
      return user ? toAdapterUser(user) : null;
    },

    async linkAccount(account) {
      await db
        .insertInto("accounts")
        .values({
          id: randomUUID(),
          user_id: account.userId,
          type: account.type,
          provider: account.provider,
          provider_account_id: account.providerAccountId,
          refresh_token: account.refresh_token ?? null,
          access_token: account.access_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state:
            typeof account.session_state === "string"
              ? account.session_state
              : null,
        })
        .execute();
      return account as AdapterAccount;
    },

    async updateUser(user) {
      await db
        .updateTable("users")
        .set({
          email: user.email,
          username: user.name ?? undefined,
          avatar_url: user.image ?? null,
          email_verified_at: user.emailVerified
            ? user.emailVerified.toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .where("id", "=", user.id!)
        .execute();
      return user as AdapterUser;
    },
  };
}
