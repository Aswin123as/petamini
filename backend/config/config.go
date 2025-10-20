package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	TelegramBotToken       string
	TelegramBotUsername    string
	Port                   string
	Environment            string
	MongoDBURI             string
	DatabaseName           string
	FrontendURL            string
	PaymentProviderToken   string
	WebhookSecret          string
	MinStarsAmount         int
	MaxStarsAmount         int
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	config := &Config{
		TelegramBotToken:     getEnv("TELEGRAM_BOT_TOKEN", ""),
		TelegramBotUsername:  getEnv("TELEGRAM_BOT_USERNAME", ""),
		Port:                 getEnv("PORT", "8080"),
		Environment:          getEnv("ENVIRONMENT", "development"),
		MongoDBURI:           getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		DatabaseName:         getEnv("DATABASE_NAME", "petamini"),
		FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:5173"),
		PaymentProviderToken: getEnv("PAYMENT_PROVIDER_TOKEN", ""),
		WebhookSecret:        getEnv("WEBHOOK_SECRET", ""),
		MinStarsAmount:       1,
		MaxStarsAmount:       2500,
	}

	// Validate required fields
	if config.TelegramBotToken == "" {
		log.Fatal("TELEGRAM_BOT_TOKEN is required")
	}

	return config
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
