# ===================== BUILD STAGE =====================
FROM maven:3.9.9-amazoncorretto-21 AS build

WORKDIR /app

# Cache dependencies trước khi copy source
COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn package -DskipTests -q

# ===================== RUNTIME STAGE =====================
FROM amazoncorretto:21-alpine

WORKDIR /app

# Tạo user non-root để chạy app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/target/*.jar app.jar

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]