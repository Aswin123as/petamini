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
	// Load environment variables
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	mongoURI := os.Getenv("MONGODB_URI")
	dbName := os.Getenv("DATABASE_NAME")

	if mongoURI == "" {
		log.Fatal("❌ MONGODB_URI not set in environment")
	}
	if dbName == "" {
		dbName = "petamini"
	}

	fmt.Println("🔄 Testing MongoDB connection...")
	fmt.Println("Database Name:", dbName)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("❌ Failed to connect: %v", err)
	}
	defer client.Disconnect(ctx)

	// Ping the database
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("❌ Failed to ping database: %v", err)
	}

	fmt.Println("✅ Successfully connected to MongoDB!")

	db := client.Database(dbName)

	// List collections
	fmt.Println("\n📋 Existing collections:")
	collections, err := db.ListCollectionNames(ctx, bson.M{})
	if err != nil {
		log.Printf("⚠️  Error listing collections: %v", err)
	} else {
		if len(collections) == 0 {
			fmt.Println("   No collections found (database is empty)")
		} else {
			for _, coll := range collections {
				count, _ := db.Collection(coll).CountDocuments(ctx, bson.M{})
				fmt.Printf("   - %s (%d documents)\n", coll, count)
			}
		}
	}

	// Check pokemons collection
	fmt.Println("\n📊 Pokemon Collection Stats:")
	pokemonCount, err := db.Collection("pokemons").CountDocuments(ctx, bson.M{})
	if err != nil {
		fmt.Printf("   ⚠️  Error: %v\n", err)
	} else {
		fmt.Printf("   Total Pokemon: %d\n", pokemonCount)

		// Count by rarity
		rarities := []string{"common", "rare", "legendary"}
		for _, rarity := range rarities {
			count, _ := db.Collection("pokemons").CountDocuments(ctx, bson.M{"rarity": rarity})
			fmt.Printf("   - %s: %d\n", rarity, count)
		}
	}

	// Check purchases collection
	fmt.Println("\n💰 Purchases Collection Stats:")
	purchaseCount, err := db.Collection("purchases").CountDocuments(ctx, bson.M{})
	if err != nil {
		fmt.Printf("   ⚠️  Error: %v\n", err)
	} else {
		fmt.Printf("   Total Purchases: %d\n", purchaseCount)

		// Count by status
		statuses := []string{"pending", "completed", "failed"}
		for _, status := range statuses {
			count, _ := db.Collection("purchases").CountDocuments(ctx, bson.M{"status": status})
			fmt.Printf("   - %s: %d\n", status, count)
		}
	}

	// Check users collection
	fmt.Println("\n👥 Users Collection Stats:")
	userCount, err := db.Collection("users").CountDocuments(ctx, bson.M{})
	if err != nil {
		fmt.Printf("   ⚠️  Error: %v\n", err)
	} else {
		fmt.Printf("   Total Users: %d\n", userCount)
	}

	fmt.Println("\n✅ Connection test complete!")
	fmt.Println("\n💡 Next steps:")
	fmt.Println("   1. If collections are empty, run: go run scripts/init_db.go")
	fmt.Println("   2. Start the backend server: go run main.go")
}
