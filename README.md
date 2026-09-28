# Tidbits - Containerized Services

This workspace now includes Docker support for:
- auth-service (Node.js, port 4000)
- client-service (Spring Boot, port 8082)
- audit-service (Spring Boot, port 8083)
- postgres (PostgreSQL, port 5432)

## Run with Docker Compose

From the project root:

1. Build images:
	docker compose build

2. Start all services:
	docker compose up -d

3. View logs:
	docker compose logs -f

4. Stop services:
	docker compose down

5. Stop services and remove database volume:
	docker compose down -v

## Endpoints

- Auth health: http://localhost:4000/api/auth/health
- Client service: http://localhost:8082
- Audit service: http://localhost:8083

## Notes

- Database schema/data is initialized from:
  - db/create.sql
  - db/testdata.sql
- The JWT secret is shared between auth-service and client-service in docker-compose.yml.
- Spring services use environment variables for database host, port, user, and password.
