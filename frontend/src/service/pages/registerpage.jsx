import { Link } from "react-router-dom";

function RegisterPage() {
  return (
    <div className="page">

      <h1>Create Account</h1>

      <form>

        <input
          type="text"
          placeholder="Full Name"
        />

        <br />
        <br />

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
          Register
        </button>

      </form>

      <br />

      <Link to="/login">
        Already have an account? Login
      </Link>

      <br />
      <br />

      <Link to="/">
        Back to Home
      </Link>

    </div>
  );
}

export default RegisterPage;