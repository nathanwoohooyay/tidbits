FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml ./pom.xml
COPY shared-exceptions/pom.xml ./shared-exceptions/pom.xml
COPY audit-service/pom.xml ./audit-service/pom.xml
COPY client-service/pom.xml ./client-service/pom.xml
COPY shared-exceptions/src ./shared-exceptions/src
COPY client-service/src ./client-service/src

RUN mvn -pl client-service -am clean package -Dmaven.test.skip=true

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/client-service/target/client-service-1.0.0.jar app.jar

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]