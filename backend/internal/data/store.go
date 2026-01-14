package data

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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

	"os"
    "path/filepath"
)

// PersistenceData wraps the data we want to save
type PersistenceData struct {
    Machines map[string]*models.Machine       `json:"machines"`
    Details  map[string]*models.MachineDetail `json:"details"`
}

// MemoryStore implementation with File Persistence
type MemoryStore struct {
    mu       sync.RWMutex
    machines map[string]*models.Machine // hashedPkey -> Machine
    data     map[string][]models.ExchangeKeyValue // clientID -> last data
    details  map[string]*models.MachineDetail // hashedPkey -> Connection Details
    filePath string
}

func NewMemoryStore(storagePath string) *MemoryStore {
    // Ensure directory exists
    dir := filepath.Dir(storagePath)
    if err := os.MkdirAll(dir, 0755); err != nil {
        log.Printf("Failed to create storage dir: %v", err)
    }

    store := &MemoryStore{
        machines: make(map[string]*models.Machine),
        data:     make(map[string][]models.ExchangeKeyValue),
        details:  make(map[string]*models.MachineDetail),
        filePath: storagePath,
    }
    
    store.load()
    return store
}

func (s *MemoryStore) load() {
    file, err := os.Open(s.filePath)
    if err != nil {
        if os.IsNotExist(err) {
            log.Println("No existing storage file, starting fresh.")
            return
        }
        log.Printf("Failed to open storage file: %v", err)
        return
    }
    defer file.Close()

    var pd PersistenceData
    if err := json.NewDecoder(file).Decode(&pd); err != nil {
        log.Printf("Failed to decode storage file: %v", err)
        return
    }

    s.machines = pd.Machines
    s.details = pd.Details
    log.Printf("Loaded %d machines from storage.", len(s.machines))
}

func (s *MemoryStore) save() {
    pd := PersistenceData{
        Machines: s.machines,
        Details:  s.details,
    }

    file, err := os.Create(s.filePath)
    if err != nil {
        log.Printf("Failed to create storage file: %v", err)
        return
    }
    defer file.Close()

    if err := json.NewEncoder(file).Encode(pd); err != nil {
        log.Printf("Failed to encode storage file: %v", err)
    }
}

// Pre-load some test data
func (s *MemoryStore) AddTestMachine(m *models.Machine) {
    s.mu.Lock()
    defer s.mu.Unlock()
    // Only add if not exists (to respect persistence)
    if _, ok := s.machines[m.HashedPkey]; !ok {
        s.machines[m.HashedPkey] = m
        s.details[m.HashedPkey] = &models.MachineDetail{
            ID:      m.ID,
            NoSerie: m.NoSerie,
        }
        s.save()
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

    if m, ok := s.machines[hashedPkey]; ok {
        return m, nil
    }

    newID := len(s.machines) + 1
    noSerie := fmt.Sprintf("UNKNOWN-%s", hashedPkey[:8])

    m := &models.Machine{
        ID:         newID,
        NoSerie:    noSerie,
        IsActive:   false,
        HashedPkey: hashedPkey,
    }

    s.machines[hashedPkey] = m
    s.details[hashedPkey] = &models.MachineDetail{
        ID:      m.ID,
        NoSerie: m.NoSerie,
        IP:      "-",
        LastSeen: time.Now(),
    }
    
    s.save()
    log.Printf("[STORE] Registered Unknown Machine: %s", noSerie)
    return m, nil
}

func (s *MemoryStore) UpdateMachineStatus(hashedPkey, ip, rawAuth, rawDecoded string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    if detail, ok := s.details[hashedPkey]; ok {
        triggerGeo := (detail.IP != ip && ip != "" && ip != "127.0.0.1") || (detail.GeoLocation == "" && ip != "" && ip != "127.0.0.1")

        detail.IP = ip
        detail.RawAuth = rawAuth
        detail.RawDecoded = rawDecoded
        detail.LastSeen = time.Now()
        
        s.save() // Persist updates (IP/LastSeen)
        
        if triggerGeo {
            go s.fetchGeoLocation(hashedPkey, ip)
        }
    }
}

func (s *MemoryStore) fetchGeoLocation(hashedPkey, ip string) {
    time.Sleep(1 * time.Second) 
    
    url := fmt.Sprintf("http://ip-api.com/json/%s", ip)
    resp, err := http.Get(url)
    if err != nil {
        log.Printf("Geo Fetch Error: %v", err)
        return
    }
    defer resp.Body.Close()
    
    var geo models.GeoAPIResponse
    if err := json.NewDecoder(resp.Body).Decode(&geo); err != nil {
        log.Printf("Geo Decode Error: %v", err)
        return
    }
    
    if geo.Status == "success" {
        location := fmt.Sprintf("%s, %s (%s)", geo.City, geo.Country, geo.ISP)
        
        s.mu.Lock()
        if detail, ok := s.details[hashedPkey]; ok {
            detail.GeoLocation = location
            detail.Lat = geo.Lat
            detail.Lon = geo.Lon
            s.save() // Persist Geo data
        }
        s.mu.Unlock()
        log.Printf("Geo Update for %s: %s", ip, location)
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
