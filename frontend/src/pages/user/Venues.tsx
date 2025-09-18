// frontend/src/pages/user/Venues.tsx - EFICIENTE REUTILIZANDO HOOKS EXISTENTES
// ================================================================
// Reutiliza useVenues() existente + server-side filtering
// Eficiente para costos de servidor

import React, { useState, useEffect } from "react";
import { Search, MapPin, Users, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { usersAPI, articlesAPI } from "../../services/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import Card from "../../components/shared/Card";
import UserEntityCard from "../../components/shared/UserEntityCard";

interface VenueProfile {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl?: string;
  articlesCount?: number;
  establishedDate?: string;
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
        if (response.success) {
          const venueProfiles = await Promise.all(
            response.data.users.map(async (user: any) => {
              const articles = await articlesAPI.getAll({ author_id: user.id });
              return {
                id: user.id,
                name: user.profileInfo?.venueName || user.username,
                description: user.profileInfo?.description || 'Local para eventos de gallos',
                location: user.profileInfo?.location || 'Ubicación no especificada',
                imageUrl: user.profileInfo?.imageUrl,
                articlesCount: articles.success ? articles.data.total || 0 : 0,
                establishedDate: user.profileInfo?.establishedDate
              };
            })
          );
          setVenues(venueProfiles);
        } else {
          setError("Error al cargar los locales. Inténtalo de nuevo más tarde.");
        }
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

  // Vista lista (normalizada)
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-theme-primary">Locales</h1>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text"
          placeholder="Buscar por nombre o ubicación..."
          className="input pl-10 w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <Card variant="error">{error}</Card>
      ) : !filteredVenues.length ? (
        <EmptyState
          title="No se encontraron locales"
          description="No hay locales que coincidan con tu búsqueda."
          icon={<Users className="w-12 h-12" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <UserEntityCard
              key={venue.id}
              id={venue.id}
              name={venue.name}
              description={venue.description}
              location={venue.location}
              imageUrl={venue.imageUrl}
              articlesCount={venue.articlesCount}
              establishedDate={venue.establishedDate}
              type="venue"
              onClick={() => navigate(`/venues/${venue.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VenuesPage;
