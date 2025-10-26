package handlers

import (
	"context"
	"fmt"
	"log"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
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
		// Provide quick action button to open the mini app (Linkers)
		msg.ReplyMarkup = h.openLinkersKeyboard()
	case "help":
		msg.Text = h.handleHelp()
		msg.ReplyMarkup = h.openLinkersKeyboard()
	case "open":
		msg.Text = "🔗 Open Linkers to share and discover links."
		msg.ReplyMarkup = h.openLinkersKeyboard()
	case "recent":
		msg.Text = h.handleRecent()
		msg.ReplyMarkup = h.openLinkersKeyboard()
	case "popular":
		msg.Text = h.handlePopular()
		msg.ReplyMarkup = h.openLinkersKeyboard()
	case "myposts":
		msg.Text = h.handleMyPosts(update.Message.From)
		msg.ReplyMarkup = h.openLinkersKeyboard()
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

	return fmt.Sprintf(`🖤 *Welcome to Linkers* — share and discover links, fast.

Hey %s! 👋

What you can do:
• 🔗 Post links or notes
• 🔥 Promote what you like.
• 🕒 Browse Recent or Popular
• 👤 See your posts under My Posts

Quick actions:
/open — Open the mini app
/recent — How it works (Recent)
/popular — How it works (Popular)
/myposts — Your posts overview
/help — All commands

Tap the button below to open Linkers.`, user.FirstName)
}

// handleHelp handles /help command
func (h *BotCommandHandler) handleHelp() string {
	return `📖 *Commands*

Linkers:
/open — Open the mini app
/recent — About Recent feed
/popular — About Popular feed
/myposts — Where to find your posts
/help — Show this message

Notes:
• Promotion is one-time per user per post
• Only the 🔥/Trending button is actionable per post
• Open the app for full experience`
}

// handleRecent describes the Recent feed behavior
func (h *BotCommandHandler) handleRecent() string {
	return `🕒 *Recent*

The Recent feed shows the latest posts first. Post a link or note, and it appears at the top. Use the mini app for the full experience.`
}

// handlePopular describes the Popular feed behavior
func (h *BotCommandHandler) handlePopular() string {
	return `🔥 *Popular*

Posts ordered by promotions. Each user can promote a post only once. Open the mini app to browse and promote.`
}

// handleMyPosts gives a brief and points to the app
func (h *BotCommandHandler) handleMyPosts(user *tgbotapi.User) string {
	return fmt.Sprintf(`👤 *My Posts*

Posts you created appear under My Posts in the app.
User: @%s (%d)

Tap Open to jump in.`, user.UserName, user.ID)
}

// openLinkersKeyboard returns a simple inline keyboard to open the mini app/frontend
func (h *BotCommandHandler) openLinkersKeyboard() tgbotapi.InlineKeyboardMarkup {
	// Prefer production frontend if available
	url := "t.me/linkersminiBot/Direct"
	row := tgbotapi.NewInlineKeyboardRow(
		tgbotapi.NewInlineKeyboardButtonURL("Open Linkers", url),
	)
	return tgbotapi.NewInlineKeyboardMarkup(row)
}

