package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/Aswin123as/petamini-backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// PaymentService handles all payment-related operations
type PaymentService struct {
	db                   *mongo.Database
	bot                  *tgbotapi.BotAPI
	paymentProviderToken string
}

// NewPaymentService creates a new payment service
func NewPaymentService(db *mongo.Database, bot *tgbotapi.BotAPI, providerToken string) *PaymentService {
	return &PaymentService{
		db:                   db,
		bot:                  bot,
		paymentProviderToken: providerToken,
	}
}

// CreateInvoice creates a Telegram Stars payment invoice
func (ps *PaymentService) CreateInvoice(ctx context.Context, req models.CreateInvoiceRequest) (*models.CreateInvoiceResponse, error) {
	// Get Pokemon details
	pokemon, err := ps.getPokemon(ctx, req.PokemonID)
	if err != nil {
		return nil, fmt.Errorf("failed to get pokemon: %w", err)
	}

	// Check if enough units are available
	if pokemon.AvailableUnits < req.Units {
		return nil, errors.New("not enough units available")
	}

	// Calculate total stars
	totalStars := pokemon.PricePerUnit * req.Units

	// Generate unique payload
	payload := ps.generatePayload()

	// Create purchase record with pending status
	purchase := models.Purchase{
		ID:             primitive.NewObjectID(),
		UserID:         req.UserID,
		PokemonID:      req.PokemonID,
		PokemonName:    pokemon.Name,
		Units:          req.Units,
		TotalStars:     totalStars,
		Status:         "pending",
		InvoicePayload: payload,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	_, err = ps.db.Collection("purchases").InsertOne(ctx, purchase)
	if err != nil {
		return nil, fmt.Errorf("failed to create purchase record: %w", err)
	}

	// Create invoice using Telegram Bot API
	invoice := tgbotapi.NewInvoice(
		req.UserID,
		fmt.Sprintf("%s Pokemon Card", pokemon.Name),
		fmt.Sprintf("Purchase %d units of %s Pokemon card", req.Units, pokemon.Name),
		payload,
		"", // providerToken - Empty for Telegram Stars
		"XTR", // currency - Telegram Stars currency
		"", // providerData - Empty for Telegram Stars
		[]tgbotapi.LabeledPrice{
			{
				Label:  fmt.Sprintf("%s x%d", pokemon.Name, req.Units),
				Amount: totalStars,
			},
		},
	)

	// Send invoice
	_, err = ps.bot.Send(invoice)
	if err != nil {
		return nil, fmt.Errorf("failed to send invoice: %w", err)
	}

	log.Printf("Invoice created for user %d: %s (%d stars)", req.UserID, pokemon.Name, totalStars)

	return &models.CreateInvoiceResponse{
		InvoiceLink:    fmt.Sprintf("https://t.me/%s?start=invoice_%s", ps.bot.Self.UserName, payload),
		InvoicePayload: payload,
		TotalStars:     totalStars,
	}, nil
}

// ProcessSuccessfulPayment processes a successful payment from Telegram
func (ps *PaymentService) ProcessSuccessfulPayment(ctx context.Context, payment *tgbotapi.SuccessfulPayment, userID int64, username string) error {
	log.Printf("Processing payment: %+v", payment)

	// Find the purchase by payload
	var purchase models.Purchase
	err := ps.db.Collection("purchases").FindOne(ctx, bson.M{
		"invoice_payload": payment.InvoicePayload,
		"status":          "pending",
	}).Decode(&purchase)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errors.New("purchase not found or already processed")
		}
		return fmt.Errorf("failed to find purchase: %w", err)
	}

	// Start a transaction to ensure atomic operations
	session, err := ps.db.Client().StartSession()
	if err != nil {
		return fmt.Errorf("failed to start session: %w", err)
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sessCtx mongo.SessionContext) (interface{}, error) {
		// Update purchase status
		_, err := ps.db.Collection("purchases").UpdateOne(sessCtx, bson.M{
			"_id": purchase.ID,
		}, bson.M{
			"$set": bson.M{
				"status":              "completed",
				"telegram_payment_id": payment.TelegramPaymentChargeID,
				"username":            username,
				"updated_at":          time.Now(),
			},
		})
		if err != nil {
			return nil, fmt.Errorf("failed to update purchase: %w", err)
		}

		// Decrease available units for the Pokemon
		objID, _ := primitive.ObjectIDFromHex(purchase.PokemonID)
		_, err = ps.db.Collection("pokemons").UpdateOne(sessCtx, bson.M{
			"_id": objID,
		}, bson.M{
			"$inc": bson.M{
				"available_units": -purchase.Units,
			},
			"$set": bson.M{
				"updated_at": time.Now(),
			},
		})
		if err != nil {
			return nil, fmt.Errorf("failed to update pokemon units: %w", err)
		}

		// Update or create user record
		_, err = ps.db.Collection("users").UpdateOne(sessCtx, bson.M{
			"telegram_id": userID,
		}, bson.M{
			"$setOnInsert": bson.M{
				"telegram_id": userID,
				"username":    username,
				"created_at":  time.Now(),
			},
			"$inc": bson.M{
				"total_stars_spent": purchase.TotalStars,
			},
			"$push": bson.M{
				"purchased_cards": models.OwnedPokemon{
					PokemonID:   purchase.PokemonID,
					PokemonName: purchase.PokemonName,
					Units:       purchase.Units,
					PurchasedAt: time.Now(),
				},
			},
			"$set": bson.M{
				"updated_at": time.Now(),
			},
		}, options.Update().SetUpsert(true))

		if err != nil {
			return nil, fmt.Errorf("failed to update user: %w", err)
		}

		return nil, nil
	})

	if err != nil {
		return fmt.Errorf("transaction failed: %w", err)
	}

	log.Printf("✅ Payment processed successfully for user %d: %s (%d units)", userID, purchase.PokemonName, purchase.Units)
	return nil
}

