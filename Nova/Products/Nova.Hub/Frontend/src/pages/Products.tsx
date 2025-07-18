import React, { useState } from "react";
import { 
  Play, 
  Square, 
  Trash2, 
  Settings, 
  Package,
  Filter,
  Grid,
  List,
  MoreHorizontal
} from "lucide-react";
import { NovaProduct } from "../types";

interface ProductsProps {
  products: NovaProduct[];
  onLaunchProduct: (productId: string) => void;
  onRefresh: () => void;
}

const Products: React.FC<ProductsProps> = ({ products, onLaunchProduct, onRefresh }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const statuses = ['all', 'Running', 'Stopped', 'Installing', 'Updating', 'Error'];

  const filteredProducts = products.filter(product => {
    const categoryMatch = filterCategory === 'all' || product.category === filterCategory;
    const statusMatch = statusFilter === 'all' || product.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running': return 'text-green-400 glass-purple';
      case 'Stopped': return 'text-gray-400 glass';
      case 'Installing': return 'text-blue-400 glass-purple';
      case 'Updating': return 'text-orange-400 glass-purple';
      case 'Error': return 'text-red-400 glass';
      default: return 'text-gray-400 glass';
    }
  };

  const ProductCard = ({ product }: { product: NovaProduct }) => (
    <div className="glass border-cyber rounded-lg p-4 hover:glow-purple transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 glass-purple rounded-lg flex items-center justify-center border border-glow">
            <Package className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gradient">{product.displayName}</h3>
            <p className="text-sm text-secondary">v{product.version}</p>
          </div>
        </div>
        <button className="p-1 text-secondary hover:text-purple-400 hover:glass rounded transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-secondary mb-4 line-clamp-2">{product.description}</p>

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full border border-glow ${getStatusColor(product.status)}`}>
          {product.status}
        </span>
        <div className="flex items-center space-x-2">
          {product.status === 'Running' ? (
            <button
              onClick={() => onLaunchProduct(product.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:glass rounded transition-colors"
              title="Stop Product"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onLaunchProduct(product.id)}
              className="p-2 text-green-400 hover:text-green-300 hover:glass rounded transition-colors"
              title="Start Product"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button
            className="p-2 text-secondary hover:text-purple-400 hover:glass rounded transition-colors"
            title="Product Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-red-400 hover:text-red-300 hover:glass rounded transition-colors"
            title="Uninstall Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const ProductListItem = ({ product }: { product: NovaProduct }) => (
    <div className="flex items-center justify-between p-4 glass border-cyber rounded-lg hover:glow-purple transition-all duration-300">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 glass-purple rounded-lg flex items-center justify-center border border-glow">
          <Package className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-medium text-gradient">{product.displayName}</h3>
          <p className="text-sm text-secondary">{product.description}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm text-secondary">v{product.version}</span>
        <span className={`text-xs px-2 py-1 rounded-full border border-glow ${getStatusColor(product.status)}`}>
          {product.status}
        </span>
        <div className="flex items-center space-x-2">
          {product.status === 'Running' ? (
            <button
              onClick={() => onLaunchProduct(product.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:glass rounded transition-colors"
              title="Stop Product"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onLaunchProduct(product.id)}
              className="p-2 text-green-400 hover:text-green-300 hover:glass rounded transition-colors"
              title="Start Product"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button
            className="p-2 text-secondary hover:text-purple-400 hover:glass rounded transition-colors"
            title="Product Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-red-400 hover:text-red-300 hover:glass rounded transition-colors"
            title="Uninstall Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Products</h1>
          <p className="text-secondary mt-1">
            Manage your installed Nova products ({filteredProducts.length} products)
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex glass rounded-lg p-1 border border-glow">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'glass-purple text-purple-400' : 'text-secondary hover:text-purple-400'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ? 'glass-purple text-purple-400' : 'text-secondary hover:text-purple-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-secondary" />
          <span className="text-sm text-secondary">Filter by:</span>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="glass border border-glow rounded-lg px-3 py-2 text-sm bg-transparent text-white"
        >
          {categories.map(category => (
            <option key={category} value={category} className="bg-black">
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="glass border border-glow rounded-lg px-3 py-2 text-sm bg-transparent text-white"
        >
          {statuses.map(status => (
            <option key={status} value={status} className="bg-black">
              {status === 'all' ? 'All Statuses' : status}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map(product => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gradient mb-2">No products found</h3>
          <p className="text-secondary mb-4">
            {filterCategory !== 'all' || statusFilter !== 'all' 
              ? 'Try adjusting your filters or browse the catalog to install new products.'
              : 'You haven\'t installed any Nova products yet.'
            }
          </p>
          <button className="glass-purple border border-glow px-4 py-2 rounded-lg text-purple-400 hover:glow-purple transition-all">
            Browse Catalog
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;