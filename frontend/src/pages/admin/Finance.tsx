import React from "react";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import Card from "../../components/shared/Card";

const AdminFinance: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#1a1f37] text-white p-4">
      <h1 className="text-2xl font-bold mb-6">Reportes Financieros</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#2a325c] p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-400" />
            <h3 className="font-bold">Ingresos Totales</h3>
          </div>
          <p className="text-2xl mt-2">$10,000.00</p>
        </Card>
        <Card className="bg-[#2a325c] p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-blue-400" />
            <h3 className="font-bold">Ganancias</h3>
          </div>
          <p className="text-2xl mt-2">$5,000.00</p>
        </Card>
        <Card className="bg-[#2a325c] p-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="text-red-400" />
            <h3 className="font-bold">Gastos</h3>
          </div>
          <p className="text-2xl mt-2">$1,200.00</p>
        </Card>
      </div>
    </div>
  );
};

export default AdminFinance;
