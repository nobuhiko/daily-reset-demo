#!/bin/sh
# イメージを作る時に 1 回だけ: WordPress を展開して、SQLite でインストールする
set -eu
DOCROOT=/var/www/html
cd "$DOCROOT"
tar xzf /tmp/wordpress.tar.gz --strip-components=1
rm /tmp/wordpress.tar.gz
# 付いてくるだけで使わないもの(外から開ける入口を減らす)
rm -f readme.html license.txt wp-config-sample.php xmlrpc.php wp-trackback.php wp-mail.php wp-signup.php wp-activate.php
rm -rf wp-content/plugins/akismet wp-content/plugins/hello.php

# SQLite で動かすための公式のプラグイン(wp-content/db.php が、データベースの呼び出しを SQLite に向ける)
unzip -q /tmp/sqlite.zip -d wp-content/plugins && rm /tmp/sqlite.zip
mkdir -p wp-content/database wp-content/uploads
printf 'Require all denied\n' > wp-content/database/.htaccess
sed -e "s#{SQLITE_IMPLEMENTATION_FOLDER_PATH}#$DOCROOT/wp-content/plugins/sqlite-database-integration#" \
    -e "s#{SQLITE_PLUGIN}#sqlite-database-integration/load.php#" \
    wp-content/plugins/sqlite-database-integration/db.copy > wp-content/db.php
# アップロードの置き場では、プログラムを動かさない
printf '<FilesMatch "\\.(php\\d?|phtml|phar)$">\n  Require all denied\n</FilesMatch>\n' > wp-content/uploads/.htaccess

# 設定: ログインの鍵は、イメージを作るたびに新しく作る
php -r '
$c = file_get_contents("/tmp/demo/wp-config.php");
$s = "";
foreach (["AUTH_KEY","SECURE_AUTH_KEY","LOGGED_IN_KEY","NONCE_KEY","AUTH_SALT","SECURE_AUTH_SALT","LOGGED_IN_SALT","NONCE_SALT"] as $k) { $s .= "define( \x27$k\x27, \x27" . bin2hex(random_bytes(32)) . "\x27 );\n"; }
file_put_contents("wp-config.php", str_replace("/*SALTS*/", $s, $c));
'

chown -R www-data:www-data "$DOCROOT"
su -s /bin/sh www-data -c "php /tmp/demo/install.php $DOCROOT"
rm -rf /tmp/demo
# 設定のファイルは、動かす人(www-data)にも書き換えさせない
chown root:www-data wp-config.php wp-content/db.php && chmod 440 wp-config.php wp-content/db.php
