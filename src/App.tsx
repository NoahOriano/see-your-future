import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import About from "./pages/about";
import FormDataState from "./pages/form"
import Home from "./pages/home";

export default function App() {
  return (
    <Router>
      <>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </>
    </Router>
  );
}