package api

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"

    "github.com/essensys-hub/essensys-support-site/backend/internal/models"
    "github.com/go-chi/chi/v5"
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

// GET /api/admin/newsletters
func (rt *Router) HandleGetNewsletters(w http.ResponseWriter, r *http.Request) {
    list, err := rt.Store.GetNewsletters()
    if err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(list)
}

// POST /api/admin/newsletters
func (rt *Router) HandleCreateNewsletter(w http.ResponseWriter, r *http.Request) {
    id := fmt.Sprintf("%d", time.Now().UnixNano())
    
    n := models.Newsletter{
        ID:        id,
        Subject:   "Nouvelle Newsletter",
        Content:   "# Nouveau Brouillon\n\nCommencez à rédiger ici...",
        Status:    "draft",
        Version:   1,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    
    if err := rt.Store.SaveNewsletter(n); err != nil {
        http.Error(w, "Failed to create", http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(n)
}

// PUT /api/admin/newsletters/{id}
func (rt *Router) HandleUpdateNewsletter(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    
    currentUser, err := rt.Store.GetNewsletter(id)
    if err != nil {
        http.Error(w, "Not Found", http.StatusNotFound)
        return
    }
    
    if currentUser.Status == "sent" {
        http.Error(w, "Cannot edit sent newsletter", http.StatusForbidden)
        return
    }
    
    var req models.Newsletter
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Bad Request", http.StatusBadRequest)
        return
    }
    
    // Update allowed fields
    currentUser.Subject = req.Subject
    currentUser.Content = req.Content
    currentUser.UpdatedAt = time.Now()
    currentUser.Version++
    
    if req.Status == "draft" || req.Status == "ready" {
        currentUser.Status = req.Status
    }
    
    if err := rt.Store.SaveNewsletter(*currentUser); err != nil {
        http.Error(w, "Failed to save", http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(currentUser)
}

// DELETE /api/admin/newsletters/{id}
func (rt *Router) HandleDeleteNewsletter(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if err := rt.Store.DeleteNewsletter(id); err != nil {
        http.Error(w, "Failed to delete", http.StatusInternalServerError)
        return
    }
    w.WriteHeader(http.StatusOK)
}

// POST /api/admin/newsletters/{id}/send
func (rt *Router) HandleSendNewsletter(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    
    n, err := rt.Store.GetNewsletter(id)
    if err != nil {
        http.Error(w, "Not Found", http.StatusNotFound)
        return
    }
    
    if n.Status != "ready" {
        http.Error(w, "Newsletter must be 'ready' to send", http.StatusBadRequest)
        return
    }
    
    // Simulate Sending
    subs, _ := rt.Store.GetSubscribers()
    log.Printf("[NEWSLETTER] Sending '%s' to %d subscribers...", n.Subject, len(subs))
    for _, s := range subs {
        log.Printf("[NEWSLETTER] -> Sending to %s", s.Email)
    }
    
    now := time.Now()
    n.Status = "sent"
    n.SentAt = &now
    n.UpdatedAt = now
    
    if err := rt.Store.SaveNewsletter(*n); err != nil {
        http.Error(w, "Failed to save status", http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(n)
}
