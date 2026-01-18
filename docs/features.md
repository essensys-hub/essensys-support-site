# Features

## User Profile & Device Linking

The **User Profile** feature allows users to associate their account with specific Essensys hardware (Machines and Gateways). This enables personalized interactions and remote management capabilities.

### Device Discovery
When a user visits their profile page, the system automatically detects Essensys devices on the **same local network** (based on public IP matching).

- **Machines (Cabinets)**: Identified by Serial Number.
- **Gateways**: Identified by Hostname.

### Linking Process
1. Navigate to the **Profil** page via the header menu.
2. The "Mes Appareils" section displays currently linked devices.
3. Use the dropdowns to select a detected Machine or Gateway.
4. Click **Enregistrer**.

> **Note:** For security reasons, regular users can only link devices that are detected on the same IP address as their current connection.

---

## Admin User Management

Administrators have access to a dedicated **Dashboard** for managing users and system configuration.

### User Manager
Located in the **Admin > Utilisateurs** tab.

- **List Users**: View all registered users, their emails, roles, and creation dates.
- **Role Assignment**: Promote users to `Support` or `Admin` roles directly from the list.
- **Device Management**:
    - Admins can view keys linked to any user.
    - Click **Lier Appareils** to open a modal where you can manually assign ANY Machine or Gateway to a user, overriding IP restrictions.

### Creating Users
Admins can manually register new users via the "Ajouter un Utilisateur" form in the User Manager, useful for setting up support staff or pre-provisioning accounts.
