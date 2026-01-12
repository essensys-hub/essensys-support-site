import React from 'react';

const DownloadPage = ({ platform, title, instructions, downloadUrl }) => {
    return (
        <div className="page-content download-page">
            <h1>{title}</h1>
            <p>Téléchargez et installez l'application Essensys pour {platform}.</p>

            <div className="download-area">
                <button
                    className="download-btn"
                    onClick={() => downloadUrl ? window.open(downloadUrl, '_blank') : alert('Lien de téléchargement bientôt disponible !')}
                >
                    {downloadUrl ? `Aller au guide ${platform}` : `Télécharger pour ${platform}`}
                </button>
            </div>

            <div className="instructions">
                <h3>Instructions d'installation</h3>
                <p>{instructions}</p>
            </div>
        </div>
    );
};

export default DownloadPage;
