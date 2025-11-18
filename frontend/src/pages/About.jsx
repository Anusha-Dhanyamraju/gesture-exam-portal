import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function About() {
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    // Add CSS animations and styles
    if (!document.getElementById("about-page-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "about-page-styles";
      styleSheet.textContent = `
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.2); }
        }
        a:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(34,197,94,0.4) !important;
        }
        .comparisonListItem:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #22c55e;
          font-weight: bold;
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

  const features = [
    {
      icon: "🎯",
      title: "Gesture Control",
      description:
        "Point at virtual keyboard keys with your index finger. Hold for 1 second to type - no physical contact needed!",
      color: "#3b82f6",
    },
    {
      icon: "⌨️",
      title: "Dual Input Mode",
      description:
        "Use hand gestures or traditional keyboard typing - switch seamlessly between both methods during the exam.",
      color: "#22c55e",
    },
    {
      icon: "📊",
      title: "Real-time Analytics",
      description:
        "Keystroke timing data is captured and visualized, helping analyze typing patterns and exam behavior.",
      color: "#8b5cf6",
    },
    {
      icon: "🔒",
      title: "Secure & Reliable",
      description:
        "All exam data is stored securely in MongoDB Atlas with encrypted connections and proper authentication.",
      color: "#ef4444",
    },
    {
      icon: "👨‍💼",
      title: "Admin Dashboard",
      description:
        "Upload question banks, monitor submissions, view scores, and manage the entire exam system from one place.",
      color: "#f59e0b",
    },
    {
      icon: "⚡",
      title: "Fast & Responsive",
      description:
        "Built with modern React and optimized for performance. Smooth animations and instant feedback throughout.",
      color: "#06b6d4",
    },
  ];

  const techStack = [
    { name: "React", category: "Frontend" },
    { name: "Node.js", category: "Backend" },
    { name: "Express", category: "Backend" },
    { name: "MongoDB Atlas", category: "Database" },
    { name: "MediaPipe Hands", category: "AI/ML" },
    { name: "Vercel", category: "Hosting" },
    { name: "Render", category: "Hosting" },
  ];

  return (
    <div style={styles.page}>
      {/* Animated background elements */}
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />
      <div style={styles.glowOrb3} />

      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.logoContainer}>
          <div style={styles.logoCircle}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
        <h1 style={styles.heroTitle}>Gesture Exam Portal</h1>
        <p style={styles.heroSubtitle}>
          Revolutionizing online examinations with AI-powered gesture recognition.
          Take exams using hand gestures or traditional typing - the choice is yours.
        </p>
        <Link to="/login" style={styles.ctaButton}>
          Get Started →
        </Link>
      </div>

      {/* Main Content */}
      <div style={styles.container}>
        {/* How It Works Section */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>How It Works</h2>
            <div style={styles.titleUnderline}></div>
          </div>
          <div style={styles.stepsContainer}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Login & Access</h3>
                <p style={styles.stepText}>
                  Students log in with their name/roll number. Admins use credentials to access the dashboard.
                </p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Gesture Recognition</h3>
                <p style={styles.stepText}>
                  MediaPipe Hands detects your hand landmarks in real-time through your webcam. Point at keys to type.
                </p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Answer Questions</h3>
                <p style={styles.stepText}>
                  Navigate through questions, answer using gestures or keyboard, and see your progress in real-time.
                </p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>4</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Submit & Review</h3>
                <p style={styles.stepText}>
                  Submit your exam when ready. Admins can review all submissions, scores, and detailed analytics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Key Features</h2>
            <div style={styles.titleUnderline}></div>
          </div>
          <div style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  ...styles.featureCard,
                  ...(hoveredCard === index ? styles.featureCardHover : {}),
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  style={{
                    ...styles.featureIcon,
                    background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                    borderColor: `${feature.color}40`,
                  }}
                >
                  <span style={styles.featureIconEmoji}>{feature.icon}</span>
                </div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Technology Stack</h2>
            <div style={styles.titleUnderline}></div>
          </div>
          <div style={styles.techGrid}>
            {techStack.map((tech, index) => (
              <div key={index} style={styles.techBadge}>
                <span style={styles.techName}>{tech.name}</span>
                <span style={styles.techCategory}>{tech.category}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Student vs Admin */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>For Students & Admins</h2>
            <div style={styles.titleUnderline}></div>
          </div>
          <div style={styles.comparisonGrid}>
            <div style={styles.comparisonCard}>
              <div style={styles.comparisonHeader}>
                <span style={styles.comparisonIcon}>👨‍🎓</span>
                <h3 style={styles.comparisonTitle}>Students</h3>
              </div>
              <ul style={styles.comparisonList}>
                <li className="comparisonListItem" style={styles.comparisonListItem}>Take exams using hand gestures</li>
                <li className="comparisonListItem" style={styles.comparisonListItem}>Navigate questions easily</li>
                <li className="comparisonListItem" style={styles.comparisonListItem}>See real-time typing analytics</li>
                <li className="comparisonListItem" style={styles.comparisonListItem}>Submit answers securely</li>
                <li className="comparisonListItem" style={styles.comparisonListItem}>View your score after submission</li>
              </ul>
            </div>
            <div style={styles.comparisonCard}>
              <div style={styles.comparisonHeader}>
                <span style={styles.comparisonIcon}>👨‍💼</span>
                <h3 style={styles.comparisonTitle}>Admins</h3>
              </div>
              <ul style={styles.comparisonList}>
                <li className="comparisonListItem" style={styles.comparisonListItem}>Upload and manage question banks</li>
                <li className="comparisonListItem" style={styles.comparisonListItem}>View all student submissions</li>
                <li className="comparisonListItem" style={styles.comparisonListItem}>Analyze scores and performance</li>
                <li className="comparisonListItem" style={styles.comparisonListItem}>Monitor exam activity in real-time</li>
                <li className="comparisonListItem" style={styles.comparisonListItem}>Export results for further analysis</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div style={styles.ctaSection}>
          <h2 style={styles.ctaTitle}>Ready to Get Started?</h2>
          <p style={styles.ctaText}>
            Experience the future of online examinations with gesture-based input.
          </p>
          <Link to="/login" style={styles.ctaButtonLarge}>
            Go to Login Page
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    color: "#f1f5f9",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    padding: "40px 20px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  glowOrb1: {
    position: "absolute",
    top: "-100px",
    right: "-100px",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)",
    filter: "blur(40px)",
    pointerEvents: "none",
    animation: "float 8s ease-in-out infinite",
  },
  glowOrb2: {
    position: "absolute",
    bottom: "-150px",
    left: "-150px",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(34,197,94,0.15), transparent 70%)",
    filter: "blur(50px)",
    pointerEvents: "none",
    animation: "float 10s ease-in-out infinite reverse",
  },
  glowOrb3: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
    animation: "pulse 12s ease-in-out infinite",
  },
  hero: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    maxWidth: "800px",
    margin: "0 auto 60px",
    padding: "40px 20px",
  },
  logoContainer: {
    marginBottom: "24px",
  },
  logoCircle: {
    width: "100px",
    height: "100px",
    margin: "0 auto",
    borderRadius: "24px",
    background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(34,197,94,0.2))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#60a5fa",
    border: "1px solid rgba(148,163,184,0.2)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  heroTitle: {
    fontSize: "48px",
    fontWeight: 800,
    margin: "0 0 16px 0",
    background: "linear-gradient(135deg, #60a5fa, #34d399)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSubtitle: {
    fontSize: "18px",
    color: "#94a3b8",
    margin: "0 0 32px 0",
    lineHeight: 1.6,
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  ctaButton: {
    display: "inline-block",
    padding: "14px 28px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1200px",
    margin: "0 auto",
  },
  section: {
    marginBottom: "60px",
  },
  sectionHeader: {
    marginBottom: "32px",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "32px",
    fontWeight: 700,
    margin: "0 0 12px 0",
    color: "#f1f5f9",
  },
  titleUnderline: {
    width: "60px",
    height: "4px",
    background: "linear-gradient(90deg, #3b82f6, #22c55e)",
    margin: "0 auto",
    borderRadius: "2px",
  },
  stepsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
    marginTop: "40px",
  },
  step: {
    display: "flex",
    gap: "16px",
    padding: "24px",
    borderRadius: "16px",
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(148,163,184,0.2)",
    transition: "all 0.3s ease",
  },
  stepNumber: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 700,
    color: "#ffffff",
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: "18px",
    fontWeight: 600,
    margin: "0 0 8px 0",
    color: "#f1f5f9",
  },
  stepText: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0,
    lineHeight: 1.6,
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginTop: "32px",
  },
  featureCard: {
    padding: "28px",
    borderRadius: "20px",
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(148,163,184,0.2)",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  featureCardHover: {
    transform: "translateY(-8px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
    borderColor: "rgba(148,163,184,0.4)",
  },
  featureIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    border: "2px solid",
  },
  featureIconEmoji: {
    fontSize: "32px",
  },
  featureTitle: {
    fontSize: "20px",
    fontWeight: 600,
    margin: "0 0 12px 0",
    color: "#f1f5f9",
  },
  featureDescription: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0,
    lineHeight: 1.6,
  },
  techGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "center",
    marginTop: "32px",
  },
  techBadge: {
    padding: "12px 20px",
    borderRadius: "12px",
    background: "rgba(30,41,59,0.8)",
    border: "1px solid rgba(148,163,184,0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    minWidth: "140px",
  },
  techName: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#f1f5f9",
  },
  techCategory: {
    fontSize: "12px",
    color: "#60a5fa",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  comparisonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginTop: "32px",
  },
  comparisonCard: {
    padding: "32px",
    borderRadius: "20px",
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(148,163,184,0.2)",
  },
  comparisonHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  comparisonIcon: {
    fontSize: "32px",
  },
  comparisonTitle: {
    fontSize: "24px",
    fontWeight: 600,
    margin: 0,
    color: "#f1f5f9",
  },
  comparisonList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  comparisonListItem: {
    padding: "8px 0",
    paddingLeft: "24px",
    position: "relative",
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  ctaSection: {
    textAlign: "center",
    padding: "60px 20px",
    borderRadius: "24px",
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(148,163,184,0.2)",
    marginTop: "40px",
  },
  ctaTitle: {
    fontSize: "36px",
    fontWeight: 700,
    margin: "0 0 16px 0",
    color: "#f1f5f9",
  },
  ctaText: {
    fontSize: "18px",
    color: "#94a3b8",
    margin: "0 0 32px 0",
  },
  ctaButtonLarge: {
    display: "inline-block",
    padding: "16px 32px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
  },
};
