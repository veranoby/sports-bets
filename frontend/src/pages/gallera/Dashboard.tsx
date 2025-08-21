import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FileText, TrendingUp, Users, Eye, Clock, CheckCircle } from "lucide-react";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import StatusChip from "../../components/shared/StatusChip";
import { articlesAPI } from "../../config/api";
import { Link } from "react-router-dom";

interface Article {
  id: string;
  title: string;
  summary: string;
  status: "draft" | "pending" | "published" | "archived";
  created_at: string;
  published_at?: string;
  views?: number;
}

const GalleraDashboard: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    pendingArticles: 0,
    totalViews: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch user's articles
        const response = await articlesAPI.getAll({
          authorId: user?.id,
          limit: 10,
          includeAuthor: true
        });
        
        const userArticles = response.data?.articles || [];
        setArticles(userArticles);
        
        // Calculate stats
        const published = userArticles.filter(a => a.status === "published");
        const pending = userArticles.filter(a => a.status === "pending");
        const totalViews = userArticles.reduce((sum, article) => sum + (article.views || 0), 0);
        
        setStats({
          totalArticles: userArticles.length,
          publishedArticles: published.length,
          pendingArticles: pending.length,
          totalViews
        });
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">
            Manage your articles and track your community engagement.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedArticles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingArticles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/gallera/articles"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Manage Articles</h3>
                  <p className="text-sm text-gray-600">Create and edit your articles</p>
                </div>
              </div>
            </Link>

            <Link
              to="/gallera/analytics"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-200">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">View Analytics</h3>
                  <p className="text-sm text-gray-600">Track article performance</p>
                </div>
              </div>
            </Link>

            <Link
              to="/gallera/community"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Community</h3>
                  <p className="text-sm text-gray-600">Connect with other galleras</p>
                </div>
              </div>
            </Link>
          </div>
        </Card>

        {/* Recent Articles */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Articles</h2>
            <Link
              to="/gallera/articles"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600 mb-6">Start creating your first article to share with the community.</p>
              <Link
                to="/gallera/articles"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Create Article
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.slice(0, 5).map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{article.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {new Date(article.created_at).toLocaleDateString()}</span>
                      {article.published_at && (
                        <span>Published: {new Date(article.published_at).toLocaleDateString()}</span>
                      )}
                      {article.views !== undefined && (
                        <span>Views: {article.views}</span>
                      )}
                    </div>
                  </div>
                  <StatusChip status={article.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GalleraDashboard;