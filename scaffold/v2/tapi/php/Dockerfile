FROM php:8.3-cli
WORKDIR /app
COPY . .
RUN curl -sS https://getcomposer.org/installer | php && php composer.phar install --no-dev
CMD ["php", "-S", "0.0.0.0:3000", "router.php"]
