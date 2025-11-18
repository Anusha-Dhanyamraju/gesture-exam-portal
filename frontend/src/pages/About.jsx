import React from "react";

export default function About() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <h1 style={styles.title}>Gesture Exam Portal</h1>
          <p style={styles.subtitle}>
            A touchless examination interface that lets students answer using
            hand-gesture typing or a traditional keyboard, while admins manage
            question banks and results.
          </p>
        </header>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>How it works</h2>
          <p style={styles.sectionText}>
            The system uses the webcam plus MediaPipe Hands to detect hand
            landmarks. A virtual keyboard appears at the bottom of the exam
            screen, and hovering over keys with your index finger types letters
            into the answer box. Keystroke timing is captured for analysis, and
            all submissions are stored in MongoDB.
          </p>
        </section>

        <section style={styles.grid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Student experience</h3>
            <p style={styles.cardText}>
              Students log in, see one question at a time, and can navigate
              between questions. They can answer using gestures, physical
              typing, or both, while a lightweight graph shows the rhythm of
              their typing during the exam.
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Admin tools</h3>
            <p style={styles.cardText}>
              Admins upload a <code>questions.json</code> file to update the
              exam bank, verify the number of questions currently in the
              database, and review student submissions with scores and answer
              breakdowns.
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Tech stack</h3>
            <p style={styles.cardText}>
              React on the frontend, Node/Express on the backend, MongoDB Atlas
              for persistence, and MediaPipe Hands for gesture recognition.
              Frontend is hosted on Vercel; the backend runs on Render.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #1d4ed8 0, #020617 45%, #000 100%)",
    color: "#e5e7eb",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "32px 20px",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
  },
  shell: {
    width: "100%",
    maxWidth: "880px",
    borderRadius: "22px",
    padding: "22px 24px 26px",
    backgroundColor: "rgba(15,23,42,0.97)",
    border: "1px solid rgba(148,163,184,0.6)",
    boxShadow: "0 24px 55px rgba(0,0,0,0.75)",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 800,
  },
  subtitle: {
    marginTop: "8px",
    fontSize: "14px",
    color: "#cbd5f5",
    maxWidth: "640px",
  },
  section: {
    marginTop: "12px",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "6px",
  },
  sectionText: {
    margin: 0,
    fontSize: "13px",
    color: "#cbd5f5",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
    marginTop: "10px",
  },
  card: {
    borderRadius: "16px",
    padding: "12px 14px",
    backgroundColor: "rgba(15,23,42,0.98)",
    border: "1px solid rgba(55,65,81,0.9)",
    fontSize: "13px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "6px",
  },
  cardText: {
    margin: 0,
    color: "#e5e7eb",
    lineHeight: 1.6,
  },
};


