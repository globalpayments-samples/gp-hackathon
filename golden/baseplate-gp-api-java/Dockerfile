FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY . .
RUN mvn -q -DskipTests package dependency:copy-dependencies

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
COPY --from=build /src/target/dependency lib
EXPOSE 3000
ENTRYPOINT ["java", "-cp", "app.jar:lib/*", "com.globalpayments.sample.Main"]
