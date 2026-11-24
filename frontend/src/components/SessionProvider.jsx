import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { api } from "../services/identity";
const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);
export default function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const value = await api("/auth/sesion");
      if (current === generation.current) {
        setSession(value);
        setError("");
      }
      return value;
    } catch (e) {
      if (current === generation.current) {
        setSession(null);
        setError(
          e.status === 401
            ? ""
            : "No pudimos consultar tu sesión. Comprobá el servidor local y volvé a intentar.",
        );
      }
      return null;
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const expired = () => {
      ++generation.current;
      setSession(null);
      setError("");
      setLoading(false);
    };
    window.addEventListener("session-ended", expired);
    return () => window.removeEventListener("session-ended", expired);
  }, [refresh]);
  async function access(path, body) {
    const current = ++generation.current;
    try {
      const value = await api(path, { method: "POST", body });
      if (current === generation.current) {
        setSession(value);
        setError("");
      }
      return value;
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }
  async function logout() {
    ++generation.current;
    await api("/auth/logout", { method: "POST", body: {} });
    setSession(null);
    setLoading(false);
  }
  return (
    <SessionContext.Provider
      value={{
        session,
        loading,
        error,
        refresh,
        logout,
        login: (body) => access("/auth/login", body),
        register: (body) => access("/auth/registro", body),
        acceptInvitation: (body) => access("/invitaciones/aceptar", body),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
