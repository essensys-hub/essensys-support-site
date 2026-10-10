import React from 'react';
import { Link } from 'react-router-dom';
import { STATUS_LABELS, listReports } from '../lib/supportReports';
import '../pages/Report.css';

// « Mes signalements » (support-reports-2026-10-004). Un incident n'a jamais de
// lien : l'API ne renvoie pas l'adresse du dépôt privé.
const MyReports = ({ token }) => {
    const [reports, setReports] = React.useState(null);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (!token) return;
        listReports(token).then(setReports).catch(() => setError('Impossible de charger vos signalements.'));
    }, [token]);

    return (
        <section id="signalements" aria-labelledby="signalements-title">
            <h3 id="signalements-title" style={{ textAlign: 'left' }}>Mes signalements</h3>
            {error && <div className="error-message">{error}</div>}
            {reports && reports.length === 0 && (
                <div style={{ textAlign: 'left' }}>
                    <p style={{ color: '#ccc' }}>Vous n'avez encore rien signalé.</p>
                    <Link className="report-primary" to="/signaler">Signaler un problème</Link>
                </div>
            )}
            {reports && reports.length > 0 && (
                <>
                    <ul className="my-reports">
                        {reports.map((r) => (
                            <li key={r.ref} data-testid="my-report">
                                <span className={`report-status report-status-${r.status}`}>{STATUS_LABELS[r.status] || r.status}</span>
                                <span className="my-report-title">{r.title}</span>
                                <span className="my-report-meta">
                                    {r.kind === 'incident' ? 'Incident' : 'Bug'} · {r.ref} · {new Date(r.created_at).toLocaleDateString('fr-FR')}
                                </span>
                                {r.kind === 'bug' && r.issue_url && (
                                    <a href={r.issue_url} target="_blank" rel="noopener noreferrer">Voir sur GitHub</a>
                                )}
                            </li>
                        ))}
                    </ul>
                    <p style={{ textAlign: 'left', marginTop: '1rem' }}>
                        <Link to="/signaler">Signaler un autre problème</Link>
                    </p>
                </>
            )}
        </section>
    );
};

export default MyReports;
