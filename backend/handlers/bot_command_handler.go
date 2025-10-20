package handlers

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/Aswin123as/petamini-backend/models"
	"github.com/Aswin123as/petamini-backend/services"
)

// BotCommandHandler handles Telegram bot commands
type BotCommandHandler struct {
	bot            *tgbotapi.BotAPI
	paymentService *services.PaymentService
	userService    *services.UserService
}

// NewBotCommandHandler creates a new bot command handler
func NewBotCommandHandler(bot *tgbotapi.BotAPI, paymentService *services.PaymentService, userService *services.UserService) *BotCommandHandler {
	return &BotCommandHandler{
		bot:            bot,
		paymentService: paymentService,
		userService:    userService,
	}
}

// HandleCommand processes incoming bot commands
func (h *BotCommandHandler) HandleCommand(update tgbotapi.Update) {
	if update.Message == nil || !update.Message.IsCommand() {
		return
	}

	msg := tgbotapi.NewMessage(update.Message.Chat.ID, "")

	switch update.Message.Command() {
	case "start":
		msg.Text = h.handleStart(update.Message.From)
	case "help":
		msg.Text = h.handleHelp()
	case "collection":
		msg.Text = h.handleCollection(update.Message.From.ID)
	case "stats":
		msg.Text = h.handleStats(update.Message.From.ID)
	case "leaderboard":
		msg.Text = h.handleLeaderboard()
	case "profile":
		msg.Text = h.handleProfile(update.Message.From.ID)
	case "shop":
		msg.Text = h.handleShop()
	default:
		msg.Text = "❓ Unknown command. Type /help to see available commands."
	}

	msg.ParseMode = "Markdown"
	if _, err := h.bot.Send(msg); err != nil {
		log.Printf("Error sending message: %v", err)
	}
}

// handleStart handles /start command
func (h *BotCommandHandler) handleStart(user *tgbotapi.User) string {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create or update user in database
	err := h.userService.CreateOrUpdateUser(ctx, user.ID, user.UserName, user.FirstName, user.LastName)
	if err != nil {
		log.Printf("Error creating user: %v", err)
	}

	return fmt.Sprintf(`🎮 *Welcome to PetaMini - Pokemon Card Collection!*

Hey %s! 👋

Collect rare Pokemon cards and build your ultimate collection! 

🃏 *What you can do:*
• Buy Pokemon cards with Telegram Stars ⭐
• Build your collection of rare cards
• Compete on the leaderboard
• Track your stats and achievements

*Commands:*
/shop - Browse available Pokemon cards
/collection - View your cards
/stats - Check your statistics
/leaderboard - Top collectors
/profile - Your profile info
/help - Show all commands

Ready to start? Open the mini app and start collecting! 🚀`, user.FirstName)
}

// handleHelp handles /help command
func (h *BotCommandHandler) handleHelp() string {
	return `📖 *Available Commands*

*Collection Management:*
/shop - Browse all Pokemon cards in shop
/collection - View your owned Pokemon cards
/profile - View your profile and account info

*Statistics & Competition:*
/stats - View your purchase statistics
/leaderboard - See top collectors

*Information:*
/start - Welcome message
/help - Show this help message

*How to Buy:*
1. Open the PetaMini mini app
2. Browse Pokemon cards
3. Click "Buy" on any card
4. Pay with Telegram Stars ⭐
5. Cards are added to your collection!

*Rarity Levels:*
⚪ Common - Easy to collect
🔵 Rare - Medium difficulty
🟣 Epic - Hard to find
🟠 Legendary - Ultra rare!

Need support? Contact @YourSupportUsername`
}

// handleCollection handles /collection command
func (h *BotCommandHandler) handleCollection(userID int64) string {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	user, err := h.userService.GetUserByTelegramID(ctx, userID)
	if err != nil {
		return "❌ Error fetching your collection. Please try again later."
	}

	if user == nil || len(user.PurchasedCards) == 0 {
		return `📦 *Your Collection is Empty*

You haven't purchased any Pokemon cards yet!

Open the mini app to start collecting! 🎮
Type /shop to see available cards.`
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("🎴 *%s's Pokemon Collection*\n\n", user.Username))
	sb.WriteString(fmt.Sprintf("📊 Total Cards: *%d*\n", len(user.PurchasedCards)))
	sb.WriteString(fmt.Sprintf("💎 Total Spent: *%d ⭐*\n\n", user.TotalSpent))

	// Group cards by Pokemon
	cardMap := make(map[string]int)
	for _, card := range user.PurchasedCards {
		cardMap[card.PokemonName] += card.Units
	}

	sb.WriteString("*Your Cards:*\n")
	for pokemonName, units := range cardMap {
		sb.WriteString(fmt.Sprintf("• %s × %d\n", pokemonName, units))
	}

	return sb.String()
}

