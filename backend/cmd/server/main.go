package main

import (
	"log"
	"net/http"
	"os"

	"github.com/essensys-hub/essensys-support-site/backend/internal/api"
	"github.com/essensys-hub/essensys-support-site/backend/internal/data"
	"github.com/essensys-hub/essensys-support-site/backend/internal/middleware"

	
	"fmt"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jmoiron/sqlx"
)

func main() {
	log.Println("Starting Essensys Passive Monitoring Server...")

	// 1. Init Store (File-based persistence)
	store := data.NewMemoryStore("./data/machines.json")
    


	// 2. Init Router
	r := chi.NewRouter()
    r.Use(chimiddleware.RealIP) // Must be before Logger to fix IP in logs
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)

	// 1b. Init Postgres (User Store)
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

    var userStore data.UserStore

    // Only connect if DB envs are set (Graceful degradation or Fatal?)
    // For now, let's try to connect if configured.
    if dbHost != "" {
        dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", 
            dbHost, dbPort, dbUser, dbPass, dbName)
        
        db, err := sqlx.Connect("postgres", dsn)
        if err != nil {
             log.Printf("WARNING: Failed to connect to database: %v. User Registration will fail.", err)
             userStore = &data.PostgresUserStore{} // Empty struct or nil handling? 
             // Ideally we should fail or have a mock. 
             // Let's create a partial store that returns errors if DB is nil.
        } else {
             log.Println("Connected to PostgreSQL")
             store := data.NewPostgresUserStore(db)
             if err := store.EnsureTableExists(); err != nil {
                 log.Fatalf("Failed to init user table: %v", err)
             }
             userStore = store
        }
    } else {
        log.Println("WARNING: DB configuration missing. User Store disable.")
    }

	// 3. API Routes with Auth
	apiRouter := api.NewRouter(store, userStore)
	
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
		    r.Post("/infos", apiRouter.HandleGatewayInfos)
        })
        
        // 3. Newsletter (Public)
        r.Post("/newsletter/subscribe", apiRouter.HandleSubscribe)
        
        // 2. Admin Routes (Token Auth & OAuth)
        r.Group(func(r chi.Router) {
            // OAuth Endpoints (Public)
            r.Get("/auth/google/login", apiRouter.HandleGoogleLogin)
            r.Get("/auth/google/login", apiRouter.HandleGoogleLogin)
            r.Get("/auth/google/callback", apiRouter.HandleGoogleCallback)
            
            // Email Auth
            r.Post("/auth/register", apiRouter.HandleRegister)
            r.Post("/auth/login", apiRouter.HandleLogin)
            
            // Apple OAuth
            r.Get("/auth/apple/login", apiRouter.HandleAppleLogin)
            r.Post("/auth/apple/callback", apiRouter.HandleAppleCallback) // Note: Apple uses POST for callback

            // Public Login endpoint (checks token in body - Legacy)
            r.Post("/admin/login", apiRouter.HandleAdminLogin)
            
            // Protected Admin endpoints
            r.Group(func(r chi.Router) {
                r.Use(middleware.AdminTokenMiddleware)
                r.Get("/admin/stats", apiRouter.HandleAdminStats)
                r.Get("/admin/machines", apiRouter.HandleAdminMachines)
                r.Get("/admin/gateways", apiRouter.HandleAdminGateways) // Added
                r.Get("/admin/subscribers", apiRouter.HandleAdminSubscribers)
                r.Post("/admin/subscribers", apiRouter.HandleAdminAddSubscriber)
                r.Delete("/admin/subscribers", apiRouter.HandleDeleteSubscriber)
                
                // Newsletter Manager
                r.Get("/admin/newsletters", apiRouter.HandleGetNewsletters)
                r.Post("/admin/newsletters", apiRouter.HandleCreateNewsletter)
                r.Put("/admin/newsletters/{id}", apiRouter.HandleUpdateNewsletter)
                r.Delete("/admin/newsletters/{id}", apiRouter.HandleDeleteNewsletter)
                r.Post("/admin/newsletters/{id}/send", apiRouter.HandleSendNewsletter)

                // User Management
                r.Get("/admin/users", apiRouter.HandleAdminGetUsers)
                r.Post("/admin/users", apiRouter.HandleAdminCreateUser)
                r.Put("/admin/users/{id}/role", apiRouter.HandleAdminUpdateUserRole)
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
