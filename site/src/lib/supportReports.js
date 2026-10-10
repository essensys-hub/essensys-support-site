// Signalements Bug/Incident (support-reports-2026-10-004).

export const readToken = () => localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

export const STATUS_LABELS = {
    pending: "En attente d'envoi",
    open: 'Ouvert',
    resolved: 'Résolu',
    closed: 'Clos',
};

export const MAX_TITLE = 120;
export const MAX_TEXT = 4000;

export async function listReports(token) {
    const res = await fetch('/api/support/reports', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reports || [];
}
