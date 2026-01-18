package models

import "time"

// AuditLog represents a record of a system event
type AuditLog struct {
	ID           int       `db:"id" json:"id"`
	UserID       int       `db:"user_id" json:"user_id"`             // ID of user performing action (0 if system/anon)
	Username     string    `db:"username" json:"username"`           // Snapshot of username/email
	Action       string    `db:"action" json:"action"`               // e.g., "LOGIN", "LOGOUT", "UPDATE_ROLE"
	ResourceType string    `db:"resource_type" json:"resource_type"` // e.g., "USER", "MACHINE"
	ResourceID   string    `db:"resource_id" json:"resource_id"`     // ID of affected resource
	IPAddress    string    `db:"ip_address" json:"ip_address"`
	Details      string    `db:"details" json:"details"`             // JSON or text description of change
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

// AuditFilter defines criteria for searching logs
type AuditFilter struct {
	Limit        int
	Offset       int
	MachineID    int    // Filter by machine scope (for admin_local)
    UserID       int    // Filter by specific user (for self-view)
    ResourceType string
    Action       string
}
