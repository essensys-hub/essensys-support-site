package middleware

import (
	"context"
	"net/http"

	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
)

type ActiveUserStore interface {
	GetUserByEmail(email string) (*models.User, error)
}

func enforceActiveUser(w http.ResponseWriter, users ActiveUserStore, email string) (*models.User, bool) {
	if users == nil || email == "" {
		return nil, true
	}
	user, err := users.GetUserByEmail(email)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return nil, false
	}
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return nil, false
	}
	if models.IsUserForbidden(user) {
		models.WriteAccountForbidden(w)
		return nil, false
	}
	return user, true
}

func UserTokenMiddlewareWithStore(store ActiveUserStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return UserTokenMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			email, _ := r.Context().Value("user_email").(string)
			if _, ok := enforceActiveUser(w, store, email); !ok {
				return
			}
			next.ServeHTTP(w, r)
		}))
	}
}

func AdminTokenMiddlewareWithStore(store ActiveUserStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return AdminTokenMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			email, _ := r.Context().Value("user_email").(string)
			if email == "" {
				next.ServeHTTP(w, r)
				return
			}
			user, ok := enforceActiveUser(w, store, email)
			if !ok {
				return
			}
			ctx := context.WithValue(r.Context(), "user_email", email)
			ctx = context.WithValue(ctx, "user_role", user.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		}))
	}
}
