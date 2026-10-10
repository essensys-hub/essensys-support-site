import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MAX_TEXT, MAX_TITLE, readToken } from '../lib/supportReports';
import './Report.css';

const APPS = [
    ['web', 'Portail web'],
    ['ios', 'App iPhone'],
    ['android', 'App Android'],
    ['gateway', 'Gateway locale'],
    ['other', 'Autre'],
];
const MODES = [
    ['cloud', 'Cloud (mon.essensys.fr)'],
    ['lan', 'Réseau local'],
    ['unknown', 'Je ne sais pas'],
];
const IMPACTS = [
    ['module', 'Un module (une lumière, un volet…)'],
    ['local', 'Toute la domotique locale'],
    ['remote', 'Accès distant / portail cloud'],
    ['hardware', 'Matériel, alimentation ou réseau'],
    ['unknown', 'Je ne sais pas'],
];

const EMPTY = { title: '', app: '', version: '', mode: '', impact: '', since: '', actual: '', expected: '', steps: '', tried: '' };

function TextField({ name, label, value, onChange, error, rows, max = MAX_TEXT, required, hint }) {
    const id = `report-${name}`;
    return (
        <div className="report-field">
            <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
            {hint && <p className="report-hint">{hint}</p>}
            {rows ? (
                <textarea id={id} name={name} rows={rows} value={value} maxLength={max}
                    aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(e) => onChange(name, e.target.value)} />
            ) : (
                <input id={id} name={name} type="text" value={value} maxLength={max}
                    aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(e) => onChange(name, e.target.value)} />
            )}
            <div className="report-field-foot">
                {error ? <span id={`${id}-error`} className="report-error" role="alert">{error}</span> : <span />}
                <span className="report-count">{value.length} / {max}</span>
            </div>
        </div>
    );
}

function SelectField({ name, label, value, options, onChange, error, required }) {
    const id = `report-${name}`;
    return (
        <div className="report-field">
            <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
            <select id={id} name={name} value={value} aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(e) => onChange(name, e.target.value)}>
                <option value="">— Choisir —</option>
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {error && <span id={`${id}-error`} className="report-error" role="alert">{error}</span>}
        </div>
    );
}

