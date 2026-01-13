package middleware

import (
	"context"
	"encoding/base64"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/essensys-hub/essensys-support-site/backend/internal/data"
)

type contextKey string

const (
	ClientIDKey contextKey = "clientID"
)

// BasicAuthMiddleware implements the Legacy IoT Authentication Protocol
// strict=true: Require valid Auth. strict=false: Allow anonymous if headers missing.
func BasicAuthMiddleware(store data.Store, strict bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Basic ") {
                if !strict {
                    // Optional Auth: Allow anonymous access
			        ctx := context.WithValue(r.Context(), ClientIDKey, "anonymous")
			        next.ServeHTTP(w, r.WithContext(ctx))
                    return
                }
				unauthorized(w)
				return
			}

			// 1. Decode Base64
			encodedCredentials := authHeader[6:] 
			decodedBytes, err := base64.StdEncoding.DecodeString(encodedCredentials)
			if err != nil {
                if !strict {
                    log.Printf("BasicAuth (Lax): Invalid Base64, proceeding as anonymous")
                    ctx := context.WithValue(r.Context(), ClientIDKey, "anonymous")
			        next.ServeHTTP(w, r.WithContext(ctx))
                    return
                }
				log.Printf("BasicAuth: Invalid Base64: %v", err)
				unauthorized(w)
				return
			}

			// 2. Split username:password
			credentials := string(decodedBytes)
			parts := strings.SplitN(credentials, ":", 2)
			if len(parts) != 2 {
                if !strict {
                    log.Printf("BasicAuth (Lax): Invalid format, proceeding as anonymous")
                    ctx := context.WithValue(r.Context(), ClientIDKey, "anonymous")
			        next.ServeHTTP(w, r.WithContext(ctx))
                    return
                }
				log.Printf("BasicAuth: Invalid format (not user:pass)")
				unauthorized(w)
				return
			}
			
			username := parts[0]
			password := parts[1]

			// 3. Reconstruct Hash
			hashedPkey := username + password

			// 4. Validate against Store
			machine, err := store.GetMachineByHashedPkey(hashedPkey)
			if err != nil || machine == nil {
                if !strict {
                     // Lax mode: Failed auth is ignored, treated as anonymous
                     log.Printf("BasicAuth (Lax): Auth failed regarding store for hash %s, proceeding as anonymous", hashedPkey[:10])
                     ctx := context.WithValue(r.Context(), ClientIDKey, "anonymous")
                     next.ServeHTTP(w, r.WithContext(ctx))
                     return
                }
				log.Printf("BasicAuth: Auth failed for hash %s... (%v)", hashedPkey[:10], err)
				unauthorized(w)
				return
			}

			// Auth Success - Inject Client ID context
			log.Printf("BasicAuth: Success for machine %s (ID: %d)", machine.NoSerie, machine.ID)
            
            // Determine Real IP (Nginx Proxy)
            clientIP := r.Header.Get("X-Real-IP")
            if clientIP == "" {
                clientIP = r.RemoteAddr
            }

            // Capture Connection Details
            store.UpdateMachineStatus(hashedPkey, clientIP, encodedCredentials, credentials)

			ctx := context.WithValue(r.Context(), ClientIDKey, machine.NoSerie)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func unauthorized(w http.ResponseWriter) {
	// MANDATORY for legacy client to retry
	w.Header().Set("WWW-Authenticate", "Basic") 
	http.Error(w, "Unauthorized", http.StatusUnauthorized)
}

// AdminTokenMiddleware validates the admin token
func AdminTokenMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		// Support "Bearer <token>"
		token = strings.TrimPrefix(token, "Bearer ")
		
		expectedToken := os.Getenv("ADMIN_TOKEN")
		if expectedToken == "" {
			expectedToken = "essensys-admin-secret"
		}

		if token != expectedToken {
			http.Error(w, "Unauthorized Admin Access", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
