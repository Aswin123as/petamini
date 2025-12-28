package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/Aswin123as/petamini-backend/models"
	"github.com/Aswin123as/petamini-backend/services"
)

// PaymentHandler handles payment-related HTTP requests
type PaymentHandler struct {
	paymentService *services.PaymentService
}

// NewPaymentHandler creates a new payment handler
func NewPaymentHandler(paymentService *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{
		paymentService: paymentService,
	}
}

// CreateInvoice handles the creation of a payment invoice
// POST /api/payments/create-invoice
func (h *PaymentHandler) CreateInvoice(c *gin.Context) {
	var req models.CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"details": err.Error(),
		})
		return
	}

	log.Printf("Creating invoice for user %d, pokemon %s, units %d", req.UserID, req.PokemonID, req.Units)

	invoice, err := h.paymentService.CreateInvoice(c.Request.Context(), req)
	if err != nil {
		log.Printf("Error creating invoice: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create invoice",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, invoice)
}

// GetPaymentStatus retrieves the status of a payment
// POST /api/payments/status
func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	var req models.PaymentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"details": err.Error(),
		})
		return
	}

	status, err := h.paymentService.GetPaymentStatus(c.Request.Context(), req.InvoicePayload)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Payment not found",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, status)
}

// GetUserPurchases retrieves all purchases for a user
// GET /api/payments/user/:userId
func (h *PaymentHandler) GetUserPurchases(c *gin.Context) {
	var userID int64
	if err := c.ShouldBindUri(&struct {
		UserID int64 `uri:"userId" binding:"required"`
	}{UserID: userID}); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	purchases, err := h.paymentService.GetUserPurchases(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve purchases",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, purchases)
}

// WebhookHandler handles incoming Telegram webhooks
type WebhookHandler struct {
	bot            *tgbotapi.BotAPI
	paymentService *services.PaymentService
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler(bot *tgbotapi.BotAPI, paymentService *services.PaymentService) *WebhookHandler {
	return &WebhookHandler{
		bot:            bot,
		paymentService: paymentService,
	}
}

// HandleWebhook processes incoming Telegram updates
// POST /webhook
func (h *WebhookHandler) HandleWebhook(c *gin.Context) {
	var update tgbotapi.Update
	if err := c.ShouldBindJSON(&update); err != nil {
		log.Printf("Error binding webhook update: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update"})
		return
	}

	// Handle successful payment
	if update.Message != nil && update.Message.SuccessfulPayment != nil {
		log.Printf("Received successful payment from user %d", update.Message.From.ID)
		
		err := h.paymentService.ProcessSuccessfulPayment(
			c.Request.Context(),
			update.Message.SuccessfulPayment,
			update.Message.From.ID,
			update.Message.From.UserName,
		)

		if err != nil {
			log.Printf("Error processing payment: %v", err)
			// Send error message to user
			msg := tgbotapi.NewMessage(
				update.Message.Chat.ID,
				"❌ Sorry, there was an error processing your payment. Please contact support.",
			)
			h.bot.Send(msg)
		} else {
			// Send success message to user
			msg := tgbotapi.NewMessage(
				update.Message.Chat.ID,
				"✅ Payment successful! Your Pokemon cards have been added to your collection.",
			)
			h.bot.Send(msg)
		}
	}

	// Handle pre-checkout query
	if update.PreCheckoutQuery != nil {
		log.Printf("Received pre-checkout query: %s", update.PreCheckoutQuery.ID)
		
		// Always approve for now (you can add validation here)
		config := tgbotapi.PreCheckoutConfig{
			PreCheckoutQueryID: update.PreCheckoutQuery.ID,
			OK:                 true,
		}
		
		if _, err := h.bot.Request(config); err != nil {
			log.Printf("Error answering pre-checkout query: %v", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
