import Logo from "../assets/Logo.png";

export default function Navbar() {
  return (
    <nav className="navbar">
      <img src={Logo} alt="logo" style={{height: "124px"}}/>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  );
}
