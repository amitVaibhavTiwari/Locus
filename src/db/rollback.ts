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

  const { error, results } = await migrator.migrateDown();

  results?.forEach((result: { migrationName: string; status: string }) => {
    if (result.status === "Success") {
      console.log(`✓ Rolled back: ${result.migrationName}`);
    } else if (result.status === "Error") {
      console.error(`✗ Rollback failed: ${result.migrationName}`);
    }
  });

  if (!results?.length) {
    console.log("Nothing to roll back");
  }

  if (error) {
    console.error("\nRollback error:", error);
    await db.destroy();
    process.exit(1);
  }

  console.log("\nRollback complete");
  await db.destroy();
}

main();
