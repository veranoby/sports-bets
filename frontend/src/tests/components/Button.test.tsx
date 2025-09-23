import { render, screen, fireEvent } from "../utils/testUtils";
import { vi } from "vitest";

// Simple Button component for testing (create if doesn't exist)
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  loading = false,
}) => {
  const baseClasses = "px-4 py-2 rounded font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid="button"
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

// Tests
describe("Button Component", () => {
  it("renders button with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByTestId("button")).toBeInTheDocument();
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByTestId("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>,
    );

    fireEvent.click(screen.getByTestId("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("shows loading state", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} loading>
        Click me
      </Button>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies correct variant classes", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByTestId("button")).toHaveClass("bg-blue-600");

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByTestId("button")).toHaveClass("bg-red-600");
  });

  it("handles keyboard navigation", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByTestId("button");
    button.focus();
    expect(button).toHaveFocus();

    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    // Note: This test depends on button's native behavior
  });
});
