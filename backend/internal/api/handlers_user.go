package api

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"strings"


	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
    "golang.org/x/crypto/bcrypt"
    "time"
)

// Helper to get IP from request (handling proxies)
func getIP(r *http.Request) string {
    // Check X-Forwarded-For
    forwarded := r.Header.Get("X-Forwarded-For")
    if forwarded != "" {
        return strings.Split(forwarded, ",")[0]
    }
    
    // Check RealIP middleware context if present (not strictly standard but common)
    // Or just RemoteAddr
    host, _, err := net.SplitHostPort(r.RemoteAddr)
    if err == nil {
        return host
    }
    return r.RemoteAddr
}

// GET /api/devices/nearby
func (rt *Router) HandleGetNearbyDevices(w http.ResponseWriter, r *http.Request) {
    userIP := getIP(r)
    // In dev, if localhost, we might want to see everything or handle it specifically.
    // userIP := "88.124.210.27" // DEBUG: Force IP for testing if needed
    
    log.Printf("[API] Searching devices nearby IP: %s", userIP)

    machines, err := rt.Store.GetMachines()
    if err != nil {
        http.Error(w, "Failed to get machines", http.StatusInternalServerError)
        return
    }

    gateways, err := rt.Store.GetGateways()
    if err != nil {
        http.Error(w, "Failed to get gateways", http.StatusInternalServerError)
        return
    }

    nearbyMachines := make([]*models.MachineDetail, 0)
    for _, m := range machines {
        // Match IP
        if m.IP == userIP {
            nearbyMachines = append(nearbyMachines, m)
        }
    }

    nearbyGateways := make([]*models.GatewayStatus, 0)
    for _, gw := range gateways {
        if gw.IP == userIP {
            nearbyGateways = append(nearbyGateways, gw)
        }
    }

    response := struct {
        Machines []*models.MachineDetail `json:"machines"`
        Gateways []*models.GatewayStatus `json:"gateways"`
        UserIP   string                  `json:"user_ip"`
    }{
        Machines: nearbyMachines,
        Gateways: nearbyGateways,
        UserIP:   userIP,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

// PUT /api/profile/links
func (rt *Router) HandleUpdateProfileLinks(w http.ResponseWriter, r *http.Request) {
    if rt.UserStore == nil {
        http.Error(w, "User Store not initialized", http.StatusServiceUnavailable)
        return
    }

    emailVal := r.Context().Value("user_email")
    if emailVal == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    email := emailVal.(string)

    user, err := rt.UserStore.GetUserByEmail(email)
    if err != nil || user == nil {
        http.Error(w, "User not found", http.StatusNotFound)
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
    
    // Security Check: Users should only be able to link devices on their own IP
    // But since they can spoof IP or just be elsewhere, maybe we trust them for now?
    // OR, better, we verify that the requested Machine/Gateway is currently on the same IP as the user request.
    
    userIP := getIP(r)
    // userIP := "88.124.210.27" // DEBUG
    
    // Validate Machine
    if req.MachineID != nil {
        machines, _ := rt.Store.GetMachines()
        found := false
        for _, m := range machines {
            if m.ID == *req.MachineID {
                // Check IP
                if m.IP != userIP {
                    log.Printf("[Security] User %s attempted to link machine %d with different IP (%s vs %s)", email, m.ID, m.IP, userIP)
                    // We allow admins to override, but this is user profile.
                    // Let's enforce IP match for security.
                    http.Error(w, "Cannot link device: IP mismatch. You must be on the same network.", http.StatusForbidden)
                    return
                }
                found = true
                break
            }
        }
        if !found {
             http.Error(w, "Machine not found", http.StatusNotFound)
             return
        }
    }
    
    // Validate Gateway
    if req.GatewayID != nil {
        gateways, _ := rt.Store.GetGateways()
        found := false
        for _, gw := range gateways {
            if gw.Hostname == *req.GatewayID {
                if gw.IP != userIP {
                     http.Error(w, "Cannot link gateway: IP mismatch.", http.StatusForbidden)
                     return
                }
                found = true
                break
            }
        }
        if !found {
            http.Error(w, "Gateway not found", http.StatusNotFound)
            return
        }
    }

    if err := rt.UserStore.UpdateUserLinks(user.ID, req.MachineID, req.GatewayID); err != nil {
        log.Printf("[API] Failed to update user links: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}

// GET /api/profile
func (rt *Router) HandleGetProfile(w http.ResponseWriter, r *http.Request) {
    if rt.UserStore == nil {
        http.Error(w, "User Store not initialized", http.StatusServiceUnavailable)
        return
    }

    emailVal := r.Context().Value("user_email")
    if emailVal == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    email := emailVal.(string)

    user, err := rt.UserStore.GetUserByEmail(email)
    if err != nil || user == nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    // Convert to UserResponse
    resp := models.UserResponse{
        ID:        user.ID,
        Email:     user.Email,
        Role:      user.Role,
        FirstName: user.FirstName,
        LastName:  user.LastName,
        Provider:  user.Provider,
        LinkedMachineID: user.LinkedMachineID,
        LinkedGatewayID: user.LinkedGatewayID,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(resp)
}

// PUT /api/profile
func (rt *Router) HandleUpdateProfile(w http.ResponseWriter, r *http.Request) {
    if rt.UserStore == nil {
        http.Error(w, "User Store not initialized", http.StatusServiceUnavailable)
        return
    }

    emailVal := r.Context().Value("user_email")
    if emailVal == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    email := emailVal.(string)
    user, err := rt.UserStore.GetUserByEmail(email)
    if err != nil || user == nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    var req struct {
        FirstName string `json:"first_name"`
        LastName  string `json:"last_name"`
        Password  string `json:"password"` // Optional
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Bad Request", http.StatusBadRequest)
        return
    }

    // Logic: Update fields if provided
    // If password provided, hash it.
    hash := ""
    if req.Password != "" {
        hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
        if err != nil {
             http.Error(w, "Server Error", http.StatusInternalServerError)
             return
        }
        hash = string(hashedBytes)
    }

    if err := rt.UserStore.UpdateUser(user.ID, req.FirstName, req.LastName, hash); err != nil {
        log.Printf("[API] Failed to update user profile: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }
    
    // Audit
    rt.LogAudit(user.ID, email, "UPDATE_PROFILE", "USER", email, getIP(r), "Updated personal details")

    w.WriteHeader(http.StatusOK)
}

// DELETE /api/profile
func (rt *Router) HandleDeleteProfile(w http.ResponseWriter, r *http.Request) {
    if rt.UserStore == nil {
        http.Error(w, "Service Unavailable", http.StatusServiceUnavailable)
        return
    }
    emailVal := r.Context().Value("user_email")
    if emailVal == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    email := emailVal.(string)
    user, err := rt.UserStore.GetUserByEmail(email)
    if err != nil || user == nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    if err := rt.UserStore.DeleteUser(user.ID); err != nil {
        log.Printf("[API] Failed to delete user: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }
    
    // Audit (Note: logging action for a deleted user ID might be tricky if reporting relies on User existence, but Audit table stores snapshotted username)
    rt.LogAudit(user.ID, email, "DELETE_PROFILE", "USER", email, getIP(r), "User deleted their own account")

    w.WriteHeader(http.StatusOK)
}

// GET /api/profile/export
func (rt *Router) HandleExportProfile(w http.ResponseWriter, r *http.Request) {
    if rt.UserStore == nil {
         http.Error(w, "Service Unavailable", http.StatusServiceUnavailable)
         return
    }
    emailVal := r.Context().Value("user_email")
    if emailVal == nil {
         http.Error(w, "Unauthorized", http.StatusUnauthorized)
         return
    }
    email := emailVal.(string)
    user, err := rt.UserStore.GetUserByEmail(email)
    if err != nil || user == nil {
         http.Error(w, "User not found", http.StatusNotFound)
         return
    }

    // 1. Get User Data
    // 2. Get Audit Logs for User
    logs := []*models.AuditLog{}
    if rt.AuditStore != nil {
        filter := models.AuditFilter{UserID: user.ID, Limit: 1000, Offset: 0}
        l, _ := rt.AuditStore.GetAuditLogs(filter)
        if l != nil {
            logs = l
        }
    }
    
    export := struct {
        User      *models.User       `json:"user_profile"`
        AuditLogs []*models.AuditLog `json:"audit_history"`
        ExportedAt time.Time         `json:"exported_at"`
    }{
        User: user,
        AuditLogs: logs,
        ExportedAt: time.Now(),
    }
    
    // Send as file download
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("Content-Disposition", "attachment; filename=\"essensys_export.json\"")
    json.NewEncoder(w).Encode(export)
    
    rt.LogAudit(user.ID, email, "EXPORT_DATA", "USER", email, getIP(r), "Exported personal data")
}
