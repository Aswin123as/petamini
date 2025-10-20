package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Pokemon represents a Pokemon entity in the database
type Pokemon struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PokemonID      int                `bson:"pokemon_id" json:"pokemonId"`
	Name           string             `bson:"name" json:"name"`
	Image          string             `bson:"image" json:"image"`
	Types          []string           `bson:"types" json:"types"`
	Height         float64            `bson:"height" json:"height"`
	Weight         float64            `bson:"weight" json:"weight"`
	Rarity         string             `bson:"rarity" json:"rarity"` // common, rare, legendary
	TotalUnits     int                `bson:"total_units" json:"totalUnits"`
	AvailableUnits int                `bson:"available_units" json:"availableUnits"`
	PricePerUnit   int                `bson:"price_per_unit" json:"pricePerUnit"` // In Telegram Stars
	CreatedAt      time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updated_at" json:"updatedAt"`
}

// Purchase represents a purchase transaction
type Purchase struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID            int64              `bson:"user_id" json:"userId"`           // Telegram User ID
	Username          string             `bson:"username" json:"username"`
	PokemonID         string             `bson:"pokemon_id" json:"pokemonId"`     // Pokemon ObjectID
	PokemonName       string             `bson:"pokemon_name" json:"pokemonName"`
	Units             int                `bson:"units" json:"units"`
	TotalStars        int                `bson:"total_stars" json:"totalStars"`
	Status            string             `bson:"status" json:"status"` // pending, completed, failed, refunded
	TelegramPaymentID string             `bson:"telegram_payment_id" json:"telegramPaymentId"`
	InvoicePayload    string             `bson:"invoice_payload" json:"invoicePayload"`
	CreatedAt         time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt         time.Time          `bson:"updated_at" json:"updatedAt"`
}

// User represents a user in the system
type User struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TelegramID     int64              `bson:"telegram_id" json:"telegramId"`
	Username       string             `bson:"username" json:"username"`
	FirstName      string             `bson:"first_name" json:"firstName"`
	LastName       string             `bson:"last_name" json:"lastName"`
	PurchasedCards []OwnedPokemon     `bson:"purchased_cards" json:"purchasedCards"`
	TotalPurchases int                `bson:"total_purchases" json:"totalPurchases"` // Number of purchases
	TotalSpent     int                `bson:"total_spent" json:"totalSpent"`         // Total stars spent
	CreatedAt      time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updated_at" json:"updatedAt"`
}

// OwnedPokemon represents a Pokemon owned by a user
type OwnedPokemon struct {
	PokemonID   string    `bson:"pokemon_id" json:"pokemonId"`
	PokemonName string    `bson:"pokemon_name" json:"pokemonName"`
	Units       int       `bson:"units" json:"units"`
	PurchasedAt time.Time `bson:"purchased_at" json:"purchasedAt"`
}

// CreateInvoiceRequest represents the request to create an invoice
type CreateInvoiceRequest struct {
	PokemonID string `json:"pokemonId" binding:"required"`
	Units     int    `json:"units" binding:"required,min=1"`
	UserID    int64  `json:"userId" binding:"required"`
}

// CreateInvoiceResponse represents the response with invoice details
type CreateInvoiceResponse struct {
	InvoiceLink    string `json:"invoiceLink"`
	InvoicePayload string `json:"invoicePayload"`
	TotalStars     int    `json:"totalStars"`
}

// PaymentStatusRequest represents a request to check payment status
type PaymentStatusRequest struct {
	InvoicePayload string `json:"invoicePayload" binding:"required"`
}

// PaymentStatusResponse represents the payment status response
type PaymentStatusResponse struct {
	Status      string    `json:"status"`
	PurchaseID  string    `json:"purchaseId,omitempty"`
	CompletedAt time.Time `json:"completedAt,omitempty"`
}

// UserStats represents user statistics
type UserStats struct {
	TelegramID     int64     `json:"telegramId"`
	Username       string    `json:"username"`
	TotalCards     int       `json:"totalCards"`
	UniquePokemon  int       `json:"uniquePokemon"`
	TotalPurchases int       `json:"totalPurchases"`
	TotalSpent     int       `json:"totalSpent"`
	MemberSince    time.Time `json:"memberSince"`
	LastPurchase   time.Time `json:"lastPurchase"`
}

// LeaderboardEntry represents a single entry in the leaderboard
type LeaderboardEntry struct {
	Rank           int    `json:"rank"`
	TelegramID     int64  `json:"telegramId"`
	Username       string `json:"username"`
	TotalCards     int    `json:"totalCards"`
	TotalPurchases int    `json:"totalPurchases"`
	TotalSpent     int    `json:"totalSpent"`
}
