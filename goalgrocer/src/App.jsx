import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home.jsx";
import Store from "./Store.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/store" element={<Store />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

