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

    return (
        <div className="catalog-container">
            <div className="catalog-header">
                <h1>Catalogue des Actions Essensys</h1>
                <p className="catalog-meta">Version: {catalogData.meta.version} | Mis à jour le: {catalogData.meta.last_updated}</p>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Rechercher une action..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="catalog-content">
                {filteredCategories.map(category => (
                    <div key={category.id} className="catalog-category">
                        <h2>{category.title}</h2>
                        <div className="actions-grid">
                            {category.actions.map((action, index) => (
                                <div key={index} className="action-card">
                                    <div className="action-header">
                                        <h3>{action.name}</h3>
                                    </div>
                                    <p className="action-description">{action.description}</p>
                                    {action.values && (
                                        <div className="action-values">
                                            <h4>Valeurs Possibles:</h4>
                                            <ul>
                                                {action.values.map((val, vIndex) => (
                                                    <li key={vIndex}>
                                                        <span className="value-label">{val.label}:</span>
                                                        <span className="value-code">{val.value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="catalog-footer">
                <p>Source de référence: <a href={catalogData.meta.source_url} target="_blank" rel="noopener noreferrer">Documentation Technique</a></p>
            </div>
        </div>
    );
};

export default Catalog;
