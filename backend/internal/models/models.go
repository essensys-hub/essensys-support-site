package models

import (
	"time"
)

// Machine represents the legacy IoT device
// Based on es_machine table
type Machine struct {
	ID              int       `db:"id" json:"id"`
	NoSerie         string    `db:"no_serie" json:"no_serie"`
	Version         string    `db:"version" json:"version,omitempty"`
	Pkey            string    `db:"pkey" json:"-"`
	HashedPkey      string    `db:"hashed_pkey" json:"-"`
	AutoriseAlarme  bool      `db:"autorise_alarme" json:"autorise_alarme"`
	IsActive        bool      `db:"is_active" json:"is_active"`
	DateCreation    time.Time `db:"date_creation" json:"date_creation"`
	DateModification time.Time `db:"date_modification" json:"date_modification"`
}

// ============================================================================
// API Structures (Legacy Protocol)
// ============================================================================

// ServerInfosResponse represents the JSON response for GET /api/serverinfos
type ServerInfosResponse struct {
	IsConnected bool   `json:"isconnected"`
	Infos       []int  `json:"infos"`
	NewVersion  string `json:"newversion"`
}

// ExchangeKeyValue represents a single key-value pair in data exchange
type ExchangeKeyValue struct {
	K int    `json:"k"`
	V string `json:"v"` // Always string, even for numbers
}

// MyStatusPayload represents the JSON payload for POST /api/mystatus
type MyStatusPayload struct {
	Version string             `json:"version"`
	EK      []ExchangeKeyValue `json:"ek"`
}

// ============================================================================
// API Structures (Admin)
// ============================================================================

type AdminLoginRequest struct {
	Token string `json:"token"`
}

type AdminStatsResponse struct {
	ConnectedClients int `json:"connected_clients"`
	TotalMachines    int `json:"total_machines"`
}

type MachineDetail struct {
	ID         int       `json:"id"`
	NoSerie    string    `json:"no_serie"`
	IP         string    `json:"ip"`
	LastSeen   time.Time `json:"last_seen"`
	RawAuth    string    `json:"raw_auth"`
	RawDecoded string    `json:"raw_decoded"` // user:pass
	GeoLocation string   `json:"geo_location"`
}

// GeoAPIResponse for parsing ip-api.com
type GeoAPIResponse struct {
    Status      string  `json:"status"`
    Country     string  `json:"country"`
    City        string  `json:"city"`
    ISP         string  `json:"isp"`
    Query       string  `json:"query"`
}
