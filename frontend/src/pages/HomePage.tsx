import PredictionForm from "../components/PredictionForm";
import "./HomePage.css";

function HomePage() {
  return (
    <main className="home-page">
      <div className="prediction-card">
        <div className="page-header">
          <h1>House Price Prediction</h1>
          <p>
            Enter the property details to get an estimated house price.
          </p>
        </div>

        <PredictionForm />
      </div>
    </main>
  );
}

export default HomePage;