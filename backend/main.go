package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"github.com/Aswin123as/petamini-backend/config"
	"github.com/Aswin123as/petamini-backend/database"
	"github.com/Aswin123as/petamini-backend/handlers"
	"github.com/Aswin123as/petamini-backend/services"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Connect to database
	db, err := database.ConnectDB(cfg.MongoDBURI, cfg.DatabaseName)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Setup database collections and indexes
	log.Println("🔧 Setting up database collections and indexes...")
	if err := setupAccessTrackingCollections(db.Database); err != nil {
		log.Printf("⚠️  Warning: Failed to setup access tracking: %v", err)
	} else {
		log.Println("✅ Access tracking collections and indexes ready")
	}

	if err := setupUsersCollection(db.Database); err != nil {
		log.Printf("⚠️  Warning: Failed to setup users collection: %v", err)
	} else {
		log.Println("✅ Users collection and indexes ready")
	}

	// Initialize Telegram Bot (optional in development)
	var bot *tgbotapi.BotAPI
	var paymentService *services.PaymentService
	userService := services.NewUserService(db.Database)

	if !cfg.DisableTelegramBot {
		var err error
		bot, err = tgbotapi.NewBotAPI(cfg.TelegramBotToken)
		if err != nil {
			log.Fatalf("Failed to initialize Telegram bot: %v", err)
		}
		bot.Debug = cfg.Environment == "development"
		log.Printf("✅ Authorized on account %s", bot.Self.UserName)
		paymentService = services.NewPaymentService(db.Database, bot, cfg.PaymentProviderToken)
	} else {
		log.Println("⚠️  Telegram bot disabled (DISABLE_TELEGRAM_BOT=true)")
	}

	// Initialize handlers
	var paymentHandler *handlers.PaymentHandler
	var webhookHandler *handlers.WebhookHandler
	if !cfg.DisableTelegramBot {
		paymentHandler = handlers.NewPaymentHandler(paymentService)
		webhookHandler = handlers.NewWebhookHandler(bot, paymentService)
	}
	userHandler := handlers.NewUserHandler(userService)
	pokemonHandler := handlers.NewPokemonHandler(db.Database)
	linkerHandler := handlers.NewLinkerHandler(db.Database)
    adminHandler := handlers.NewAdminHandler(db.Database)
	var botCommandHandler *handlers.BotCommandHandler
	if !cfg.DisableTelegramBot {
		botCommandHandler = handlers.NewBotCommandHandler(bot, paymentService, userService)
	}
	accessHandler := handlers.NewAccessHandler(db.Database)
	wsHandler := handlers.NewWebSocketHandler(db.Database)

	// Setup Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.Default()

	// Middleware
	router.Use(corsMiddleware(cfg.FrontendURL))
	router.Use(gin.Recovery())
	router.Use(gin.Logger())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
		})
	})

	// WebSocket endpoint for real-time updates
	router.GET("/ws", wsHandler.HandleWebSocket)

	// API routes
	api := router.Group("/api")
	{
		// Pokemon routes
		pokemons := api.Group("/pokemons")
		{
			pokemons.GET("", pokemonHandler.GetAllPokemon)
			pokemons.GET("/:id", pokemonHandler.GetPokemonByID)
		}

		// Payment routes (only when bot is enabled)
		if !cfg.DisableTelegramBot {
			payments := api.Group("/payments")
			{
				payments.POST("/create-invoice", paymentHandler.CreateInvoice)
				payments.POST("/status", paymentHandler.GetPaymentStatus)
				payments.GET("/user/:userId", paymentHandler.GetUserPurchases)
			}
		}

		// User routes
		users := api.Group("/users")
		{
			users.GET("/profile/:userId", userHandler.GetUserProfile)
			users.GET("/stats/:userId", userHandler.GetUserStats)
			users.GET("/collection/:userId", userHandler.GetUserCollection)
			users.GET("/leaderboard", userHandler.GetLeaderboard)
			users.GET("/top", userHandler.GetTopCollectors)
		}

		// Linker routes
		linkers := api.Group("/linkers")
		{
			linkers.GET("", linkerHandler.GetAllLinkers)
			linkers.GET("/check-duplicate", linkerHandler.CheckDuplicateLink)
			linkers.GET("/tag/:tag", linkerHandler.GetLinkersByTag)
			linkers.POST("", linkerHandler.CreateLinker)
			linkers.PUT("/:id", linkerHandler.UpdateLinker)
			linkers.POST("/:id/promote", linkerHandler.PromoteLinker)
			linkers.DELETE("/:id", linkerHandler.DeleteLinker)
		}

		// Access tracking routes
		access := api.Group("/access")
		{
			access.POST("/track", accessHandler.TrackPageAccess)
			access.GET("/stats", accessHandler.GetPageAccessStats)
			access.GET("/daily", accessHandler.GetDailyAccessStats)
			access.GET("/history/:userId", accessHandler.GetUserAccessHistory)
		}

		// Telegram webhook
		if !cfg.DisableTelegramBot {
			api.POST("/webhook", webhookHandler.HandleWebhook)
		}
	}

	// Simple admin page (non-API) to list users and access details
	// Expose ONLY in non-production environments
	if cfg.Environment != "production" {
		router.GET("/admin/users", adminHandler.UsersAccessPage)
	}

	// Setup webhook for Telegram bot
	if !cfg.DisableTelegramBot && cfg.Environment == "production" {
		// Derive webhook URL from the configured public URL.
		// Deployment scripts place the public tunnel URL into FRONTEND_URL (possibly comma-separated).
		webhookBase := cfg.FrontendURL
		// Fallback to BACKEND_URL env var if FRONTEND_URL not set
		if webhookBase == "" {
			webhookBase = os.Getenv("BACKEND_URL")
		}
		if webhookBase == "" {
			log.Fatalf("WEBHOOK URL is required in production: set FRONTEND_URL or BACKEND_URL to your public domain")
		}
		// If a comma-separated list is present, use the last entry (deployment may append the tunnel URL)
		if strings.Contains(webhookBase, ",") {
			parts := strings.Split(webhookBase, ",")
			webhookBase = strings.TrimSpace(parts[len(parts)-1])
		}
		webhookURL := strings.TrimRight(webhookBase, "/") + "/api/webhook"
		webhook, err := tgbotapi.NewWebhook(webhookURL)
		if err != nil {
			log.Fatalf("Failed to create webhook: %v", err)
		}

		_, err = bot.Request(webhook)
		if err != nil {
			log.Fatalf("Failed to set webhook: %v", err)
		}

		info, err := bot.GetWebhookInfo()
		if err != nil {
			log.Fatalf("Failed to get webhook info: %v", err)
		}
		log.Printf("✅ Webhook set to: %s", info.URL)
	} else if !cfg.DisableTelegramBot {
		// For development, delete webhook first then use long polling
		log.Println("🔧 Development mode: Removing webhook...")
		deleteWebhook := tgbotapi.DeleteWebhookConfig{
			DropPendingUpdates: false,
		}
		_, err := bot.Request(deleteWebhook)
		if err != nil {
			log.Printf("⚠️  Warning: Failed to delete webhook: %v", err)
		} else {
			log.Println("✅ Webhook removed successfully")
		}
		
		go startPolling(bot, paymentService, botCommandHandler)
	}

	// Start server
	log.Printf("🚀 Server starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// corsMiddleware adds CORS headers
func corsMiddleware(frontendURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// Allow multiple origins in development
		allowedOrigins := []string{
			frontendURL,
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://192.168.18.124:5173",
		}
		
		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				allowed = true
				break
			}
		}
		
		// Set CORS headers
		if allowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			// Default to configured frontend URL
			c.Writer.Header().Set("Access-Control-Allow-Origin", frontendURL)
		}
		
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// startPolling starts long polling for development
func startPolling(bot *tgbotapi.BotAPI, paymentService *services.PaymentService, botCommandHandler *handlers.BotCommandHandler) {
	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := bot.GetUpdatesChan(u)
	log.Println("📡 Started polling for updates...")

	for update := range updates {
		// Handle bot commands
		if update.Message != nil && update.Message.IsCommand() {
			go botCommandHandler.HandleCommand(update)
			continue
		}

		// Handle successful payment
		if update.Message != nil && update.Message.SuccessfulPayment != nil {
			log.Printf("Received successful payment from user %d", update.Message.From.ID)
			
			ctx := context.Background()
			err := paymentService.ProcessSuccessfulPayment(
				ctx,
				update.Message.SuccessfulPayment,
				update.Message.From.ID,
				update.Message.From.UserName,
			)

			if err != nil {
				log.Printf("Error processing payment: %v", err)
				msg := tgbotapi.NewMessage(
					update.Message.Chat.ID,
					"❌ Sorry, there was an error processing your payment. Please contact support.",
				)
				bot.Send(msg)
			} else {
				msg := tgbotapi.NewMessage(
					update.Message.Chat.ID,
					"✅ Payment successful! Your Pokemon cards have been added to your collection.",
				)
				bot.Send(msg)
			}
		}

		// Handle pre-checkout query
		if update.PreCheckoutQuery != nil {
			log.Printf("Received pre-checkout query: %s", update.PreCheckoutQuery.ID)
			
			config := tgbotapi.PreCheckoutConfig{
				PreCheckoutQueryID: update.PreCheckoutQuery.ID,
				OK:                 true,
			}
			
			if _, err := bot.Request(config); err != nil {
				log.Printf("Error answering pre-checkout query: %v", err)
			}
		}
	}
}

