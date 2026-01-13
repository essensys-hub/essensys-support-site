package api

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
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
