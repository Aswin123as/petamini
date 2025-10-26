package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/Aswin123as/petamini-backend/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AccessHandler struct {
	db *mongo.Database
}

func NewAccessHandler(db *mongo.Database) *AccessHandler {
	return &AccessHandler{db: db}
}

// TrackPageAccess logs when a user accesses a page
func (h *AccessHandler) TrackPageAccess(c *gin.Context) {
	var req models.TrackUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := h.db.Collection("page_accesses")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check for duplicate access within last 5 minutes to prevent spam
	fiveMinutesAgo := time.Now().Add(-5 * time.Minute)
	existingAccess, err := collection.CountDocuments(ctx, bson.M{
		"user_id":   req.UserID,
		"page_url":  req.PageURL,
		"timestamp": bson.M{"$gte": fiveMinutesAgo},
	})
	if err == nil && existingAccess > 0 {
		// Already tracked recently, return success without creating duplicate
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Access already tracked recently",
		})
		return
	}

	// Get user agent and IP
	userAgent := c.GetHeader("User-Agent")
	ipAddress := c.ClientIP()

	// Create page access record
	pageAccess := models.PageAccess{
		UserID:    req.UserID,
		Username:  req.Username,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		PageURL:   req.PageURL,
		UserAgent: userAgent,
		IPAddress: ipAddress,
		Timestamp: time.Now(),
		CreatedAt: time.Now(),
	}

	_, err = collection.InsertOne(ctx, pageAccess)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track access"})
		return
	}

	// Also update or create user profile to track last seen
	userCollection := h.db.Collection("users")
	filter := bson.M{"telegram_id": req.UserID}
	update := bson.M{
		"$set": bson.M{
			"telegram_id": req.UserID,
			"username":    req.Username,
			"first_name":  req.FirstName,
			"last_name":   req.LastName,
			"updated_at":  time.Now(),
		},
		"$setOnInsert": bson.M{
			"created_at":      time.Now(),
			"purchased_cards": []models.OwnedPokemon{},
			"total_purchases": 0,
			"total_spent":     0,
		},
	}
	opts := options.Update().SetUpsert(true)
	_, err = userCollection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		// Log error but don't fail the request
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Access tracked, but user profile update failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User access tracked successfully",
	})
}

// GetPageAccessStats returns statistics about page accesses
func (h *AccessHandler) GetPageAccessStats(c *gin.Context) {
	collection := h.db.Collection("page_accesses")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Total access count
	totalCount, err := collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stats"})
		return
	}

	// Unique users count
	uniqueUsers, err := collection.Distinct(ctx, "user_id", bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unique users"})
		return
	}

	// Recent accesses (last 24 hours)
	yesterday := time.Now().Add(-24 * time.Hour)
	recentCount, err := collection.CountDocuments(ctx, bson.M{
		"timestamp": bson.M{"$gte": yesterday},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recent stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"totalAccesses":   totalCount,
		"uniqueUsers":     len(uniqueUsers),
		"last24Hours":     recentCount,
		"timestamp":       time.Now(),
	})
}

// GetUserAccessHistory returns access history for a specific user
func (h *AccessHandler) GetUserAccessHistory(c *gin.Context) {
	userID := c.Param("userId")
	
	collection := h.db.Collection("page_accesses")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Parse userID
	var telegramID int64
	if _, err := fmt.Sscanf(userID, "%d", &telegramID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get limit parameter (default 50, max 100)
	limit := int64(50)
	if limitParam := c.Query("limit"); limitParam != "" {
		var parsedLimit int64
		if _, err := fmt.Sscanf(limitParam, "%d", &parsedLimit); err == nil {
			if parsedLimit > 0 && parsedLimit <= 100 {
				limit = parsedLimit
			}
		}
	}

	// Find all accesses for this user
	opts := options.Find().SetSort(bson.M{"timestamp": -1}).SetLimit(limit)
	cursor, err := collection.Find(ctx, bson.M{"user_id": telegramID}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get access history"})
		return
	}
	defer cursor.Close(ctx)

	var accesses []models.PageAccess
	if err := cursor.All(ctx, &accesses); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode access history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"userId":   telegramID,
		"accesses": accesses,
		"count":    len(accesses),
		"limit":    limit,
	})
}

// GetDailyAccessStats returns access statistics grouped by day
func (h *AccessHandler) GetDailyAccessStats(c *gin.Context) {
	collection := h.db.Collection("page_accesses")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get days parameter (default to last 30 days)
	days := 30
	if daysParam := c.Query("days"); daysParam != "" {
		var parsedDays int
		if _, err := fmt.Sscanf(daysParam, "%d", &parsedDays); err == nil {
			if parsedDays > 0 && parsedDays <= 365 {
				days = parsedDays
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Days parameter must be between 1 and 365"})
				return
			}
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid days parameter"})
			return
		}
	}

	// Calculate start date
	startDate := time.Now().AddDate(0, 0, -days)
	startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())

	// Aggregation pipeline to group by day
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"timestamp": bson.M{"$gte": startDate},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{
				"$dateToString": bson.M{
					"format": "%Y-%m-%d",
					"date":   "$timestamp",
				},
			},
			"count": bson.M{"$sum": 1},
			"uniqueUsers": bson.M{"$addToSet": "$user_id"},
		}}},
		{{Key: "$project", Value: bson.M{
			"_id":         0,
			"date":        "$_id",
			"count":       1,
			"uniqueUsers": bson.M{"$size": "$uniqueUsers"},
		}}},
		{{Key: "$sort", Value: bson.M{"date": -1}}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get daily stats"})
		return
	}
	defer cursor.Close(ctx)

	type DailyStat struct {
		Date        string `bson:"date" json:"date"`
		Count       int    `bson:"count" json:"count"`
		UniqueUsers int    `bson:"uniqueUsers" json:"uniqueUsers"`
	}

	var dailyStats []DailyStat
	if err := cursor.All(ctx, &dailyStats); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode daily stats"})
		return
	}

	// Return empty array if no data found
	if dailyStats == nil {
		dailyStats = []DailyStat{}
	}

	c.JSON(http.StatusOK, gin.H{
		"dailyStats": dailyStats,
		"period":     days,
		"startDate":  startDate.Format("2006-01-02"),
		"endDate":    time.Now().Format("2006-01-02"),
	})
}
