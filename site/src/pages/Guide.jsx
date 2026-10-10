import React from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { readToken } from '../lib/supportReports';
import './Guide.css';

// Guide utilisateur du portail (portal-user-guide-2026-10-006), réservé aux comptes connectés.
// Contenu préparé au déploiement depuis essensys-user-portal-frontend/docs/user-guide
// (scripts/prepare_guide.py) dans /guide-data/.

const useToken = () => {
    const [token, setToken] = React.useState(readToken);
    React.useEffect(() => {
        const onAuth = () => setToken(readToken());
        window.addEventListener('auth-change', onAuth);
        window.addEventListener('storage', onAuth);
        return () => {
            window.removeEventListener('auth-change', onAuth);
            window.removeEventListener('storage', onAuth);
        };
    }, []);
    return token;
};

const LoginInvite = ({ slug }) => (
    <div className="page-content guide-page">
        <div className="guide-panel">
            <h1>Guide du portail</h1>
            <p>Le guide du portail mon.essensys.fr est réservé aux utilisateurs Essensys.</p>
            <p>Connectez-vous pour accéder au guide.</p>
            <Link className="guide-primary" to={`/login?return=${encodeURIComponent(slug ? `/guide/${slug}` : '/guide')}`}>
                Se connecter
            </Link>
        </div>
    </div>
);

const Guide = () => {
    const { slug } = useParams();
    const token = useToken();
    const [index, setIndex] = React.useState(null);
    const [body, setBody] = React.useState(null);
    const [state, setState] = React.useState('loading');

    React.useEffect(() => {
        if (!token) return undefined;
        let cancelled = false;
        setState('loading');
        fetch('/guide-data/index.json')
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('absent'))))
            .then(async (data) => {
                if (cancelled) return;
                setIndex(data);
                if (!slug) { setState('ready'); return; }
                if (!data.pages.some((p) => p.slug === slug)) { setState('unknown'); return; }
                const res = await fetch(`/guide-data/${slug}.md`);
                if (!res.ok) throw new Error('absent');
                const text = await res.text();
                if (!cancelled) { setBody(text); setState('ready'); }
            })
            .catch(() => !cancelled && setState('missing'));
        return () => { cancelled = true; };
    }, [token, slug]);

    React.useEffect(() => { window.scrollTo(0, 0); }, [slug]);

    if (!token) return <LoginInvite slug={slug} />;

    const pages = index?.pages || [];
    const position = pages.findIndex((p) => p.slug === slug);
    const prev = position > 0 ? pages[position - 1] : null;
    const next = position >= 0 && position < pages.length - 1 ? pages[position + 1] : null;

    return (
        <div className="page-content guide-page">
            <div className="guide-panel">
                {state === 'loading' && <p>Chargement du guide…</p>}
                {state === 'missing' && (
                    <>
                        <h1>Guide du portail</h1>
                        <p>Le guide est en cours de préparation. Revenez dans quelques instants.</p>
                    </>
                )}
                {state === 'unknown' && (
                    <>
                        <h1>Page du guide introuvable</h1>
                        <p>Cette page n'existe pas ou a changé de nom.</p>
                        <Link to="/guide">Retour au sommaire du guide</Link>
                    </>
                )}
                {state === 'ready' && !slug && (
                    <>
                        <h1>{index.title || 'Guide du portail'}</h1>
                        <p className="guide-intro">
                            Une page par écran du portail <strong>mon.essensys.fr</strong>, avec une capture et l'explication de chaque bouton.
                        </p>
                        <ol className="guide-toc" data-testid="guide-toc">
                            {pages.map((p) => (
                                <li key={p.slug}>
                                    <Link to={`/guide/${p.slug}`}>{p.title}</Link>
                                    {p.summary && <span className="guide-summary">{p.summary}</span>}
                                </li>
                            ))}
                        </ol>
                    </>
                )}
                {state === 'ready' && slug && (
                    <>
                        <p className="guide-breadcrumb"><Link to="/guide">Guide du portail</Link> › {pages[position]?.title}</p>
                        <article className="guide-article" data-testid="guide-article">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                        </article>
                        <nav className="guide-pager" aria-label="Pages du guide">
                            {prev ? <Link to={`/guide/${prev.slug}`}>← {prev.title}</Link> : <span />}
                            {next ? <Link to={`/guide/${next.slug}`}>{next.title} →</Link> : <span />}
                        </nav>
                    </>
                )}
            </div>
        </div>
    );
};

export default Guide;
