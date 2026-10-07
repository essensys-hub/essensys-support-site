package api

import (
	"log"
	"net/http"
	"sync"
	"time"
)

// registerRateLimiter is a simple in-memory IP limiter for legacy HandleRegister parity.
type registerRateLimiter struct {
	mu     sync.Mutex
	counts map[string][]time.Time
	limit  int
	window time.Duration
}

func newRegisterRateLimiter(limit int, window time.Duration) *registerRateLimiter {
	return &registerRateLimiter{
		counts: make(map[string][]time.Time),
		limit:  limit,
		window: window,
	}
}

func (rl *registerRateLimiter) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getIP(r)
		now := time.Now()
		rl.mu.Lock()
		var kept []time.Time
		for _, t := range rl.counts[ip] {
			if now.Sub(t) <= rl.window {
				kept = append(kept, t)
			}
		}
		if len(kept) >= rl.limit {
			rl.counts[ip] = kept
			rl.mu.Unlock()
			log.Printf("audit action=REGISTER_BLOCKED_RATELIMIT ip=%s", ip)
			http.Error(w, "Too many registration attempts. Please try again later.", http.StatusTooManyRequests)
			return
		}
		kept = append(kept, now)
		rl.counts[ip] = kept
		rl.mu.Unlock()
		next.ServeHTTP(w, r)
	})
}

// DefaultRegisterRateLimitMiddleware returns 5 registrations per IP per hour.
func DefaultRegisterRateLimitMiddleware() func(http.Handler) http.Handler {
	return newRegisterRateLimiter(5, time.Hour).middleware
}
