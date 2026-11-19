# WordPress のデモ。インストールまで、イメージを作る時に済ませる。
# コンテナは書き込みを保存しないので、起きるたびに、ここで作った初期状態に戻る
# データベースは SQLite(公式の SQLite Database Integration)
FROM php:8.3-apache

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev unzip; \
    docker-php-ext-configure gd --with-freetype --with-jpeg; \
    docker-php-ext-install -j"$(nproc)" zip gd opcache; \
    rm -rf /var/lib/apt/lists/*; \
    a2enmod rewrite headers; \
    sed -ri 's#AllowOverride None#AllowOverride All#g' /etc/apache2/apache2.conf; \
    printf 'ServerTokens Prod\nServerSignature Off\n' > /etc/apache2/conf-enabled/zz-demo.conf

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-demo.ini

ARG WP_VERSION=7.1.4
COPY .cache/wordpress-${WP_VERSION}-ja.tar.gz /tmp/wordpress.tar.gz
COPY .cache/sqlite-database-integration.zip /tmp/sqlite.zip
COPY docker/install.sh docker/install.php docker/wp-config.php /tmp/demo/
RUN sh /tmp/demo/install.sh

COPY docker/start.sh /usr/local/bin/start-demo
STOPSIGNAL SIGTERM
EXPOSE 80
CMD ["sh", "/usr/local/bin/start-demo"]
