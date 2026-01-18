package api

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"strings"


	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
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
