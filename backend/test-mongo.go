package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	uri := "mongodb+srv://aswinmail12_db_user:N5ijckeY6tF9PAI9@cluster-petamini.brepo4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-petamini"

	fmt.Println("🔄 Testing MongoDB Atlas connection...")
	fmt.Println("URI:", uri)
	fmt.Println()

	// Test 1: Basic connection
	fmt.Println("Test 1: Basic connection with default settings")
	testConnection(uri, nil)

	// Test 2: With TLS Skip Verify
	fmt.Println("\nTest 2: Connection with InsecureSkipVerify=true")
	tlsConfig1 := &tls.Config{
		InsecureSkipVerify: true,
	}
	testConnection(uri, tlsConfig1)

	// Test 3: With TLS MinVersion
	fmt.Println("\nTest 3: Connection with MinVersion TLS 1.2")
	tlsConfig2 := &tls.Config{
		MinVersion: tls.VersionTLS12,
	}
	testConnection(uri, tlsConfig2)

	// Test 4: Combined settings
	fmt.Println("\nTest 4: Combined settings (InsecureSkipVerify + TLS 1.2)")
	tlsConfig3 := &tls.Config{
		InsecureSkipVerify: true,
		MinVersion:         tls.VersionTLS12,
	}
	testConnection(uri, tlsConfig3)
}

func testConnection(uri string, tlsConfig *tls.Config) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	clientOptions := options.Client().
		ApplyURI(uri).
		SetServerSelectionTimeout(30 * time.Second).
		SetConnectTimeout(30 * time.Second)

	if tlsConfig != nil {
		clientOptions.SetTLSConfig(tlsConfig)
	}

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Printf("❌ Connect failed: %v\n", err)
		return
	}
	defer client.Disconnect(ctx)

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Printf("❌ Ping failed: %v\n", err)
		return
	}

	fmt.Println("✅ Connection successful!")
}
