import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Support from './pages/Support';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CookieConsent from './components/CookieConsent';
import DownloadPage from './pages/DownloadPage';
import RaspberryPi from './pages/RaspberryPi';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="support" element={<Support />} />
          <Route path="admin" element={<Admin />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="profile" element={<Profile />} />
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
            element={<RaspberryPi />}
          />
        </Route>
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  );
}

export default App;
