# 毎朝リセットされるデモサイト(Cloudflare Containers)

EC-CUBE と WordPress のデモサイトを、Cloudflare Containers で動かす最小の見本です。管理画面に誰でも入れて、毎朝 4:00 に初期状態へ戻ります。

- `eccube/` EC-CUBE 4.3
- `wordpress/` WordPress(日本語版)

どちらも同じ作りです。片方だけ使えます。

## リセットの仕組み

1. インストールは、イメージを作る時に済ませる(`docker/install.sh`)。データベースは SQLite で、イメージの中に入る
2. コンテナは書き込みを保存しない。止まって起き直すと、イメージを作った時の状態に戻る
3. 毎朝、Worker の cron がコンテナを壊す(`src/index.ts` の `scheduled`)。次に誰かが開いたとき、初期状態から起きる

リセットのためのコードは `destroy()` の 1 行だけです。データベースを戻すスクリプトも、バックアップもありません。

## 動かす

要るもの: Cloudflare の Workers Paid プラン(Containers に必要)、手元の Docker、Node.js。

```sh
cd eccube            # または cd wordpress
npm install
sh scripts/fetch.sh  # 公式の配布物を取り、チェックサムで確かめる
npx wrangler deploy  # 手元でイメージを作り、Cloudflare に上げる
```

`https://<名前>.<アカウント>.workers.dev` で開きます。最初の 1 回と、30 分使われなかったあとは、起きるまで数秒かかります。デプロイの直後は、コンテナの用意ができるまで 1 分ほど 404 や「起こしています」の画面になります。

cron が動き始めるまで、デプロイから 10 分ほどかかりました。リセットをすぐ試したいときは、`crons` を一時的に `* * * * *` にして待ちます。

| | 管理画面 | ログイン |
|---|---|---|
| EC-CUBE | `/admin/` | `admin` / `password` |
| WordPress | `/wp-admin/` | `demo` / `demo-password` |

手元で確かめるだけなら `docker build -t demo . && docker run --rm -p 8080:80 demo` で動きます(Worker は通りません)。

## 自分のデモにする

- 見せたいプラグインや見本のデータは、`docker/install.sh`(WordPress は `docker/install.php` も)で入れる。イメージに入れたものが初期状態になる
- 独自ドメインで出すときは、`wrangler.jsonc` の `routes` を足す。アプリが受け付けるホスト名にも同じ名前を足す。EC-CUBE は `Dockerfile` の `TRUSTED_HOSTS`、WordPress は `docker/wp-config.php` の `$demo_hosts`
- リセットの時刻は `wrangler.jsonc` の `crons`(UTC)

## 開かせない画面は、自分で決める

管理画面に誰でも入れるので、パスワードの変更やファイルの書き換えを Worker で断っています(`src/policy.ts`)。

この一覧は考え方を示す例で、網羅していません。公開する前に、自分のデモで押されたら困る操作を洗い出して足してください。見せる画面が決まっているなら、決めた画面だけ通して残りを全部断るほうが漏れにくいです。

リセットは 1 日 1 回なので、いたずらされると翌朝まで残ります。困るなら cron の回数を増やすか、`sleepAfter` を短くします。

## ハマったところ

- Apache を 1 番目のプロセスにしない(`docker/start.sh`)。`php:*-apache` の止める合図は SIGWINCH で、Cloudflare のコンテナでは起きてすぐ止まることがあった
- WordPress は「起きてる?」に軽く返す(`docker/wp-config.php`)。コンテナの生存確認はホスト名 `ping` で届く。そのままだと 1 回ごとにトップページを作る
- https で来たことを伝える(`src/index.ts`)。コンテナには http で届くので、伝えないとリダイレクトの先が http になる
- `max_instances` は 2。デプロイでイメージを入れ替えるあいだ、古いほうと新しいほうが重なる

経緯と費用は Zenn の記事に書きました: [毎朝リセットされる EC-CUBEとWordPress のデモサイトを Cloudflare Containers で作る](https://zenn.dev/nobuhiko/articles/cloudflare-containers-eccube-wordpress-demo)

## ライセンス

MIT。EC-CUBE と WordPress は、それぞれのライセンスに従います(このリポジトリには入っていません。`scripts/fetch.sh` が公式から取ります)。

作っている人: [うみうしラボ](https://umiushi-lab.com/)
