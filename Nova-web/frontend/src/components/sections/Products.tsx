import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import HolographicCard from '../ui/HolographicCard';
import { 
  Trash2, 
  Settings, 
  Gamepad2, 
  Monitor, 
  Download, 
  ArrowRight,
  Zap,
  Star,
  Users,
  Shield
} from 'lucide-react';

const Products = () => {
  const products = [
    {
      name: 'Nova Cleaner',
      description: 'Deep system cleanup and debloating tool that removes unwanted apps, cleans registry, and manages startup programs with military precision.',
      icon: Trash2,
      features: ['Uninstall bloatware', 'Registry cleaning', 'Temp file cleanup', 'Startup management'],
      status: 'Available',
      downloads: '45K+',
      rating: 4.9,
      color: 'purple'
    },
    {
      name: 'Nova Tweaker',
      description: 'Advanced Windows optimization with performance tweaks, privacy settings, and visual customizations for power users.',
      icon: Settings,
      features: ['Performance tweaks', 'Privacy settings', 'Visual customizations', 'System behavior'],
      status: 'Available',
      downloads: '38K+',
      rating: 4.8,
      color: 'cyan'
    },
    {
      name: 'Nova Gaming',
      description: 'Game management and optimization suite with library discovery, launcher, and real-time performance monitoring.',
      icon: Gamepad2,
      features: ['Game library', 'Performance optimization', 'FPS monitoring', 'Resource management'],
      status: 'Beta',
      downloads: '22K+',
      rating: 4.7,
      color: 'green'
    },
    {
      name: 'Nova Monitor',
      description: 'Real-time system monitoring with CPU, RAM, GPU usage tracking and advanced temperature monitoring capabilities.',
      icon: Monitor,
      features: ['Real-time monitoring', 'Temperature tracking', 'Network activity', 'Storage analysis'],
      status: 'Coming Soon',
      downloads: 'TBA',
      rating: null,
      color: 'purple'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section id="products" className="py-24 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 dot-pattern opacity-10" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center space-x-3 glass px-6 py-3 rounded-full border-glow mb-8">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Our Product Suite</span>
            <div className="w-px h-4 bg-purple-500/30" />
            <span className="text-xs text-gray-400">4 Powerful Tools</span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-bold mb-8">
            <span className="block text-gradient mb-4">Powerful tools for</span>
            <span className="text-gradient-cyber neon-text">every need</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Each Nova product is engineered with precision to solve specific system challenges, 
            giving you complete control over your Windows experience with cutting-edge technology.
          </p>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20"
        >
          {products.map((product) => (
            <motion.div
              key={product.name}
              variants={itemVariants}
            >
              <HolographicCard className="h-full">
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${
                        product.color === 'purple' ? 'from-purple-600 to-purple-800' :
                        product.color === 'cyan' ? 'from-cyan-600 to-cyan-800' :
                        'from-green-600 to-green-800'
                      } rounded-2xl flex items-center justify-center glow-purple group-hover:glow-purple-strong transition-all duration-300`}>
                        <product.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gradient mb-1">{product.name}</h3>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            product.status === 'Available' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            product.status === 'Beta' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>
                            {product.status}
                          </span>
                          {product.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-400">{product.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-gray-400 mb-1">
                        <Download className="w-4 h-4" />
                        <span className="text-sm font-medium">{product.downloads}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Users className="w-3 h-3" />
                        <span className="text-xs">downloads</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 leading-relaxed mb-6">
                    {product.description}
                  </p>

                  {/* Features Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {product.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: featureIndex * 0.1 + 0.3 }}
                        viewport={{ once: true }}
                        className="flex items-center space-x-3 text-sm text-gray-400 glass rounded-lg p-3"
                      >
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <Button 
                      variant={product.status === 'Available' ? 'purple' : product.status === 'Beta' ? 'secondary' : 'ghost'} 
                      className="flex-1 group relative overflow-hidden"
                      disabled={product.status === 'Coming Soon'}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {product.status === 'Available' ? (
                        <>
                          <Download className="w-4 h-4 mr-2 relative z-10" />
                          <span className="relative z-10">Download</span>
                        </>
                      ) : product.status === 'Beta' ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 relative z-10" />
                          <span className="relative z-10">Try Beta</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2 relative z-10" />
                          <span className="relative z-10">Notify Me</span>
                        </>
                      )}
                    </Button>
                    <Button variant="ghost" className="group">
                      <span>Learn More</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </HolographicCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <HolographicCard className="max-w-3xl mx-auto">
            <div className="p-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl flex items-center justify-center mx-auto mb-8 glow-purple-strong">
                <Download className="w-10 h-10 text-white" />
                <div className="absolute inset-0 bg-purple-500/20 rounded-3xl animate-ping" />
              </div>
              <h3 className="text-4xl font-bold text-gradient-cyber mb-6">
                Get the Complete Suite
              </h3>
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                Download all Nova products together and save 40% with our bundle package. 
                Experience the full power of system optimization.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="purple" size="xl" className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Download className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Download Nova Suite</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
                </Button>
                <div className="text-sm text-gray-500">
                  <span className="line-through">$99.99</span>
                  <span className="text-purple-400 font-bold ml-2">$59.99</span>
                </div>
              </div>
            </div>
          </HolographicCard>
        </motion.div>
      </div>
    </section>
  );
};

export default Products;