// setupAccessTrackingCollections ensures the page_accesses collection and indexes exist
func setupAccessTrackingCollections(db *mongo.Database) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Check if collection exists
	collections, err := db.ListCollectionNames(ctx, bson.M{})
	if err != nil {
		return err
	}

	pageAccessesExists := false
	for _, name := range collections {
		if name == "page_accesses" {
			pageAccessesExists = true
			break
		}
	}

	// Create collection if it doesn't exist
	if !pageAccessesExists {
		err = db.CreateCollection(ctx, "page_accesses")
		if err != nil {
			return err
		}
	}

	// Get collection
	collection := db.Collection("page_accesses")

	// Define indexes
	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "timestamp", Value: -1}},
			Options: options.Index().SetName("timestamp_-1"),
		},
		{
			Keys: bson.D{
				{Key: "user_id", Value: 1},
				{Key: "timestamp", Value: -1},
			},
			Options: options.Index().SetName("user_id_1_timestamp_-1"),
		},
		{
			Keys: bson.D{
				{Key: "user_id", Value: 1},
				{Key: "page_url", Value: 1},
				{Key: "timestamp", Value: -1},
			},
			Options: options.Index().SetName("spam_prevention"),
		},
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}},
			Options: options.Index().SetName("user_id_1"),
		},
	}

	// Create indexes
	_, err = collection.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		// Don't fail if indexes already exist
		log.Printf("Warning: Some indexes may already exist: %v", err)
	}

	return nil
}

// setupUsersCollection ensures the users collection and indexes exist
func setupUsersCollection(db *mongo.Database) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Check if collection exists
	collections, err := db.ListCollectionNames(ctx, bson.M{})
	if err != nil {
		return err
	}

	usersExists := false
	for _, name := range collections {
		if name == "users" {
			usersExists = true
			break
		}
	}

	// Create collection if it doesn't exist
	if !usersExists {
		if err := db.CreateCollection(ctx, "users"); err != nil {
			return err
		}
	}

	collection := db.Collection("users")

	// Define indexes
	uniqueTrue := true
	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "telegram_id", Value: 1}},
			Options: options.Index().SetName("telegram_id_1").SetUnique(uniqueTrue),
		},
		{
			Keys:    bson.D{{Key: "username", Value: 1}},
			Options: options.Index().SetName("username_1"),
		},
		{
			Keys:    bson.D{{Key: "last_active", Value: -1}},
			Options: options.Index().SetName("last_active_-1"),
		},
		{
			Keys:    bson.D{{Key: "is_banned", Value: 1}},
			Options: options.Index().SetName("is_banned_1"),
		},
	}

	if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
		log.Printf("Warning: Some user indexes may already exist: %v", err)
	}

	return nil
}
