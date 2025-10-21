package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
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

	// Initialize Telegram Bot
	bot, err := tgbotapi.NewBotAPI(cfg.TelegramBotToken)
	if err != nil {
		log.Fatalf("Failed to initialize Telegram bot: %v", err)
	}
	bot.Debug = cfg.Environment == "development"
	log.Printf("✅ Authorized on account %s", bot.Self.UserName)

	// Initialize services
	paymentService := services.NewPaymentService(db.Database, bot, cfg.PaymentProviderToken)
	userService := services.NewUserService(db.Database)

	// Initialize handlers
	paymentHandler := handlers.NewPaymentHandler(paymentService)
	webhookHandler := handlers.NewWebhookHandler(bot, paymentService)
	userHandler := handlers.NewUserHandler(userService)
	pokemonHandler := handlers.NewPokemonHandler(db.Database)
	botCommandHandler := handlers.NewBotCommandHandler(bot, paymentService, userService)

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

	// API routes
	api := router.Group("/api")
	{
		// Pokemon routes
		pokemons := api.Group("/pokemons")
		{
			pokemons.GET("", pokemonHandler.GetAllPokemon)
			pokemons.GET("/:id", pokemonHandler.GetPokemonByID)
		}

		// Payment routes
		payments := api.Group("/payments")
		{
			payments.POST("/create-invoice", paymentHandler.CreateInvoice)
			payments.POST("/status", paymentHandler.GetPaymentStatus)
			payments.GET("/user/:userId", paymentHandler.GetUserPurchases)
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

		// Telegram webhook
		api.POST("/webhook", webhookHandler.HandleWebhook)
	}

	// Setup webhook for Telegram bot
	if cfg.Environment == "production" {
		webhookURL := "https://yourdomain.com/api/webhook" // Update this
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
	} else {
		// For development, use long polling
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
		c.Writer.Header().Set("Access-Control-Allow-Origin", frontendURL)
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
