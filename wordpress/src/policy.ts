// 誰でも管理画面に入れるデモなので、開かせない画面を Worker で断る。
// これは考え方を示す最小の例。自分のデモで何を断るかは、入れたプラグインと見せたい画面に合わせて決めること。
//   (1) ほかの人を締め出す操作  (2) プログラムや画面の中身を置く操作  (3) ファイルや設定を持ち出す操作
// 見せる画面が決まっているなら、「決めた画面だけ通して、ほかは全部断る」ほうが漏れにくい。

// 判定の抜け道を塞ぐ: %xx を戻し、/index.php を外し、// と .. をたたむ
export function normalize(pathname: string): string {
  let p = pathname;
  try { p = decodeURIComponent(p); } catch { /* 壊れた %xx はそのまま */ }
  p = p.replace(/\\/g, "/").replace(/^\/index\.php(?=\/)/i, "");
  const out: string[] = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") { out.pop(); continue; }
    out.push(seg);
  }
  return "/" + out.join("/");
}

const DENY: { re: RegExp; why: string }[] = [
  { re: /^\/wp-admin\/(profile|users|user-new|user-edit)\.php$/i, why: "ユーザーとパスワードの変更" },
  { re: /^\/wp-admin\/options(-[a-z]+)?\.php$/i, why: "サイトの設定" },
  { re: /^\/wp-admin\/(plugins|plugin-install|plugin-editor|themes|theme-install|theme-editor|update|update-core|site-editor|customize)\.php$/i, why: "プラグインとテーマの管理" },
  { re: /^\/wp-admin\/(export|import|site-health|tools)\.php$/i, why: "書き出しとツール" },
  { re: /^\/wp-admin\/install\.php$/i, why: "インストーラー" },
  { re: /^\/(xmlrpc|wp-cron|wp-config)\.php$/i, why: "この入口" },
  // 管理画面の外からも同じ操作ができる入口(REST API)
  { re: /^\/wp-json\/wp\/v2\/(users|settings|plugins|themes|templates|template-parts|global-styles)(\/|$)/i, why: "REST API での設定の変更" },
];

/** 断るなら理由を返す。通すなら null */
export function deny(url: URL): string | null {
  // REST API は /?rest_route=/wp/v2/… でも呼べる。同じ決まりで見る
  const rest = url.searchParams.get("rest_route");
  const paths = [normalize(url.pathname), ...(rest === null ? [] : [normalize("/wp-json/" + rest)])];
  if (paths[0] === "/wp-login.php" && !["", "login", "logout"].includes(url.searchParams.get("action") ?? "")) {
    return "パスワードの再発行";
  }
  for (const p of paths) {
    const hit = DENY.find((r) => r.re.test(p));
    if (hit) return hit.why;
  }
  return null;
}
