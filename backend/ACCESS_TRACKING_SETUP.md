# Access Tracking Database Setup

## Automatic Setup (Recommended)

The collections and indexes are **automatically created** when the backend starts up. No manual action required!

When you start the backend with:

```bash
cd backend
go run main.go
```

You'll see:

```
🔧 Setting up database collections and indexes...
✅ Access tracking collections and indexes ready
```

## Manual Setup (Optional)

If you want to set up the collections and indexes manually or verify they exist:

### Run the Setup Script

```bash
cd backend
go run scripts/setup_access_tracking.go
```

### Output:

```
🔧 Setting up Access Tracking Collections and Indexes...
✅ page_accesses collection already exists
🔍 Creating indexes...
  ✓ Index 'timestamp_-1' already exists
  ✓ Index 'user_id_1_timestamp_-1' already exists
  ✓ Index 'spam_prevention' already exists
  ✓ Index 'user_id_1' already exists
🎉 Access tracking setup completed!
```

## Collections Created

### `page_accesses`

Stores all user page access logs with the following fields:

- `user_id` (int64) - Telegram user ID
- `username` (string) - Telegram username
- `first_name` (string) - User's first name
- `last_name` (string) - User's last name
- `page_url` (string) - URL of the page accessed
- `user_agent` (string) - Browser/device information
- `ip_address` (string) - User's IP address
- `timestamp` (datetime) - When the access occurred
- `created_at` (datetime) - Record creation time

## Indexes Created

1. **timestamp\_-1**: Fast date-based queries
2. **user*id_1_timestamp*-1**: Fast user history retrieval
3. **spam_prevention**: Prevents duplicate tracking within 5 minutes
4. **user_id_1**: Fast user-based statistics

## Verify Setup

### Check Collection Exists

```bash
mongosh "your_connection_string"
use your_database_name
db.getCollectionNames()
# Should include 'page_accesses'
```

### Check Indexes

```javascript
db.page_accesses.getIndexes();
```

Should show:

```json
[
  { "name": "_id_", ... },
  { "name": "timestamp_-1", ... },
  { "name": "user_id_1_timestamp_-1", ... },
  { "name": "spam_prevention", ... },
  { "name": "user_id_1", ... }
]
```

## Troubleshooting

### Collection Not Created

- Check MongoDB connection string in `.env`
- Ensure MongoDB server is running
- Check user has write permissions

### Indexes Not Created

- Indexes may already exist (check with `getIndexes()`)
- Ensure collection has some data
- Check MongoDB logs for errors

### Permission Issues

Ensure your MongoDB user has these permissions:

```javascript
{
  "resource": { "db": "your_database", "collection": "page_accesses" },
  "actions": ["find", "insert", "update", "createIndex", "createCollection"]
}
```
