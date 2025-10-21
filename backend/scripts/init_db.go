package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration from environment
	mongoURI := os.Getenv("MONGODB_URI")
	dbName := os.Getenv("DATABASE_NAME")

	if mongoURI == "" || dbName == "" {
		log.Fatal("❌ MONGODB_URI and DATABASE_NAME must be set in .env file")
	}

	fmt.Println("🔄 Initializing database...")
	fmt.Println("Database Name:", dbName)

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("❌ Failed to connect: %v", err)
	}
	defer client.Disconnect(ctx)

	// Ping database
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("❌ Failed to ping database: %v", err)
	}

	fmt.Println("✅ Connected to MongoDB successfully")

	db := client.Database(dbName)

	// Create collections
	createCollections(ctx, db)

	// Create indexes
	createIndexes(ctx, db)

	// Optionally seed data
	seedData(ctx, db)

	fmt.Println("✅ Database initialization complete!")
}

func createCollections(ctx context.Context, db *mongo.Database) {
	collections := []string{"pokemons", "purchases", "users"}

	for _, coll := range collections {
		err := db.CreateCollection(ctx, coll)
		if err != nil {
			// Collection might already exist
			fmt.Printf("⚠️  Collection '%s' might already exist\n", coll)
		} else {
			fmt.Printf("✅ Created collection: %s\n", coll)
		}
	}
}

func createIndexes(ctx context.Context, db *mongo.Database) {
	fmt.Println("\n🔄 Creating indexes...")

	// Pokemons indexes
	pokemonsIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "pokemon_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "rarity", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "available_units", Value: -1}},
		},
	}
	_, err := db.Collection("pokemons").Indexes().CreateMany(ctx, pokemonsIndexes)
	if err != nil {
		fmt.Printf("⚠️  Error creating pokemon indexes: %v\n", err)
	} else {
		fmt.Println("✅ Created indexes for 'pokemons' collection")
	}

	// Purchases indexes
	purchasesIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "user_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "invoice_payload", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
	}
	_, err = db.Collection("purchases").Indexes().CreateMany(ctx, purchasesIndexes)
	if err != nil {
		fmt.Printf("⚠️  Error creating purchase indexes: %v\n", err)
	} else {
		fmt.Println("✅ Created indexes for 'purchases' collection")
	}

	// Users indexes
	usersIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "telegram_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "username", Value: 1}},
		},
	}
	_, err = db.Collection("users").Indexes().CreateMany(ctx, usersIndexes)
	if err != nil {
		fmt.Printf("⚠️  Error creating user indexes: %v\n", err)
	} else {
		fmt.Println("✅ Created indexes for 'users' collection")
	}
}

func seedData(ctx context.Context, db *mongo.Database) {
	fmt.Println("\n🔄 Seeding sample data...")

	// Check if data already exists
	count, err := db.Collection("pokemons").CountDocuments(ctx, bson.M{})
	if err != nil {
		fmt.Printf("⚠️  Error checking collection: %v\n", err)
		return
	}

	if count > 0 {
		fmt.Println("⚠️  Data already exists, skipping seed")
		return
	}

	// Sample Pokemon data
	samplePokemons := []interface{}{
		bson.M{
			"pokemon_id":      1,
			"name":            "Bulbasaur",
			"image":           "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
			"types":           []string{"grass", "poison"},
			"height":          7,
			"weight":          69,
			"rarity":          "common",
			"total_units":     100,
			"available_units": 75,
			"price_per_unit":  5,
			"created_at":      time.Now(),
			"updated_at":      time.Now(),
		},
		bson.M{
			"pokemon_id":      4,
			"name":            "Charmander",
			"image":           "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png",
			"types":           []string{"fire"},
			"height":          6,
			"weight":          85,
			"rarity":          "common",
			"total_units":     100,
			"available_units": 80,
			"price_per_unit":  5,
			"created_at":      time.Now(),
			"updated_at":      time.Now(),
		},
		bson.M{
			"pokemon_id":      25,
			"name":            "Pikachu",
			"image":           "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
			"types":           []string{"electric"},
			"height":          4,
			"weight":          60,
			"rarity":          "rare",
			"total_units":     50,
			"available_units": 30,
			"price_per_unit":  15,
			"created_at":      time.Now(),
			"updated_at":      time.Now(),
		},
		bson.M{
			"pokemon_id":      150,
			"name":            "Mewtwo",
			"image":           "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
			"types":           []string{"psychic"},
			"height":          20,
			"weight":          1220,
			"rarity":          "legendary",
			"total_units":     10,
			"available_units": 5,
			"price_per_unit":  50,
			"created_at":      time.Now(),
			"updated_at":      time.Now(),
		},
	}

	_, err = db.Collection("pokemons").InsertMany(ctx, samplePokemons)
	if err != nil {
		fmt.Printf("⚠️  Error seeding data: %v\n", err)
	} else {
		fmt.Printf("✅ Seeded %d sample Pokemon\n", len(samplePokemons))
	}
}
