type MarkdownHintMenuProps = {
  items: { id: string; label: string; insert: string }[];
  index: number;
  top: number;
  left: number;
  onHover: (index: number) => void;
  onSelect: (index: number) => void;
};

export function MarkdownHintMenu({
  items,
  index,
  top,
  left,
  onHover,
  onSelect,
}: MarkdownHintMenuProps) {
  return (
    <ul
      className="md-hint-menu"
      role="listbox"
      style={{ top, left }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {items.map((item, itemIndex) => (
        <li key={item.id} role="none">
          <button
            type="button"
            role="option"
            aria-selected={itemIndex === index}
            className={
              itemIndex === index ? "md-hint-item is-active" : "md-hint-item"
            }
            onMouseEnter={() => onHover(itemIndex)}
            onClick={() => onSelect(itemIndex)}
          >
            <span>{item.label}</span>
            <code>{item.insert.replaceAll("\n", "↵")}</code>
          </button>
        </li>
      ))}
    </ul>
  );
}
