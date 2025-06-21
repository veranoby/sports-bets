import React from "react";
import { FileText, BarChart2, Download } from "lucide-react";
import Card from "../../components/shared/Card";

const AdminReports: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#1a1f37] text-white p-4">
      <h1 className="text-2xl font-bold mb-6">Reportes del Sistema</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#2a325c] p-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-yellow-400" />
            <h3 className="font-bold">Reporte de Usuarios</h3>
          </div>
          <button className="flex items-center gap-1 px-3 py-1 bg-[#596c95] rounded text-sm">
            <Download size={14} /> Descargar
          </button>
        </Card>
        <Card className="bg-[#2a325c] p-4">
          <div className="flex items-center gap-3 mb-4">
            <BarChart2 className="text-purple-400" />
            <h3 className="font-bold">Reporte de Apuestas</h3>
          </div>
          <button className="flex items-center gap-1 px-3 py-1 bg-[#596c95] rounded text-sm">
            <Download size={14} /> Descargar
          </button>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;
