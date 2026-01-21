import React, { useMemo, useState } from 'react';
import tableReference from '../data/table_reference.json';
import './Catalog.css';

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'review', label: 'En revue' },
    { value: 'approved', label: 'Approuve' },
    { value: 'archive', label: 'Archive' }
];

const ENTRY_DEFAULTS = {
    web: tableReference.entryDefaults?.web ?? true,
    local: tableReference.entryDefaults?.local ?? true
};

const EMPTY_FORM = {
    categorie: '',
    zone: '',
    piece: '',
    action: '',
    keys: '',
    value: '',
    attribute: '',
    shortDescription: '',
    longDescription: '',
    web: ENTRY_DEFAULTS.web,
    local: ENTRY_DEFAULTS.local
};

const buildInitialEntries = () => (tableReference.entries || []).map((entry, index) => ({
    id: `entry-${index + 1}`,
    categorie: entry.categorie || 'Autres',
    zone: entry.zone || '',
    piece: entry.piece && entry.piece !== 'NULL' ? entry.piece : '',
    action: entry.action && entry.action !== 'NULL' ? entry.action : '',
    keys: entry.keys || '',
    value: entry.value || '',
    attribute: entry.attribute || '',
    shortDescription: entry.shortDescription || '',
    longDescription: entry.longDescription || '',
    web: entry.web ?? ENTRY_DEFAULTS.web,
    local: entry.local ?? ENTRY_DEFAULTS.local
}));

const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
};

const buildAuditMessage = (title, details) => ({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    details,
    actor: 'Admin',
    timestamp: new Date().toISOString()
});

