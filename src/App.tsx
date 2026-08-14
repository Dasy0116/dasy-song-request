import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import AdminDashboard from "@/pages/AdminDashboard";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </HashRouter>
  );
}
