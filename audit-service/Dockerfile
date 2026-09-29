FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml ./pom.xml
COPY client-service/pom.xml ./client-service/pom.xml
COPY audit-service/pom.xml ./audit-service/pom.xml
COPY audit-service/src ./audit-service/src

RUN mvn -pl audit-service -am clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/audit-service/target/audit-service-1.0.0.jar app.jar

EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]