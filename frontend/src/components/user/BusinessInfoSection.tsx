import React from "react";
import {
  Building,
  ShieldCheck,
  MapPin,
  Info,
  Mail,
  Phone,
  Globe,
  Edit3,
} from "lucide-react";
import type { Venue, Gallera } from "../../types";

interface BusinessInfoSectionProps {
  type: "venue" | "gallera";
  data: Venue | Gallera | null;
  onEdit?: () => void;
}

const DetailItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div>
    <label className="flex items-center text-sm font-medium text-gray-500 mb-1">
      {icon}
      <span className="ml-2">{label}</span>
    </label>
    <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg text-gray-900 min-h-[40px]">
      {value || "No especificado"}
    </div>
  </div>
);

const BusinessInfoSection: React.FC<BusinessInfoSectionProps> = ({
  type,
  data,
  onEdit,
}) => {
  if (!data) {
    return (
      <div className="bg-blue-50 rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">
          No se encontró información de la entidad de negocio para este usuario.
        </p>
      </div>
    );
  }

  const isGallera = (d: any): d is Gallera => type === "gallera";

  const title =
    type === "venue" ? "Información del Venue" : "Información de la Gallera";

  const formatSpecialties = (specialties: Gallera["specialties"]) => {
    if (!specialties) return "No especificado";
    return (specialties.breeds || []).join(", ");
  };

  const formatFightRecord = (record: Gallera["fightRecord"]) => {
    if (!record) return "N/A";
    return `Victorias: ${record.wins}, Derrotas: ${record.losses}, Empates: ${record.draws}`;
  };

  return (
    <div className="bg-blue-50 rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Building className="w-6 h-6 text-blue-600" /> {title}
        </h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-200 text-blue-600 rounded-lg hover:bg-blue-300 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DetailItem
          icon={<Info />}
          label={type === "venue" ? "Nombre del Venue" : "Nombre de la Gallera"}
          value={data.name}
        />
        <DetailItem icon={<MapPin />} label="Ubicación" value={data.location} />
        <DetailItem
          icon={<Info />}
          label="Descripción"
          value={data.description}
        />
        <DetailItem icon={<ShieldCheck />} label="Estado" value={data.status} />
        <DetailItem
          icon={<ShieldCheck />}
          label="Verificado"
          value={data.certified ? "Sí" : "No"}
        />

        {isGallera(data) && (
          <>
            <DetailItem
              icon={<Info />}
              label="Especialidades (Razas)"
              value={formatSpecialties(data.specialties)}
            />
            <DetailItem
              icon={<Info />}
              label="Gallos Activos"
              value={data.activeRoosters || data.activeRoosters}
            />
            <DetailItem
              icon={<Info />}
              label="Récord de Peleas"
              value={formatFightRecord(data.fightRecord)}
            />
          </>
        )}

        <div className="md:col-span-2 border-t pt-6 mt-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Información de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailItem
              icon={<Mail />}
              label="Email de Contacto"
              value={data.contactInfo?.email}
            />
            <DetailItem
              icon={<Phone />}
              label="Teléfono de Contacto"
              value={data.contactInfo?.phone}
            />
            <DetailItem
              icon={<Globe />}
              label="Sitio Web"
              value={data.contactInfo?.website}
            />
            {data.contactInfo?.address && (
              <DetailItem
                icon={<MapPin />}
                label="Dirección Postal (opcional)"
                value={data.contactInfo?.address}
              />
            )}
          </div>
        </div>
      </div>

      {data.images && data.images[0] && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Imagen Principal
          </h3>
          <div className="flex justify-center">
            <img
              src={data.images[0]}
              alt={`${data.name}`}
              className="max-w-md w-full h-64 object-cover rounded-lg border border-gray-200 shadow-sm"
            />
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-6 text-center">
        La información de la entidad de negocio es de solo lectura. Para
        realizar cambios, por favor contacte a un administrador.
      </p>
    </div>
  );
};

export default BusinessInfoSection;
