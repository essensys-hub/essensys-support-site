package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// HandleRegister handles email/password registration
func (router *Router) HandleRegister(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic Validation
	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	// Check if user exists
	existingUser, err := router.UserStore.GetUserByEmail(req.Email)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if existingUser != nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to process password", http.StatusInternalServerError)
		return
	}

	// Determine Role (Admin Check)
	role := models.RoleUser
    // TODO: Improve this check, maybe pass environment variable safely
    // For now, sticking to standard users. Admins added via manual DB or OAuth promotion.

	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         role,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Provider:     models.ProviderEmail,
		CreatedAt:    time.Now(),
		LastLogin:    time.Now(),
	}

	if err := router.UserStore.CreateUser(user); err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Successful registration
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

// HandleLogin handles email/password login
func (router *Router) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := router.UserStore.GetUserByEmail(req.Email)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

    // Check provider (Prevent email login for OAuth users unless they set a password)
    if user.Provider != models.ProviderEmail && user.PasswordHash == "" {
         http.Error(w, "Please login with "+user.Provider, http.StatusUnauthorized)
         return
    }

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Update Last Login
	router.UserStore.UpdateLastLogin(user.ID)

	// Generate JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	tokenString, err := GenerateJWT(user.Email, user.Role, expirationTime)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Return Token match response format
    w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
        "token": tokenString,
        "user": models.UserResponse{
            ID:        user.ID,
            Email:     user.Email,
            Role:      user.Role,
            FirstName: user.FirstName,
            LastName:  user.LastName,
            Provider:  user.Provider,
        },
    })
}

// Helper to determine if an email is admin (matches .env list)
func (router *Router) IsAdminEmail(email string, adminList string) bool {
    parts := strings.Split(adminList, ",")
    for _, admin := range parts {
        if strings.TrimSpace(admin) == email {
            return true
        }
    }
    return false
}
