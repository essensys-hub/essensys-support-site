package api

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
    "strconv"
    "time"

    "github.com/go-chi/chi/v5"
	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
    "golang.org/x/crypto/bcrypt"
)

// POST /api/admin/login
func (rt *Router) HandleAdminLogin(w http.ResponseWriter, r *http.Request) {
	var req models.AdminLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	// Simple Token Validation (Hardcoded or Env)
	expectedToken := os.Getenv("ADMIN_TOKEN")
	if expectedToken == "" {
		expectedToken = "essensys-admin-secret" // Default dev token
	}

	if req.Token != expectedToken {
		http.Error(w, "Invalid Token", http.StatusUnauthorized)
		return
	}

	// Success
	w.WriteHeader(http.StatusOK)
}

// GET /api/admin/stats
func (rt *Router) HandleAdminStats(w http.ResponseWriter, r *http.Request) {
	stats, err := rt.Store.GetStats()
	if err != nil {
		log.Printf("[API] Failed to get stats: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// GET /api/admin/machines
func (rt *Router) HandleAdminMachines(w http.ResponseWriter, r *http.Request) {
	machines, err := rt.Store.GetMachines()
	if err != nil {
		log.Printf("[API] Failed to get machines: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(machines)
}

// GET /api/admin/users
func (rt *Router) HandleAdminGetUsers(w http.ResponseWriter, r *http.Request) {
    if rt.UserStore == nil {
        http.Error(w, "User Store not initialized", http.StatusServiceUnavailable)
        return
    }

    users, err := rt.UserStore.GetAllUsers()
    if err != nil {
        log.Printf("[API] Failed to get users: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(users)
}

// PUT /api/admin/users/{id}/role
func (rt *Router) HandleAdminUpdateUserRole(w http.ResponseWriter, r *http.Request) {
    if rt.UserStore == nil {
        http.Error(w, "User Store not initialized", http.StatusServiceUnavailable)
        return
    }

    idStr := chi.URLParam(r, "id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "Invalid User ID", http.StatusBadRequest)
        return
    }

    var req struct {
        Role string `json:"role"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Bad Request", http.StatusBadRequest)
        return
    }

    if req.Role != "admin" && req.Role != "user" && req.Role != "support" {
        http.Error(w, "Invalid Role", http.StatusBadRequest)
        return
    }

    if err := rt.UserStore.UpdateUserRole(id, req.Role); err != nil {
        log.Printf("[API] Failed to update user role: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}

// POST /api/admin/users
func (rt *Router) HandleAdminCreateUser(w http.ResponseWriter, r *http.Request) {
    if rt.UserStore == nil {
        http.Error(w, "User Store not initialized", http.StatusServiceUnavailable)
        return
    }

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
    existingUser, err := rt.UserStore.GetUserByEmail(req.Email)
    if err != nil {
        log.Printf("[API] DB Error checking user: %v", err)
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
        log.Printf("[API] Password hash failed: %v", err)
        http.Error(w, "Failed to process password", http.StatusInternalServerError)
        return
    }

    role := models.RoleUser // Default to user, admin can upgrade later
    // Or we could accept role in payload if we extended RegisterRequest, but let's keep it simple.

    user := &models.User{
        Email:        req.Email,
        PasswordHash: string(hashedPassword),
        Role:         role,
        FirstName:    req.FirstName,
        LastName:     req.LastName,
        Provider:     models.ProviderEmail,
        CreatedAt:    time.Now(),
        LastLogin:    time.Now(), // Placeholder
    }

    if err := rt.UserStore.CreateUser(user); err != nil {
        log.Printf("[API] Failed to create user: %v", err)
        http.Error(w, "Failed to create user", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}
