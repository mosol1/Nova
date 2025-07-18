import { motion } from 'framer-motion';
import HolographicCard from '../ui/HolographicCard';
import { 
  Shield, 
  Zap, 
  Cpu, 
  HardDrive, 
  Gauge, 
  Lock,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'Military-grade protection with real-time threat detection, privacy safeguards, and encrypted data handling.',
      color: 'purple',
      stats: '99.9% Protection Rate'
    },
    {
      icon: Zap,
      title: 'Lightning Performance',
      description: 'Optimize system performance with intelligent algorithms, resource management, and automated tweaking.',
      color: 'cyan',
      stats: '300% Speed Boost'
    },
    {
      icon: Cpu,
      title: 'Smart Optimization',
      description: 'AI-powered system analysis that learns and adapts to your usage patterns for maximum efficiency.',
      color: 'green',
      stats: 'AI-Powered Learning'
    },
    {
      icon: HardDrive,
      title: 'Deep System Cleaning',
      description: 'Remove junk files, duplicates, and system clutter with surgical precision and safety protocols.',
      color: 'purple',
      stats: '2.4GB Average Cleanup'
    },
    {
      icon: Gauge,
      title: 'Real-time Monitoring',
      description: 'Track system performance, temperatures, and resource usage with advanced analytics dashboard.',
      color: 'cyan',
      stats: 'Live System Metrics'
    },
    {
      icon: Lock,
      title: 'Privacy Protection',
      description: 'Block trackers, secure data, and maintain complete control over your privacy with advanced encryption.',
      color: 'green',
      stats: '100% Data Security'
    }
  ];

  const performanceStats = [
    { metric: '300%', label: 'Faster Boot Times', icon: TrendingUp },
    { metric: '85%', label: 'Less Memory Usage', icon: Activity },
    { metric: '50%', label: 'Reduced CPU Load', icon: Cpu },
    { metric: '99.9%', label: 'Uptime Reliability', icon: Shield }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section className="py-24 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-5" />
      
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
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Why Choose Nova</span>
            <div className="w-px h-4 bg-purple-500/30" />
            <span className="text-xs text-gray-400">Advanced Features</span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-bold mb-8">
            <span className="block text-gradient mb-4">Built for</span>
            <span className="text-gradient-cyber neon-text">performance</span>
          </h2>
          
          <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Every feature is engineered to deliver maximum impact with minimal resource usage, 
            ensuring your system runs at peak performance with cutting-edge optimization technology.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
            >
              <HolographicCard className="h-full">
                <div className="p-8">
                  {/* Icon with Animated Ring */}
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 bg-gradient-to-br ${
                      feature.color === 'purple' ? 'from-purple-600 to-purple-800' :
                      feature.color === 'cyan' ? 'from-cyan-600 to-cyan-800' :
                      'from-green-600 to-green-800'
                    } rounded-3xl flex items-center justify-center glow-purple group-hover:glow-purple-strong transition-all duration-300`}>
                      <feature.icon className="w-10 h-10 text-white" />
                    </div>
                    {/* Rotating Ring */}
                    <div className="absolute inset-0 border-2 border-purple-500/20 rounded-3xl animate-spin" style={{ animationDuration: '8s' }} />
                    <div className="absolute inset-2 border border-purple-500/10 rounded-2xl animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gradient mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Stats Badge */}
                  <div className="glass rounded-lg p-3 border-glow">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Performance</span>
                      <span className="text-sm font-bold text-gradient-purple">{feature.stats}</span>
                    </div>
                  </div>
                </div>
              </HolographicCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Performance Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <HolographicCard>
            <div className="p-12">
              <div className="text-center mb-12">
                <h3 className="text-4xl font-bold text-gradient-cyber mb-6">
                  Proven Performance Impact
                </h3>
                <p className="text-gray-400 text-lg">
                  Real results from our community of 500,000+ active users worldwide
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {performanceStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.6 }}
                    viewport={{ once: true }}
                    className="text-center group"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-4 glow-purple group-hover:glow-purple-strong transition-all duration-300">
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-5xl font-bold text-gradient-cyber mb-3 group-hover:neon-text transition-all duration-300">
                      {stat.metric}
                    </div>
                    <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="mt-12 text-center">
                <div className="glass rounded-xl p-6 border-glow max-w-2xl mx-auto">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-400">Live Performance Metrics</span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    These metrics are updated in real-time based on user feedback and system telemetry. 
                    Your results may vary depending on system configuration.
                  </p>
                </div>
              </div>
            </div>
          </HolographicCard>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;