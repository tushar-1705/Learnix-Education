# Multi-stage build for Spring Boot application

# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the built JAR from build stage
# Spring Boot Maven plugin creates: learnix-1.0.0.jar
COPY --from=build /app/target/learnix-*.jar app.jar

# Expose the port
EXPOSE 8082

# Run the application
# Note: Environment variables should be passed via docker run -e or docker-compose
# The .env file is loaded by the application, but you can also pass env vars directly
ENTRYPOINT ["java", "-jar", "app.jar"]
