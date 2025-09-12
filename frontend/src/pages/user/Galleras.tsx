import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield } from 'lucide-react';
import { articlesAPI, usersAPI } from '../../config/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import UserEntityCard from '../../components/shared/UserEntityCard';

interface GalleraProfile {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl?: string;
  articlesCount: number;
  establishedDate?: string;
}

const GallerasPage = () => {
  const [galleras, setGalleras] = useState<GalleraProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchGalleras();
  }, []);

  const fetchGalleras = async () => {
    try {
      setLoading(true);
      // Get users with gallera role
      const galleraUsers = await usersAPI.getAll({ role: 'gallera' });
      // Get their articles
      const galleraProfiles = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        galleraUsers.data.users.map(async (user: any) => {
          const articles = await articlesAPI.getAll({ author_id: user.id });
          return {
            id: user.id,
            name: user.profileInfo?.galleraName || user.username,
            description: user.profileInfo?.description || 'Institución criadora profesional',
            location: user.profileInfo?.location || 'Ecuador',
            imageUrl: user.profileInfo?.imageUrl,
            articlesCount: articles.data.total || 0,
            establishedDate: user.profileInfo?.establishedDate
          };
        })
      );
      setGalleras(galleraProfiles);
    } catch (error) {
      console.error('Error loading galleras:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGalleras = galleras.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner text='Cargando instituciones...' />;
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-3xl font-bold mb-4 text-theme-primary'>Instituciones Criadoras</h1>
      <div className='mb-4 relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
        <input 
          type='text'
          placeholder='Buscar por nombre...'
          className='input pl-10 w-full'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredGalleras.length === 0 ? (
        <EmptyState 
          icon={<Shield size={48} />}
          title='No se encontraron instituciones'
          description='No hay criadores que coincidan con tu búsqueda.'
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredGalleras.map(gallera => (
            <UserEntityCard
              key={gallera.id}
              id={gallera.id}
              name={gallera.name}
              description={gallera.description}
              location={gallera.location}
              imageUrl={gallera.imageUrl || '/placeholder.svg'}
              articlesCount={gallera.articlesCount}
              establishedDate={gallera.establishedDate}
              type="gallera"
              onClick={() => navigate(`/galleras/${gallera.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GallerasPage;