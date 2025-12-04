import SeeYourFuture from "../components/seeyourfuture";

export default function Home() {
  return (
    <div className="home-page">
      <h1>See Your Future</h1>

      <p>
        Welcome to the main application page. This tool allows you to explore
        potential outcomes, visualize scenarios, and interact with the core
        features of the project. Use the instructions below to get started.
      </p>

      <h2>How to Use the Application</h2>
      <ul>
        <li>Follow the prompts within the interface.</li>
        <li>Adjust any parameters or settings as needed.</li>
        <li>Review the generated results and interpretations.</li>
      </ul>

      <div className="app-container">
        <SeeYourFuture />
      </div>
    </div>
  );
}