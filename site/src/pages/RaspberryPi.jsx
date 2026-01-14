import React from 'react';
import raspberryPiImage from '../assets/raspberry_pi_server.png';
import mermaid from 'mermaid';

const RaspberryPi = () => {
    React.useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
        });
        mermaid.contentLoaded();
    }, []);

    return (
        <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1>Le Cerveau de votre Maison</h1>

            <p style={{ fontSize: '1.2em', color: '#ccc', marginBottom: '40px' }}>
                Transformez votre Raspberry Pi en un Hub domestique puissant qui centralise et sécurise toute votre domotique.
            </p>

            <img
                src={raspberryPiImage}
                alt="Raspberry Pi Server Hub"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    borderRadius: '16px',
                    boxShadow: '0 0 20px rgba(0, 201, 255, 0.3)',
                    marginBottom: '40px'
                }}
            />

            <div style={{ background: '#222', padding: '30px', borderRadius: '16px', marginBottom: '40px', textAlign: 'left' }}>
                <h2 style={{ marginTop: 0, color: '#92FE9D' }}>Comment ça marche ?</h2>
                <div className="mermaid">
                    {`
                    graph TD
                        A[Votre Maison] -->|Capteurs & Appareils| B(Raspberry Pi Hub)
                        B -->|Sécurisation & Traitement| C{Essensys Cloud}
                        C -->|Contrôle à distance| D[Votre Smartphone]
                        D -->|Ordres| C
                        C -->|Synchronisation| B
                        B -->|Action| A
                    `}
                </div>
            </div>

            <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '16px', border: '1px solid #333' }}>
                <h2 style={{ marginTop: 0 }}>Installation Simple</h2>
                <p>Ouvrez le terminal de votre Raspberry Pi et copiez cette ligne :</p>

                <div style={{
                    background: '#000',
                    padding: '15px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '1.1em',
                    color: '#00C9FF',
                    overflowX: 'auto',
                    border: '1px solid #444',
                    margin: '20px 0'
                }}>
                    curl -sL https://essensys.fr/install.sh | bash
                </div>

                <p style={{ fontSize: '0.9em', color: '#888' }}>
                    Le script va automatiquement configurer le serveur, sécuriser les connexions et connecter votre Hub au cloud Essensys.
                </p>
            </div>
        </div>
    );
};

export default RaspberryPi;
