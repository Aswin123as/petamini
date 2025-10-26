package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/Aswin123as/petamini-backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// UserService handles all user-related operations
type UserService struct {
	db *mongo.Database
}

// NewUserService creates a new user service
func NewUserService(db *mongo.Database) *UserService {
	return &UserService{
		db: db,
	}
}

// CreateOrUpdateUser creates a new user or updates existing user info
func (us *UserService) CreateOrUpdateUser(ctx context.Context, telegramID int64, username, firstName, lastName string) error {
	collection := us.db.Collection("users")

	filter := bson.M{"telegram_id": telegramID}
	update := bson.M{
		"$set": bson.M{
			"username":   username,
			"first_name": firstName,
			"last_name":  lastName,
			"updated_at": time.Now(),
			"last_active": time.Now(),
		},
		"$setOnInsert": bson.M{
			"telegram_id":      telegramID,
			"purchased_cards":  []models.OwnedPokemon{},
			"total_purchases":  0,
			"total_spent":      0,
			// Linkers app defaults
			"posts_count":      0,
			"promotions_made":  0,
			"role":             "user",
			"is_banned":        false,
			"created_at":       time.Now(),
		},
	}

	opts := options.Update().SetUpsert(true)
	result, err := collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("failed to create/update user: %w", err)
	}

	if result.UpsertedCount > 0 {
		log.Printf("New user created: %s (ID: %d)", username, telegramID)
	}

	return nil
}

// GetUserByTelegramID retrieves a user by their Telegram ID
func (us *UserService) GetUserByTelegramID(ctx context.Context, telegramID int64) (*models.User, error) {
	collection := us.db.Collection("users")

	var user models.User
	err := collection.FindOne(ctx, bson.M{"telegram_id": telegramID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	return &user, nil
}

// GetUserByID retrieves a user by their MongoDB ID
func (us *UserService) GetUserByID(ctx context.Context, userID primitive.ObjectID) (*models.User, error) {
	collection := us.db.Collection("users")

	var user models.User
	err := collection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	return &user, nil
}

// GetTopCollectors retrieves top collectors sorted by total spent
func (us *UserService) GetTopCollectors(ctx context.Context, limit int) ([]models.User, error) {
	collection := us.db.Collection("users")

	opts := options.Find().
		SetSort(bson.D{{Key: "total_spent", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to find top collectors: %w", err)
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		return nil, fmt.Errorf("failed to decode users: %w", err)
	}

	return users, nil
}

// GetUserStats retrieves statistics for a user
func (us *UserService) GetUserStats(ctx context.Context, telegramID int64) (*models.UserStats, error) {
	user, err := us.GetUserByTelegramID(ctx, telegramID)
	if err != nil {
		return nil, err
	}

	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	// Calculate unique Pokemon count
	uniquePokemon := make(map[string]bool)
	totalCards := 0
	for _, card := range user.PurchasedCards {
		uniquePokemon[card.PokemonName] = true
		totalCards += card.Units
	}

	stats := &models.UserStats{
		TelegramID:      user.TelegramID,
		Username:        user.Username,
		TotalCards:      totalCards,
		UniquePokemon:   len(uniquePokemon),
		TotalPurchases:  user.TotalPurchases,
		TotalSpent:      user.TotalSpent,
		MemberSince:     user.CreatedAt,
		LastPurchase:    user.UpdatedAt,
	}

	return stats, nil
}

// GetUserCollection retrieves a user's Pokemon collection
func (us *UserService) GetUserCollection(ctx context.Context, telegramID int64) ([]models.OwnedPokemon, error) {
	user, err := us.GetUserByTelegramID(ctx, telegramID)
	if err != nil {
		return nil, err
	}

	if user == nil {
		return []models.OwnedPokemon{}, nil
	}

	return user.PurchasedCards, nil
}

// UpdateUserStats updates user statistics after a purchase
func (us *UserService) UpdateUserStats(ctx context.Context, telegramID int64, purchaseAmount int) error {
	collection := us.db.Collection("users")

	filter := bson.M{"telegram_id": telegramID}
	update := bson.M{
		"$inc": bson.M{
			"total_purchases": 1,
			"total_spent":     purchaseAmount,
		},
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update user stats: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// GetLeaderboard retrieves leaderboard with rankings
func (us *UserService) GetLeaderboard(ctx context.Context, limit int) ([]models.LeaderboardEntry, error) {
	users, err := us.GetTopCollectors(ctx, limit)
	if err != nil {
		return nil, err
	}

	leaderboard := make([]models.LeaderboardEntry, len(users))
	for i, user := range users {
		totalCards := 0
		for _, card := range user.PurchasedCards {
			totalCards += card.Units
		}

		leaderboard[i] = models.LeaderboardEntry{
			Rank:           i + 1,
			TelegramID:     user.TelegramID,
			Username:       user.Username,
			TotalCards:     totalCards,
			TotalPurchases: user.TotalPurchases,
			TotalSpent:     user.TotalSpent,
		}
	}

	return leaderboard, nil
}