const Catalog = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [versions, setVersions] = useState(() => {
        const now = new Date().toISOString();
        return [{
            id: 'version-1',
            name: 'Version 1',
            status: 'draft',
            createdAt: now,
            updatedAt: now,
            entries: buildInitialEntries()
        }];
    });
    const [selectedVersionId, setSelectedVersionId] = useState('version-1');
    const [auditTrail, setAuditTrail] = useState([]);
    const [formState, setFormState] = useState(EMPTY_FORM);
    const [editingEntryId, setEditingEntryId] = useState(null);
    const [newVersionName, setNewVersionName] = useState('');
    const [cloneVersionName, setCloneVersionName] = useState('');

    const selectedVersion = useMemo(
        () => versions.find((version) => version.id === selectedVersionId),
        [versions, selectedVersionId]
    );

    const filteredEntries = useMemo(() => {
        if (!selectedVersion) return [];
        const lowerTerm = searchTerm.trim().toLowerCase();
        if (!lowerTerm) return selectedVersion.entries;

        return selectedVersion.entries.filter((entry) => {
            const haystack = [
                entry.categorie,
                entry.zone,
                entry.piece,
                entry.action,
                entry.keys,
                entry.value,
                entry.attribute,
                entry.shortDescription,
                entry.longDescription
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(lowerTerm);
        });
    }, [selectedVersion, searchTerm]);

    const pushAudit = (title, details) => {
        setAuditTrail((prev) => [buildAuditMessage(title, details), ...prev].slice(0, 150));
    };

    const updateVersion = (versionId, updater) => {
        setVersions((prev) => prev.map((version) => {
            if (version.id !== versionId) return version;
            return updater(version);
        }));
    };

    const handleCreateVersion = () => {
        const now = new Date().toISOString();
        const nextIndex = versions.length + 1;
        const name = newVersionName.trim() || `Version ${nextIndex}`;
        const newVersion = {
            id: `version-${Date.now()}`,
            name,
            status: 'draft',
            createdAt: now,
            updatedAt: now,
            entries: []
        };
        setVersions((prev) => [newVersion, ...prev]);
        setSelectedVersionId(newVersion.id);
        setNewVersionName('');
        pushAudit('Nouvelle version', `Creation de ${name}.`);
    };

    const handleCloneVersion = () => {
        if (!selectedVersion) return;
        const now = new Date().toISOString();
        const name = cloneVersionName.trim() || `Copie de ${selectedVersion.name}`;
        const clonedVersion = {
            ...selectedVersion,
            id: `version-${Date.now()}`,
            name,
            status: 'draft',
            createdAt: now,
            updatedAt: now,
            entries: selectedVersion.entries.map((entry) => ({
                ...entry,
                id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
            }))
        };
        setVersions((prev) => [clonedVersion, ...prev]);
        setSelectedVersionId(clonedVersion.id);
        setCloneVersionName('');
        pushAudit('Clonage version', `Clone de ${selectedVersion.name} vers ${name}.`);
    };

    const handleStatusChange = (event) => {
        const nextStatus = event.target.value;
        if (!selectedVersion) return;
        updateVersion(selectedVersion.id, (version) => ({
            ...version,
            status: nextStatus,
            updatedAt: new Date().toISOString()
        }));
        pushAudit('Changement de statut', `Statut de ${selectedVersion.name}: ${nextStatus}.`);
    };

    const handleEditEntry = (entry) => {
        setEditingEntryId(entry.id);
        setFormState({
            categorie: entry.categorie,
            zone: entry.zone,
            piece: entry.piece || '',
            action: entry.action || '',
            keys: entry.keys,
            value: entry.value,
            attribute: entry.attribute,
            shortDescription: entry.shortDescription || '',
            longDescription: entry.longDescription || '',
            web: entry.web ?? ENTRY_DEFAULTS.web,
            local: entry.local ?? ENTRY_DEFAULTS.local
        });
    };

    const resetForm = () => {
        setEditingEntryId(null);
        setFormState(EMPTY_FORM);
    };

    const handleDeleteEntry = (entryId) => {
        if (!selectedVersion) return;
        const entry = selectedVersion.entries.find((item) => item.id === entryId);
        if (entry) {
            const shouldDelete = window.confirm(
                `Confirmer la suppression de ${entry.categorie} - ${entry.zone} (cle ${entry.keys}) ?`
            );
            if (!shouldDelete) {
                pushAudit('Suppression annulee', `${entry.categorie} - ${entry.zone} (cle ${entry.keys}).`);
                return;
            }
        }
        updateVersion(selectedVersion.id, (version) => ({
            ...version,
            entries: version.entries.filter((item) => item.id !== entryId),
            updatedAt: new Date().toISOString()
        }));
        if (entry) {
            pushAudit('Suppression entree', `${entry.categorie} - ${entry.zone} (cle ${entry.keys}).`);
        }
        if (editingEntryId === entryId) {
            resetForm();
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!selectedVersion) return;
        const now = new Date().toISOString();
        const payload = {
            ...formState,
            categorie: formState.categorie.trim(),
            zone: formState.zone.trim(),
            piece: formState.piece.trim(),
            action: formState.action.trim(),
            keys: formState.keys.trim(),
            value: formState.value.trim(),
            attribute: formState.attribute.trim(),
            shortDescription: formState.shortDescription.trim(),
            longDescription: formState.longDescription.trim(),
            web: formState.web ?? ENTRY_DEFAULTS.web,
            local: formState.local ?? ENTRY_DEFAULTS.local
        };

        if (editingEntryId) {
            updateVersion(selectedVersion.id, (version) => ({
                ...version,
                entries: version.entries.map((entry) => (
                    entry.id === editingEntryId ? { ...entry, ...payload } : entry
                )),
                updatedAt: now
            }));
            pushAudit('Modification entree', `${payload.categorie} - ${payload.zone} (cle ${payload.keys}).`);
        } else {
            const newEntry = {
                id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                ...payload
            };
            updateVersion(selectedVersion.id, (version) => ({
                ...version,
                entries: [newEntry, ...version.entries],
                updatedAt: now
            }));
            pushAudit('Ajout entree', `${payload.categorie} - ${payload.zone} (cle ${payload.keys}).`);
        }
        resetForm();
    };

    return (
        <div className="catalog-page">
            <header className="catalog-header">
                <div>
                    <h1>Catalogue des actions</h1>
                    <p className="catalog-subtitle">
                        Gestion des versions, statut et contenu actionnable.
                    </p>
                    <p className="catalog-meta">
                        Source: <strong>{tableReference.source || 'TableReference.json'}</strong>
                    </p>
                </div>
                <div className="catalog-header-actions">
                    <button type="button" className="catalog-button primary" onClick={handleCreateVersion}>
                        Nouvelle version
                    </button>
                    <button type="button" className="catalog-button secondary" onClick={handleCloneVersion}>
                        Cloner version
                    </button>
                </div>
            </header>

            <section className="catalog-card">
                <div className="card-header">
                    <h2>Version active</h2>
                    {selectedVersion && (
                        <span className={`status-pill status-${selectedVersion.status}`}>
                            {STATUS_OPTIONS.find((status) => status.value === selectedVersion.status)?.label}
                        </span>
                    )}
                </div>
                <div className="version-grid">
                    <label className="field">
                        <span>Selection</span>
                        <select
                            value={selectedVersionId}
                            onChange={(event) => setSelectedVersionId(event.target.value)}
                        >
                            {versions.map((version) => (
                                <option key={version.id} value={version.id}>
                                    {version.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field">
                        <span>Statut</span>
                        <select value={selectedVersion?.status || 'draft'} onChange={handleStatusChange}>
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field">
                        <span>Nom nouvelle version</span>
                        <input
                            type="text"
                            placeholder="Ex: Version client A"
                            value={newVersionName}
                            onChange={(event) => setNewVersionName(event.target.value)}
                        />
                    </label>
                    <label className="field">
                        <span>Nom clone</span>
                        <input
                            type="text"
                            placeholder="Ex: Copie pour audit"
                            value={cloneVersionName}
                            onChange={(event) => setCloneVersionName(event.target.value)}
                        />
                    </label>
                </div>
                <div className="version-meta">
                    <div>
                        <span className="meta-label">Cree le</span>
                        <span>{formatDate(selectedVersion?.createdAt)}</span>
                    </div>
                    <div>
                        <span className="meta-label">Mis a jour</span>
                        <span>{formatDate(selectedVersion?.updatedAt)}</span>
                    </div>
                    <div>
                        <span className="meta-label">Entrees</span>
                        <span>{selectedVersion?.entries.length || 0}</span>
                    </div>
                </div>
            </section>

            <section className="catalog-card">
                <div className="card-header">
                    <h2>{editingEntryId ? 'Modifier une entree' : 'Ajouter une entree'}</h2>
                    {editingEntryId && (
                        <button type="button" className="catalog-button ghost" onClick={resetForm}>
                            Annuler la modification
                        </button>
                    )}
                </div>
                <form className="entry-form" onSubmit={handleSubmit}>
                    <label className="field">
                        <span>Categorie</span>
                        <input
                            type="text"
                            required
                            value={formState.categorie}
                            onChange={(event) => setFormState((prev) => ({ ...prev, categorie: event.target.value }))}
                        />
                    </label>
                    <label className="field">
                        <span>Zone</span>
                        <input
                            type="text"
                            required
                            value={formState.zone}
                            onChange={(event) => setFormState((prev) => ({ ...prev, zone: event.target.value }))}
                        />
                    </label>
                    <label className="field">
                        <span>Piece</span>
                        <input
                            type="text"
                            value={formState.piece}
                            onChange={(event) => setFormState((prev) => ({ ...prev, piece: event.target.value }))}
                        />
                    </label>
                    <label className="field">
                        <span>Action</span>
                        <input
                            type="text"
                            value={formState.action}
                            onChange={(event) => setFormState((prev) => ({ ...prev, action: event.target.value }))}
                        />
                    </label>
                    <label className="field">
                        <span>Cle</span>
                        <input
                            type="text"
                            required
                            value={formState.keys}
                            onChange={(event) => setFormState((prev) => ({ ...prev, keys: event.target.value }))}
                        />
                    </label>
                    <label className="field">
                        <span>Valeur</span>
                        <input
                            type="text"
                            required
                            value={formState.value}
                            onChange={(event) => setFormState((prev) => ({ ...prev, value: event.target.value }))}
                        />
                    </label>
                    <label className="field">
                        <span>Attribut</span>
                        <input
                            type="text"
                            value={formState.attribute}
                            onChange={(event) => setFormState((prev) => ({ ...prev, attribute: event.target.value }))}
                        />
                    </label>
                    <label className="field span-2">
                        <span>Description courte</span>
                        <input
                            type="text"
                            value={formState.shortDescription}
                            onChange={(event) => setFormState((prev) => ({ ...prev, shortDescription: event.target.value }))}
                        />
                    </label>
                    <label className="field span-2">
                        <span>Description longue</span>
                        <textarea
                            rows="3"
                            value={formState.longDescription}
                            onChange={(event) => setFormState((prev) => ({ ...prev, longDescription: event.target.value }))}
                        />
                    </label>
                    <div className="form-actions">
                        <button type="submit" className="catalog-button primary">
                            {editingEntryId ? 'Mettre a jour' : 'Ajouter'}
                        </button>
                        {!editingEntryId && (
                            <button type="button" className="catalog-button ghost" onClick={resetForm}>
                                Reinitialiser
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="catalog-card">
                <div className="card-header">
                    <h2>Entrees du catalogue</h2>
                    <div className="search-field">
                        <input
                            type="text"
                            placeholder="Rechercher zone, piece, cle, valeur..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Categorie</th>
                                <th>Zone</th>
                                <th>Piece</th>
                                <th>Action</th>
                                <th>Cle</th>
                                <th>Valeur</th>
                                <th>Attribut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.map((entry) => (
                                <tr key={entry.id}>
                                    <td>{entry.categorie}</td>
                                    <td>{entry.zone}</td>
                                    <td>{entry.piece || '-'}</td>
                                    <td>{entry.action || '-'}</td>
                                    <td className="mono">{entry.keys}</td>
                                    <td className="mono">{entry.value}</td>
                                    <td>{entry.attribute || '-'}</td>
                                    <td className="table-actions">
                                        <button type="button" className="catalog-button ghost" onClick={() => handleEditEntry(entry)}>
                                            Modifier
                                        </button>
                                        <button
                                            type="button"
                                            className="catalog-button danger"
                                            onClick={() => handleDeleteEntry(entry.id)}
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredEntries.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        Aucune entree ne correspond a la recherche.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="catalog-card">
                <div className="card-header">
                    <h2>Audit trail</h2>
                    <span className="audit-count">{auditTrail.length} actions</span>
                </div>
                <div className="audit-list">
                    {auditTrail.length === 0 && (
                        <p className="empty-state">Les actions admin seront listees ici.</p>
                    )}
                    {auditTrail.map((entry) => (
                        <div key={entry.id} className="audit-item">
                            <div>
                                <strong>{entry.title}</strong>
                                <p>{entry.details}</p>
                            </div>
                            <div className="audit-meta">
                                <span>{entry.actor}</span>
                                <span>{formatDate(entry.timestamp)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Catalog;
