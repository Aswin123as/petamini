# Frontend-Backend Integration Guide

## Overview

The frontend now creates purchase records in the backend database when the "Buy" button is clicked.

## Flow

1. **User clicks "Buy" button** → Opens purchase modal
2. **User selects units and clicks "Buy Now"** → Calls backend API
3. **Backend creates purchase record** with status "pending"
4. **Backend returns invoice payload** 
5. **Frontend opens Telegram Stars payment**
6. **User completes payment**
7. **Telegram sends webhook to backend**
8. **Backend updates purchase status** to "completed"
9. **Backend decreases available units**
10. **Backend updates user's purchase history**

## Setup

### 1. Configure Environment Variables

Create `.env.local` in the frontend root:

```env
VITE_BACKEND_URL=http://localhost:8080
VITE_ENV=development
```

For production:
```env
VITE_BACKEND_URL=https://your-backend-domain.com
VITE_ENV=production
```

### 2. Start Backend Server

```bash
cd backend
go run main.go
```

Backend should be running on `http://localhost:8080`

### 3. Start Frontend

```bash
npm run dev
```

Frontend will connect to backend automatically.

## API Integration

### Endpoint Called: `POST /api/payments/create-invoice`

**Request:**
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

## Database Records Created

### 1. Purchase Record (Pending)

When "Buy Now" is clicked, a purchase record is created:

```javascript
{
  _id: ObjectId("..."),
  user_id: 123456789,
  pokemon_id: "507f1f77bcf86cd799439011",
  pokemon_name: "Pikachu",
  units: 2,
  total_stars: 10,
  status: "pending",  // ← Created as pending
  invoice_payload: "abc123def456...",
  created_at: ISODate("2025-10-20T12:00:00Z"),
  updated_at: ISODate("2025-10-20T12:00:00Z")
}
```

### 2. Purchase Record Updated (After Payment)

When payment is successful, backend webhook updates the record:

```javascript
{
  _id: ObjectId("..."),
  user_id: 123456789,
  username: "johndoe",
  pokemon_id: "507f1f77bcf86cd799439011",
  pokemon_name: "Pikachu",
  units: 2,
  total_stars: 10,
  status: "completed",  // ← Updated to completed
  telegram_payment_id: "tg_payment_123",
  invoice_payload: "abc123def456...",
  created_at: ISODate("2025-10-20T12:00:00Z"),
  updated_at: ISODate("2025-10-20T12:01:00Z")
}
```

### 3. Pokemon Units Decreased

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Pikachu",
  available_units: 28,  // ← Decreased by 2
  total_units: 50,
  // ... other fields
}
```

### 4. User Purchase History Updated

```javascript
{
  _id: ObjectId("..."),
  telegram_id: 123456789,
  username: "johndoe",
  purchased_cards: [
    {
      pokemon_id: "507f1f77bcf86cd799439011",
      pokemon_name: "Pikachu",
      units: 2,
      purchased_at: ISODate("2025-10-20T12:01:00Z")
    }
  ],
  total_stars_spent: 10,
  // ... other fields
}
```

## Testing

### Test Without Telegram (Development)

1. Start backend: `cd backend && go run main.go`
2. Start frontend: `npm run dev`
3. Click "Buy" on any Pokemon card
4. Check console for:
   ```
   Creating invoice record in backend...
   ✅ Invoice created: {invoicePayload: "...", totalStars: 10}
   ✅ Testing mode: Invoice record created in database
   ```

5. Check database:
   ```bash
   cd backend
   go run scripts/test_connection.go
   ```

### Test With Telegram

1. Deploy backend to public server (with HTTPS)
2. Set webhook URL in backend
3. Open Mini App in Telegram
4. Click "Buy" → Complete payment with Stars
5. Check database for completed purchase

## Error Handling

### Backend Not Running

If backend is not available, you'll see:
```
❌ Purchase failed: Failed to fetch
```

**Solution:** Start the backend server

### Invalid Pokemon ID

If Pokemon doesn't exist:
```
❌ Purchase failed: Failed to create invoice
```

**Solution:** Check Pokemon ID is valid ObjectID

### Insufficient Units

If trying to buy more than available:
```
❌ Purchase failed: not enough units available
```

**Solution:** Display available units to user

## Monitoring

### View Purchase Records

```bash
cd backend
go run scripts/test_connection.go
```

Shows:
- Total purchases
- Purchases by status (pending/completed/failed)
- Total users
- Pokemon availability

### MongoDB Atlas Dashboard

1. Go to MongoDB Atlas
2. Click "Browse Collections"
3. View `purchases` collection
4. Filter by status: `{status: "pending"}` or `{status: "completed"}`

## Production Deployment

### Frontend

Update `.env.production`:
```env
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_ENV=production
```

Build:
```bash
npm run build
```

### Backend

Set production environment variables:
```env
ENVIRONMENT=production
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://yourdomain.com
```

Deploy to:
- Heroku
- Railway
- DigitalOcean
- AWS/GCP/Azure

## Security Considerations

- ✅ Backend validates all requests
- ✅ CORS configured for frontend URL only
- ✅ Telegram user ID verified
- ✅ Purchase records tracked in database
- ✅ Atomic transactions prevent race conditions
- ✅ Invoice payload is unique and secure

## Troubleshooting

### CORS Error

**Error:** `Access to fetch blocked by CORS policy`

**Solution:** 
1. Check `FRONTEND_URL` in backend `.env`
2. Restart backend server

### Database Connection Failed

**Error:** `Failed to connect to MongoDB`

**Solution:**
1. Check MongoDB connection string
2. Verify IP whitelist in MongoDB Atlas
3. Test connection: `go run scripts/test_connection.go`

### Payment Not Processing

**Error:** Payment completes but status not updated

**Solution:**
1. Check webhook is set correctly
2. Verify backend is publicly accessible (HTTPS)
3. Check backend logs for webhook errors

## Next Steps

1. ✅ Purchase records are now created
2. ⏭️ Test the full payment flow
3. ⏭️ Monitor purchases in database
4. ⏭️ Add purchase history page
5. ⏭️ Add admin dashboard

---

**Your frontend is now integrated with the backend! 🎉**

Every "Buy" button click creates a database record, enabling full purchase tracking and analytics.
