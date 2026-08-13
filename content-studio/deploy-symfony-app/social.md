# Social posts: Deploy a Symfony App to Production, the Honest Way

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/deploy-symfony-app/

## X / Twitter
```
To deploy a Symfony app: set `APP_ENV=prod` and a real `APP_SECRET` on the server, run `composer install --no-dev --optimize-autoloader`, then `bin/console…

https://www.kloudbean.com/blog/deploy-symfony-app/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## LinkedIn
```
To deploy a Symfony app: set `APP_ENV=prod` and a real `APP_SECRET` on the server, run `composer install --no-dev --optimize-autoloader`, then `bin/console…

Serve `public/index.php` with nginx and PHP-FPM, and make sure `var/cache` and `var/log` are writable by the web server user. That last one is the classic 500.

Read the full guide: https://www.kloudbean.com/blog/deploy-symfony-app/

#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## X thread
```
1/5  Deploy a Symfony App to Production, the Honest Way

Quick thread 🧵
```
```
2/5  To deploy a Symfony app: set `APP_ENV=prod` and a real `APP_SECRET` on the server, run `composer install --no-dev --optimize-autoloader`, then `bin/console cache:clear` and `cache:warmup`, then `doctrine:migrations:migrate --no-interaction`.
```
```
3/5  Serve `public/index.php` with nginx and PHP-FPM, and make sure `var/cache` and `var/log` are writable by the web server user.
```
```
4/5  That last one is the classic 500.
```
```
5/5  Full walkthrough:
https://www.kloudbean.com/blog/deploy-symfony-app/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```
