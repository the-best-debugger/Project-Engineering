export default function DashboardPageLayout({ header, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f1a",
        color: "#e2e8f0",
        fontFamily: "sans-serif",
      }}
    >
      {header}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>{children}</div>
    </div>
  );
}
