// Example App.tsx with React Router
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import About from "./pages/about";
import FormDataState from "./pages/form"
import { DevGeminiFutureTest } from "./dev/DevGeminiFutureTest";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/dev-gemini" element={<DevGeminiFutureTest />} />
        <Route path="/form" element={<FormDataState />} />
      </Routes>
    </BrowserRouter>
  )
}
