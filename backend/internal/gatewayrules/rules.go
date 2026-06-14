package gatewayrules

import "strings"

const RemoteIneligibleHost = "essensys-server"

func NormalizeHost(gatewayID string) string {
	g := strings.TrimSpace(strings.ToLower(gatewayID))
	return strings.TrimPrefix(g, "gw-")
}

func IsRemoteEligible(gatewayID *string) bool {
	if gatewayID == nil || *gatewayID == "" {
		return true
	}
	return NormalizeHost(*gatewayID) != RemoteIneligibleHost
}

func RemoteBlockedMessage() string {
	return "essensys-server ne supporte pas le portail distant mon.essensys.fr — liaison armoire et serveur cloud interdites"
}
