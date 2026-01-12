import React from 'react';

const Support = () => {
    return (
        <div className="page-content">
            <h1>Support & Documentation</h1>
            <p>Here you will find guides to install and maintain your Essensys system.</p>

            <div className="doc-section">
                <h2>Installation</h2>
                <ul>
                    <li><a href="#">Installing the Server on Raspberry Pi</a></li>
                    <li><a href="#">Connecting Hardware</a></li>
                </ul>
            </div>

            <div className="doc-section">
                <h2>Troubleshooting</h2>
                <ul>
                    <li><a href="#">Common Issues</a></li>
                    <li><a href="#">Diagnostic Tools</a></li>
                </ul>
            </div>
        </div>
    );
};

export default Support;
