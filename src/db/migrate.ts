import { FileMigrationProvider, Migrator } from "kysely/migration";
import * as fs from "fs/promises";
import * as path from "path";
import { pathToFileURL } from "url";
import { db } from "@/lib/db";

async function main() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(process.cwd(), "src/db/migrations"),
      import: (filePath) => import(pathToFileURL(filePath).href),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result: { migrationName: string; status: string }) => {
    if (result.status === "Success") {
      console.log(`✓ ${result.migrationName}`);
    } else if (result.status === "Error") {
      console.error(`✗ ${result.migrationName} — failed`);
    }
  });

  if (!results?.length) {
    console.log("Nothing to migrate — already up to date");
  }

  if (error) {
    console.error("\nMigration error:", error);
    await db.destroy();
    process.exit(1);
  }

  console.log("\nMigrations complete");
  await db.destroy();
}

main();
