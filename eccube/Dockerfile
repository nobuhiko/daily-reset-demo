# EC-CUBE のデモ。インストールまで、イメージを作る時に済ませる。
# コンテナは書き込みを保存しないので、起きるたびに、ここで作った初期状態に戻る
FROM php:8.3-apache

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends libicu-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev unzip; \
    docker-php-ext-configure gd --with-freetype --with-jpeg; \
    docker-php-ext-install -j"$(nproc)" intl zip gd opcache; \
    rm -rf /var/lib/apt/lists/*; \
    a2enmod rewrite headers; \
    sed -ri 's#AllowOverride None#AllowOverride All#g' /etc/apache2/apache2.conf; \
    printf 'ServerTokens Prod\nServerSignature Off\n' > /etc/apache2/conf-enabled/zz-demo.conf

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-demo.ini

ARG ECCUBE_VERSION=4.3.1-p1
# 入るホスト名(Symfony の TRUSTED_HOSTS)。独自ドメインで出すときは、ここに足す
ARG TRUSTED_HOSTS='^localhost$,^127\.0\.0\.1$,\.workers\.dev$'
COPY .cache/eccube-${ECCUBE_VERSION}.tar.gz /tmp/eccube.tar.gz
COPY docker/install.sh /usr/local/bin/install-demo
RUN TRUSTED_HOSTS="$TRUSTED_HOSTS" sh /usr/local/bin/install-demo

COPY docker/start.sh /usr/local/bin/start-demo
STOPSIGNAL SIGTERM
EXPOSE 80
CMD ["sh", "/usr/local/bin/start-demo"]
