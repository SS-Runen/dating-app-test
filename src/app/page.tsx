"use client";

import { useEffect, useState } from "react";
import CreateAccount from "../lib/components/CreateAccount";
import Login from "../lib/components/Login";

export default function Home() {
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [checkAuth, setCheckAuth] = useState(false);

  useEffect(() => {
    if (!checkAuth) return;
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      window.location.href = "/explore";
    } else {
      handleShowCreateAccount();
    }
  }, [checkAuth]);

  const handleShowCreateAccount = () => {
    setShowCreateAccount(true);
    setShowLogin(false);
  }

  const handleShowLogin = () => {
    setShowCreateAccount(false);
    setShowLogin(true);
  }

  return (
    <div className="home-panel">
      <div className="panel left">
        <div className="panel-content">
            <div className="banner-text">
            <h1><i className="la la-hand-holding-heart"></i> Lucent</h1>
            <span>A dating app for the modern world</span>
            </div>

            {showCreateAccount && <CreateAccount handleShowLogin={handleShowLogin} />}
            {showLogin && <Login handleShowCreateAccount={handleShowCreateAccount} />}
            {!showCreateAccount && !showLogin && <button type="button" className="btn btn-primary" style={{ width: "200px"}} onClick={() => setCheckAuth(true)}>Get Started</button>}
        </div>
      </div>
    </div>
  );
}
