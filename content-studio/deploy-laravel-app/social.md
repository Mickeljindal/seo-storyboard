# Social posts: Deploy a Laravel App the Right Way (Queues and All)

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/deploy-laravel-app/

## X / Twitter
```
Set your `.env` on the server (`APP_KEY`, `APP_ENV=production`, `APP_DEBUG=false`, DB creds).

https://www.kloudbean.com/blog/deploy-laravel-app/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## LinkedIn
```
Set your `.env` on the server (`APP_KEY`, `APP_ENV=production`, `APP_DEBUG=false`, DB creds).

On every deploy run `composer install --no-dev`, build assets, `php artisan migrate --force`, then cache config, routes and views, and `php artisan storage:link`. PHP-FPM serves the app, never `artisan serve`. And run `php artisan queue:restart` so your workers actually pick up the new code.

Read the full guide: https://www.kloudbean.com/blog/deploy-laravel-app/

#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## X thread
```
1/6  Deploy a Laravel App the Right Way (Queues and All)

Quick thread 🧵
```
```
2/6  Set your `.env` on the server (`APP_KEY`, `APP_ENV=production`, `APP_DEBUG=false`, DB creds).
```
```
3/6  On every deploy run `composer install --no-dev`, build assets, `php artisan migrate --force`, then cache config, routes and views, and `php artisan storage:link`.
```
```
4/6  PHP-FPM serves the app, never `artisan serve`.
```
```
5/6  And run `php artisan queue:restart` so your workers actually pick up the new code.
```
```
6/6  Full walkthrough:
https://www.kloudbean.com/blog/deploy-laravel-app/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```
