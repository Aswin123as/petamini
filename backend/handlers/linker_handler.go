package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/Aswin123as/petamini-backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// LinkerHandler handles Linker-related HTTP requests
type LinkerHandler struct {
	db *mongo.Database
}

// NewLinkerHandler creates a new linker handler
func NewLinkerHandler(db *mongo.Database) *LinkerHandler {
	return &LinkerHandler{
		db: db,
	}
}

// GetAllLinkers retrieves all linker posts
func (h *LinkerHandler) GetAllLinkers(c *gin.Context) {
	collection := h.db.Collection("linkers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get sort parameter (recent or popular)
	sortBy := c.DefaultQuery("sort", "recent")

	// Set up sorting options
	var sortOption bson.D
	if sortBy == "popular" {
		sortOption = bson.D{{Key: "promotions", Value: -1}}
	} else {
		sortOption = bson.D{{Key: "timestamp", Value: -1}}
	}

	opts := options.Find().SetSort(sortOption)

	cursor, err := collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch linkers"})
		return
	}
	defer cursor.Close(ctx)

	var linkers []models.Linker
	if err = cursor.All(ctx, &linkers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode linkers"})
		return
	}

	c.JSON(http.StatusOK, linkers)
}

// CreateLinker creates a new linker post
func (h *LinkerHandler) CreateLinker(c *gin.Context) {
	var linker models.Linker
	if err := c.ShouldBindJSON(&linker); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values
	linker.ID = primitive.NewObjectID()
	linker.Promotions = 0
	linker.Timestamp = time.Now()
	linker.PromotedBy = []int64{}

	// Validate user ID
	if linker.UserID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := h.db.Collection("linkers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, linker)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create linker"})
		return
	}

	c.JSON(http.StatusCreated, linker)
}

// PromoteLinker promotes or unpromotes a linker post
func (h *LinkerHandler) PromoteLinker(c *gin.Context) {
	linkerID := c.Param("id")
	userIDStr := c.Query("userId")

	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(linkerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid linker ID"})
		return
	}

	collection := h.db.Collection("linkers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find the linker
	var linker models.Linker
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&linker)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Linker not found"})
		return
	}

	// Check if user already promoted
	hasPromoted := false
	for _, id := range linker.PromotedBy {
		if id == userID {
			hasPromoted = true
			break
		}
	}

	var update bson.M
	if hasPromoted {
		// Remove promotion
		update = bson.M{
			"$inc":  bson.M{"promotions": -1},
			"$pull": bson.M{"promotedBy": userID},
		}
	} else {
		// Add promotion
		update = bson.M{
			"$inc":  bson.M{"promotions": 1},
			"$push": bson.M{"promotedBy": userID},
		}
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedLinker models.Linker
	err = collection.FindOneAndUpdate(ctx, bson.M{"_id": objectID}, update, opts).Decode(&updatedLinker)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update linker"})
		return
	}

	c.JSON(http.StatusOK, updatedLinker)
}

// DeleteLinker deletes a linker post
func (h *LinkerHandler) DeleteLinker(c *gin.Context) {
	linkerID := c.Param("id")
	userIDStr := c.Query("userId")

	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(linkerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid linker ID"})
		return
	}

	collection := h.db.Collection("linkers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find the linker to check ownership
	var linker models.Linker
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&linker)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Linker not found"})
		return
	}

	// Check if the user owns this linker
	if linker.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own posts"})
		return
	}

	_, err = collection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete linker"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Linker deleted successfully"})
}

// GetLinkersByTag retrieves linkers filtered by tag
func (h *LinkerHandler) GetLinkersByTag(c *gin.Context) {
	tag := c.Param("tag")
	if tag == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tag is required"})
		return
	}

	collection := h.db.Collection("linkers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"tags": bson.M{"$in": []string{tag}}}
	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}})

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch linkers"})
		return
	}
	defer cursor.Close(ctx)

	var linkers []models.Linker
	if err = cursor.All(ctx, &linkers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode linkers"})
		return
	}

	c.JSON(http.StatusOK, linkers)
}
