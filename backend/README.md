# PetaMini Backend - Telegram Stars Payment System

Backend service for PetaMini Telegram Mini App with Telegram Stars payment integration.

## Features

- ✅ Telegram Stars payment processing
- ✅ Invoice creation and management
- ✅ Webhook handling for payment notifications
- ✅ MongoDB database integration
- ✅ User purchase history tracking
- ✅ Pokemon inventory management
- ✅ RESTful API endpoints
- ✅ CORS support for frontend integration

## Tech Stack

- **Language**: Go 1.21+
- **Framework**: Gin (HTTP web framework)
- **Database**: MongoDB
- **Bot API**: go-telegram-bot-api
- **Environment**: godotenv

## Prerequisites

- Go 1.21 or higher
- MongoDB (local or cloud)
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Payment Provider Token (for Telegram Stars)

## Installation

1. **Clone the repository**

```bash
cd backend
```

2. **Install dependencies**

```bash
go mod download
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username
PORT=8080
ENVIRONMENT=development
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=petamini
FRONTEND_URL=http://localhost:5173
PAYMENT_PROVIDER_TOKEN=your_payment_provider_token
WEBHOOK_SECRET=your_webhook_secret_key
```

## Running the Application

### Development Mode (with long polling)

```bash
go run main.go
```

### Production Mode (build and run)

```bash
go build -o petamini-backend main.go
./petamini-backend
```

## API Endpoints

### Payment Endpoints

#### 1. Create Invoice

**POST** `/api/payments/create-invoice`

Creates a new Telegram Stars payment invoice.

**Request Body:**

```json
{
  "pokemonId": "507f1f77bcf86cd799439011",
  "units": 2,
  "userId": 123456789
}
```

**Response:**

```json
{
  "invoiceLink": "https://t.me/your_bot?start=invoice_abc123",
  "invoicePayload": "abc123def456...",
  "totalStars": 10
}
```

#### 2. Get Payment Status

**POST** `/api/payments/status`

Checks the status of a payment.

**Request Body:**

```json
{
  "invoicePayload": "abc123def456..."
}
```

**Response:**

```json
{
  "status": "completed",
  "purchaseId": "507f1f77bcf86cd799439011",
  "completedAt": "2025-10-20T12:00:00Z"
}
```

#### 3. Get User Purchases

**GET** `/api/payments/user/:userId`

Retrieves all completed purchases for a user.

**Response:**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "userId": 123456789,
    "username": "johndoe",
    "pokemonId": "507f1f77bcf86cd799439012",
    "pokemonName": "Pikachu",
    "units": 2,
    "totalStars": 10,
    "status": "completed",
    "createdAt": "2025-10-20T12:00:00Z"
  }
]
```

### Webhook Endpoint

#### Telegram Webhook

**POST** `/api/webhook`

Receives updates from Telegram (payments, pre-checkout queries, etc.)

### Health Check

**GET** `/health`

Returns server health status.

## Database Schema

### Collections

#### `pokemons`

```javascript
{
  _id: ObjectId,
  pokemon_id: Number,
  name: String,
  image: String,
  types: [String],
  height: Number,
  weight: Number,
  rarity: String,  // "common", "rare", "legendary"
  total_units: Number,
  available_units: Number,
  price_per_unit: Number,  // in Telegram Stars
  created_at: Date,
  updated_at: Date
}
```

#### `purchases`

```javascript
{
  _id: ObjectId,
  user_id: Number,  // Telegram User ID
  username: String,
  pokemon_id: String,  // Reference to pokemons._id
  pokemon_name: String,
  units: Number,
  total_stars: Number,
  status: String,  // "pending", "completed", "failed", "refunded"
  telegram_payment_id: String,
  invoice_payload: String,
  created_at: Date,
  updated_at: Date
}
```

#### `users`

```javascript
{
  _id: ObjectId,
  telegram_id: Number,
  username: String,
  first_name: String,
  last_name: String,
  purchased_cards: [{
    pokemon_id: String,
    pokemon_name: String,
    units: Number,
    purchased_at: Date
  }],
  total_stars_spent: Number,
  created_at: Date,
  updated_at: Date
}
```

## Telegram Bot Setup

1. **Create a bot** with [@BotFather](https://t.me/botfather)
2. **Get your bot token** from BotFather
3. **Enable payments** by contacting [@BotFather](https://t.me/botfather) and selecting your bot
4. **Choose a payment provider** (for Telegram Stars, select the Stars option)
5. **Get payment provider token** from BotFather

## Payment Flow

1. **Frontend** calls `/api/payments/create-invoice` with Pokemon ID and units
2. **Backend** creates a purchase record and generates Telegram invoice
3. **User** receives invoice in Telegram and pays with Stars
4. **Telegram** sends pre-checkout query to bot (backend auto-approves)
5. **Telegram** processes payment and sends successful payment update
6. **Backend** receives webhook, updates purchase status, decreases available units
7. **User** receives confirmation message

## Development Tips

### Testing Payments in Development

Use Telegram's test mode for development:

```bash
# Set test mode in your bot configuration
TELEGRAM_BOT_TOKEN=your_test_bot_token
```

### Debugging

Enable debug mode:

```go
bot.Debug = true
```

View logs:

```bash
# All logs are printed to stdout
go run main.go
```

### Database Seeding

You can seed the database with Pokemon data by creating a seed script or manually inserting documents.

## Deployment

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

Build and run:

```bash
docker build -t petamini-backend .
docker run -p 8080:8080 --env-file .env petamini-backend
```

### Environment Variables for Production

Make sure to set:

- `ENVIRONMENT=production`
- Webhook URL pointing to your domain
- Secure `WEBHOOK_SECRET`

## Security Considerations

- ✅ Always validate webhook requests
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Validate payment amounts
- ✅ Check available units before creating invoices
- ✅ Use transactions for atomic database operations

## Troubleshooting

### Webhook not receiving updates

- Check webhook URL is publicly accessible
- Verify SSL certificate is valid
- Check Telegram webhook status: `https://api.telegram.org/bot<token>/getWebhookInfo`

### Payment not processing

- Check bot has payment provider configured
- Verify payment provider token is correct
- Check MongoDB connection
- Review server logs for errors

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
