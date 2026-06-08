import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import { seedPgliteArticles } from "../src/server/db/pglite-seed";

const dataDir = path.join(process.cwd(), process.env.DATABASE_PATH ?? ".local/seo-pglite");
const client = new PGlite(dataDir);

const seeded = await seedPgliteArticles(client);
if (seeded > 0) console.log(`✓ Seeded ${seeded} articles`);
else console.log("Skip seed — articles already exist");

await client.close();
