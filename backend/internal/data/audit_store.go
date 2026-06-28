package data

import (
	"log"
	"time"

	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
	"github.com/jmoiron/sqlx"
)

type AuditStore interface {
	EnsureTableExists() error
	CreateAuditLog(log *models.AuditLog) error
	GetAuditLogs(filter models.AuditFilter) ([]*models.AuditLog, error)
}

type PostgresAuditStore struct {
	db *sqlx.DB
}

func NewPostgresAuditStore(db *sqlx.DB) *PostgresAuditStore {
	return &PostgresAuditStore{db: db}
}

func (s *PostgresAuditStore) EnsureTableExists() error {
	schema := `
	CREATE TABLE IF NOT EXISTS audit_logs (
		id SERIAL PRIMARY KEY,
		user_id INT NOT NULL,
		username VARCHAR(255) NOT NULL,
		action VARCHAR(50) NOT NULL,
		resource_type VARCHAR(50) NOT NULL,
		resource_id VARCHAR(50) NOT NULL,
		ip_address VARCHAR(50) NOT NULL,
		details TEXT,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);
    CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
    `
	_, err := s.db.Exec(schema)
	return err
}

func (s *PostgresAuditStore) CreateAuditLog(l *models.AuditLog) error {
    if l.CreatedAt.IsZero() {
        l.CreatedAt = time.Now()
    }
	query := `
		INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, ip_address, details, created_at)
		VALUES (:user_id, :username, :action, :resource_type, :resource_id, :ip_address, :details, :created_at)
	`
	_, err := s.db.NamedExec(query, l)
	if err != nil {
		log.Printf("Error inserting audit log: %v", err)
	}
	return err
}

func (s *PostgresAuditStore) GetAuditLogs(filter models.AuditFilter) ([]*models.AuditLog, error) {
	logs := []*models.AuditLog{}
	
    var query string
    var args []interface{}

    if filter.MachineID != 0 {
        // Filter actions performed BY users linked to this machine
        // "admin_local ne voit de les information de l'armoie essensys attaché"
        query = `
            SELECT a.* 
            FROM audit_logs a 
            JOIN users u ON a.user_id = u.id 
            WHERE u.linked_machine_id = $1
            ORDER BY a.created_at DESC 
            LIMIT $2 OFFSET $3`
        args = []interface{}{filter.MachineID, filter.Limit, filter.Offset}
    } else if filter.UserID != 0 {
        // Filter actions performed BY specific user (Own logs)
        query = `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
        args = []interface{}{filter.UserID, filter.Limit, filter.Offset}
    } else {
        query = `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`
        args = []interface{}{filter.Limit, filter.Offset}
    }
    
	if filter.Limit == 0 { filter.Limit = 100 }
    
    // Update args if limit was default 0
    if filter.MachineID == 0 {
        args = []interface{}{filter.Limit, filter.Offset}
    } else {
        args = []interface{}{filter.MachineID, filter.Limit, filter.Offset}
    }

	err := s.db.Select(&logs, query, args...)
	return logs, err
}
