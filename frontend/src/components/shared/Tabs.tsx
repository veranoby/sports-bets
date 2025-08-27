import React, { createContext, useContext, useState } from "react";

const TabsContext = createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export const Tabs: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ value, onValueChange, children, className = "" }) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div className={className}>{children}</div>
  </TabsContext.Provider>
);

export const TabsList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`flex border-b border-[#596c95] ${className}`}>
    {children}
  </div>
);

export const TabsTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className = "" }) => {
  const context = useContext(TabsContext);
  if (!context) return null;

  const isActive = context.value === value;

  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={`px-4 py-2 font-medium text-sm focus:outline-none ${
        isActive ? "border-b-2 border-[#cd6263] text-white" : "text-gray-400"
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className = "" }) => {
  const context = useContext(TabsContext);
  if (!context || context.value !== value) return null;

  return <div className={`mt-2 ${className}`}>{children}</div>;
};
