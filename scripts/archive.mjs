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

const rawHtml = await res.text();

// 保存後にドメインを移しても相対パス(CSS/JS/画像/リンク)が壊れないよう、
// <base href="..."> を挿入して基準URLを元サイトに固定する。
// これにより「保存データを開く」で見たときの見た目・リンク切れを大幅に減らせる。
const baseUrl = res.url || url; // リダイレクト後の最終URLを優先
const baseTag = `<base href="${baseUrl.replace(/"/g, "&quot;")}">`;

let html;
if (/<head[^>]*>/i.test(rawHtml)) {
  html = rawHtml.replace(/<head[^>]*>/i, (match) => `${match}\n${baseTag}`);
} else if (/<html[^>]*>/i.test(rawHtml)) {
  html = rawHtml.replace(/<html[^>]*>/i, (match) => `${match}\n<head>${baseTag}</head>`);
} else {
  html = `${baseTag}\n${rawHtml}`;
}

// ハッシュは実際に保存・公開する内容(baseタグ挿入後)に対して計算する。
// これにより「index.jsonのハッシュ」と「archives/配下の実ファイル」が常に一致し、
// 今後そのファイルが改ざんされていないかの検証に使える。
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
  otsFile: `${filename}.ots`, // OpenTimestamps証明ファイル(刻印に成功していれば存在する)
});

writeFileSync(indexPath, JSON.stringify(records, null, 2) + "\n", "utf-8");

console.log("---");
console.log(`保存完了: archives/${filename}`);
console.log(`取得日時: ${fetchedAt}`);
console.log(`HTTPステータス: ${res.status}`);
console.log(`SHA-256: ${sha256}`);

// GitHub Actionsの後続ステップ(OpenTimestamps刻印)に、生成したファイル名を渡す
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `filename=${filename}\n`, {
    flag: "a",
  });
}

if (!res.ok) {
  console.warn(
    `警告: HTTPステータスが${res.status}でした。取得内容がエラーページの可能性があります。`
  );
}
