import { FormEvent, useState } from "react";
import { ErrorAlert } from "../components/common/ErrorAlert";

interface LoginPageProps {
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ error, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onLogin(email, password);
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center">
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="text-center mb-4">
          <h1 className="mb-1">ProjectA Admin</h1>
          <div className="text-muted">Sign in to continue</div>
        </div>
        <div className="card shadow-sm">
          <div className="card-body">
            <ErrorAlert message={error} />
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
