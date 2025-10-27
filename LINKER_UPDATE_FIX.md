# Linker Update/Edit Fix

## Problem

The frontend was calling `PUT /api/linkers/:id` to update posts (content and tags), but the backend didn't have this endpoint implemented. This caused all edit operations to fail.

## Solution

### Backend Changes

#### 1. Added UpdateLinker Handler (`backend/handlers/linker_handler.go`)

```go
func (h *LinkerHandler) UpdateLinker(c *gin.Context)
```

**Features:**

- Validates user ownership before allowing edit
- Updates content and tags
- Re-extracts URLs from updated content
- Returns the updated linker with all fields

**Request:**

- Method: `PUT`
- URL: `/api/linkers/:id?userId={userId}`
- Body: `{"content": "...", "tags": ["tag1", "tag2"]}`

**Response:**

- Success: Updated linker object with new content, tags, and links
- Errors: 400 (bad request), 403 (not owner), 404 (not found), 500 (server error)

#### 2. Added Route (`backend/main.go`)

```go
linkers.PUT("/:id", linkerHandler.UpdateLinker)
```

### How It Works

1. **Frontend calls:** `PUT /api/linkers/{id}?userId={userId}` with `{content, tags}`
2. **Backend validates:**
   - Linker exists
   - User owns the linker
3. **Backend updates:**
   - Content field
   - Tags array
   - Links array (re-extracted from content)
4. **Backend returns:** Updated linker object

### Tag Handling

**On Create:**

- Tags come from the JSON request body
- Stored directly in the `tags` field
- No special processing needed (already working)

**On Update:**

- Tags come from the JSON request body
- Replace the entire `tags` array
- Frontend should send the complete desired tag list

### Testing

**Create with tags:**

```bash
POST /api/linkers
{
  "userId": 123456789,
  "username": "testuser",
  "content": "Check this out https://example.com",
  "tags": ["tech", "tools"]
}
```

**Update with new tags:**

```bash
PUT /api/linkers/{id}?userId=123456789
{
  "content": "Updated content https://example.com",
  "tags": ["tech", "productivity"]
}
```

## Files Modified

- `backend/handlers/linker_handler.go` - Added UpdateLinker handler
- `backend/main.go` - Added PUT /:id route

## Status

✅ Fixed - Edit functionality now works for both content and tags
