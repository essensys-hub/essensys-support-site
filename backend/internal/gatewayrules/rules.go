package gatewayrules

// Deprecated: use essensys-user-portal-backend/internal/domain/gateway.go after cloud backend consolidation.
// This package remains until essensys-support-site/backend is removed (OpenSpec essensys-cloud-backend-consolidation).

import (
	"errors"
	"strings"
)

const RemoteIneligibleHost = "essensys-server"

func NormalizeHost(gatewayID string) string {
	g := strings.TrimSpace(strings.ToLower(gatewayID))
	return strings.TrimPrefix(g, "gw-")
}

func IsRemoteEligible(gatewayID *string) bool {
	if gatewayID == nil || *gatewayID == "" {
		return false
	}
	return NormalizeHost(*gatewayID) != RemoteIneligibleHost
}

func RemoteBlockedMessage() string {
	return "essensys-server ne supporte pas le portail distant mon.essensys.fr — liaison armoire et serveur cloud interdites"
}

// ValidateNoPortalLinkRemoval rejects clearing gateway or cloud machine once linked.
func ValidateNoPortalLinkRemoval(linkedGatewayID *string, linkedMachineID *int, machineID *int, gatewayID *string) error {
	if linkedGatewayID == nil || strings.TrimSpace(*linkedGatewayID) == "" {
		return nil
	}
	if gatewayID == nil || strings.TrimSpace(*gatewayID) == "" {
		return errors.New("la gateway ne peut pas être retirée une fois liée")
	}
	if IsRemoteEligible(linkedGatewayID) && linkedMachineID != nil && machineID == nil {
		return errors.New("le serveur cloud ne peut pas être retiré une fois lié")
	}
	return nil
}