// GetPaymentStatus retrieves the status of a payment
func (ps *PaymentService) GetPaymentStatus(ctx context.Context, invoicePayload string) (*models.PaymentStatusResponse, error) {
	var purchase models.Purchase
	err := ps.db.Collection("purchases").FindOne(ctx, bson.M{
		"invoice_payload": invoicePayload,
	}).Decode(&purchase)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("purchase not found")
		}
		return nil, fmt.Errorf("failed to find purchase: %w", err)
	}

	response := &models.PaymentStatusResponse{
		Status:     purchase.Status,
		PurchaseID: purchase.ID.Hex(),
	}

	if purchase.Status == "completed" {
		response.CompletedAt = purchase.UpdatedAt
	}

	return response, nil
}

// getPokemon retrieves a Pokemon from the database
func (ps *PaymentService) getPokemon(ctx context.Context, pokemonID string) (*models.Pokemon, error) {
	objID, err := primitive.ObjectIDFromHex(pokemonID)
	if err != nil {
		return nil, errors.New("invalid pokemon ID")
	}

	var pokemon models.Pokemon
	err = ps.db.Collection("pokemons").FindOne(ctx, bson.M{
		"_id": objID,
	}).Decode(&pokemon)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("pokemon not found")
		}
		return nil, err
	}

	return &pokemon, nil
}

// generatePayload generates a unique payload for invoice tracking
func (ps *PaymentService) generatePayload() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// GetUserPurchases retrieves all purchases for a user
func (ps *PaymentService) GetUserPurchases(ctx context.Context, userID int64) ([]models.Purchase, error) {
	cursor, err := ps.db.Collection("purchases").Find(ctx, bson.M{
		"user_id": userID,
		"status":  "completed",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to find purchases: %w", err)
	}
	defer cursor.Close(ctx)

	var purchases []models.Purchase
	if err = cursor.All(ctx, &purchases); err != nil {
		return nil, fmt.Errorf("failed to decode purchases: %w", err)
	}

	return purchases, nil
}
