package handlers

import (
	"context"
	"net/http"
	"regexp"
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

// extractURLs extracts all URLs from a text string
func extractURLs(text string) []string {
	// Regular expression to match URLs
	urlPattern := `https?://[^\s<>"{}|\\^\[\]` + "`" + `]+`
	re := regexp.MustCompile(urlPattern)
	matches := re.FindAllString(text, -1)
	
	// Remove duplicates
	seen := make(map[string]bool)
	var urls []string
	for _, url := range matches {
		if !seen[url] {
			seen[url] = true
			urls = append(urls, url)
		}
	}
	
	return urls
}

// CheckDuplicateLink checks if a URL has already been posted
func (h *LinkerHandler) CheckDuplicateLink(c *gin.Context) {
	url := c.Query("url")
	if url == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL parameter is required"})
		return
	}

	collection := h.db.Collection("linkers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if a linker with this URL exists and type is 'url'
	var existingLinker models.Linker
	err := collection.FindOne(ctx, bson.M{
		"content": url,
		"type":    "url",
	}).Decode(&existingLinker)

	if err == mongo.ErrNoDocuments {
		// URL doesn't exist - safe to post
		c.JSON(http.StatusOK, gin.H{"exists": false})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check duplicate"})
		return
	}

	// URL already exists
	c.JSON(http.StatusOK, gin.H{
		"exists":    true,
		"linker":    existingLinker,
		"message":   "This link has already been posted",
	})
}

// CreateLinker creates a new linker post
func (h *LinkerHandler) CreateLinker(c *gin.Context) {
	var linker models.Linker
	if err := c.ShouldBindJSON(&linker); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate user ID
	if linker.UserID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Extract URLs from content
	linker.Links = extractURLs(linker.Content)

	collection := h.db.Collection("linkers")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check for duplicate links if any URLs found
	if len(linker.Links) > 0 {
		for _, link := range linker.Links {
			var existingLinker models.Linker
			err := collection.FindOne(ctx, bson.M{
				"links": link,
			}).Decode(&existingLinker)

			if err == nil {
				// Link already exists
				c.JSON(http.StatusConflict, gin.H{
					"error":   "duplicate_link",
					"message": "This link has already been posted",
					"link":    link,
					"existingPost": existingLinker,
				})
				return
			}
		}
	}

	// Set default values
	linker.ID = primitive.NewObjectID()
	linker.Promotions = 0
	linker.Timestamp = time.Now()
	linker.CreatedAt = time.Now()
	linker.PromotedBy = []int64{}

	_, err := collection.InsertOne(ctx, linker)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create linker"})
		return
	}

	c.JSON(http.StatusCreated, linker)
}

// PromoteLinker promotes a linker post (one user can promote only once, non-toggleable)
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

	// If already promoted, return current state (no toggle - one promotion only)
	if hasPromoted {
		c.JSON(http.StatusOK, linker)
		return
	}

	// Add promotion (first time only)
	update := bson.M{
		"$inc":  bson.M{"promotions": 1},
		"$push": bson.M{"promotedBy": userID},
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
