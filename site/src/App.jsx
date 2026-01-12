import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Support from './pages/Support';
import Admin from './pages/Admin';
import DownloadPage from './pages/DownloadPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="support" element={<Support />} />
          <Route path="admin" element={<Admin />} />
          <Route
            path="ios"
            element={
              <DownloadPage
                platform="iOS"
                title="Essensys pour iOS"
                instructions="Téléchargez le fichier .ipa ou installez via TestFlight (lien bientôt disponible)."
                buttonText="En cours de test (Pas encore publié)"
              />
            }
          />
          <Route
            path="android"
            element={
              <DownloadPage
                platform="Android"
                title="Essensys pour Android"
                instructions="Téléchargez le fichier .apk et autorisez l'installation depuis des sources inconnues."
                buttonText="En cours de test (Pas encore publié)"
              />
            }
          />
          <Route
            path="raspberrypi"
            element={
              <DownloadPage
                platform="Raspberry Pi"
                title="Serveur Hub Essensys"
                instructions="Lancez le script d'installation sur votre Raspberry Pi : curl -sL https://essensys.fr/install.sh | bash"
                downloadUrl="https://essensys-hub.github.io/essensys-raspberry-install/"
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
