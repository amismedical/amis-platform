# AMIS Backend - Production API Server Dockerfile

FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install git for go modules and psql client for migrations
RUN apk add --no-cache git postgresql-client

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the API server
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s" \
    -o api-server ./cmd/api

FROM alpine:3.19 AS production

RUN apk --no-cache add ca-certificates tzdata postgresql-client bash

WORKDIR /app

# Copy binary
COPY --from=builder /app/api-server .

# Copy migrations and migration script
COPY --from=builder /app/migrations ./migrations
COPY migrations/run_migrations.sh ./run_migrations.sh

# Create uploads directory
RUN mkdir -p /app/uploads

# Make migration script executable
RUN chmod +x ./run_migrations.sh

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENV GIN_MODE=release
ENV PORT=8080

# Run migrations on startup, then start server
CMD ./run_migrations.sh && ./api-server
