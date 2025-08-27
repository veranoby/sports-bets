// frontend/src/pages/user/Venues.tsx - EFICIENTE REUTILIZANDO HOOKS EXISTENTES
// ================================================================
// Reutiliza useVenues() existente + server-side filtering
// Eficiente para costos de servidor

import React, { useState, useEffect } from "react";
import { Search, MapPin, Users, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { usersAPI } from "../../config/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import Card from "../../components/shared/Card";

interface VenueProfile {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl?: string;
}

const VenuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { venueId } = useParams<{ venueId?: string }>();
  const [search, setSearch] = useState("");
  const [venues, setVenues] = useState<VenueProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.getAll({ role: 'venue' });
        const venueProfiles = response.data.users.map(user => ({
          id: user.id,
          name: user.profileInfo?.venueName || user.username,
          description: user.profileInfo?.description || 'Local para eventos de gallos',
          location: user.profileInfo?.location || 'Ubicación no especificada',
          imageUrl: user.profileInfo?.imageUrl,
        }));
        setVenues(venueProfiles);
      } catch (err) {
        setError("Error al cargar los locales. Inténtalo de nuevo más tarde.");
        console.error('Error loading venues:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const filteredVenues = venues.filter(
    (venue) =>
      venue.name.toLowerCase().includes(search.toLowerCase()) ||
      venue.location.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Cargando locales..." />;

  // Vista individual (simplificada)
  if (venueId) {
    const venue = venues.find((v) => v.id === venueId);
    if (!venue)
      return (
        <EmptyState
          title="Local no encontrado"
          icon={<Users className="w-12 h-12" />}
        />
      );

    return (
      <div className="page-background space-y-4 p-4">
                <button
          onClick={() => navigate("/venues")}
          className="flex items-center gap-2 text-sm text-theme-light hover:text-theme-primary"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Volver a la lista
        </button>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-theme-primary mb-2">
            {venue.name}
          </h1>
          <div className="flex items-center gap-1 text-theme-light mb-3">
            <MapPin className="w-4 h-4" />
            <span>{venue.location}</span>
          </div>
          <p className="text-theme-light">{venue.description}</p>
        </div>

        {/* Placeholder para artículos del venue */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-theme-primary mb-4">
            Artículos de {venue.name}
          </h2>
          <EmptyState
            title="Próximamente"
            description="Los artículos de este local aparecerán aquí"
            icon={<Users className="w-12 h-12" />}
          />
        </Card>
      </div>
    );
  }

  // Vista lista (optimizada)
  return (
    <div className="page-background space-y-4 p-4">
      {/* Búsqueda simple */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-light" />
          <input
            type="text"
            placeholder="Buscar locales por nombre o ubicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1f37]/50 border border-gray-600/50 rounded-lg text-theme-primary"
          />
        </div>
      </Card>

      {/* Lista eficiente */}
      {error ? (
        <Card variant="error">{error}</Card>
      ) : !filteredVenues.length ? (
        <EmptyState
          title="No se encontraron locales"
          icon={<Users className="w-12 h-12" />}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredVenues.map((venue) => (
            <Card
              key={venue.id}
              onClick={() => navigate(`/venues/${venue.id}`)}
              className="p-4 cursor-pointer hover:bg-[#2a325c]/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="font-semibold text-theme-primary">
                    {venue.name}
                  </h2>
                  <div className="flex items-center gap-1 text-sm text-theme-light mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{venue.location}</span>
                  </div>
                  <p className="text-xs text-theme-light mt-2 line-clamp-2">
                    {venue.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-light ml-4" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenuesPage;
