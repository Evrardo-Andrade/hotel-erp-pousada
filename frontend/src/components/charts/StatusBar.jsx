export function StatusBar({ items }) {
  const total = items.reduce((sum, item) => sum + item.total, 0) || 1;

  return (
    <div className="status-bar">
      {items.map((item) => (
        <div
          key={item.status}
          className={`status-segment status-${item.status}`}
          style={{ width: `${(item.total / total) * 100}%` }}
          title={`${item.status}: ${item.total}`}
        >
          <span>{item.total}</span>
        </div>
      ))}
    </div>
  );
}
