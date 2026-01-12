import React from 'react';

const DownloadPage = ({ platform, title, instructions, downloadUrl }) => {
    return (
        <div className="page-content download-page">
            <h1>{title}</h1>
            <p>Download and install the Essensys App for {platform}.</p>

            <div className="download-area">
                <button
                    className="download-btn"
                    onClick={() => downloadUrl ? window.open(downloadUrl, '_blank') : alert('Download link coming soon!')}
                >
                    {downloadUrl ? `Go to ${platform} Guide` : `Download for ${platform}`}
                </button>
            </div>

            <div className="instructions">
                <h3>Installation Instructions</h3>
                <p>{instructions}</p>
            </div>
        </div>
    );
};

export default DownloadPage;
