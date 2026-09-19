// scripts/archive.mjs
// 使い方: node scripts/archive.mjs "https://example.com/page"
//
// 指定されたURLを取得し、以下を記録する:
//   - URL
//   - 取得日時(UTC ISO8601)
//   - 保存したHTMLファイル(archives/配下)
//   - SHA-256ハッシュ(改ざん検証用)
//
// メタデータは archives/index.json に追記される。

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { createHash } from "crypto";

const url = process.argv[2];

if (!url) {
  console.error("エラー: URLを指定してください。");
  console.error('例: node scripts/archive.mjs "https://example.com"');
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(url);
} catch {
  console.error(`エラー: 不正なURLです: ${url}`);
  process.exit(1);
}

const now = new Date();
const fetchedAt = now.toISOString();

// ファイル名用のスラッグ (ホスト名+パスを安全な文字列に変換)
const rawSlug = (parsedUrl.hostname + parsedUrl.pathname)
  .replace(/[^a-zA-Z0-9._-]+/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 80);

const timestampForFile = fetchedAt.replace(/[:.]/g, "-");
const filename = `${timestampForFile}_${rawSlug || "page"}.html`;

mkdirSync("archives", { recursive: true });

console.log(`取得中: ${url}`);

const res = await fetch(url, {
  redirect: "follow",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; gyotaku-archiver/1.0; +https://github.com)",
  },
});

const html = await res.text();
const sha256 = createHash("sha256").update(html, "utf-8").digest("hex");

writeFileSync(`archives/${filename}`, html, "utf-8");

const indexPath = "archives/index.json";
let records = [];
if (existsSync(indexPath)) {
  try {
    records = JSON.parse(readFileSync(indexPath, "utf-8"));
  } catch {
    records = [];
  }
}

records.unshift({
  url,
  fetchedAt,
  file: filename,
  sha256,
  httpStatus: res.status,
  finalUrl: res.url !== url ? res.url : undefined,
  byteLength: Buffer.byteLength(html, "utf-8"),
});

writeFileSync(indexPath, JSON.stringify(records, null, 2) + "\n", "utf-8");

console.log("---");
console.log(`保存完了: archives/${filename}`);
console.log(`取得日時: ${fetchedAt}`);
console.log(`HTTPステータス: ${res.status}`);
console.log(`SHA-256: ${sha256}`);

if (!res.ok) {
  console.warn(
    `警告: HTTPステータスが${res.status}でした。取得内容がエラーページの可能性があります。`
  );
}
