import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/../drizzle/schema";

// グローバルスコープに型付けされたdrizzleインスタンスを保持するための変数を宣言
declare global {
  // eslint-disable-next-line no-var
  var db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

let db: ReturnType<typeof drizzle<typeof schema>>;

// process.env.NODE_ENV をチェックして、本番環境でのみシングルトンを有効にする
if (process.env.NODE_ENV === "production") {
  if (!global.db) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    global.db = drizzle(pool, { schema });
  }
  db = global.db;
} else {
  // 開発環境では、ホットリロードのたびに新しい接続を作成する
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { db };
