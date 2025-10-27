# Tag and Content Validation Tests

## Test Cases for CreateLinker and UpdateLinker

### ✅ Valid Cases (Should Succeed)

#### 1. Create post with content only (no tags)

```json
POST /api/linkers
{
  "userId": 123456789,
  "username": "testuser",
  "content": "Check this out https://example.com"
}
```

**Expected:** ✅ Success - Tags will be empty array `[]`

#### 2. Create post with content and tags

```json
POST /api/linkers
{
  "userId": 123456789,
  "username": "testuser",
  "content": "Check this out https://example.com",
  "tags": ["tech", "tools"]
}
```

**Expected:** ✅ Success - Post created with tags

#### 3. Create post with content and empty tags array

```json
POST /api/linkers
{
  "userId": 123456789,
  "username": "testuser",
  "content": "Just some text without URLs",
  "tags": []
}
```

**Expected:** ✅ Success - Tags will be empty array `[]`

#### 4. Update post with new content and tags

```json
PUT /api/linkers/{id}?userId=123456789
{
  "content": "Updated content https://example.com",
  "tags": ["tech", "productivity"]
}
```

**Expected:** ✅ Success - Both content and tags updated

#### 5. Update post to remove all tags

```json
PUT /api/linkers/{id}?userId=123456789
{
  "content": "Still has content",
  "tags": []
}
```

**Expected:** ✅ Success - Tags cleared, content remains

---

### ❌ Invalid Cases (Should Fail)

#### 6. Create post with ONLY tags (no content)

```json
POST /api/linkers
{
  "userId": 123456789,
  "username": "testuser",
  "content": "",
  "tags": ["tech", "tools"]
}
```

**Expected:** ❌ Error 400 - "Content is required. Tags alone cannot be posted."

#### 7. Create post with whitespace-only content and tags

```json
POST /api/linkers
{
  "userId": 123456789,
  "username": "testuser",
  "content": "   \n\t   ",
  "tags": ["tech"]
}
```

**Expected:** ❌ Error 400 - "Content is required. Tags alone cannot be posted."

#### 8. Update post to remove content but keep tags

```json
PUT /api/linkers/{id}?userId=123456789
{
  "content": "",
  "tags": ["tech"]
}
```

**Expected:** ❌ Error 400 - "Content is required. Tags alone cannot be posted."

#### 9. Update post with whitespace-only content

```json
PUT /api/linkers/{id}?userId=123456789
{
  "content": "     ",
  "tags": ["tech", "tools"]
}
```

**Expected:** ❌ Error 400 - "Content is required. Tags alone cannot be posted."

#### 10. Create post with missing content field entirely

```json
POST /api/linkers
{
  "userId": 123456789,
  "username": "testuser",
  "tags": ["tech"]
}
```

**Expected:** ❌ Error 400 - JSON binding error or content validation error

---

## Backend Implementation Details

### CreateLinker Validation

1. ✅ Validates `userId > 0`
2. ✅ Validates `strings.TrimSpace(content) != ""`
3. ✅ Initializes `tags` as `[]string{}` if nil
4. ✅ Initializes `links` as `[]string{}` if nil
5. ✅ Extracts URLs from content automatically
6. ✅ Checks for duplicate links

### UpdateLinker Validation

1. ✅ Validates ownership (only author can edit)
2. ✅ Validates `strings.TrimSpace(content) != ""`
3. ✅ Initializes `tags` as `[]string{}` if nil
4. ✅ Initializes `updatedLinks` as `[]string{}` if nil
5. ✅ Re-extracts URLs from updated content

---

## Frontend Behavior

The frontend should:

1. **Disable submit** when content is empty (already implemented via `!inputText.trim()`)
2. **Allow empty tags** - user can post without tags
3. **Show error toast** if backend returns 400 with validation message
4. **Trim tags** - remove whitespace and convert to lowercase
5. **Limit to 2 tags** - slice before sending to backend

---

## Quick Manual Test

### Test 1: Content Required

```bash
curl -X POST http://localhost:8080/api/linkers \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123456789,
    "username": "test",
    "content": "",
    "tags": ["tech"]
  }'
```

**Expected Response:**

```json
{
  "error": "Content is required. Tags alone cannot be posted."
}
```

### Test 2: Valid with Tags

```bash
curl -X POST http://localhost:8080/api/linkers \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123456789,
    "username": "test",
    "content": "Check this out",
    "tags": ["tech", "ai"]
  }'
```

**Expected Response:**

```json
{
  "id": "...",
  "userId": 123456789,
  "content": "Check this out",
  "tags": ["tech", "ai"],
  ...
}
```

---

## Status

✅ **All validations implemented**

- Content cannot be empty or whitespace-only
- Tags are optional but content is required
- Both create and update endpoints enforce these rules
- Nil arrays properly initialized to prevent MongoDB issues
