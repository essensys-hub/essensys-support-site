import React, { useState, useMemo, useEffect } from 'react';
import tableReference from '../data/table_reference.json';
import './Catalog.css';

const buildCatalog = (entries) => {
    const categories = new Map();

    entries.forEach((entry) => {
        const categoryName = entry.categorie || 'Autres';
        const category = categories.get(categoryName) || { id: categoryName, title: categoryName, actions: new Map() };

        const actionLabel = entry.action && entry.action !== 'NULL' ? entry.action : '';
        const actionName = actionLabel ? `${entry.zone} - ${actionLabel}` : entry.zone;
        const actionKey = `${entry.zone}||${actionLabel}||${entry.keys}`;

        if (!category.actions.has(actionKey)) {
            category.actions.set(actionKey, {
                name: actionName,
                description: entry.longDescription || entry.shortDescription || entry.zone || '',
                key_reference: entry.keys || '',
                values: []
            });
        }

        const action = category.actions.get(actionKey);
        action.values.push({
            label: entry.attribute || '',
            value: entry.value || ''
        });

        categories.set(categoryName, category);
    });

    return Array.from(categories.values()).map((category) => ({
        ...category,
        actions: Array.from(category.actions.values()).map((action) => ({
            ...action,
            values: action.values.slice().sort((a, b) => {
                const aNum = Number(a.value);
                const bNum = Number(b.value);
                if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
                    return aNum - bNum;
                }
                return String(a.value).localeCompare(String(b.value));
            })
        }))
    }));
};

const Catalog = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const allCategories = useMemo(() => buildCatalog(tableReference.entries || []), []);
    const [filteredCategories, setFilteredCategories] = useState(allCategories);

    useEffect(() => {
        const lowerTerm = searchTerm.trim().toLowerCase();
        if (!lowerTerm) {
            setFilteredCategories(allCategories);
            return;
        }

        const matchesAction = (action) => {
            if (action.name.toLowerCase().includes(lowerTerm)) return true;
            if (action.description.toLowerCase().includes(lowerTerm)) return true;
            if ((action.key_reference || '').toLowerCase().includes(lowerTerm)) return true;
            return action.values.some((value) =>
                String(value.value).toLowerCase().includes(lowerTerm) ||
                String(value.label).toLowerCase().includes(lowerTerm)
            );
        };

        const filtered = allCategories.map((category) => {
            const matchingActions = category.actions.filter(matchesAction);
            return { ...category, actions: matchingActions };
        }).filter(category => category.actions.length > 0);

        setFilteredCategories(filtered);
    }, [searchTerm, allCategories]);

    // Helper to render values in a way that looks like controls
    const renderValues = (values) => {
        if (!values || values.length === 0) return null;

        // If generic range
        if (values.length === 1 && values[0].value.includes('...')) {
            return (
                <div className="value-display">
                    <span className="value-item">
                        <span className="code">{values[0].value}</span>
                        {' '}- {values[0].label}
                    </span>
                </div>
            );
        }

        // List of options (Radio-like look)
        return (
            <div className="value-display">
                {values.map((val, idx) => (
                    <div key={idx} className="value-item">
                        <input type="radio" disabled checked={false} /> {/* Visual only */}
                        <label style={{ width: 'auto', marginRight: '5px', float: 'none' }}>{val.label}</label>
                        <span className="code">({val.value})</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="catalog-container">
            <div className="catalog-header">
                <h1>Catalogue des Actions Essensys</h1>
                <p className="catalog-meta">
                    Source: <strong>{tableReference.source || 'TableReference.json'}</strong>
                </p>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Filtrer les actions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="catalog-content">
                {filteredCategories.map(category => (
                    <div key={category.id}>
                        <div className="category-divider">{category.title}</div>

                        {/* Render each action as a "Zone" or Controls block */}
                        {category.actions.map((action, index) => (
                            <div key={index} className="esys-zone">
                                <div className="esys-validinfo">
                                    <h3>{action.name}</h3>
                                    <div style={{ marginBottom: '10px', color: '#666', fontStyle: 'italic' }}>
                                        {action.description}
                                    </div>

                                    {action.key_reference && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong>Ref Clé:</strong> <span className="code">{action.key_reference}</span>
                                        </div>
                                    )}

                                    <div className="action-controls">
                                        {renderValues(action.values)}
                                    </div>
                                    <div className="clear"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="catalog-footer">
                <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
                    Documentation Technique Officielle
                </p>
            </div>
        </div>
    );
};

export default Catalog;
