import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import 'bootstrap/dist/css/bootstrap.min.css';
import "react-toastify/dist/ReactToastify.css";

import './styles/index.css';

import { ToastContainer } from "react-toastify";

import TopHeader from "./components/Header";
import HistoryPage from "./pages/History";
import MainPage from "./pages/Download";
import ConfigCenter from "./pages/ConfigCenter";

function App() {
  return (
    <Router>
      <div className="app">
        <TopHeader />
        <main className="main-content">
          <Routes>
            <Route path="*" element={<Navigate replace to="/" />} />
            <Route path="/" element={<MainPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/config" element={<ConfigCenter />} />
          </Routes>
        </main>
        <ToastContainer style={{ top: "55px" }} />
      </div>
    </Router>
  );
}

export default App;
