package main

import (
	"log"
	"net/http"
	"os"

	"github.com/essensys-hub/essensys-support-site/backend/internal/api"
	"github.com/essensys-hub/essensys-support-site/backend/internal/data"
	"github.com/essensys-hub/essensys-support-site/backend/internal/middleware"
	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
	
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

func main() {
	log.Println("Starting Essensys Passive Monitoring Server...")

	// 1. Init Store (Memory for now)
	store := data.NewMemoryStore()
    
    // Seed a test machine for development
    // User: "testuser" -> MD5("testuser") -> ... wait, client logic is reverse.
    // Client has KEY (16 bytes). 
    // Let's create a known HashedPkey for testing.
    // user: aaaaaaaaaaaaaaaa (16 'a')
    // pass: bbbbbbbbbbbbbbbb (16 'b')
    // hashedPkey: aaaaaaaaaaaaaaaabbbbbbbbbbbbbbbb
	store.AddTestMachine(&models.Machine{
		ID: 1,
		NoSerie: "TEST-CLIENT-01",
		IsActive: true,
		HashedPkey: "aaaaaaaaaaaaaaaabbbbbbbbbbbbbbbb",
	})
    log.Println("Seeded Test Machine: User='aaaaaaaaaaaaaaaa', Pass='bbbbbbbbbbbbbbbb' (Basic YWFhYWFhYWFhYWFhYWFhYTpiYmJiYmJiYmJiYmJiYmJi)")

	// 2. Init Router
	r := chi.NewRouter()
    r.Use(chimiddleware.RealIP) // Must be before Logger to fix IP in logs
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)

	// 3. API Routes with Auth
	apiRouter := api.NewRouter(store)
	
	r.Route("/api", func(r chi.Router) {
        // 1a. IoT Routes - Strict Auth
		r.Group(func(r chi.Router) {
            r.Use(middleware.BasicAuthMiddleware(store, true))
		    r.Post("/mystatus", apiRouter.HandleMyStatus)
		    r.Get("/myactions", apiRouter.HandleMyActions)
        })

        // 1b. IoT Routes - Optional Auth (Public Access allowed)
        r.Group(func(r chi.Router) {
            r.Use(middleware.BasicAuthMiddleware(store, false))
		    r.Get("/serverinfos", apiRouter.HandleServerInfos)
        })
        
        // 2. Admin Routes (Token Auth)
        r.Group(func(r chi.Router) {
            // Public Login endpoint (checks token in body)
            r.Post("/admin/login", apiRouter.HandleAdminLogin)
            
            // Protected Admin endpoints
            r.Group(func(r chi.Router) {
                r.Use(middleware.AdminTokenMiddleware)
                r.Get("/admin/stats", apiRouter.HandleAdminStats)
                r.Get("/admin/machines", apiRouter.HandleAdminMachines)
            })
        })
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Listening on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
