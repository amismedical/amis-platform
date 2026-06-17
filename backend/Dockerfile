# AMIS Backend - Simple Server Dockerfile
# Works without database - uses mock data for demo

FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install git for go modules
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the simple server
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s" \
    -o simple-server ./cmd/simple

FROM alpine:3.19 AS production

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary
COPY --from=builder /app/simple-server .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENV GIN_MODE=release
ENV PORT=8080

CMD ["./simple-server"]