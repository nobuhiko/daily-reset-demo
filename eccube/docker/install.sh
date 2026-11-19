#!/bin/sh
# イメージを作る時に 1 回だけ: EC-CUBE を展開して、SQLite でインストールする
set -eu
DOCROOT=/var/www/html
cd "$DOCROOT"
tar xzf /tmp/eccube.tar.gz --strip-components=1
rm /tmp/eccube.tar.gz

export APP_ENV=prod APP_DEBUG=0
export DATABASE_URL="sqlite:///$DOCROOT/var/eccube.db"
export DATABASE_SERVER_VERSION=3
export MAILER_DSN="null://null"
# ログインの鍵は、イメージを作るたびに新しく作る
export ECCUBE_AUTH_MAGIC="$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')"
export ECCUBE_ADMIN_ROUTE=admin
export ECCUBE_TEMPLATE_CODE=default
export ECCUBE_LOCALE=ja
# 管理画面のログインは admin / password(EC-CUBE のインストーラーの既定)
php -d memory_limit=-1 bin/console eccube:install --no-interaction

# --no-interaction では .env が書かれないので、同じ値で書く
cat > .env <<ENV
APP_ENV=$APP_ENV
APP_DEBUG=$APP_DEBUG
DATABASE_URL=$DATABASE_URL
DATABASE_SERVER_VERSION=$DATABASE_SERVER_VERSION
DATABASE_CHARSET=utf8
MAILER_DSN=$MAILER_DSN
ECCUBE_AUTH_MAGIC=$ECCUBE_AUTH_MAGIC
ECCUBE_ADMIN_ROUTE=$ECCUBE_ADMIN_ROUTE
ECCUBE_TEMPLATE_CODE=$ECCUBE_TEMPLATE_CODE
ECCUBE_LOCALE=$ECCUBE_LOCALE
TRUSTED_HOSTS=$TRUSTED_HOSTS
# 手前の Worker からしか届かないので、Worker が付ける X-Forwarded-* を信じる(https の URL を作るため)
TRUSTED_PROXIES=REMOTE_ADDR
ENV

php -d memory_limit=-1 bin/console cache:clear --no-warmup
php -d memory_limit=-1 bin/console cache:warmup
chown -R www-data:www-data "$DOCROOT"
