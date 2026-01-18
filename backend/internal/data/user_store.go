package data

import (
    "database/sql"
    "fmt"
    "time"

    "github.com/essensys-hub/essensys-support-site/backend/internal/models"
    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

// UserStore defines interface for user persistence
type UserStore interface {
    CreateUser(u *models.User) error
    GetUserByEmail(email string) (*models.User, error)
    GetAllUsers() ([]*models.User, error)
    UpdateUserRole(userID int, role string) error
    UpdateUserLinks(userID int, machineID *int, gatewayID *string) error
    UpdateLastLogin(userID int) error
    EnsureTableExists() error
}

type PostgresUserStore struct {
    db *sqlx.DB
}

func NewPostgresUserStore(db *sqlx.DB) *PostgresUserStore {
    return &PostgresUserStore{db: db}
}

func (s *PostgresUserStore) EnsureTableExists() error {
    query := `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        provider VARCHAR(50) DEFAULT 'email',
        provider_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        linked_machine_id INT,
        linked_gateway_id VARCHAR(255)
    );
    
    -- Migrations for existing tables
    ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_machine_id INT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_gateway_id VARCHAR(255);
    `
    _, err := s.db.Exec(query)
    return err
}

func (s *PostgresUserStore) CreateUser(u *models.User) error {
    query := `
        INSERT INTO users (email, password_hash, role, first_name, last_name, provider, provider_id, created_at, last_login)
        VALUES (:email, :password_hash, :role, :first_name, :last_name, :provider, :provider_id, :created_at, :last_login)
        RETURNING id`
    
    rows, err := s.db.NamedQuery(query, u)
    if err != nil {
        return err
    }
    defer rows.Close()
    
    if rows.Next() {
        return rows.Scan(&u.ID)
    }
    return fmt.Errorf("failed to retrieve last insert id")
}

func (s *PostgresUserStore) GetUserByEmail(email string) (*models.User, error) {
    var user models.User
    query := `SELECT * FROM users WHERE email = $1`
    err := s.db.Get(&user, query, email)
    if err == sql.ErrNoRows {
        return nil, nil // Not found
    }
    if err != nil {
        return nil, err
    }
    return &user, nil
}

func (s *PostgresUserStore) UpdateLastLogin(userID int) error {
    query := `UPDATE users SET last_login = $1 WHERE id = $2`
    _, err := s.db.Exec(query, time.Now(), userID)
    return err
}

func (s *PostgresUserStore) GetAllUsers() ([]*models.User, error) {
    var users []*models.User
    query := `SELECT id, email, role, first_name, last_name, created_at, last_login, linked_machine_id, linked_gateway_id FROM users ORDER BY created_at DESC`
    err := s.db.Select(&users, query)
    return users, err
}

func (s *PostgresUserStore) UpdateUserRole(userID int, role string) error {
    query := `UPDATE users SET role = $1 WHERE id = $2`
    _, err := s.db.Exec(query, role, userID)
    return err
}

func (s *PostgresUserStore) UpdateUserLinks(userID int, machineID *int, gatewayID *string) error {
    query := `UPDATE users SET linked_machine_id = $1, linked_gateway_id = $2 WHERE id = $3`
    _, err := s.db.Exec(query, machineID, gatewayID, userID)
    return err
}
