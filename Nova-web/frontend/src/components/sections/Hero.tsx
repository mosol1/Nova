import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { ArrowRight, Shield, Cpu, Download, Zap } from 'lucide-react';
import ParticleField from '../ui/ParticleField';
import CircuitPattern from '../ui/CircuitPattern';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden pt-2">
      {/* Background Effects */}
      <ParticleField />
      <CircuitPattern />

      {/* Animated Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.05, 0.2, 0.05],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6"
        >
          {/* Badge + Heading Grouped */}
          <div className="space-y-6">
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-3 glass px-6 py-3 rounded-full border-glow mt-12" // Changed from mt-8 to mt-12
            >
              <div className="relative">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
              </div>
              <span className="text-sm text-purple-300 font-medium">Latest Nova Integration</span>
              <div className="w-px h-4 bg-purple-500/30" />
              <span className="text-xs text-gray-400">v2.4.1 Released</span>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="block text-gradient mb-1">Boost your PC</span>
                <span className="text-gradient-cyber neon-text">Now.</span>
              </h1>
            </motion.div>
          </div>

          {/* Floating Icons */}
          <div className="relative">
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -left-20 top-0 w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center glass"
            >
              <Shield className="w-6 h-6 text-purple-400" />
            </motion.div>
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -right-20 top-8 w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center glass"
            >
              <Cpu className="w-6 h-6 text-cyan-400" />
            </motion.div>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed"
          >
            Elevate your system's performance effortlessly with Nova, where
            <span className="text-gradient-purple"> smart technology</span> meets
            <span className="text-gradient-purple"> user-friendly optimization</span> tools.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <Button variant="purple" size="xl" className="group relative overflow-hidden">
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto"
          >
            {[
              { value: '500K+', label: 'Active Users' },
              { value: '99.9%', label: 'Uptime' },
              { value: '4.9★', label: 'User Rating' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="text-center group"
              >
                <div className="text-3xl md:text-4xl font-bold text-gradient-cyber mb-2 group-hover:neon-text transition-all duration-300">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="pt-20"
          >
            <div className="relative max-w-5xl mx-auto">
              {/* Dashboard Container */}
              <div className="relative glass rounded-2xl p-8 border-glow glow-purple">
                {/* Holographic Overlay */}
                <div className="absolute inset-0 holographic rounded-2xl opacity-30" />
                
                {/* Browser Header */}
                <div className="relative z-10 flex items-center space-x-3 mb-8">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <div className="flex-1 glass rounded-lg h-8 ml-6 flex items-center px-4">
                    <span className="text-xs text-gray-500">nova.app/dashboard</span>
                    <div className="ml-auto">
                      <Shield className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Grid */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* System Overview */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass rounded-xl p-6 border-glow group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm text-gray-400">System Overview</h3>
                      <Cpu className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">CPU Usage</span>
                        <span className="text-sm text-white font-medium">23%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <motion.div 
                          className="bg-gradient-to-r from-purple-500 to-purple-700 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '23%' }}
                          transition={{ delay: 1, duration: 1 }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Memory</span>
                        <span className="text-sm text-white font-medium">67%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <motion.div 
                          className="bg-gradient-to-r from-cyan-500 to-cyan-700 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '67%' }}
                          transition={{ delay: 1.2, duration: 1 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Performance */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass rounded-xl p-6 border-glow group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm text-gray-400">Performance</h3>
                      <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-4xl font-bold text-gradient-cyber mb-2">98.5%</div>
                    <div className="text-xs text-green-400 flex items-center">
                      <ArrowRight className="w-3 h-3 mr-1 rotate-[-45deg]" />
                      +12% improvement
                    </div>
                    <div className="mt-4 h-16 flex items-end space-x-1">
                      {[40, 65, 45, 80, 95, 75, 98].map((height, index) => (
                        <motion.div
                          key={index}
                          className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-sm"
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: 1.5 + index * 0.1, duration: 0.5 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                  
                  {/* Storage */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass rounded-xl p-6 border-glow group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm text-gray-400">Storage Cleaned</h3>
                      <Download className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-4xl font-bold text-gradient-cyber mb-2">2.4 GB</div>
                    <div className="text-xs text-purple-400">This week</div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Temp files</span>
                        <span className="text-white">1.2 GB</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Cache</span>
                        <span className="text-white">0.8 GB</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Logs</span>
                        <span className="text-white">0.4 GB</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
              
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-purple-600/20 rounded-2xl blur-3xl -z-10 animate-pulse" />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-purple-500/30 rounded-full flex justify-center"
        >
          <div className="w-1 h-3 bg-purple-500 rounded-full mt-2 animate-pulse" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;