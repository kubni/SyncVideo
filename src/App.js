import Home from "./pages/Home";
import Creator from "./pages/Creator";
import Participant from "./pages/Participant";

import { BrowserRouter, Routes, Route } from "react-router-dom"

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/creator" element={<Creator />} />
        <Route path="/participant" element={<Participant />} />
      </Routes>
    </BrowserRouter>
  )
}
