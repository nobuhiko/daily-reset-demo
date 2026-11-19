<?php
// デモの WordPress の設定(イメージを作る時に、鍵の所だけ書き換える)

// Cloudflare のコンテナの「起きてる?」(ホスト名 ping での呼び出し)には、WordPress を動かさずに返す。
// これが無いと 1 回ごとにトップページを丸ごと作り、重なると詰まる
if ( isset( $_SERVER['HTTP_HOST'] ) && 'ping' === $_SERVER['HTTP_HOST'] ) {
	http_response_code( 204 );
	exit;
}

// データベースは SQLite。コンテナは書き込みを保存しないので、起きるたびに初期状態に戻る
define( 'DB_NAME', 'wp' );
define( 'DB_USER', '' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', '' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );
define( 'DB_ENGINE', 'sqlite' );
define( 'DB_DIR', __DIR__ . '/wp-content/database/' );
define( 'DB_FILE', '.ht.sqlite' );

/*SALTS*/

$table_prefix = 'wp_';

// 手前の Worker からしか届かない。https で来たことは、Worker が付けるヘッダーで知る
if ( isset( $_SERVER['HTTP_X_FORWARDED_PROTO'] ) && 'https' === $_SERVER['HTTP_X_FORWARDED_PROTO'] ) {
	$_SERVER['HTTPS'] = 'on';
}
// サイトの URL は、呼ばれたホスト名から決める(workers.dev の名前はデプロイするまで分からないため)。
// 入れる名前は決めておく。独自ドメインで出すときは、ここに足す
$demo_hosts = '/^(localhost|127\.0\.0\.1)(:\d+)?$|^[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/';
$demo_host  = isset( $_SERVER['HTTP_HOST'] ) && preg_match( $demo_hosts, $_SERVER['HTTP_HOST'] ) ? $_SERVER['HTTP_HOST'] : 'localhost';
$demo_base  = ( empty( $_SERVER['HTTPS'] ) ? 'http://' : 'https://' ) . $demo_host;
define( 'WP_HOME', $demo_base );
define( 'WP_SITEURL', $demo_base );

// 管理画面からプログラムを書き換えさせない・入れさせない・更新させない
define( 'DISALLOW_FILE_EDIT', true );
define( 'DISALLOW_FILE_MODS', true );
define( 'AUTOMATIC_UPDATER_DISABLED', true );
define( 'WP_AUTO_UPDATE_CORE', false );
define( 'WP_DEBUG', false );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}
require_once ABSPATH . 'wp-settings.php';
