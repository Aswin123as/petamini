package database

import (
	"context"
	"crypto/tls"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoDB holds the database connection
type MongoDB struct {
	Client   *mongo.Client
	Database *mongo.Database
}

// ConnectDB establishes a connection to MongoDB
func ConnectDB(uri, dbName string) (*MongoDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Configure TLS for Windows
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		MinVersion:         tls.VersionTLS12,
		MaxVersion:         tls.VersionTLS12,
	}

	clientOptions := options.Client().
		ApplyURI(uri).
		SetTLSConfig(tlsConfig).
		SetServerSelectionTimeout(30 * time.Second).
		SetConnectTimeout(30 * time.Second)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, err
	}

	// Ping the database to verify connection
	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, err
	}

	log.Println("✅ Connected to MongoDB successfully")

	return &MongoDB{
		Client:   client,
		Database: client.Database(dbName),
	}, nil
}

// Close closes the database connection
func (db *MongoDB) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return db.Client.Disconnect(ctx)
}
