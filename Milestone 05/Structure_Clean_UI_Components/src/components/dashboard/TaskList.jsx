import TaskItem from "../shared/TaskItem";

export default function TaskList({ tasks, onToggleTask, onDeleteTask }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No tasks found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Add a task above to get started</div>
        </div>
      )}
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggleTask} onDelete={onDeleteTask} />
      ))}
    </div>
  );
}
