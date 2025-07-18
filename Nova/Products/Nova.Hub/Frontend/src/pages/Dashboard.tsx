import React from 'react';
import { Package, Activity, Download, TrendingUp, Clock, Box } from 'lucide-react';
import Card from '../components/ui/Card';

interface DashboardProps {
  products: any[];
  currentUser: any;
  onLaunchProduct: (productId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ products, currentUser, onLaunchProduct }) => {
  const runningProducts = products.filter(p => p.status === 'Running');

  const stats = [
    {
      label: 'Installed Products',
      value: products.length.toString(),
      icon: Package,
      color: 'text-blue-400'
    },
    {
      label: 'Running Products',
      value: runningProducts.length.toString(),
      icon: Activity,
      color: 'text-green-400'
    },
    {
      label: 'Available Updates',
      value: '2',
      icon: Download,
      color: 'text-orange-400'
    },
    {
      label: 'System Health',
      value: '98%',
      icon: TrendingUp,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">
            Welcome back{currentUser?.isAuthenticated ? `, ${currentUser.displayName || currentUser.globalName || currentUser.username}` : ''}!
          </h1>
          <p className="text-secondary mt-1">
            Here's what's happening with your Nova products today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-secondary glass px-3 py-1.5 rounded-lg border border-glow">
            <Clock className="inline w-4 h-4 mr-1" />
            Last updated just now
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">{stat.label}</p>
                <p className="text-2xl font-bold text-gradient mt-1">{stat.value}</p>
              </div>
              <div className="p-3 rounded-lg glass border border-glow">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Running Products */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gradient">Running Products</h2>
          <span className="text-sm text-secondary">
            {runningProducts.length} Active
          </span>
        </div>

        {runningProducts.length > 0 ? (
          <div className="space-y-3">
            {runningProducts.map((product, index) => (
              <Card key={index} className="group border-cyber">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg glass-purple border border-glow">
                      <Box className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gradient">{product.name}</h3>
                      <p className="text-sm text-secondary">{product.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-400 glass-purple px-2 py-1 rounded-md border border-glow">
                      Running
                    </span>
                    <button
                      onClick={() => onLaunchProduct(product.id)}
                      className="p-2 text-secondary hover:text-purple-400 rounded-lg hover:glass transition-colors"
                    >
                      <Activity className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-8">
              <Box className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary mb-2">No products running</h3>
              <p className="text-muted">Start a product to see it appear here.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gradient">Recent Activity</h2>
        <Card>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 glow-cyan"></div>
              <div>
                <p className="text-gradient font-medium">Started Nova Hub</p>
                <p className="text-sm text-muted">Just now</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;