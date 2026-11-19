// 誰でも管理画面に入れるデモなので、開かせない画面を Worker で断る。
// これは考え方を示す最小の例。自分のデモで何を断るかは、入れたプラグインと見せたい画面に合わせて決めること。
//   (1) ほかの人を締め出す操作  (2) プログラムや画面の中身を置く操作  (3) ファイルや設定を持ち出す操作

// 判定の抜け道を塞ぐ: %xx を戻し、/index.php を外し、// と .. をたたむ
export function normalize(pathname: string): string {
  let p = pathname;
  try { p = decodeURIComponent(p); } catch { /* 壊れた %xx はそのまま */ }
  p = p.replace(/\\/g, "/").replace(/^\/index\.php(?=\/|$)/i, "");
  const out: string[] = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") { out.pop(); continue; }
    out.push(seg);
  }
  return "/" + out.join("/");
}

const DENY: { re: RegExp; why: string }[] = [
  { re: /^\/install(\/|\.php|$)/i, why: "インストーラー" },
  { re: /^\/admin\/change_password(\/|$)/i, why: "パスワードの変更" },
  { re: /^\/admin\/setting\/system(\/|$)/i, why: "システム設定(管理者・権限・セキュリティ)" },
  { re: /^\/admin\/store(\/|$)/i, why: "プラグインとテンプレートの管理" },
  { re: /^\/admin\/content\/(file_manager|page|block|css|js|layout)(\/|$)/i, why: "ファイルと画面の中身の編集" },
];

/** 断るなら理由を返す。通すなら null */
export function deny(pathname: string): string | null {
  const p = normalize(pathname);
  return DENY.find((r) => r.re.test(p))?.why ?? null;
}
