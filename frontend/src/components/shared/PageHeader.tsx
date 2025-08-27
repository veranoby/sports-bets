import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className,
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {breadcrumbs && (
        <nav className="mb-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <span key={index}>
              <a
                href={breadcrumb.href}
                className="text-blue-600 hover:underline"
              >
                {breadcrumb.label}
              </a>
              {index < breadcrumbs.length - 1 && " > "}
            </span>
          ))}
        </nav>
      )}
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
      {actions && <div className="mt-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
