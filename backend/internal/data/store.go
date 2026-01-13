package data

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
	"github.com/jmoiron/sqlx"
)

// Store defines the data access interface
type Store interface {
    // Auth
    GetMachineByHashedPkey(hashedPkey string) (*models.Machine, error)
    
    // Data Capture
    SaveClientData(clientID string, data []models.ExchangeKeyValue) error
    
    // Admin
    GetStats() (*models.AdminStatsResponse, error)
    GetMachines() ([]*models.MachineDetail, error)
    UpdateMachineStatus(hashedPkey, ip, rawAuth, rawDecoded string)
    RegisterUnknownMachine(hashedPkey string) (*models.Machine, error)
}

// MemoryStore implementation for rapid dev / testing
type MemoryStore struct {
    mu       sync.RWMutex
    machines map[string]*models.Machine // hashedPkey -> Machine
    data     map[string][]models.ExchangeKeyValue // clientID -> last data
    details  map[string]*models.MachineDetail // hashedPkey -> Connection Details
}

func NewMemoryStore() *MemoryStore {
    return &MemoryStore{
        machines: make(map[string]*models.Machine),
        data:     make(map[string][]models.ExchangeKeyValue),
        details:  make(map[string]*models.MachineDetail),
    }
}

// Pre-load some test data
func (s *MemoryStore) AddTestMachine(m *models.Machine) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.machines[m.HashedPkey] = m
    // Init detail
    s.details[m.HashedPkey] = &models.MachineDetail{
        ID:      m.ID,
        NoSerie: m.NoSerie,
    }
}

func (s *MemoryStore) GetMachineByHashedPkey(hashedPkey string) (*models.Machine, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    if m, ok := s.machines[hashedPkey]; ok {
        return m, nil
    }
    return nil, fmt.Errorf("machine not found")
}

func (s *MemoryStore) RegisterUnknownMachine(hashedPkey string) (*models.Machine, error) {
    s.mu.Lock()
    defer s.mu.Unlock()

    // Check if exists again to be safe
    if m, ok := s.machines[hashedPkey]; ok {
        return m, nil
    }

    // Auto-create ID
    newID := len(s.machines) + 1
    noSerie := fmt.Sprintf("UNKNOWN-%s", hashedPkey[:8])

    m := &models.Machine{
        ID:         newID,
        NoSerie:    noSerie,
        IsActive:   false, // Requires approval
        HashedPkey: hashedPkey,
    }

    s.machines[hashedPkey] = m
    s.details[hashedPkey] = &models.MachineDetail{
        ID:      m.ID,
        NoSerie: m.NoSerie,
        IP:      "-",
        LastSeen: time.Now(),
    }
    
    log.Printf("[STORE] Registered Unknown Machine: %s (Hash: %s)", noSerie, hashedPkey[:10])
    return m, nil
}

func (s *MemoryStore) UpdateMachineStatus(hashedPkey, ip, rawAuth, rawDecoded string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    if detail, ok := s.details[hashedPkey]; ok {
        detail.IP = ip
        detail.RawAuth = rawAuth
        detail.RawDecoded = rawDecoded
        detail.LastSeen = time.Now()
    }
}

func (s *MemoryStore) SaveClientData(clientID string, data []models.ExchangeKeyValue) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    s.data[clientID] = data
    log.Printf("[STORE] Saved %d data points for client %s", len(data), clientID)
    return nil
}

func (s *MemoryStore) GetStats() (*models.AdminStatsResponse, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    return &models.AdminStatsResponse{
        ConnectedClients: len(s.data),
        TotalMachines:    len(s.machines),
    }, nil
}

func (s *MemoryStore) GetMachines() ([]*models.MachineDetail, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    list := make([]*models.MachineDetail, 0, len(s.details))
    for _, d := range s.details {
        list = append(list, d)
    }
    return list, nil
}

// DatabaseStore implementation (Future / Production)
type DatabaseStore struct {
    db *sqlx.DB
}

func NewDatabaseStore(db *sqlx.DB) *DatabaseStore {
    return &DatabaseStore{db: db}
}

func (s *DatabaseStore) GetMachineByHashedPkey(hashedPkey string) (*models.Machine, error) {
    var machine models.Machine
	// Note: in real implementation we should check is_active = true
	query := `SELECT * FROM es_machine WHERE hashed_pkey = $1 AND is_active = true`
	err := s.db.Get(&machine, query, hashedPkey)
	if err != nil {
		return nil, err
	}
	return &machine, nil
}

func (s *DatabaseStore) RegisterUnknownMachine(hashedPkey string) (*models.Machine, error) {
    // Stub
    return nil, fmt.Errorf("not implemented in database store")
}

func (s *DatabaseStore) UpdateMachineStatus(hashedPkey, ip, rawAuth, rawDecoded string) {
    // No-op for DB store in passive mode for now
}

func (s *DatabaseStore) SaveClientData(clientID string, data []models.ExchangeKeyValue) error {
    // In passive mode, we might just log to Redis or update a 'latest_state' table
    // For now, simple logging
    log.Printf("[DB STORE] (Simulated) Saved data for %s", clientID)
    return nil
}

func (s *DatabaseStore) GetStats() (*models.AdminStatsResponse, error) {
    // Mock implementation for now as we don't have full DB setup in this file context yet
    return &models.AdminStatsResponse{
        ConnectedClients: 0,
        TotalMachines:    0,
    }, nil
}

func (s *DatabaseStore) GetMachines() ([]*models.MachineDetail, error) {
    return []*models.MachineDetail{}, nil
}
