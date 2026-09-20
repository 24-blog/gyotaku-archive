[![License](https://img.shields.io/github/license/24-blog/childhood-gender-bias)](LICENSE)
![Timestamp](https://img.shields.io/badge/Timestamps-2088FF?style=plastic&logo=github&logoColor=white)


## 目次

- [魚拓Archiveシステム](#魚拓archiveシステム)
- [使い方](#使い方)
- [ハッシュの検証方法](#ハッシュの検証方法)
- [OpenTimestampsによる第三者タイムスタンプ](#opentimestampsによる第三者タイムスタンプ)
- [ローカルで直接実行する場合](#ローカルで直接実行する場合)
- [今後の拡張案](#今後の拡張案)
- [📜 Legal and Ethical Notice](#-legal-and-ethical-notice)
  - [Purpose of This Repository](#purpose-of-this-repository)
  - [Copyright Acknowledgment](#copyright-acknowledgment)
  - [Takedown Requests](#takedown-requests)
  - [Disclaimer](#disclaimer)


## 魚拓Archiveシステム

WebページのURL・取得日時・保存データ(HTML)・SHA-256ハッシュを記録するアーカイブシステムです。

## 使い方

1. このリポジトリをGitHubにpushし、GitHub Pagesを有効化する。(Settings → Pages → Branch: main / root)

2.  `ots-upgrade.yml` を `.github/workflows/` フォルダ内に追加。

| File name | 
|---|
| `.github/workflows/gyotaku.yml` | 
| `scripts/archive.mjs` | 
| `archives/index.json` | 
| `.nojekyll` |
| `index.html` | 
| `ots-upgrade.yml` |

<p align="center">
  <img src="pc_view.jpg" width="">
</p>

3. アーカイブしたいときは、GitHubリポジトリの **Actions** タブ → **魚拓 (Web Archive)** → **Run workflow** を開き、
   `url` にアーカイブしたいページのURLを入力して実行する。
   
4. 実行が完了すると:
   - `archives/` 配下に取得したHTMLがそのまま保存される。
   - `archives/index.json` に以下のメタデータが追記される。
     - `url`: 取得元URL
     - `fetchedAt`: 取得日時(UTC, ISO8601)
     - `file`: 保存したHTMLファイル名
     - `sha256`: 保存データのSHA-256ハッシュ(改ざん検証用)
     - `httpStatus`: 取得時のHTTPステータスコード
     - `byteLength`: 保存データのバイト数

5. GitHub Pagesの `index.html` にアクセスすると、記録した魚拓の一覧が表示される。

## ハッシュの検証方法

保存されたHTMLファイルが改ざんされていないかは、ローカルで以下のように確認できる。

```
shasum -a 256 archives/<ファイル名>.html
```

`archives/index.json` に記録された `sha256` の値と一致すれば取得時点のデータと同一であることが確認できる。

## OpenTimestampsによる第三者タイムスタンプ

`archives/index.json` の `fetchedAt` は、Actions内のスクリプト自身が記録した「自己申告」の時刻であり、リポジトリの書き込み権限があれば理論上書き換え可能。これを補強するため[OpenTimestamps](https://opentimestamps.org/)を使いBitcoinブロックチェーンを使った第三者証明を各アーカイブに付与している。

- アーカイブ実行時、自動的に `archives/<ファイル名>.html.ots` という証明ファイルが生成される。
- 生成直後は「保留中(pending)」の状態。ハッシュがBitcoinブロックへ実際に取り込まれるまで数時間〜1日程度かかる。
- 別ワークフロー(`ots-upgrade.yml`)が毎日自動実行され、保留中の証明を確定状態にアップグレードする。
- **Actions** タブ → **Timestamps確定チェック** から手動による強制実行可能。

**確定した証明を検証する方法(要: opentimestamps-clientのインストール):**

```
pip install opentimestamps-client
ots verify archives/<ファイル名>.html.ots
```

成功すると、「このファイルのハッシュ値がこの日時以前にBitcoinブロック番号◯◯◯に存在していた」ことをAnthropicやGitHubのいずれにも依存せずBitcoinネットワーク自体によって検証できる。

## ローカルで直接実行する場合

GitHub Actionsを使わず、手元で実行することも可能。(Node.js 18以上が必要)

```
node scripts/archive.mjs "https://example.com/page"
```

## 今後の拡張案

- スクリーンショット(headless browser)の追加保存
- 定期実行(cron)による自動巡回アーカイブ
- 一覧ページの検索・タグ絞り込み機能


## 📜 Legal and Ethical Notice

### Purpose of This Repository

This repository contains archived copies of publicly accessible web pages ("web fishprints"). These archives are created and maintained **exclusively for the following public-interest purposes**:

1. **Verifiability of citations**: Ensuring that sources cited in critical commentary, fact-checking, or academic discussion can be independently verified.
2. **Preservation of public discourse**: Preventing the loss of evidence when original pages are deleted, whether intentionally or accidentally.
3. **Non-commercial research**: Supporting scholarly and journalistic research into the evolution of online information.

### Copyright Acknowledgment

We acknowledge that:

- The archived content remains the property of its respective copyright holders.
- This repository does not claim ownership over any third-party content.
- The archives are made available under a good-faith belief that this use qualifies as fair use (U.S.) / fair dealing (other jurisdictions) for purposes of criticism, commentary, news reporting, teaching, scholarship, and research.

### Takedown Requests

If you are a copyright holder and believe that specific content in this repository infringes your rights:

1. **Please contact us first** at [https://forms.gle/24blog](https://docs.google.com/forms/d/e/1FAIpQLSdXV4cZdQdfSzytiWLUNCQvRCg_KgM-53nWvkWb8MZu5y3ATA/viewform) with details of the content in question.
2. We will review your request promptly and, where appropriate, remove the content voluntarily.
3. We ask that you allow us a reasonable opportunity to respond before filing a formal DMCA notice with GitHub.

We are committed to resolving any concerns in good faith and minimizing any potential harm to rights holders while preserving the integrity of public discourse.

### Disclaimer

This repository is provided "as is" for educational and archival purposes only. We make no warranties regarding the accuracy, completeness, or legality of the archived content. Users are responsible for their own use of this material.


⚠️COPYRIGHT<br>
Textual commentary written by the repository owner is
licensed under CC BY-NC-ND 4.0.
