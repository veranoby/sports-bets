interface StatusChipProps {
  status: string;
}

export const StatusChip = ({ status }: StatusChipProps) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium ${
      status === "active"
        ? "bg-[#596c95] text-white"
        : status === "completed"
        ? "bg-green-600 text-white"
        : "bg-[#cd6263] text-white"
    }`}
  >
    {status.toUpperCase()}
  </span>
);
