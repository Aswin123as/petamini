package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/Aswin123as/petamini-backend/config"
	"github.com/Aswin123as/petamini-backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	fmt.Println("🔧 Setting up Access Tracking Collections and Indexes...")

	// Load configuration
	cfg := config.LoadConfig()

	// Connect to database
	db, err := database.ConnectDB(cfg.MongoDBURI, cfg.DatabaseName)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Create page_accesses collection if it doesn't exist
	collections, err := db.Database.ListCollectionNames(ctx, bson.M{})
	if err != nil {
		log.Fatalf("❌ Failed to list collections: %v", err)
	}

	pageAccessesExists := false
	for _, name := range collections {
		if name == "page_accesses" {
			pageAccessesExists = true
			break
		}
	}

	if !pageAccessesExists {
		fmt.Println("📦 Creating page_accesses collection...")
		err = db.Database.CreateCollection(ctx, "page_accesses")
		if err != nil {
			log.Fatalf("❌ Failed to create page_accesses collection: %v", err)
		}
		fmt.Println("✅ page_accesses collection created")
	} else {
		fmt.Println("✅ page_accesses collection already exists")
	}

	// Get collection
	collection := db.Database.Collection("page_accesses")

	// Create indexes
	fmt.Println("\n🔍 Creating indexes...")

	indexes := []struct {
		name  string
		keys  bson.D
		opts  *options.IndexOptions
	}{
		{
			name: "timestamp_-1",
			keys: bson.D{{Key: "timestamp", Value: -1}},
			opts: options.Index().SetName("timestamp_-1"),
		},
		{
			name: "user_id_1_timestamp_-1",
			keys: bson.D{
				{Key: "user_id", Value: 1},
				{Key: "timestamp", Value: -1},
			},
			opts: options.Index().SetName("user_id_1_timestamp_-1"),
		},
		{
			name: "spam_prevention",
			keys: bson.D{
				{Key: "user_id", Value: 1},
				{Key: "page_url", Value: 1},
				{Key: "timestamp", Value: -1},
			},
			opts: options.Index().SetName("spam_prevention"),
		},
		{
			name: "user_id_1",
			keys: bson.D{{Key: "user_id", Value: 1}},
			opts: options.Index().SetName("user_id_1"),
		},
	}

	// Check existing indexes
	existingIndexes, err := collection.Indexes().List(ctx)
	if err != nil {
		log.Fatalf("❌ Failed to list existing indexes: %v", err)
	}

	existingIndexMap := make(map[string]bool)
	for existingIndexes.Next(ctx) {
		var index bson.M
		if err := existingIndexes.Decode(&index); err == nil {
			if name, ok := index["name"].(string); ok {
				existingIndexMap[name] = true
			}
		}
	}

	// Create missing indexes
	for _, idx := range indexes {
		if existingIndexMap[idx.name] {
			fmt.Printf("  ✓ Index '%s' already exists\n", idx.name)
			continue
		}

		fmt.Printf("  📝 Creating index '%s'...\n", idx.name)
		indexModel := mongo.IndexModel{
			Keys:    idx.keys,
			Options: idx.opts,
		}

		_, err := collection.Indexes().CreateOne(ctx, indexModel)
		if err != nil {
			log.Printf("  ⚠️  Warning: Failed to create index '%s': %v\n", idx.name, err)
		} else {
			fmt.Printf("  ✅ Index '%s' created successfully\n", idx.name)
		}
	}

	fmt.Println("\n🎉 Access tracking setup completed!")
	fmt.Println("\nIndexes created:")
	fmt.Println("  1. timestamp_-1 - For date-based queries")
	fmt.Println("  2. user_id_1_timestamp_-1 - For user history queries")
	fmt.Println("  3. spam_prevention - For duplicate detection")
	fmt.Println("  4. user_id_1 - For user-based statistics")
}
