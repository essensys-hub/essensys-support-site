import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Support from './pages/Support';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Profile from './pages/Profile';
import Report from './pages/Report';
import CookieConsent from './components/CookieConsent';
import DownloadPage from './pages/DownloadPage';
import RaspberryPi from './pages/RaspberryPi';
import Privacy from './pages/Privacy';
import Catalog from './pages/Catalog';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import NewRelicPageTracker from './observability/NewRelicPageTracker';
import LinkClickTracker from './observability/LinkClickTracker';
import './App.css';

const ANDROID_RELEASE_URL = 'https://github.com/essensys-hub/essensys-android-phone-apps/releases/tag/android-v2.0.0';
const ANDROID_APK_URL = 'https://github.com/essensys-hub/essensys-android-phone-apps/releases/download/android-v2.0.0/essensys-android-2.0.0.apk';
// Play Protect bloque par défaut une app installée hors Play Store et peu répandue (essensys-android-phone-apps#9).
const ANDROID_INSTALL_STEPS = [
  <>Si l'ancienne version (1.0) est installée, <strong>désinstallez-la</strong>.</>,
  <>Appuyez sur <strong>Télécharger l'APK</strong> depuis votre téléphone Android, puis ouvrez le fichier téléchargé (notification, ou application <strong>Fichiers → Téléchargements</strong>).</>,
  <>Si Android le demande, <strong>autorisez l'installation depuis cette source</strong> (Chrome ou Fichiers).</>,
  <>Si <strong>Play Protect</strong> affiche « Application bloquée » : c'est normal pour une application installée hors du Play Store. <strong>N'appuyez pas sur « OK »</strong>, qui annule l'installation : appuyez sur <strong>Plus de détails</strong>, puis sur <strong>Installer quand même</strong>.</>,
  <>Sur Xiaomi (HyperOS/MIUI), un écran d'analyse de sécurité peut suivre : attendez la fin du compte à rebours, puis confirmez.</>,
  <>Ouvrez <strong>Mon Essensys</strong> et connectez-vous avec votre compte du portail <strong>mon.essensys.fr</strong>.</>,
];

function App() {
  return (
    <BrowserRouter>
      <NewRelicPageTracker />
      <LinkClickTracker />
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Outside Layout, like /login: recovery must not offer the site nav
            to someone who is mid-way through regaining access. */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Same reasoning as /login and the recovery routes: no site nav
            while a forced password change is outstanding. */}
        <Route path="/change-password" element={<ChangePassword />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/support" element={<Support />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/signaler" element={<Report />} />
          <Route path="/privacy" element={<Privacy />} />
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
                downloadUrl={ANDROID_APK_URL}
                buttonText="Télécharger l'APK (version 2.0.0)"
                steps={ANDROID_INSTALL_STEPS}
                note={<>Empreinte SHA-256 et notes de version : <a href={ANDROID_RELEASE_URL} target="_blank" rel="noopener noreferrer">release 2.0.0 sur GitHub</a>.</>}
              />
            }
          />
          <Route path="raspberrypi" element={<RaspberryPi />} />
        </Route>
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  );
}

export default App;
