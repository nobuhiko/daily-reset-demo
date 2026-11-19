<?php
// イメージを作る時: 空のデータベースに WordPress を入れる
$root = rtrim( $argv[1], '/' );
define( 'WP_INSTALLING', true );
$_SERVER['HTTP_HOST']   = 'localhost';
$_SERVER['REQUEST_URI'] = '/';
require $root . '/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/upgrade.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

// 管理画面のログインは demo / demo-password(だれでも入れる前提。開かせない画面は、手前の Worker が断る)
wp_install( '毎朝リセットされるデモ', 'demo', 'demo@example.invalid', false, '', 'demo-password', 'ja' );
update_option( 'blog_public', 0 );
update_option( 'default_comment_status', 'closed' );
update_option( 'users_can_register', 0 );
$r = activate_plugin( 'sqlite-database-integration/load.php' );
echo 'sqlite => ', is_wp_error( $r ) ? $r->get_error_message() : 'ok', "\n";

// ここに、デモで見せたいもの(自分のプラグインの有効化、見本の記事など)を足す

global $wp_rewrite;
$wp_rewrite->set_permalink_structure( '/%postname%/' );
update_option( 'rewrite_rules', '' );
file_put_contents( $root . '/.htaccess', "# BEGIN WordPress\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteBase /\nRewriteRule ^index\\.php$ - [L]\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule . /index.php [L]\n</IfModule>\n# END WordPress\n" );
echo 'WordPress ', get_bloginfo( 'version' ), ' / ', get_locale(), "\n";
