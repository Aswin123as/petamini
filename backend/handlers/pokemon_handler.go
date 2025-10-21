package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// PokemonHandler handles Pokemon-related HTTP requests
type PokemonHandler struct {
	db *mongo.Database
}

// NewPokemonHandler creates a new pokemon handler
func NewPokemonHandler(db *mongo.Database) *PokemonHandler {
	return &PokemonHandler{
		db: db,
	}
}

// GetAllPokemon handles GET /api/pokemons
func (h *PokemonHandler) GetAllPokemon(c *gin.Context) {
	ctx := c.Request.Context()

	cursor, err := h.db.Collection("pokemons").Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pokemon"})
		return
	}
	defer cursor.Close(ctx)

	var pokemons []bson.M
	if err := cursor.All(ctx, &pokemons); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode pokemon"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pokemons": pokemons,
		"total":    len(pokemons),
	})
}

// GetPokemonByID handles GET /api/pokemons/:id
func (h *PokemonHandler) GetPokemonByID(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	var pokemon bson.M
	err := h.db.Collection("pokemons").FindOne(ctx, bson.M{"_id": id}).Decode(&pokemon)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pokemon not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pokemon"})
		return
	}

	c.JSON(http.StatusOK, pokemon)
}
