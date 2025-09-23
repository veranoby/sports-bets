interface StatusFilterDropdownProps {
  options: string[];
  onSelect: (status: string) => void;
  className?: string;
}

export const StatusFilterDropdown = ({
  options,
  onSelect,
  className,
}: StatusFilterDropdownProps) => {
  return (
    <select
      onChange={(e) => onSelect(e.target.value)}
      className={`px-4 py-2 rounded-md border focus:outline-none focus:ring-1 ${className}`}
    >
      <option value="">Todos</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};
