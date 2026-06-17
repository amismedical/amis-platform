package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	Storage  StorageConfig
}

type ServerConfig struct {
	Host         string
	Port         int
	ReadTimeout  int
	WriteTimeout int
	IdleTimeout  int
}

func (s ServerConfig) Address() string {
	return s.Host + ":" + strconv.Itoa(s.Port)
}

type DatabaseConfig struct {
	Host            string
	Port            int
	Username        string
	Password        string
	Name            string
	SSLMode         string
	MaxConns        int
	MinConns        int
	MaxConnLifetime int
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type JWTConfig struct {
	Secret           string
	AccessTokenTTL   int
	RefreshTokenTTL  int
}

type StorageConfig struct {
	Path       string
	MaxSizeMB  int
}

func Load(path string) (*Config, error) {
	if err := godotenv.Load(path + "/.env"); err != nil {
		if _, ok := os.LookupEnv("GIN_MODE"); !ok {
			return nil, err
		}
	}

	cfg := &Config{
		Server: ServerConfig{
			Host:         getEnv("SERVER_HOST", "0.0.0.0"),
			Port:         getEnvInt("SERVER_PORT", 8080),
			ReadTimeout:  getEnvInt("SERVER_READ_TIMEOUT", 30),
			WriteTimeout: getEnvInt("SERVER_WRITE_TIMEOUT", 30),
			IdleTimeout:  getEnvInt("SERVER_IDLE_TIMEOUT", 120),
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnvInt("DB_PORT", 5432),
			Username:        getEnv("DB_USERNAME", "postgres"),
			Password:        getEnv("DB_PASSWORD", "postgres"),
			Name:            getEnv("DB_NAME", "amis"),
			SSLMode:         getEnv("DB_SSLMODE", "disable"),
			MaxConns:        getEnvInt("DB_MAX_CONNS", 20),
			MinConns:        getEnvInt("DB_MIN_CONNS", 5),
			MaxConnLifetime: getEnvInt("DB_MAX_CONN_LIFETIME", 3600),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			Secret:          getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
			AccessTokenTTL:  getEnvInt("JWT_ACCESS_TOKEN_TTL", 15),
			RefreshTokenTTL: getEnvInt("JWT_REFRESH_TOKEN_TTL", 10080),
		},
		Storage: StorageConfig{
			Path:      getEnv("STORAGE_PATH", "./uploads"),
			MaxSizeMB: getEnvInt("STORAGE_MAX_SIZE_MB", 10),
		},
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value, ok := os.LookupEnv(key); ok {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}