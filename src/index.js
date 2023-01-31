import React from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import List from "./components/list";
import "./App.css";

// used to redirect decentralist.xyz/verify which is shared in ancillary data to doc page explaining how to verify price requests
function Redirect() {
  return (
    <div>
      {
        (window.location.href =
          "https://decentra-list.gitbook.io/docs/using-decentra-list/verify-uma-oracle-requests")
      }
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route exact path="/" element={<List />}></Route>
        <Route exact path="/verify" element={<Redirect/>}></Route>
      </Routes>
    </Router>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();