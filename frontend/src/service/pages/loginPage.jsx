import { Link } from "react-router-dom";

function LoginPage() {
  return (
    <div className="page">

      <h1>Login</h1>

      <form>

        <input
          type="email"
          placeholder="Email"
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="Password"
        />

        <br />
        <br />

        <button type="submit">
          Login
        </button>

      </form>

      <br />

      <Link to="/register">
        Create an account
      </Link>

      <br />
      <br />

      <Link to="/">
        Back to Home
      </Link>

    </div>
  );
}

export default LoginPage;