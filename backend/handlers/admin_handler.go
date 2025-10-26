package handlers

import (
    "context"
    "fmt"
    "net/http"
    "sort"
    "strconv"
    "strings"
    "time"

    "github.com/Aswin123as/petamini-backend/models"
    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

// AdminHandler serves simple admin/read-only pages outside Telegram routes
type AdminHandler struct {
    db *mongo.Database
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(db *mongo.Database) *AdminHandler {
    return &AdminHandler{db: db}
}

// UsersAccessPage renders an HTML page with users and their access stats
// Route: GET /admin/users?limit=100
func (h *AdminHandler) UsersAccessPage(c *gin.Context) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // Parse limit
    limitParam := c.DefaultQuery("limit", "100")
    limit, err := strconv.Atoi(limitParam)
    if err != nil || limit <= 0 || limit > 1000 {
        limit = 100
    }

    // Fetch users sorted by last_active desc (fallback to updated_at)
    usersCol := h.db.Collection("users")
    findOpts := options.Find().SetSort(bson.D{{Key: "last_active", Value: -1}, {Key: "updated_at", Value: -1}}).SetLimit(int64(limit))

    cur, err := usersCol.Find(ctx, bson.M{}, findOpts)
    if err != nil {
        c.String(http.StatusInternalServerError, "Error fetching users: %v", err)
        return
    }
    defer cur.Close(ctx)

    var users []models.User
    if err := cur.All(ctx, &users); err != nil {
        c.String(http.StatusInternalServerError, "Error decoding users: %v", err)
        return
    }

    // Gather user IDs for stats lookup
    ids := make([]int64, 0, len(users))
    for _, u := range users {
        ids = append(ids, u.TelegramID)
    }

    // Build access stats map: user_id -> {total, lastAccess, uniquePagesCount}
    type accessStat struct {
        Total            int       `bson:"total"`
        LastAccess       time.Time `bson:"lastAccess"`
        UniquePagesCount int       `bson:"uniquePagesCount"`
    }

    statsMap := map[int64]accessStat{}
    if len(ids) > 0 {
        paCol := h.db.Collection("page_accesses")
        pipeline := mongo.Pipeline{
            bson.D{{Key: "$match", Value: bson.M{"user_id": bson.M{"$in": ids}}}},
            bson.D{{Key: "$group", Value: bson.D{
                {Key: "_id", Value: "$user_id"},
                {Key: "total", Value: bson.D{{Key: "$sum", Value: 1}}},
                {Key: "lastAccess", Value: bson.D{{Key: "$max", Value: "$timestamp"}}},
                {Key: "uniquePages", Value: bson.D{{Key: "$addToSet", Value: "$page_url"}}},
            }}},
            bson.D{{Key: "$project", Value: bson.D{
                {Key: "user_id", Value: "$_id"},
                {Key: "total", Value: 1},
                {Key: "lastAccess", Value: 1},
                {Key: "uniquePagesCount", Value: bson.D{{Key: "$size", Value: "$uniquePages"}}},
            }}},
        }

        cur2, err := paCol.Aggregate(ctx, pipeline)
        if err == nil {
            var rows []struct {
                UserID           int64     `bson:"user_id"`
                Total            int       `bson:"total"`
                LastAccess       time.Time `bson:"lastAccess"`
                UniquePagesCount int       `bson:"uniquePagesCount"`
            }
            if err := cur2.All(ctx, &rows); err == nil {
                for _, r := range rows {
                    statsMap[r.UserID] = accessStat{Total: r.Total, LastAccess: r.LastAccess, UniquePagesCount: r.UniquePagesCount}
                }
            }
        }
    }

    // Build HTML page
    var b strings.Builder
    b.WriteString("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">")
    b.WriteString("<title>Users & Access</title>")
    b.WriteString("<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,\"Helvetica Neue\",Arial;line-height:1.4;padding:24px} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left} th{background:#f3f4f6;position:sticky;top:0} tr:nth-child(even){background:#fafafa} .muted{color:#6b7280;font-size:12px} .pill{display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px} .danger{background:#fee2e2;color:#991b1b}</style>")
    b.WriteString("</head><body>")
    b.WriteString("<h1>Users & Access</h1>")
    b.WriteString(fmt.Sprintf("<p class=\"muted\">Top %d by last active. <a href=\"/health\">Health</a></p>", limit))
    b.WriteString("<table><thead><tr>")
    headers := []string{"Telegram ID", "Username", "Name", "Posts", "Promotions", "Role", "Banned", "Last Active", "Total Accesses", "Unique Pages", "Last Access"}
    for _, h := range headers {
        b.WriteString("<th>" + h + "</th>")
    }
    b.WriteString("</tr></thead><tbody>")

    // Ensure deterministic order if db lacks last_active
    sort.SliceStable(users, func(i, j int) bool {
        li := users[i].LastActive
        lj := users[j].LastActive
        if li.Equal(lj) {
            return users[i].UpdatedAt.After(users[j].UpdatedAt)
        }
        return li.After(lj)
    })

    for _, u := range users {
        st := statsMap[u.TelegramID]
        name := strings.TrimSpace(strings.TrimSpace(u.FirstName + " " + u.LastName))
        if name == "" {
            name = "-"
        }
        username := u.Username
        if username == "" {
            username = "-"
        } else {
            username = "@" + username
        }

        lastActive := u.LastActive
        if lastActive.IsZero() {
            lastActive = u.UpdatedAt
        }
        lastActiveStr := "-"
        if !lastActive.IsZero() {
            lastActiveStr = lastActive.Local().Format("2006-01-02 15:04:05")
        }
        lastAccessStr := "-"
        if !st.LastAccess.IsZero() {
            lastAccessStr = st.LastAccess.Local().Format("2006-01-02 15:04:05")
        }

        bannedClass := "pill"
        if u.IsBanned {
            bannedClass += " danger"
        }

        b.WriteString("<tr>")
        b.WriteString(fmt.Sprintf("<td>%d</td>", u.TelegramID))
        b.WriteString(fmt.Sprintf("<td>%s</td>", username))
        b.WriteString(fmt.Sprintf("<td>%s</td>", name))
        b.WriteString(fmt.Sprintf("<td>%d</td>", u.PostsCount))
        b.WriteString(fmt.Sprintf("<td>%d</td>", u.PromotionsMade))
        b.WriteString(fmt.Sprintf("<td><span class=\"pill\">%s</span></td>", htmlEscape(u.Role)))
        b.WriteString(fmt.Sprintf("<td><span class=\"%s\">%v</span></td>", bannedClass, u.IsBanned))
        b.WriteString(fmt.Sprintf("<td>%s</td>", lastActiveStr))
        b.WriteString(fmt.Sprintf("<td>%d</td>", st.Total))
        b.WriteString(fmt.Sprintf("<td>%d</td>", st.UniquePagesCount))
        b.WriteString(fmt.Sprintf("<td>%s</td>", lastAccessStr))
        b.WriteString("</tr>")
    }

    b.WriteString("</tbody></table>")
    b.WriteString("</body></html>")

    c.Header("Content-Type", "text/html; charset=utf-8")
    c.String(http.StatusOK, b.String())
}

// htmlEscape is a tiny helper to escape minimal content for HTML context
func htmlEscape(s string) string {
    r := strings.NewReplacer(
        "&", "&amp;",
        "<", "&lt;",
        ">", "&gt;",
        "\"", "&quot;",
        "'", "&#39;",
    )
    return r.Replace(s)
}
