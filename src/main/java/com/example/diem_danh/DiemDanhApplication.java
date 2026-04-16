package com.example.diem_danh;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DiemDanhApplication {

	public static void main(String[] args) {

		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();

		System.setProperty("JWT_SECRET", dotenv.get("JWT_SECRET", ""));
		System.setProperty("JWT_EXPIRATION", dotenv.get("JWT_EXPIRATION", "3600000"));
		System.setProperty("JWT_QR_EXPIRATION", dotenv.get("JWT_QR_EXPIRATION", "300000"));

		System.setProperty("NEO4J_URI", dotenv.get("NEO4J_URI", ""));
		System.setProperty("NEO4J_USERNAME", dotenv.get("NEO4J_USERNAME", ""));
		System.setProperty("NEO4J_PASSWORD", dotenv.get("NEO4J_PASSWORD", ""));
		System.setProperty("NEO4J_DATABASE", dotenv.get("NEO4J_DATABASE", "neo4j"));

		System.setProperty("MINIO_URL", dotenv.get("MINIO_URL", ""));
		System.setProperty("MINIO_ACCESS_KEY", dotenv.get("MINIO_ACCESS_KEY", ""));
		System.setProperty("MINIO_SECRET_KEY", dotenv.get("MINIO_SECRET_KEY", ""));
		System.setProperty("MINIO_BUCKET", dotenv.get("MINIO_BUCKET", ""));
		System.setProperty("MINIO_PUBLIC_URL", dotenv.get("MINIO_PUBLIC_URL", ""));

		System.setProperty("REDIS_HOST", dotenv.get("REDIS_HOST", "localhost"));
		System.setProperty("REDIS_PORT", dotenv.get("REDIS_PORT", "6379"));
		System.setProperty("REDIS_PASSWORD", dotenv.get("REDIS_PASSWORD", ""));

		System.setProperty("RABBITMQ_HOST", dotenv.get("RABBITMQ_HOST", "localhost"));
		System.setProperty("RABBITMQ_PORT", dotenv.get("RABBITMQ_PORT", "5672"));
		System.setProperty("RABBITMQ_USER", dotenv.get("RABBITMQ_USER", "guest"));
		System.setProperty("RABBITMQ_PASS", dotenv.get("RABBITMQ_PASS", "guest"));

		SpringApplication.run(DiemDanhApplication.class, args);
	}
}