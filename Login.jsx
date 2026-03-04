import React, { useState } from "react";
import logo from '../assets/logo.png';
import bgImage from '../assets/login-bg.jpg';
import { useNavigate } from "react-router-dom";
import './Login.css';
import LottieBackground from '../components/LottieBackground';

export default function Login() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginId === "Tanishq17" && password === "10") {
      navigate('/dashboard');
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="login-page">
      {/* Background Image */}
      <div
        className="login-background-image"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      ></div>

      {/* Lottie Animation Wrapper */}
      <div className="lottie-container">
        <LottieBackground />
      </div>

      {/* Login Form */}
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-md-6 col-lg-5">
            <div className="login-wrap p-4 p-md-5">
              <div className="text-center mb-4 d-flex align-items-center justify-content-center gap-2">
                <img src={logo} alt="Logo" style={{ height: "50px", marginRight: "2px" }} />
                <h3 className="m-0">Login</h3>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Username"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                  />
                </div>
                <div className="form-group mb-4">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <button
                    type="submit"
                    className="form-control btn btn-primary rounded submit px-3"
                  >
                    Log In
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
