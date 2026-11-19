// EC-CUBE のデモの入口。
// 1. 開かせない画面を断る(src/policy.ts)
// 2. 1 つしかないコンテナに渡す。https で来たことを伝える
// 3. 毎日 4:00(日本時間)にコンテナを壊す = 初期状態に戻す
import { Container, getContainer } from "@cloudflare/containers";
import { deny } from "./policy";

export class Shop extends Container {
  defaultPort = 80;
  // 30 分だれも来なければ止まる。止まったお店は、次に起きたとき初期状態に戻っている
  sleepAfter = "30m";
}

interface Env {
  SHOP: DurableObjectNamespace<Shop>;
}

// 毎回同じ名前を渡すと、全員が同じ 1 つのコンテナにつながる
const SHOP_NAME = "demo";

const page = (status: number, title: string, body: string) =>
  new Response(
    `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>` +
      `<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.8"><h1 style="font-size:1.4rem">${title}</h1>${body}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow", "cache-control": "no-store" } },
  );

const waking = () =>
  page(503, "お店を起こしています", `<p>数秒たつと、自動で開き直します。</p><script>setTimeout(()=>location.reload(),5000)</script>`);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const why = deny(url.pathname);
    if (why) return page(403, "デモでは開けない画面です", `<p>「${why}」は、みんなで使うデモを守るため、開けないようにしています。</p>`);

    // コンテナの中の Apache には http で届く。https で来たことを伝えないと、リダイレクトやフォームの送り先が http になる
    // (EC-CUBE 側は .env の TRUSTED_PROXIES=REMOTE_ADDR で、このヘッダーを信じる)
    const fwd = new Request(request);
    const https = url.protocol === "https:";
    fwd.headers.set("x-forwarded-proto", https ? "https" : "http");
    fwd.headers.set("x-forwarded-port", url.port || (https ? "443" : "80"));
    fwd.headers.set("x-forwarded-for", request.headers.get("cf-connecting-ip") ?? "");

    const shop = getContainer(env.SHOP, SHOP_NAME);
    let res: Response;
    try {
      // 止まっているコンテナは、起きて待ち受けるまで待ってから渡す
      await shop.startAndWaitForPorts();
      res = await shop.fetch(fwd);
    } catch {
      return waking();
    }
    // 起きる途中やイメージの入れ替え中は、ライブラリが英語の 500 を返す。案内の画面に替える
    if (res.status === 500 && !(res.headers.get("content-type") ?? "").includes("text/html")) {
      if (/container/i.test(await res.clone().text())) return waking();
    }

    // デモは検索に出さない。robots.txt で全部断ると noindex を読んでもらえないので、応答のヘッダーで断る
    const headers = new Headers(res.headers);
    headers.set("x-robots-tag", "noindex, nofollow");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },

  // リセットはこれだけ。壊したコンテナは、次に誰かが開いたとき、イメージを作った時の状態から起きる
  async scheduled(_c: ScheduledController, env: Env): Promise<void> {
    await getContainer(env.SHOP, SHOP_NAME).destroy();
  },
} satisfies ExportedHandler<Env>;
