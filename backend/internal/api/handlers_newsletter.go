package api

import (
    "encoding/json"
    "log"
    "net/http"
)

type SubscribeRequest struct {
    Email string `json:"email"`
}

// POST /api/newsletter/subscribe
func (rt *Router) HandleSubscribe(w http.ResponseWriter, r *http.Request) {
    var req SubscribeRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Bad Request", http.StatusBadRequest)
        return
    }

    if req.Email == "" {
        http.Error(w, "Email required", http.StatusBadRequest)
        return
    }

    if err := rt.Store.AddSubscriber(req.Email); err != nil {
        log.Printf("[API] Failed to subscribe: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"subscribed"}`))
}

// GET /api/admin/subscribers
func (rt *Router) HandleAdminSubscribers(w http.ResponseWriter, r *http.Request) {
    subs, err := rt.Store.GetSubscribers()
    if err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(subs)
}
