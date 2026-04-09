import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const BrokerResponse = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const requestToken = searchParams.get("request_token");
    const RequestToken = searchParams.get("RequestToken");
    const auth_code = searchParams.get("auth_code");
    const code = searchParams.get("code");

    if (requestToken || auth_code || code || RequestToken) {
      let token = requestToken || RequestToken || auth_code;
      let clientCode = code;
      navigate(`/setup?request_token=${token}&clientCode=${clientCode}`);
    } else {
      navigate("/setup");
    }
  }, [navigate, searchParams]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f8f9fa",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        ></div>
        <p>Processing broker response...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default BrokerResponse;
