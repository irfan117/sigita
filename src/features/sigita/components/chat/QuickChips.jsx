export default function QuickChips({ quick, onPick }) {
  return (
    <div className="chips">
      {quick.map((q, i) => (
        <button
          key={q}
          className="chip"
          style={{ animationDelay: `${i * 0.07}s` }}
          onClick={() => onPick(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
