import React, { useState } from "react";
import { 
  Download, 
  Star, 
  Heart, 
  Search, 
  Filter,
  Grid,
  List,
  ShoppingCart,
  Lock,
  Crown,
  Package
} from "lucide-react";
import { UserInfo } from "../types";

interface CatalogProps {
  currentUser: UserInfo | null;
  onSignIn: () => void;
}

// Mock catalog data - in real app this would come from API
const catalogProducts = [
  {
    id: "nova.productivity.suite",
    name: "Nova Productivity Suite",
    displayName: "Nova Productivity Suite",
    description: "Complete productivity tools for professionals including task management, note-taking, and time tracking.",
    category: "Productivity",
    price: 29.99,
    rating: 4.8,
    downloads: 15420,
    author: "Nova Team",
    version: "2.1.0",
    requiresAuth: true,
    icon: "/icons/productivity.png",
    screenshots: ["/screenshots/prod1.png", "/screenshots/prod2.png"],
    tags: ["productivity", "task-management", "notes"],
    features: ["Task Management", "Note Taking", "Time Tracking", "Calendar Integration"],
    lastUpdated: "2024-01-15"
  },
  {
    id: "nova.dev.tools",
    name: "Nova Dev Tools",
    displayName: "Nova Development Tools",
    description: "Essential development tools for coding including code editor, debugger, and project management.",
    category: "Development",
    price: 0,
    rating: 4.9,
    downloads: 28750,
    author: "Nova Community",
    version: "1.5.2",
    requiresAuth: false,
    icon: "/icons/dev-tools.png",
    screenshots: ["/screenshots/dev1.png", "/screenshots/dev2.png"],
    tags: ["development", "code-editor", "debugging"],
    features: ["Code Editor", "Debugger", "Git Integration", "Terminal"],
    lastUpdated: "2024-01-20"
  }
];

const Catalog: React.FC<CatalogProps> = ({ currentUser, onSignIn }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['all', ...Array.from(new Set(catalogProducts.map(p => p.category)))];

  const filteredProducts = catalogProducts.filter(product => {
    const searchMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
    
    const priceMatch = priceFilter === 'all' || 
                      (priceFilter === 'free' && product.price === 0) ||
                      (priceFilter === 'paid' && product.price > 0);
    
    return searchMatch && categoryMatch && priceMatch;
  });

  const handleInstall = (productId: string, requiresAuth: boolean, price: number) => {
    if (requiresAuth && !currentUser?.isAuthenticated) {
      onSignIn();
      return;
    }

    if (price > 0 && !currentUser?.isAuthenticated) {
      onSignIn();
      return;
    }

    console.log(`Installing product: ${productId}`);
  };

  const ProductCard = ({ product }: { product: any }) => (
    <div className="glass border-cyber rounded-lg p-4 hover:glow-purple transition-all duration-300 group">
      {/* Product Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 glass-purple rounded-lg flex items-center justify-center border border-glow">
            <Package className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gradient group-hover:text-gradient-cyber transition-colors">
              {product.displayName}
            </h3>
            <p className="text-sm text-secondary">by {product.author}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Heart className="w-4 h-4 text-secondary hover:text-red-400 cursor-pointer transition-colors" />
          {product.requiresAuth && <Lock className="w-4 h-4 text-orange-400" title="Requires Account" />}
        </div>
      </div>

      {/* Product Info */}
      <p className="text-sm text-secondary mb-3 line-clamp-2">{product.description}</p>

      {/* Rating & Downloads */}
      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm text-gradient">{product.rating}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Download className="w-4 h-4 text-secondary" />
          <span className="text-sm text-secondary">{product.downloads.toLocaleString()}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {product.tags.slice(0, 3).map((tag: string) => (
          <span key={tag} className="text-xs px-2 py-1 glass border border-glow text-secondary rounded">
            {tag}
          </span>
        ))}
      </div>

      {/* Price & Install */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {product.price === 0 ? (
            <span className="text-green-400 font-medium">Free</span>
          ) : (
            <div className="flex items-center space-x-1">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-gradient font-medium">${product.price}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => handleInstall(product.id, product.requiresAuth, product.price)}
          className={`px-4 py-2 rounded-lg font-medium transition-all border border-glow ${
            product.price === 0 
              ? 'glass text-green-400 hover:glow-cyan'
              : 'glass-purple text-purple-400 hover:glow-purple'
          }`}
        >
          {product.price === 0 ? 'Install' : 'Purchase'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Product Catalog</h1>
          <p className="text-secondary mt-1">
            Discover and install Nova products ({filteredProducts.length} available)
          </p>
        </div>

        {/* View Toggle */}
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

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass border border-glow rounded-lg pl-10 pr-4 py-2 w-full bg-transparent text-white placeholder-secondary"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="glass border border-glow rounded-lg px-3 py-2 bg-transparent text-white"
        >
          {categories.map(category => (
            <option key={category} value={category} className="bg-black">
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>

        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="glass border border-glow rounded-lg px-3 py-2 bg-transparent text-white"
        >
          <option value="all" className="bg-black">All Prices</option>
          <option value="free" className="bg-black">Free</option>
          <option value="paid" className="bg-black">Paid</option>
        </select>
      </div>

      {/* Auth Notice */}
      {!currentUser?.isAuthenticated && (
        <div className="mb-6 p-4 glass-purple border border-glow rounded-lg">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-gradient font-medium">Sign in to access premium products</p>
              <p className="text-sm text-secondary">
                Create an account to purchase and install premium Nova products
              </p>
            </div>
            <button onClick={onSignIn} className="glass-purple border border-glow px-4 py-2 rounded-lg text-purple-400 hover:glow-purple transition-all ml-auto">
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Products */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gradient mb-2">No products found</h3>
          <p className="text-secondary mb-4">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <button 
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              setPriceFilter("all");
            }}
            className="glass-purple border border-glow px-4 py-2 rounded-lg text-purple-400 hover:glow-purple transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Catalog;