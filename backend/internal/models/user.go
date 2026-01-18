package models

import (
	"time"
)

// User Roles
const (
	RoleUser    = "user"
	RoleSupport = "support"
	RoleAdmin   = "admin"
)

// Auth Providers
const (
	ProviderEmail  = "email"
	ProviderGoogle = "google"
	ProviderApple  = "apple"
)

// User represents a registered user in the system
type User struct {
	ID           int       `db:"id" json:"id"`
	Email        string    `db:"email" json:"email"`
	PasswordHash string    `db:"password_hash" json:"-"` // Empty for OAuth
	Role         string    `db:"role" json:"role"`
	FirstName    string    `db:"first_name" json:"first_name"`
	LastName     string    `db:"last_name" json:"last_name"`
	Provider     string    `db:"provider" json:"provider"`
	ProviderID   string    `db:"provider_id" json:"-"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	LastLogin    time.Time `db:"last_login" json:"last_login"`
    
    // Linked Devices
    LinkedMachineID *int    `db:"linked_machine_id" json:"linked_machine_id"`
    LinkedGatewayID *string `db:"linked_gateway_id" json:"linked_gateway_id"`
}

// RegisterRequest for email registration
type RegisterRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// LoginRequest for email login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UserResponse for client-side usage (sanitized)
type UserResponse struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Provider  string    `json:"provider"`
    
    // Linked Devices
    LinkedMachineID *int    `json:"linked_machine_id"`
    LinkedGatewayID *string `json:"linked_gateway_id"`
}
