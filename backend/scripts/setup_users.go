package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

func main() {
	uri := os.Getenv("MONGODB_URI")
	dbName := os.Getenv("DATABASE_NAME")
	if uri == "" || dbName == "" {
		log.Fatal("Please set MONGODB_URI and DATABASE_NAME environment variables")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer client.Disconnect(ctx)

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		log.Fatalf("Ping error: %v", err)
	}

	db := client.Database(dbName)
	if err := setupUsers(db); err != nil {
		log.Fatalf("Setup error: %v", err)
	}

	fmt.Println("Users collection and indexes are ready.")
}

func setupUsers(db *mongo.Database) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	collections, err := db.ListCollectionNames(ctx, bson.M{})
	if err != nil {
		return err
	}

	exists := false
	for _, n := range collections {
		if n == "users" {
			exists = true
			break
		}
	}
	if !exists {
		if err := db.CreateCollection(ctx, "users"); err != nil {
			return err
		}
	}

	col := db.Collection("users")
	unique := true
	models := []mongo.IndexModel{
		{Keys: bson.D{{Key: "telegram_id", Value: 1}}, Options: options.Index().SetUnique(unique).SetName("telegram_id_1")},
		{Keys: bson.D{{Key: "username", Value: 1}}, Options: options.Index().SetName("username_1")},
		{Keys: bson.D{{Key: "last_active", Value: -1}}, Options: options.Index().SetName("last_active_-1")},
		{Keys: bson.D{{Key: "is_banned", Value: 1}}, Options: options.Index().SetName("is_banned_1")},
	}

	_, err = col.Indexes().CreateMany(ctx, models)
	if err != nil {
		log.Printf("Index creation warning: %v", err)
	}
	return nil
}