const Report = () => {
    const [params, setParams] = useSearchParams();
    const kind = params.get('type') === 'incident' ? 'incident' : 'bug';
    const [token, setToken] = React.useState(readToken);
    const [form, setForm] = React.useState(EMPTY);
    const [errors, setErrors] = React.useState({});
    const [banner, setBanner] = React.useState('');
    const [sending, setSending] = React.useState(false);
    const [done, setDone] = React.useState(null);

    React.useEffect(() => {
        const onAuth = () => setToken(readToken());
        window.addEventListener('auth-change', onAuth);
        window.addEventListener('storage', onAuth);
        return () => {
            window.removeEventListener('auth-change', onAuth);
            window.removeEventListener('storage', onAuth);
        };
    }, []);

    const change = (name, value) => {
        setForm((f) => ({ ...f, [name]: value }));
        setErrors((e) => ({ ...e, [name]: undefined }));
    };

    const setKind = (k) => {
        setParams({ type: k });
        setErrors({});
        setBanner('');
    };

    if (!token) {
        return (
            <div className="page-content report-page">
                <h1>Signaler un problème</h1>
                <div className="report-panel">
                    <p>Le signalement est réservé aux utilisateurs Essensys.</p>
                    <p>Connectez-vous avec votre compte Essensys pour déclarer un bug ou un incident.</p>
                    <Link className="report-primary" to={`/login?return=${encodeURIComponent(`/signaler?type=${kind}`)}`}>
                        Se connecter pour signaler
                    </Link>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="page-content report-page">
                <h1>Signalement envoyé</h1>
                <div className="report-panel" role="status">
                    <p>Merci. Votre signalement porte la référence <strong>{done.ref}</strong>.</p>
                    <p>{done.status === 'pending'
                        ? "Il sera transmis à l'équipe dans les prochaines minutes."
                        : "Il a été transmis à l'équipe."}</p>
                    <p>Vous pouvez suivre son état dans <Link to="/profile#signalements">Mon profil, rubrique Mes signalements</Link>.</p>
                    <button type="button" className="report-secondary" onClick={() => { setDone(null); setForm(EMPTY); }}>
                        Faire un autre signalement
                    </button>
                </div>
            </div>
        );
    }

    const submit = async (e) => {
        e.preventDefault();
        setBanner('');
        const local = {};
        if (!form.title.trim()) local.title = 'Ce champ est obligatoire.';
        if (!form.actual.trim()) local.actual = 'Ce champ est obligatoire.';
        if (kind === 'bug' && !form.app) local.app = 'Ce champ est obligatoire.';
        if (kind === 'incident' && !form.impact) local.impact = 'Ce champ est obligatoire.';
        if (Object.keys(local).length) {
            setErrors(local);
            return;
        }
        const body = kind === 'bug'
            ? { kind, title: form.title, app: form.app, version: form.version, mode: form.mode, actual: form.actual, expected: form.expected, steps: form.steps }
            : { kind, title: form.title, impact: form.impact, since: form.since, mode: form.mode, actual: form.actual, tried: form.tried };
        setSending(true);
        try {
            const res = await fetch('/api/support/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 201) {
                setDone(data);
            } else if ((res.status === 400 || res.status === 422) && data.field) {
                setErrors({ [data.field]: data.message || 'Valeur refusée.' });
            } else if (res.status === 429) {
                const at = data.retry_at ? new Date(data.retry_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '';
                setBanner(`${data.message || 'Limite de signalements atteinte.'}${at ? ` Nouvel essai possible le ${at}.` : ''}`);
            } else if (res.status === 401) {
                setBanner('Votre session a expiré. Reconnectez-vous puis renvoyez le signalement.');
            } else {
                setBanner("Le signalement n'a pas pu être envoyé. Réessayez dans quelques minutes.");
            }
        } catch {
            setBanner('Erreur réseau. Vérifiez votre connexion puis réessayez.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="page-content report-page">
            <h1>Signaler un problème</h1>
            <div className="report-kinds" role="radiogroup" aria-label="Type de signalement">
                <button type="button" role="radio" aria-checked={kind === 'bug'} className={kind === 'bug' ? 'active' : ''} onClick={() => setKind('bug')}>
                    Bug logiciel
                </button>
                <button type="button" role="radio" aria-checked={kind === 'incident'} className={kind === 'incident' ? 'active' : ''} onClick={() => setKind('incident')}>
                    Incident sur mon installation
                </button>
            </div>

            <form className="report-panel" onSubmit={submit} noValidate>
                <div className="report-warning" role="note" data-testid="report-warning">
                    <strong>Important :</strong> ne saisissez jamais votre adresse postale, votre mot de passe ni aucun code d'accès.
                    Les bugs sont publiés sur GitHub de façon anonyme.
                </div>

                <TextField name="title" label="Titre" value={form.title} onChange={change} error={errors.title} max={MAX_TITLE} required
                    hint={kind === 'bug' ? 'Exemple : « Les volets de la cuisine ne répondent plus dans l’app Android »' : 'Exemple : « Plus aucune lumière ne répond depuis ce matin »'} />

                {kind === 'bug' ? (
                    <div className="report-row">
                        <SelectField name="app" label="Application concernée" value={form.app} options={APPS} onChange={change} error={errors.app} required />
                        <TextField name="version" label="Version (si connue)" value={form.version} onChange={change} error={errors.version} max={60} />
                        <SelectField name="mode" label="Connexion" value={form.mode} options={MODES} onChange={change} error={errors.mode} />
                    </div>
                ) : (
                    <div className="report-row">
                        <SelectField name="impact" label="Ce qui est touché" value={form.impact} options={IMPACTS} onChange={change} error={errors.impact} required />
                        <TextField name="since" label="Depuis quand" value={form.since} onChange={change} error={errors.since} max={120} />
                        <SelectField name="mode" label="Connexion" value={form.mode} options={MODES} onChange={change} error={errors.mode} />
                    </div>
                )}

                <TextField name="actual" label="Ce qui se passe" value={form.actual} onChange={change} error={errors.actual} rows={5} required />
                {kind === 'bug' ? (
                    <>
                        <TextField name="expected" label="Ce qui était attendu" value={form.expected} onChange={change} error={errors.expected} rows={3} />
                        <TextField name="steps" label="Étapes pour reproduire" value={form.steps} onChange={change} error={errors.steps} rows={4}
                            hint="Une étape par ligne : écran ouvert, bouton appuyé, résultat." />
                    </>
                ) : (
                    <TextField name="tried" label="Ce que vous avez déjà essayé" value={form.tried} onChange={change} error={errors.tried} rows={3} />
                )}

                {banner && <div className="report-banner" role="alert">{banner}</div>}

                <button type="submit" className="report-primary" disabled={sending}>
                    {sending ? 'Envoi…' : 'Envoyer le signalement'}
                </button>
            </form>
        </div>
    );
};

export default Report;
