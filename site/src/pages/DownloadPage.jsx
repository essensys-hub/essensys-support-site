import React from 'react';

const DownloadPage = ({ platform, title, instructions, steps, downloadUrl, buttonText, note }) => {
    return (
        <div className="page-content download-page">
            <h1>{title}</h1>
            <p>Téléchargez et installez l'application Essensys pour {platform}.</p>

            <div className="download-area">
                {downloadUrl ? (
                    <a className="download-btn" href={downloadUrl} rel="noopener noreferrer" data-testid="download-link">
                        {buttonText || `Télécharger pour ${platform}`}
                    </a>
                ) : (
                    <button className="download-btn" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                        {buttonText || 'Lien de téléchargement bientôt disponible'}
                    </button>
                )}
            </div>

            <div className="instructions">
                <h3>Instructions d'installation</h3>
                {steps ? (
                    <ol className="install-steps">
                        {steps.map((step, index) => <li key={index}>{step}</li>)}
                    </ol>
                ) : (
                    <p>{instructions}</p>
                )}
                {note && <p className="install-note">{note}</p>}
            </div>
        </div>
    );
};

export default DownloadPage;
