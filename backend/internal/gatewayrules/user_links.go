package gatewayrules

import "errors"

// ValidateAdminUserLinks checks admin PUT /admin/users/{id}/links payloads.
func ValidateAdminUserLinks(machineID *int, gatewayID *string, armoireID *int) error {
	hasGW := gatewayID != nil && *gatewayID != ""
	hasMachine := machineID != nil
	hasArmoire := armoireID != nil

	if !hasGW && !hasMachine && !hasArmoire {
		return nil
	}

	if hasGW && !IsRemoteEligible(gatewayID) {
		if hasMachine || hasArmoire {
			return errors.New(RemoteBlockedMessage())
		}
		return nil
	}

	if hasGW {
		if !hasMachine {
			return errors.New("serveur cloud (machine_id) requis avec une gateway CM5")
		}
		return nil
	}

	if !hasArmoire && !hasMachine {
		return errors.New("sélectionnez une armoire (inventaire OVH) pour le mode armoire seule")
	}
	return nil
}
