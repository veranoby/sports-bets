import React from "react";

interface FormFieldProps {
  label: string;
  type?: "text" | "number" | "email" | "password" | "textarea";
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  className = "",
}) => {
  const InputComponent = type === "textarea" ? "textarea" : "input";

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-600">*</span>}
      </label>
      <InputComponent
        type={type !== "textarea" ? type : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`block w-full rounded-md border ${
          error ? "border-red-300" : "border-gray-300"
        } shadow-sm focus:border-[#596c95] focus:ring-[#596c95] ${
          type === "textarea" ? "h-24" : "h-10"
        } p-2`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
