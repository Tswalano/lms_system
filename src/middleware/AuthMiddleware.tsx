import { useCookies } from "react-cookie";
import { useQuery } from "@tanstack/react-query";
import { useStateContext } from "../context";
import React, { useEffect } from "react";
import { getMeFn } from "../api/authAPI";
import LoadingPage from "../pages/loadingPage";

type AuthMiddlewareProps = {
  children: React.ReactElement;
};

const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({ children }) => {
  const [cookies] = useCookies(["logged_in", "accessToken", "token", "userId"]);
  const stateContext = useStateContext();
  const { authUser } = stateContext.state;

  const query = useQuery({
    queryKey: ["authUser"],
    queryFn: () => getMeFn(cookies.token, cookies.userId),
    enabled: !!cookies.logged_in,
    select: (data) => data.body.payload,
  });

  useEffect(() => {
    console.log("Here....", cookies.logged_in, query.data, query.error);

    if (cookies.logged_in && query.data) {
      console.log("query.data", query.data);
      stateContext.dispatch({ type: "SET_USER", payload: query.data });
    }

    if (query.error) {
      console.error("Failed to load user data:", query.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookies.logged_in, query.data, query.error]);

  if (query.isLoading && cookies.logged_in) {
    return <LoadingPage />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default AuthMiddleware;
