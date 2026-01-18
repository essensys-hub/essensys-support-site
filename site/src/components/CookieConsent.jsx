import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    const handleDecline = () => {
        // Technically strict GDPR requires blocking cookies until accept.
        // For this support site, we'll just hide it and not store 'true'.
        // Or store 'false' if we want to remember the choice but not track.
        localStorage.setItem('cookieConsent', 'false');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div style={styles.banner}>
            <div style={styles.content}>
                <p style={{ margin: 0 }}>
                    Nous utilisons des cookies pour améliorer votre expérience.
                    <a href="/privacy" style={{ color: '#00C9FF', marginLeft: '5px' }}>En savoir plus</a>
                </p>
                <div style={styles.buttons}>
                    <button onClick={handleDecline} style={styles.declineBtn}>Refuser</button>
                    <button onClick={handleAccept} style={styles.acceptBtn}>Accepter</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    banner: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#222',
        color: '#fff',
        padding: '15px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
    },
    content: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        width: '100%',
        flexWrap: 'wrap',
        gap: '10px',
    },
    buttons: {
        display: 'flex',
        gap: '10px',
    },
    acceptBtn: {
        backgroundColor: '#00C9FF',
        color: '#000',
        border: 'none',
        padding: '8px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    declineBtn: {
        backgroundColor: 'transparent',
        color: '#aaa',
        border: '1px solid #555',
        padding: '8px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

export default CookieConsent;
