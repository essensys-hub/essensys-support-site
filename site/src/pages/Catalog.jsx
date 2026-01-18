import React, { useState, useEffect } from 'react';
import catalogData from '../data/catalog.json';
import './Catalog.css';

const Catalog = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCategories, setFilteredCategories] = useState(catalogData.categories);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = catalogData.categories.map(category => {
            const matchingActions = category.actions.filter(action =>
                action.name.toLowerCase().includes(lowerTerm) ||
                action.description.toLowerCase().includes(lowerTerm)
            );
            return { ...category, actions: matchingActions };
        }).filter(category => category.actions.length > 0);

        setFilteredCategories(filtered);
    }, [searchTerm]);

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
                    Version: {catalogData.meta.version} |
                    Inspiré de l'interface: <strong>essensys-server-frontend</strong>
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
