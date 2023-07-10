import React from "react";

function SignUpEmailTemplate({ userName, invitationLink }) {
  return (
    <div>
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          backgroundColor: "#fff",
        }}
      >
        <h1>Invitation to Sign Up</h1>
      </div>

      {/* Intro */}
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          backgroundColor: "#e8f5e9",
        }}
      >
        <h2>
          Hi <span style={{ color: "#2196f3" }}>{userName}</span>,
        </h2>
        <p>
          You have been invited to sign up for the Disraptor's Leave Management
          System as part of your onboarding process.
        </p>
      </div>

      {/* Body */}
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          backgroundColor: "#fff",
        }}
      >
        <p>Click the link below to create your account:</p>
        <br />
        <a
          style={{
            backgroundColor: "#2196f3",
            color: "#fff",
            padding: "10px 40px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
          href={invitationLink}
          target="_blank"
          rel="noreferrer"
        >
          Sign Up Now
        </a>
        <br />
        <br />
        <p>
          This link will expire after 60 minutes, contact your manager for
          assistance should this link expire before you complete signing up.
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          backgroundColor: "#e8f5e9",
        }}
      >
        &copy; {new Date().getFullYear()}{" "}
        <span style={{ fontWeight: "bold", color: "#2196f3" }}>Disraptor</span>
        {". "}
        All rights reserved.
      </div>
    </div>
  );
}

export default SignUpEmailTemplate;
