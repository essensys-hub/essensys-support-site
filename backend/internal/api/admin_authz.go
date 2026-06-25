package api

import (
	"errors"
	"net/http"

	"github.com/essensys-hub/essensys-support-site/backend/internal/data"
	"github.com/essensys-hub/essensys-support-site/backend/internal/models"
)

var (
	errAuthzForbidden   = errors.New("forbidden")
	errAuthzNotFound    = errors.New("not found")
	errAuthzSelfAction  = errors.New("self action")
	errAuthzLastAdmin   = errors.New("last admin")
	errAuthzInvalidRole = errors.New("invalid role")
)

type adminAction string

const (
	actionUpdateRole  adminAction = "update_role"
	actionUpdateLinks adminAction = "update_links"
	actionForbid      adminAction = "forbid"
	actionUnforbid    adminAction = "unforbid"
	actionDelete      adminAction = "delete"
)

type adminUserStore interface {
	GetUserByID(id int) (*models.User, error)
	CountAdminGlobal() (int, error)
}

func isPrivilegedRole(role string) bool {
	return role == models.RoleAdminGlobal || role == models.RoleAdminLocal || role == models.RoleSupport
}

func isLocalManageableRole(role string) bool {
	return role == models.RoleUser || role == models.RoleGuestLocal
}

func callerOwnsTarget(caller, target *models.User) bool {
	if caller.LinkedMachineID == nil || target.LinkedMachineID == nil {
		return false
	}
	return *caller.LinkedMachineID == *target.LinkedMachineID
}

func authorizeAdminTarget(users adminUserStore, caller *models.User, targetUserID int, action adminAction, newRole string) (*models.User, error) {
	if users == nil || caller == nil {
		return nil, errAuthzForbidden
	}
	target, err := users.GetUserByID(targetUserID)
	if err != nil {
		return nil, err
	}
	if target == nil {
		return nil, errAuthzNotFound
	}

	switch caller.Role {
	case models.RoleAdminGlobal:
		switch action {
		case actionDelete:
			if caller.ID == target.ID {
				return nil, errAuthzSelfAction
			}
			if target.Role == models.RoleAdminGlobal {
				count, err := users.CountAdminGlobal()
				if err != nil {
					return nil, err
				}
				if count <= 1 {
					return nil, errAuthzLastAdmin
				}
			}
		case actionForbid, actionUnforbid:
			if caller.ID == target.ID {
				return nil, errAuthzSelfAction
			}
		}
		return target, nil
	case models.RoleAdminLocal:
		if !callerOwnsTarget(caller, target) || isPrivilegedRole(target.Role) {
			return nil, errAuthzForbidden
		}
		if action == actionUpdateRole && !isLocalManageableRole(newRole) {
			return nil, errAuthzInvalidRole
		}
		if (action == actionForbid || action == actionUnforbid || action == actionDelete || action == actionUpdateLinks) &&
			!isLocalManageableRole(target.Role) {
			return nil, errAuthzForbidden
		}
		return target, nil
	default:
		return nil, errAuthzForbidden
	}
}

func writeAuthzError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, errAuthzNotFound):
		http.Error(w, "User not found", http.StatusNotFound)
	case errors.Is(err, errAuthzSelfAction):
		http.Error(w, "Forbidden: cannot perform this action on your own account", http.StatusForbidden)
	case errors.Is(err, errAuthzLastAdmin):
		http.Error(w, "Conflict: cannot remove the last global admin", http.StatusConflict)
	case errors.Is(err, errAuthzInvalidRole):
		http.Error(w, "Forbidden: invalid role for local admin", http.StatusForbidden)
	case errors.Is(err, errAuthzForbidden):
		http.Error(w, "Forbidden: Insufficient Permissions", http.StatusForbidden)
	default:
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

var _ adminUserStore = (*data.PostgresUserStore)(nil)
