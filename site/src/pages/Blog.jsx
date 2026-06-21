import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/blog/index.json')
            .then((r) => {
                if (!r.ok) throw new Error('Blog indisponible');
                return r.json();
            })
            .then((data) => setPosts(data.posts || []))
            .catch((e) => setError(e.message));
    }, []);

    if (error) {
        return (
            <div className="page-content">
                <h1>Blog</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="page-content">
            <h1>Blog — Avancement OpenSpec</h1>
            <p>Suivi public des epics produit Essensys.</p>
            {posts.length === 0 ? (
                <p>Aucun article pour le moment.</p>
            ) : (
                <ul className="blog-list">
                    {posts.map((p) => (
                        <li key={p.slug}>
                            <Link to={`/blog/${p.slug}`}>
                                <strong>{p.title}</strong>
                            </Link>
                            {p.date && <span className="blog-date"> — {p.date}</span>}
                            {p.roadmap_id && <span className="blog-id"> ({p.roadmap_id})</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Blog;
