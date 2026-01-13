package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/essensys-hub/essensys-support-site/backend/internal/data"
	"github.com/essensys-hub/essensys-support-site/backend/internal/middleware"
	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
)

type Router struct {
	Store data.Store
}

func NewRouter(store data.Store) *Router {
	return &Router{Store: store}
}

// GET /api/serverinfos
func (rt *Router) HandleServerInfos(w http.ResponseWriter, r *http.Request) {
	clientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
	log.Printf("[API] ServerInfos requested by %s", clientID)

	response := models.ServerInfosResponse{
		IsConnected: false, // Always false in passive mode (no user interaction needed)
		Infos:       []int{363, 349, 350, 351, 352, 353, 11, 920}, // Indices to collect
		NewVersion:  "no", // No firmware update for now
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// POST /api/mystatus
func (rt *Router) HandleMyStatus(w http.ResponseWriter, r *http.Request) {
	clientID, _ := r.Context().Value(middleware.ClientIDKey).(string)
	
	// Decode Payload
	var payload models.MyStatusPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		log.Printf("[API] MyStatus Bad Request from %s: %v", clientID, err)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	// Capture Data
	log.Printf("[API] MyStatus received from %s (Ver: %s, %d Keys)", clientID, payload.Version, len(payload.EK))
	if err := rt.Store.SaveClientData(clientID, payload.EK); err != nil {
        log.Printf("[API] Failed to save data: %v", err)
    }

	// Return 201 Created (Empty Body)
	w.WriteHeader(http.StatusCreated)
}

// GET /api/myactions (Not Implemented / Empty)
func (rt *Router) HandleMyActions(w http.ResponseWriter, r *http.Request) {
	// Passive Mode: We never send actions.
	// We can return 404 or an empty list. 
    // Returning empty JSON list is safer for client compatibility if it insists on parsing JSON.
    // Or just 200 OK with empty body if client ignores it.
    // Spec says "Not Implemented", let's return 200 OK with empty JSON object or just 200.
    
    // For safety against legacy client parsing crashes:
    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte("{}")) 
}