// handleStats handles /stats command
func (h *BotCommandHandler) handleStats(userID int64) string {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	user, err := h.userService.GetUserByTelegramID(ctx, userID)
	if err != nil {
		return "❌ Error fetching your stats. Please try again later."
	}

	if user == nil {
		return "❌ No stats available. Start collecting Pokemon cards first!"
	}

	// Calculate statistics
	uniquePokemon := make(map[string]bool)
	totalCards := 0
	mostRecent := "N/A"

	for _, card := range user.PurchasedCards {
		uniquePokemon[card.PokemonName] = true
		totalCards += card.Units
		mostRecent = card.PokemonName // Last one in array
	}

	accountAge := time.Since(user.CreatedAt).Hours() / 24 // Days

	return fmt.Sprintf(`📊 *Your Statistics*

👤 *Profile:*
• Username: @%s
• Member Since: %s
• Account Age: %.0f days

🎴 *Collection Stats:*
• Total Cards: *%d*
• Unique Pokemon: *%d*
• Total Purchases: *%d*
• Total Spent: *%d ⭐*

📈 *Activity:*
• Most Recent: %s
• Last Purchase: %s

💰 *Economics:*
• Average per Purchase: *%.1f ⭐*
• Cards per Purchase: *%.1f*

Keep collecting to climb the leaderboard! 🚀`,
		user.Username,
		user.CreatedAt.Format("Jan 2, 2006"),
		accountAge,
		totalCards,
		len(uniquePokemon),
		user.TotalPurchases,
		user.TotalSpent,
		mostRecent,
		user.UpdatedAt.Format("Jan 2, 2006"),
		float64(user.TotalSpent)/float64(max(user.TotalPurchases, 1)),
		float64(totalCards)/float64(max(user.TotalPurchases, 1)))
}

// handleLeaderboard handles /leaderboard command
func (h *BotCommandHandler) handleLeaderboard() string {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	topUsers, err := h.userService.GetTopCollectors(ctx, 10)
	if err != nil {
		return "❌ Error fetching leaderboard. Please try again later."
	}

	if len(topUsers) == 0 {
		return "📊 Leaderboard is empty. Be the first collector!"
	}

	var sb strings.Builder
	sb.WriteString("🏆 *Top Collectors Leaderboard*\n\n")

	medals := []string{"🥇", "🥈", "🥉"}
	for i, user := range topUsers {
		rank := fmt.Sprintf("%d.", i+1)
		if i < len(medals) {
			rank = medals[i]
		}

		totalCards := 0
		for _, card := range user.PurchasedCards {
			totalCards += card.Units
		}

		sb.WriteString(fmt.Sprintf("%s *%s*\n", rank, user.Username))
		sb.WriteString(fmt.Sprintf("   💎 %d ⭐ | 🎴 %d cards | 🛍️ %d purchases\n\n",
			user.TotalSpent, totalCards, user.TotalPurchases))
	}

	return sb.String()
}

// handleProfile handles /profile command
func (h *BotCommandHandler) handleProfile(userID int64) string {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	user, err := h.userService.GetUserByTelegramID(ctx, userID)
	if err != nil {
		return "❌ Error fetching your profile. Please try again later."
	}

	if user == nil {
		return "❌ Profile not found. Please start the bot with /start"
	}

	return fmt.Sprintf(`👤 *Profile Information*

*Basic Info:*
• Name: %s %s
• Username: @%s
• User ID: %d

*Account Status:*
• Created: %s
• Last Active: %s
• Status: ✅ Active

*Collection:*
• Total Cards: %d
• Total Purchases: %d
• Total Spent: %d ⭐

Type /collection to see your cards!
Type /stats for detailed statistics!`,
		user.FirstName,
		user.LastName,
		user.Username,
		user.TelegramID,
		user.CreatedAt.Format("Jan 2, 2006 15:04"),
		user.UpdatedAt.Format("Jan 2, 2006 15:04"),
		len(user.PurchasedCards),
		user.TotalPurchases,
		user.TotalSpent)
}

// handleShop handles /shop command
func (h *BotCommandHandler) handleShop() string {
	return `🏪 *Pokemon Card Shop*

Open the PetaMini mini app to browse all available Pokemon cards!

*Available Rarities:*
⚪ Common - 10-50 ⭐
🔵 Rare - 100-200 ⭐
🟣 Epic - 300-500 ⭐
🟠 Legendary - 1000+ ⭐

*How to Shop:*
1. Open the mini app
2. Browse Pokemon cards
3. Click "Buy" on any card
4. Complete payment with Telegram Stars
5. Cards are instantly added to your collection!

Each Pokemon has limited units available - grab them before they're gone! 🏃‍♂️💨`
}

// Helper function for max
func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
