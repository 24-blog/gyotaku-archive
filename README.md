[![License](https://img.shields.io/github/license/24-blog/childhood-gender-bias)](LICENSE)


# 魚拓アーカイブシステム

Webページの URL・取得日時・保存データ(HTML)・SHA-256ハッシュ を記録するアーカイブシステムです。

## 使い方

1. このリポジトリをGitHubにpushし、GitHub Pagesを有効化する(Settings → Pages → Branch: main / root)。

| File name | 
|---|
| `.github/workflows/gyotaku.yml` | 
| `scripts/archive.mjs` | 
| `archives/index.json` | 
| `index.html` | 
| `README.md` | 

2. アーカイブしたいときは、GitHubリポジトリの **Actions** タブ → **魚拓 (Web Archive)** → **Run workflow** を開き、
   `url` にアーカイブしたいページのURLを入力して実行する。
3. 実行が完了すると:
   - `archives/` 配下に取得したHTMLがそのまま保存される
   - `archives/index.json` に以下のメタデータが追記される
     - `url`: 取得元URL
     - `fetchedAt`: 取得日時(UTC, ISO8601)
     - `file`: 保存したHTMLファイル名
     - `sha256`: 保存データのSHA-256ハッシュ(改ざん検証用)
     - `httpStatus`: 取得時のHTTPステータスコード
     - `byteLength`: 保存データのバイト数
4. GitHub Pagesの `index.html` にアクセスすると、記録した魚拓の一覧が表示される。

## ハッシュの検証方法

保存されたHTMLファイルが改ざんされていないかは、ローカルで以下のように確認できる。

```
shasum -a 256 archives/<ファイル名>.html
```

`archives/index.json` に記録された `sha256` の値と一致すれば、取得時点のデータと同一であることが確認できる。

## ローカルで直接実行する場合

GitHub Actionsを使わず、手元で実行することも可能(Node.js 18以上が必要)。

```
node scripts/archive.mjs "https://example.com/page"
```

## 今後の拡張案

- スクリーンショット(headless browser)の追加保存
- 定期実行(cron)による自動巡回アーカイブ
- 一覧ページへの検索・タグ絞り込み機能
