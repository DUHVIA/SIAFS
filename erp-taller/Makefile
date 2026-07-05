.PHONY: help db-up db-down db-restart dev up studio migrate seed test

# Mostrar ayuda por defecto
help:
	@echo "=========================================================="
	@echo "Comandos disponibles para SIAFS ERP:"
	@echo "=========================================================="
	@echo "  make db-up      - Enciende el contenedor de PostgreSQL en segundo plano."
	@echo "  make db-down    - Detiene y elimina el contenedor de la base de datos."
	@echo "  make db-restart - Reinicia la base de datos (down -> up)."
	@echo "  make dev        - Inicia el servidor de desarrollo de Next.js (Front/Back)."
	@echo "  make up         - Levanta la base de datos y luego inicia el servidor Next.js."
	@echo "  make studio     - Abre Prisma Studio para inspeccionar los datos."
	@echo "  make migrate    - Aplica migraciones pendientes de Prisma."
	@echo "  make seed       - Ejecuta el seeder para poblar la base de datos inicial."
	@echo "  make test       - Ejecuta las pruebas unitarias con Vitest."
	@echo "=========================================================="

# Comandos de Docker (Base de Datos)
db-up:
	@echo "Levantando base de datos..."
	docker compose up -d

db-down:
	@echo "Deteniendo base de datos..."
	docker compose down

db-restart: db-down db-up

# Comandos de Desarrollo
dev:
	@echo "Iniciando servidor de desarrollo Next.js..."
	pnpm dev

up: db-up
	@echo "Esperando 2 segundos a que la BD esté lista..."
	sleep 2
	@echo "Iniciando servidor Next.js..."
	pnpm dev

# Comandos de Prisma (ORM)
studio:
	@echo "Iniciando Prisma Studio..."
	pnpm prisma studio

migrate:
	@echo "Ejecutando migraciones..."
	pnpm prisma migrate dev

seed:
	@echo "Poblando base de datos..."
	pnpm prisma db seed

# Pruebas
test:
	@echo "Ejecutando pruebas de Vitest..."
	pnpm test
