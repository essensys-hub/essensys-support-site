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

// GET /api/admin/gateways
func (rt *Router) HandleAdminGateways(w http.ResponseWriter, r *http.Request) {
    gateways, err := rt.Store.GetGateways()
    if err != nil {
        log.Printf("[API] Failed to get gateways: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(gateways)
}

// GET /api/admin/users
func (rt *Router) HandleAdminGetUsers(w http.ResponseWriter, r *http.Request) {
    if rt.UserStore == nil {
        http.Error(w, "User Store not initialized", http.StatusServiceUnavailable)
        return
    }

    // Get Current Admin User
    email := r.Context().Value("user_email").(string)
    currentUser, err := rt.UserStore.GetUserByEmail(email)
    if err != nil || currentUser == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    var users []*models.User
    
    if currentUser.Role == models.RoleAdminGlobal {
        // Global Admin: GetAll
        users, err = rt.UserStore.GetAllUsers()
    } else if currentUser.Role == models.RoleAdminLocal {
        // Local Admin: GetByMachine
        if currentUser.LinkedMachineID == nil {
            // Edge case: AdminLocal but no machine? Should not happen.
            users = []*models.User{}
        } else {
            users, err = rt.UserStore.GetUsersByMachineID(*currentUser.LinkedMachineID)
        }
    } else {
        http.Error(w, "Forbidden", http.StatusForbidden)
        return
    }

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

    // Get Current Admin
    email := r.Context().Value("user_email").(string)
    currentUser, err := rt.UserStore.GetUserByEmail(email)
    if err != nil || currentUser == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    idStr := chi.URLParam(r, "id")
    targetUserID, err := strconv.Atoi(idStr)
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

    // Permission Check
    allowed := false
    
    if currentUser.Role == models.RoleAdminGlobal {
        // Global can set any role (except maybe invalid ones)
        allowed = true
    } else if currentUser.Role == models.RoleAdminLocal {
        // Local can ONLY promote guest_local <-> user
        // They CANNOT touch other admins or themselves (usually)
        // And they must own the user (checked below)
        
        // Check if target user belongs to same machine
        // We could fetch target user, but simpler: verify target is in My Users list?
        // Let's fetch target user to be safe.
        // Optimization: We could rely on GetUsersByMachineID check, but explicit fetch is safer.
        // However, we don't have GetUserByID exposed on Store yet?
        // Wait, UserStore interface doesn't have GetUserByID. It has GetUserByEmail.
        // I need GetUserByID to verify relationship!
        // or I can call UpdateUserRole blindly but that's insecure.
        // Let's assume for now I add GetUserByID to store, or fetch all and filter.
        // Or blindly trust ID? No.
        
        // WORKAROUND: Iterate over GetUsersByMachineID results to find ID.
        if currentUser.LinkedMachineID != nil {
             myUsers, _ := rt.UserStore.GetUsersByMachineID(*currentUser.LinkedMachineID)
             for _, u := range myUsers {
                 if u.ID == targetUserID {
                     allowed = true
                     break
                 }
             }
        }
        
        // Scope Check: Can only set 'user' or 'guest_local'
        if req.Role != models.RoleUser && req.Role != models.RoleGuestLocal {
            allowed = false
        }
    }

    if !allowed {
        http.Error(w, "Forbidden: Insufficient Permissions", http.StatusForbidden)
        return
    }

    if err := rt.UserStore.UpdateUserRole(targetUserID, req.Role); err != nil {
        log.Printf("[API] Failed to update user role: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    // Audit Log
    detail := "Updated role for user " + idStr + " to " + req.Role
    rt.LogAudit(currentUser.ID, currentUser.Email, "UPDATE_ROLE", "USER", idStr, getIP(r), detail)

    w.WriteHeader(http.StatusOK)
}

// POST /api/admin/users
func (rt *Router) HandleAdminCreateUser(w http.ResponseWriter, r *http.Request) {
    if rt.UserStore == nil {
        http.Error(w, "User Store not initialized", http.StatusServiceUnavailable)
        return
    }

    // Get Current Admin for Audit
    // Assuming context has valid user email from middleware
    adminEmail, _ := r.Context().Value("user_email").(string)
    adminID := 0
    if adminEmail != "" {
        if u, err := rt.UserStore.GetUserByEmail(adminEmail); err == nil && u != nil {
            adminID = u.ID
        }
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

    role := models.RoleGuestLocal // Default to guest, local admin can promote
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

    // Audit Log
    rt.LogAudit(adminID, adminEmail, "CREATE_USER", "USER", user.Email, getIP(r), "Created user by admin")

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}

// PUT /api/admin/users/{id}/links
func (rt *Router) HandleAdminUpdateUserLinks(w http.ResponseWriter, r *http.Request) {
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
        MachineID *int    `json:"linked_machine_id"`
        GatewayID *string `json:"linked_gateway_id"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Bad Request", http.StatusBadRequest)
        return
    }

    // Admins can link whatever they want, no IP check
    if err := rt.UserStore.UpdateUserLinks(id, req.MachineID, req.GatewayID); err != nil {
        log.Printf("[API] Failed to update user links (Admin): %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}
