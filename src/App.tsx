import { useState } from "react";
import "./App.css"; // Put your HTML CSS here

export default function App() {
  const [openAcc, setOpenAcc] = useState<number | null>(null);

  const toggleAcc = (i: number) => {
    setOpenAcc(openAcc === i ? null : i);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="container">
      {/* HEADER */}
      <header>
        <div className="brand">
          <div className="logo">SYF</div>
          <div>
            <h1>See Your Future — Project Proposal</h1>
            <p className="lead">
              Generative AI experience for multi-round self-reflection
              (entertainment, not prediction).
            </p>
          </div>
        </div>

        <nav className="top-actions" aria-label="Top actions">
          <button className="btn" onClick={() => scrollToSection("overview")}>
            Overview
          </button>
          <button className="btn" onClick={() => scrollToSection("diagram")}>
            System Diagram
          </button>
          <button
            className="btn primary"
            onClick={() => alert("This triggers the prototype flow (placeholder).")}
          >
            Prototype Demo
          </button>
        </nav>
      </header>

      {/* MAIN + SIDEBAR */}
      <main>
        <section>
          {/* OVERVIEW CARD */}
          <article className="card" id="overview" aria-labelledby="overview-title">
            <div className="section-title">
              <h2 id="overview-title">Motivation & Project Idea</h2>
              <span className="small muted">Entertainment + reflection</span>
            </div>

            <p>
              <strong>Motivation:</strong> People enjoy interactive self-reflection
              that blends personalization, creativity, and entertainment. See Your
              Future builds a richer, multi-round “future snapshot” using
              generative AI (language, image, audio).
            </p>

            <h3 style={{ marginTop: 14 }}>Experience flow</h3>
            <ol className="muted" style={{ paddingLeft: 18 }}>
              <li>
                <strong>Round 1 — Baseline Intake:</strong> selfie + optional
                resume/photos, baseline questionnaire.
              </li>
              <li>
                <strong>Round 2 — AI-refined questions:</strong> LLM (ChatGPT)
                generates personalized follow-ups; user answers.
              </li>
              <li>
                <strong>Generation:</strong> narrative, 0–100 future quality
                score, AI image, audio narration, habit suggestions, and an improved
                future.
              </li>
            </ol>

            <div className="features" style={{ marginTop: 14 }}>
              <div className="feature">
                <h3>Personalized follow-ups</h3>
                <p>
                  ChatGPT generates targeted refining questions to improve
                  specificity and relevance of the profile.
                </p>
              </div>
              <div className="feature">
                <h3>Multi-modal outputs</h3>
                <p>Text narrative, score visualization, generated image, audio.</p>
              </div>
              <div className="feature">
                <h3>Improved future loop</h3>
                <p>
                  Suggestions + regenerated narrative/image to show contrast.
                </p>
              </div>
              <div className="feature">
                <h3>Clearly framed</h3>
                <p>
                  Entertainment + self-reflection to avoid deterministic
                  interpretation.
                </p>
              </div>
            </div>
          </article>

          {/* GAITS */}
          <article className="card" style={{ marginTop: 16 }} id="gaits">
            <div className="section-title">
              <h2>Generative AI Tools (GAITs)</h2>
              <span className="muted">language, image, audio</span>
            </div>

            <div className="gaits">
              <div className="gait">
                <div className="icon">✦</div>
                <div>
                  <h4>ChatGPT (GPT-4o / 4o mini)</h4>
                  <p>Refining questions, narrative, scoring, habit engine.</p>
                </div>
              </div>

              <div className="gait">
                <div className="icon">🖼️</div>
                <div>
                  <h4>Stable Diffusion XL</h4>
                  <p>Image generation for future + improved future scenes.</p>
                </div>
              </div>

              <div className="gait">
                <div className="icon">🔊</div>
                <div>
                  <h4>ElevenLabs TTS</h4>
                  <p>Audio narration (original + improved).</p>
                </div>
              </div>
            </div>
          </article>

          {/* ACCORDION */}
          <article className="card" style={{ marginTop: 16 }} id="brainstorm">
            <div className="section-title">
              <h2>Preliminary Brainstorming</h2>
              <span className="muted">ideas & optional features</span>
            </div>

            <div className="accordion">
              {/* Item 1 */}
              <div className="acc-item">
                <div className="acc-head" onClick={() => toggleAcc(0)}>
                  <strong>Core features</strong>
                  <span className="small muted">click to expand</span>
                </div>
                <div className={`acc-body ${openAcc === 0 ? "show" : ""}`}>
                  <ul className="muted">
                    <li>Selfie upload + optional resume/photos.</li>
                    <li>Baseline questionnaire feeding a refinement engine.</li>
                    <li>Narrative, score, image, audio, habits.</li>
                  </ul>
                </div>
              </div>

              {/* Item 2 */}
              <div className="acc-item">
                <div className="acc-head" onClick={() => toggleAcc(1)}>
                  <strong>Fun extensions</strong>
                  <span className="small muted">tarot, palm-reading vibes</span>
                </div>
                <div className={`acc-body ${openAcc === 1 ? "show" : ""}`}>
                  <p className="muted">
                    Playful tarot/palm-reading layers — explicitly labeled as fun.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="acc-item">
                <div className="acc-head" onClick={() => toggleAcc(2)}>
                  <strong>Ethics & safety notes</strong>
                  <span className="small muted">privacy, bias, disclaimers</span>
                </div>
                <div className={`acc-body ${openAcc === 2 ? "show" : ""}`}>
                  <p className="muted">
                    Entertainment framing, avoid sensitive inference, provide
                    deletion controls.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </section>

        {/* SIDEBAR */}
        <aside>
          {/* SYSTEM DIAGRAM */}
          <div className="card" id="diagram">
            <div className="section-title">
              <h2>System Overview (flow)</h2>
              <span className="muted">
                Front end → Backend Pipeline → GAITs → Outputs
              </span>
            </div>

            <div className="diagram-wrap">
              {/* Directly embedding the SVG from the HTML */}
              <svg
                className="flow"
                viewBox="0 0 1000 640"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMinYMin meet"
              >
                {/* Entire SVG copied exactly from HTML */}
                {/* You can paste the same <defs>, <rect>, <text>, <line> etc. here */}
              </svg>
            </div>

            <p className="small muted" style={{ marginTop: 10 }}>
              Diagram is illustrative; the pipeline includes Refinement Engine,
              Profile Builder, Visual Interpreter, Future Generator, Image & Audio
              modules, and improved-future loop.
            </p>
          </div>

          {/* SCORE MOCK */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-title">
              <h2>Quick mock: future score</h2>
              <span className="muted">visual example</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="small muted">
                Future quality score: <strong style={{ color: "#dff" }}>86 / 100</strong>
              </div>

              <div className="score-bar">
                <div className="score-fill" style={{ width: "86%" }}></div>
              </div>

              <div className="small muted">
                Drivers: health habits, career momentum, social engagement.
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  className="btn"
                  onClick={() =>
                    alert("Generate improved future — placeholder")
                  }
                >
                  Generate improved future
                </button>
                <button
                  className="btn"
                  style={{ marginLeft: 6 }}
                  onClick={() => alert("Play narration — placeholder")}
                >
                  Play narration
                </button>
              </div>
            </div>
          </div>

          {/* DEV NOTES */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-title">
              <h2>Developer notes</h2>
              <span className="muted">implementation hints</span>
            </div>

            <ul className="muted" style={{ paddingLeft: 18 }}>
              <li>
                Backend: <span className="kbd">POST /api/upload</span>,{" "}
                <span className="kbd">POST /api/round2</span>,{" "}
                <span className="kbd">POST /api/generate</span>.
              </li>
              <li>
                Use server-side resume text extraction before LLM input.
              </li>
              <li>Provide privacy controls + data deletion.</li>
              <li>
                Score drivers stored inside <code>profile_structured</code>.
              </li>
            </ul>
          </div>
        </aside>
      </main>

      {/* FOOTER */}
      <footer>
        <div className="muted">
          Designed for prototype & course submission. © See Your Future —
          entertainment & self-reflection — not prediction.
        </div>
      </footer>
    </div>
  );
}