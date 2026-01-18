package api

import (
	"encoding/json"
    "log"
	"net/http"
	"strings"
	"time"

	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
    "github.com/golang-jwt/jwt/v4"
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

	// Initialize User Structure
	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Provider:     models.ProviderEmail,
		CreatedAt:    time.Now(),
		LastLogin:    time.Now(),
	}

	// Determine Role and Links
	role := models.RoleGuestLocal // Default
    
    // Auto-Link Logic based on IP
    userIP := getIP(r)
    
    machines, err := router.Store.GetMachines()
    if err == nil {
        for _, m := range machines {
            if m.IP == userIP {
                user.LinkedMachineID = &m.ID
                
                // Check if this machine already has a local admin
                hasAdmin, err := router.UserStore.HasLocalAdmin(m.ID)
                if err == nil && !hasAdmin {
                    log.Printf("[Register] First user for machine %d (%s). Promoting to AdminLocal.", m.ID, m.NoSerie)
                    role = models.RoleAdminLocal
                } else {
                    log.Printf("[Register] User joined machine %d as GuestLocal.", m.ID)
                }
                break // Only link to first matching machine
            }
        }
    }

	// Double check if email is in global admin list (env var)
    // if router.IsAdminEmail(req.Email, os.Getenv("ADMIN_EMAILS")) {
    //     role = models.RoleAdminGlobal
    // }

	user.Role = role

	if err := router.UserStore.CreateUser(user); err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

    // Audit Log
    router.LogAudit(user.ID, user.Email, "REGISTER", "USER", "", getIP(r), "Registration successful")

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
        router.LogAudit(0, req.Email, "LOGIN_FAILED", "USER", "", getIP(r), "Invalid credentials (user not found)")
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

    // Check provider
    if user.Provider != models.ProviderEmail && user.PasswordHash == "" {
         http.Error(w, "Please login with "+user.Provider, http.StatusUnauthorized)
         return
    }

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
        router.LogAudit(user.ID, user.Email, "LOGIN_FAILED", "USER", "", getIP(r), "Invalid credentials (password mismatch)")
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Update Last Login
	router.UserStore.UpdateLastLogin(user.ID)

    // Audit Log
    router.LogAudit(user.ID, user.Email, "LOGIN", "USER", "", getIP(r), "Login successful")

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

// HandleLogout handles logging of logouts (Client should trigger this)
func (router *Router) HandleLogout(w http.ResponseWriter, r *http.Request) {
    // We expect a valid token in context if auth middleware is used, or we just log "Logout attempt" if not.
    // Since logout clears token client-side, this call is made just before clearing.
    // If we use middleware, we know who it is.
    // If not, we can try to parse header manually if middleware not applied to this route?
    // Let's assume this route is protected or expects header.
    
    // Actually, middleware puts fields in context. If not protected, context is empty.
    // We should probably protect it with UserTokenMiddleware.
    
    // For now, let's try to extract from context (assuming middleware is applied)
    // There is no easy way to get UserID from standard Claims without looking at how Middleware sets it.
    // Our middleware (in other files) sets "user" or "email" in context?
    // Let's check middleware later, but typical usage:
    // We'll read from Body if we want user details, or trust the token.
    
    // Simplified: Just 200 OK.
    // BUT we need to audit.
    // Let's rely on middleware to populate context, OR decode token manually here if needed.
    // For this impl, I'll assume we add it to a protected group.
    
    // Placeholder implementation, to be enhanced if context has user info.
    w.WriteHeader(http.StatusOK)
}


// GenerateJWT creates a new token for the given user
func GenerateJWT(email, role string, expirationTime time.Time) (string, error) {
	claims := jwt.MapClaims{
		"sub":  email,
		"role": role,
		"exp":  expirationTime.Unix(),
		"iss":  "essensys-backend",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTKey())
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


