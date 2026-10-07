package api

import (
	"crypto/subtle"
	"encoding/json"
	"log"
	"net/http"
	"os"
    "strconv"
    "time"

    "github.com/go-chi/chi/v5"
	"github.com/essensys-hub/essensys-support-site/backend/internal/gatewayrules"
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

	// ADMIN_TOKEN is validated at startup; never accept a missing/empty
	// expected token, and compare in constant time.
	expectedToken := os.Getenv("ADMIN_TOKEN")
	if expectedToken == "" || subtle.ConstantTimeCompare([]byte(req.Token), []byte(expectedToken)) != 1 {
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
    if users == nil {
        users = []*models.User{}
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
    if _, err := authorizeAdminTarget(rt.UserStore, currentUser, targetUserID, actionUpdateRole, req.Role); err != nil {
        writeAuthzError(w, err)
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

    email := r.Context().Value("user_email").(string)
    currentUser, err := rt.UserStore.GetUserByEmail(email)
    if err != nil || currentUser == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    idStr := chi.URLParam(r, "id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "Invalid User ID", http.StatusBadRequest)
        return
    }

    if _, err := authorizeAdminTarget(rt.UserStore, currentUser, id, actionUpdateLinks, ""); err != nil {
        writeAuthzError(w, err)
        return
    }

    var req struct {
        MachineID *int    `json:"linked_machine_id"`
        GatewayID *string `json:"linked_gateway_id"`
        ArmoireID *int    `json:"linked_armoire_id"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Bad Request", http.StatusBadRequest)
        return
    }

    if req.GatewayID != nil && !gatewayrules.IsRemoteEligible(req.GatewayID) {
        if req.ArmoireID != nil || req.MachineID != nil {
            http.Error(w, gatewayrules.RemoteBlockedMessage(), http.StatusBadRequest)
            return
        }
        req.ArmoireID = nil
        req.MachineID = nil
    }

    if err := gatewayrules.ValidateAdminUserLinks(req.MachineID, req.GatewayID, req.ArmoireID); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Admins can link within authorized scope
    if err := rt.UserStore.UpdateUserLinks(id, req.MachineID, req.GatewayID, req.ArmoireID); err != nil {
        log.Printf("[API] Failed to update user links (Admin): %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}

func (rt *Router) HandleAdminForbidUser(w http.ResponseWriter, r *http.Request) {
    caller, target, idStr, ok := rt.authorizeAdminUserAction(w, r, actionForbid)
    if !ok {
        return
    }
    if models.IsUserForbidden(target) {
        http.Error(w, "User already forbidden", http.StatusConflict)
        return
    }
    if err := rt.UserStore.ForbidUser(target.ID); err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }
    rt.LogAudit(caller.ID, caller.Email, "FORBID_USER", "USER", idStr, getIP(r), "Forbidden user "+target.Email)
    w.WriteHeader(http.StatusNoContent)
}

func (rt *Router) HandleAdminUnforbidUser(w http.ResponseWriter, r *http.Request) {
    caller, target, idStr, ok := rt.authorizeAdminUserAction(w, r, actionUnforbid)
    if !ok {
        return
    }
    if !models.IsUserForbidden(target) {
        http.Error(w, "User is not forbidden", http.StatusConflict)
        return
    }
    if err := rt.UserStore.UnforbidUser(target.ID); err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }
    rt.LogAudit(caller.ID, caller.Email, "UNFORBID_USER", "USER", idStr, getIP(r), "Re-enabled user "+target.Email)
    w.WriteHeader(http.StatusNoContent)
}

func (rt *Router) HandleAdminDeleteUser(w http.ResponseWriter, r *http.Request) {
    caller, target, idStr, ok := rt.authorizeAdminUserAction(w, r, actionDelete)
    if !ok {
        return
    }
    if err := rt.UserStore.DeleteUser(target.ID); err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }
    rt.LogAudit(caller.ID, caller.Email, "DELETE_USER", "USER", idStr, getIP(r), "Deleted user "+target.Email)
    w.WriteHeader(http.StatusNoContent)
}

func (rt *Router) authorizeAdminUserAction(w http.ResponseWriter, r *http.Request, action adminAction) (*models.User, *models.User, string, bool) {
    if rt.UserStore == nil {
        http.Error(w, "User Store not initialized", http.StatusServiceUnavailable)
        return nil, nil, "", false
    }
    email := r.Context().Value("user_email").(string)
    caller, err := rt.UserStore.GetUserByEmail(email)
    if err != nil || caller == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return nil, nil, "", false
    }
    idStr := chi.URLParam(r, "id")
    targetID, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "Invalid User ID", http.StatusBadRequest)
        return nil, nil, "", false
    }
    target, err := authorizeAdminTarget(rt.UserStore, caller, targetID, action, "")
    if err != nil {
        writeAuthzError(w, err)
        return nil, nil, "", false
    }
    return caller, target, idStr, true
}

// GET /api/admin/audit
func (rt *Router) HandleGetAuditLogs(w http.ResponseWriter, r *http.Request) {
    if rt.AuditStore == nil {
         http.Error(w, "Audit Store not initialized", http.StatusServiceUnavailable)
         return
    }

    email := r.Context().Value("user_email").(string)
    currentUser, err := rt.UserStore.GetUserByEmail(email)
    if err != nil || currentUser == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    filter := models.AuditFilter{
        Limit: 100, // Default limit
        Offset: 0,
    }
    
    // Parse Query Params
    if l := r.URL.Query().Get("limit"); l != "" {
        if val, err := strconv.Atoi(l); err == nil {
            filter.Limit = val
        }
    }
    if o := r.URL.Query().Get("offset"); o != "" {
        if val, err := strconv.Atoi(o); err == nil {
            filter.Offset = val
        }
    }

    // Role-Based Filtering
    if currentUser.Role == models.RoleAdminGlobal {
        // Global Admin: Sees all
    } else if currentUser.Role == models.RoleAdminLocal {
        // Local Admin: Filter by Machine (Implemented in Store via MachineID param)
         if currentUser.LinkedMachineID != nil {
             filter.MachineID = *currentUser.LinkedMachineID
        } else {
             // AdminLocal without machine -> Empty list
             w.Header().Set("Content-Type", "application/json")
             json.NewEncoder(w).Encode([]*models.AuditLog{})
             return
        }
    } else if currentUser.Role == models.RoleUser {
        // User: Sees ONLY their OWN actions
        filter.UserID = currentUser.ID
    } else {
        http.Error(w, "Forbidden", http.StatusForbidden)
        return
    }
    
    logs, err := rt.AuditStore.GetAuditLogs(filter)
    if err != nil {
        log.Printf("[API] Failed to get audit logs: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(logs)
}
