# Database Indexes for Access Tracking

## Required Indexes for Optimal Performance

### Collection: `page_accesses`

1. **Timestamp Index** (Critical for daily stats)

```javascript
db.page_accesses.createIndex({ timestamp: -1 });
```

2. **User ID + Timestamp Compound Index** (For user history queries)

```javascript
db.page_accesses.createIndex({ user_id: 1, timestamp: -1 });
```

3. **Duplicate Prevention Index** (For spam prevention)

```javascript
db.page_accesses.createIndex({
  user_id: 1,
  page_url: 1,
  timestamp: -1,
});
```

4. **User ID Unique Users** (For stats queries)

```javascript
db.page_accesses.createIndex({ user_id: 1 });
```

## How to Apply

### Method 1: MongoDB Shell

```bash
mongosh "your_connection_string"
use your_database_name
db.page_accesses.createIndex({ "timestamp": -1 })
db.page_accesses.createIndex({ "user_id": 1, "timestamp": -1 })
db.page_accesses.createIndex({ "user_id": 1, "page_url": 1, "timestamp": -1 })
db.page_accesses.createIndex({ "user_id": 1 })
```

### Method 2: MongoDB Compass

1. Connect to your database
2. Select `page_accesses` collection
3. Go to "Indexes" tab
4. Click "Create Index"
5. Add the indexes shown above

## Performance Impact

- **Without indexes**: Daily stats query can take 5-10 seconds on 100k+ records
- **With indexes**: Same query takes 50-200ms
- **Storage overhead**: ~2-5% of collection size

## Monitoring

Check index usage:

```javascript
db.page_accesses.aggregate([{ $indexStats: {} }]);
```
