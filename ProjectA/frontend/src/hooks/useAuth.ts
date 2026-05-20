import { useState } from "react";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(
    localStorage.getItem("token")
  );

  const setToken = (value: string | null) => {
    if (value) {
      localStorage.setItem("token", value);
    } else {
      localStorage.removeItem("token");
    }

    setTokenState(value);
  };

  const logout = () => setToken(null);

  return { token, setToken, logout };
}
