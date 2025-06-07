import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  onSearch: (term: string) => void;
  className?: string;
}

export const SearchInput = ({
  placeholder,
  onSearch,
  className,
}: SearchInputProps) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-md border focus:outline-none focus:ring-1"
      />
    </div>
  );
};
