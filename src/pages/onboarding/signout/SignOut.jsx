import React, { useEffect, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SignOut = () => {
  const ctx = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect
    (() => {
      ctx.signOut();
      navigate("/signin");
    },
    []);
};

export default SignOut;
