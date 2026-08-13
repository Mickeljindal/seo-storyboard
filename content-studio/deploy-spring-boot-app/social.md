# Social posts: deploy spring boot app

> Auto-generated from this article's title, meta description, and short-version box. No new claims. Edit freely before posting.
> Article: https://www.kloudbean.com/blog/deploy-spring-boot-app/

## X / Twitter
```
> Build an executable JAR with `./mvnw clean package` (or `./gradlew bootJar`), then run `java -jar app.jar` on any server that has a JVM.

https://www.kloudbean.com/blog/deploy-spring-boot-app/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## LinkedIn
```
> Build an executable JAR with `./mvnw clean package` (or `./gradlew bootJar`), then run `java -jar app.jar` on any server that has a JVM.

Spring Boot embeds Tomcat, so there's no separate app server to install. Externalize config through environment variables (`SPRING_DATASOURCE_URL`, `SPRING_PROFILES_ACTIVE=prod`), set a sane `-Xmx` so the JVM isn't OOM-killed, put it behind a reverse proxy for TLS, keep the process supervised so it restarts on crash and reboot, and point it at a managed database.

Read the full guide: https://www.kloudbean.com/blog/deploy-spring-boot-app/

#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```

## X thread
```
1/5  deploy spring boot app

Quick thread 🧵
```
```
2/5  > Build an executable JAR with `./mvnw clean package` (or `./gradlew bootJar`), then run `java -jar app.jar` on any server that has a JVM.
```
```
3/5  Spring Boot embeds Tomcat, so there's no separate app server to install.
```
```
4/5  Externalize config through environment variables (`SPRING_DATASOURCE_URL`, `SPRING_PROFILES_ACTIVE=prod`), set a sane `-Xmx` so the JVM isn't OOM-killed, put it behind a reverse proxy for TLS, keep the process supervised so it restarts on crash and reboot, and point it at a…
```
```
5/5  Full walkthrough:
https://www.kloudbean.com/blog/deploy-spring-boot-app/
#Kloudbean #CloudHosting #DevOps #WebDev #Deployment
```
