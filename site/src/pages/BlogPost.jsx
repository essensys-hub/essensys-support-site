import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const BlogPost = () => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/blog/index.json')
            .then((r) => r.json())
            .then((data) => {
                const found = (data.posts || []).find((p) => p.slug === slug);
                if (!found) throw new Error('Article introuvable');
                setPost(found);
            })
            .catch((e) => setError(e.message));
    }, [slug]);

    if (error) {
        return (
            <div className="page-content">
                <p>{error}</p>
                <Link to="/blog">← Retour au blog</Link>
            </div>
        );
    }

    if (!post) {
        return <div className="page-content"><p>Chargement…</p></div>;
    }

    return (
        <div className="page-content blog-post">
            <p><Link to="/blog">← Blog</Link></p>
            <h1>{post.title}</h1>
            {post.date && <p className="blog-meta">{post.date}{post.roadmap_id ? ` · ${post.roadmap_id}` : ''}</p>}
            <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>
    );
};

export default BlogPost;
