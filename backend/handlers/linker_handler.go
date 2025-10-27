package handlers

import (
	"context"
	"math"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
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

	// Default DB-side sorting
	sortOption := bson.D{{Key: "timestamp", Value: -1}}
	if sortBy == "popular" {
		// We'll fetch recent posts first (time-desc) then apply app-side ranking with recency and quality weights.
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

	if sortBy == "popular" {
		// Compute a lightweight trending score per post:
		// score = promotions + 0.25*sqrt(promotions) + recencyBoost
		// recencyBoost = max(0, 48 - ageHours) * 0.05 (recent posts get a small lift up to 48h)
		now := time.Now()
		type scored struct {
			l     models.Linker
			score float64
		}
		scoredList := make([]scored, 0, len(linkers))
		for _, l := range linkers {
			ageHours := now.Sub(l.Timestamp).Hours()
			if ageHours < 0 {
				ageHours = 0
			}
			recencyBoost := math.Max(0, 48-ageHours) * 0.05
			promo := float64(l.Promotions)
			s := promo + 0.25*math.Sqrt(math.Max(0, promo)) + recencyBoost
			scoredList = append(scoredList, scored{l: l, score: s})
		}
		sort.Slice(scoredList, func(i, j int) bool { return scoredList[i].score > scoredList[j].score })
		// Write back in ranked order
		ranked := make([]models.Linker, 0, len(scoredList))
		for _, it := range scoredList {
			ranked = append(ranked, it.l)
		}
		c.JSON(http.StatusOK, ranked)
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

	// Validate content is not empty (tags alone are not allowed)
	trimmedContent := strings.TrimSpace(linker.Content)
	if trimmedContent == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content is required. Tags alone cannot be posted."})
		return
	}

	// Validate content length (250 characters max)
	if len(trimmedContent) > 250 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content must be 250 characters or less"})
		return
	}

	// Extract URLs from content
	linker.Links = extractURLs(linker.Content)

	// Initialize tags as empty array if nil
	if linker.Tags == nil {
		linker.Tags = []string{}
	}

	// Initialize links as empty array if nil (in case no URLs extracted)
	if linker.Links == nil {
		linker.Links = []string{}
	}

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
		// Log the actual error for debugging
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create linker",
			"details": err.Error(),
		})
		return
	}

	// Update user's post count and activity
	usersCol := h.db.Collection("users")
	_, _ = usersCol.UpdateOne(ctx,
		bson.M{"telegram_id": linker.UserID},
		bson.M{
			"$set": bson.M{
				"username":    linker.Username,
				"updated_at":  time.Now(),
				"last_active": time.Now(),
			},
			"$setOnInsert": bson.M{
				"telegram_id":     linker.UserID,
				"posts_count":     0,
				"promotions_made": 0,
				"role":            "user",
				"is_banned":       false,
				"created_at":      time.Now(),
			},
			"$inc": bson.M{"posts_count": 1},
		},
		options.Update().SetUpsert(true),
	)

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

	// Atomic one-time promote: only update if userID not already in promoted_by
	filter := bson.M{"_id": objectID, "promoted_by": bson.M{"$ne": userID}}
	update := bson.M{
		"$inc":  bson.M{"promotions": 1},
		"$push": bson.M{"promoted_by": userID},
	}
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)

	var updatedLinker models.Linker
	err = collection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&updatedLinker)
	if err == mongo.ErrNoDocuments {
		// Already promoted or linker not found; fetch current doc to return
		var current models.Linker
		if err2 := collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&current); err2 != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Linker not found"})
			return
		}
		// Return existing state without changes
		c.JSON(http.StatusOK, current)
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update linker"})
		return
	}

	// Increment user's promotions_made and update activity (only when promotion actually happened)
	usersCol := h.db.Collection("users")
	_, _ = usersCol.UpdateOne(ctx,
		bson.M{"telegram_id": userID},
		bson.M{
			"$set": bson.M{
				"updated_at":  time.Now(),
				"last_active": time.Now(),
			},
			"$setOnInsert": bson.M{
				"posts_count":     0,
				"promotions_made": 0,
				"role":            "user",
				"is_banned":       false,
				"created_at":      time.Now(),
				"telegram_id":     userID,
			},
			"$inc": bson.M{"promotions_made": 1},
		},
		options.Update().SetUpsert(true),
	)

	c.JSON(http.StatusOK, updatedLinker)
}

// UpdateLinker updates a linker's content and tags
func (h *LinkerHandler) UpdateLinker(c *gin.Context) {
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

	// Parse request body
	var updateReq struct {
		Content string   `json:"content" binding:"required"`
		Tags    []string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate content is not empty (tags alone are not allowed)
	trimmedContent := strings.TrimSpace(updateReq.Content)
	if trimmedContent == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content is required. Tags alone cannot be posted."})
		return
	}

	// Validate content length (250 characters max)
	if len(trimmedContent) > 250 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content must be 250 characters or less"})
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
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own posts"})
		return
	}

	// Extract URLs from updated content
	updatedLinks := extractURLs(updateReq.Content)

	// Initialize arrays as empty if nil to avoid MongoDB issues
	if updateReq.Tags == nil {
		updateReq.Tags = []string{}
	}
	if updatedLinks == nil {
		updatedLinks = []string{}
	}

	// Update the linker
	update := bson.M{
		"$set": bson.M{
			"content": updateReq.Content,
			"tags":    updateReq.Tags,
			"links":   updatedLinks,
		},
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
