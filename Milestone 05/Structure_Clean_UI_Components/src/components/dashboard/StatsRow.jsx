import StatCard from "../shared/StatCard";

export default function StatsRow({ totalCount, completedCount, progressPercent }) {
  const remaining = totalCount - completedCount;

  const progressFooter = (
    <div style={{ height: 4, background: "#2d2d44", borderRadius: 99, marginTop: 8 }}>
      <div
        style={{
          height: "100%",
          width: `${progressPercent}%`,
          background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
          borderRadius: 99,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
      <StatCard label="Total Tasks" value={totalCount} subtitle="All time" />
      <StatCard label="Completed" value={completedCount} valueColor="#22c55e" subtitle="Done ✓" />
      <StatCard label="Remaining" value={remaining} valueColor="#f59e0b" subtitle="To do" />
      <StatCard
        label="Progress"
        value={`${progressPercent}%`}
        valueColor="#6366f1"
        footer={progressFooter}
      />
    </div>
  );
}
