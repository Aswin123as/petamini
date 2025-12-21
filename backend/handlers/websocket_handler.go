package handlers

import (
	"context"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for development
		// In production, you should restrict this
		return true
	},
}

type WebSocketHandler struct {
	db      *mongo.Database
	clients map[*websocket.Conn]bool
	mu      sync.RWMutex
}

type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func NewWebSocketHandler(db *mongo.Database) *WebSocketHandler {
	handler := &WebSocketHandler{
		db:      db,
		clients: make(map[*websocket.Conn]bool),
	}
	
	// Start watching the linkers collection for changes
	go handler.watchLinkers()
	
	return handler
}

// HandleWebSocket handles WebSocket connections
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer conn.Close()

	// Register client
	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()

	log.Printf("New WebSocket client connected. Total clients: %d", len(h.clients))

	// Send initial connection success message
	h.sendMessage(conn, WSMessage{
		Type:    "connected",
		Payload: map[string]string{"message": "Connected to Linkers live updates"},
	})

	// Read messages from client (keep connection alive)
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Client disconnected: %v", err)
			break
		}
	}

	// Unregister client
	h.mu.Lock()
	delete(h.clients, conn)
	h.mu.Unlock()

	log.Printf("Client disconnected. Total clients: %d", len(h.clients))
}

// watchLinkers monitors changes in the linkers collection
func (h *WebSocketHandler) watchLinkers() {
	collection := h.db.Collection("linkers")
	ctx := context.Background()

	// Create a change stream pipeline
	pipeline := mongo.Pipeline{
		// Only watch for insert, update, and delete operations
		{{Key: "$match", Value: bson.D{
			{Key: "operationType", Value: bson.D{
				{Key: "$in", Value: bson.A{"insert", "update", "delete"}},
			}},
		}}},
	}

	// Configure options to return full document for updates
	opts := options.ChangeStream().SetFullDocument(options.UpdateLookup)

	// Start watching the collection
	stream, err := collection.Watch(ctx, pipeline, opts)
	if err != nil {
		log.Printf("⚠️  Failed to create change stream: %v", err)
		log.Println("⚠️  MongoDB Change Streams require a replica set.")
		log.Println("⚠️  WebSocket real-time updates will not work in standalone MongoDB.")
		log.Println("ℹ️  Consider using MongoDB Atlas (free tier) which provides replica sets.")
		log.Println("ℹ️  Server will continue without real-time updates.")
		return
	}
	defer stream.Close(ctx)

	log.Println("📡 Started watching linkers collection for changes...")

	for stream.Next(ctx) {
		var changeEvent bson.M
		if err := stream.Decode(&changeEvent); err != nil {
			log.Printf("Error decoding change event: %v", err)
			continue
		}

		operationType, ok := changeEvent["operationType"].(string)
		if !ok {
			continue
		}

		log.Printf("🔔 Change detected: %s", operationType)

		// Broadcast the change to all connected clients
		message := WSMessage{
			Type: operationType,
		}

		switch operationType {
		case "insert", "update":
			// Full document is available for inserts and updates (with updateLookup)
			if fullDoc, ok := changeEvent["fullDocument"].(bson.M); ok {
				message.Payload = map[string]interface{}{
					"fullDocument": fullDoc,
				}
			}
		case "delete":
			// For deletes, send the document ID
			if docKey, ok := changeEvent["documentKey"].(bson.M); ok {
				message.Payload = map[string]interface{}{
					"documentKey": docKey,
				}
			}
		}

		h.broadcastMessage(message)
	}

	if err := stream.Err(); err != nil {
		log.Printf("Change stream error: %v", err)
	}
}

// broadcastMessage sends a message to all connected clients
func (h *WebSocketHandler) broadcastMessage(message WSMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if err := h.sendMessage(client, message); err != nil {
			log.Printf("Error sending message to client: %v", err)
		}
	}
}

// sendMessage sends a message to a specific client
func (h *WebSocketHandler) sendMessage(conn *websocket.Conn, message WSMessage) error {
	conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	return conn.WriteJSON(message)
}
