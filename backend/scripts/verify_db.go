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

	mongoURI := os.Getenv("MONGODB_URI")
	dbName := os.Getenv("DATABASE_NAME")

	if mongoURI == "" || dbName == "" {
		log.Fatal("MONGODB_URI and DATABASE_NAME must be set")
	}

	fmt.Println("🔍 Verifying Database Structure")
	fmt.Println("================================")
	fmt.Printf("Database: %s\n\n", dbName)

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

	fmt.Println("✅ Connected to MongoDB\n")

	db := client.Database(dbName)

	// List all collections
	collections, err := db.ListCollectionNames(ctx, bson.M{})
	if err != nil {
		log.Fatalf("❌ Failed to list collections: %v", err)
	}

	fmt.Println("📋 Collections in Database:")
	fmt.Println("---------------------------")
	for _, coll := range collections {
		fmt.Printf("  • %s\n", coll)
	}
	fmt.Println()

	// Check each collection
	checkCollection(ctx, db, "pokemons", "Pokemon Cards")
	checkCollection(ctx, db, "purchases", "Purchase Records")
	checkCollection(ctx, db, "users", "User Profiles")

	fmt.Println("\n✅ Database verification complete!")
}

func checkCollection(ctx context.Context, db *mongo.Database, collName, displayName string) {
	collection := db.Collection(collName)
	
	// Count documents
	count, err := collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		fmt.Printf("❌ Error counting %s: %v\n", collName, err)
		return
	}

	fmt.Printf("📊 %s (%s)\n", displayName, collName)
	fmt.Println("   " + repeat("-", len(displayName)+len(collName)+4))
	fmt.Printf("   Total Records: %d\n", count)

	if count > 0 {
		// Show sample record
		var sample bson.M
		err := collection.FindOne(ctx, bson.M{}).Decode(&sample)
		if err != nil {
			fmt.Printf("   ⚠️  Could not fetch sample: %v\n", err)
		} else {
			fmt.Println("   Sample fields:")
			for key := range sample {
				fmt.Printf("     - %s\n", key)
			}
		}

		// List indexes
		cursor, err := collection.Indexes().List(ctx)
		if err == nil {
			var indexes []bson.M
			if err := cursor.All(ctx, &indexes); err == nil && len(indexes) > 0 {
				fmt.Printf("   Indexes: %d\n", len(indexes))
				for _, idx := range indexes {
					if name, ok := idx["name"].(string); ok && name != "_id_" {
						fmt.Printf("     - %s\n", name)
					}
				}
			}
		}
	} else {
		fmt.Println("   ⚠️  No records found - collection is empty")
	}
	fmt.Println()
}

func repeat(s string, n int) string {
	result := ""
	for i := 0; i < n; i++ {
		result += s
	}
	return result
}
