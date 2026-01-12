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
                title="Essensys for iOS"
                instructions="Download the .ipa file or install via TestFlight (link coming soon)."
              />
            }
          />
          <Route
            path="android"
            element={
              <DownloadPage
                platform="Android"
                title="Essensys for Android"
                instructions="Download the .apk file and allow installation from unknown sources."
              />
            }
          />
          <Route
            path="raspberrypi"
            element={
              <DownloadPage
                platform="Raspberry Pi"
                title="Essensys Hub Server"
                instructions="Run the install script on your Raspberry Pi: curl -sL https://essensys.fr/install.sh | bash"
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
