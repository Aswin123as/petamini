package main

import (
	"context"
	"log"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"os"
)

func main() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: Error loading .env file, trying ../.env")
		err = godotenv.Load("../.env")
		if err != nil {
			log.Fatal("Error loading .env file from both locations")
		}
	}

	mongoURI := os.Getenv("MONGODB_URI")
	databaseName := os.Getenv("DATABASE_NAME")

	if mongoURI == "" || databaseName == "" {
		log.Fatal("MONGODB_URI and DATABASE_NAME must be set in .env file")
	}

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	// Ping the database
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	log.Println("✅ Connected to MongoDB")

	db := client.Database(databaseName)

	// Create linkers collection if it doesn't exist
	collections, err := db.ListCollectionNames(ctx, bson.M{})
	if err != nil {
		log.Fatalf("Failed to list collections: %v", err)
	}

	hasLinkers := false
	for _, name := range collections {
		if name == "linkers" {
			hasLinkers = true
			break
		}
	}

	if !hasLinkers {
		err = db.CreateCollection(ctx, "linkers")
		if err != nil {
			log.Fatalf("Failed to create linkers collection: %v", err)
		}
		log.Println("✅ Created linkers collection")
	} else {
		log.Println("✅ Linkers collection already exists")
	}

	// Create indexes for linkers collection
	linkersCollection := db.Collection("linkers")
	
	// Index on user_id for faster user queries
	_, err = linkersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}},
	})
	if err != nil {
		log.Printf("Warning: Failed to create user_id index: %v", err)
	} else {
		log.Println("✅ Created index on user_id")
	}

	// Index on timestamp for sorting by recent
	_, err = linkersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "timestamp", Value: -1}},
	})
	if err != nil {
		log.Printf("Warning: Failed to create timestamp index: %v", err)
	} else {
		log.Println("✅ Created index on timestamp")
	}

	// Index on promotions for sorting by popular
	_, err = linkersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "promotions", Value: -1}},
	})
	if err != nil {
		log.Printf("Warning: Failed to create promotions index: %v", err)
	} else {
		log.Println("✅ Created index on promotions")
	}

	// Index on tags for tag-based queries
	_, err = linkersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "tags", Value: 1}},
	})
	if err != nil {
		log.Printf("Warning: Failed to create tags index: %v", err)
	} else {
		log.Println("✅ Created index on tags")
	}

	log.Println("✅ Database setup for linkers completed successfully!")
}
