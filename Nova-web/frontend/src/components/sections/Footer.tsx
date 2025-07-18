
import { motion } from 'framer-motion';
import { Zap, Github, Twitter, Disc as Discord, Mail, ArrowRight, Send } from 'lucide-react';
import { Button } from '../ui/button';
import HolographicCard from '../ui/HolographicCard';

const Footer = () => {
  const footerLinks = {
    Products: [
      { name: 'Nova Cleaner', href: '#' },
      { name: 'Nova Tweaker', href: '#' },
      { name: 'Nova Gaming', href: '#' },
      { name: 'Nova Monitor', href: '#' },
    ],
    Support: [
      { name: 'Documentation', href: '#' },
      { name: 'Community', href: '#' },
      { name: 'Contact Us', href: '#' },
      { name: 'Bug Reports', href: '#' },
    ],
    Company: [
      { name: 'About Us', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Changelog', href: '#' },
    ],
    Resources: [
      { name: 'Blog', href: '#' },
      { name: 'Tutorials', href: '#' },
      { name: 'API Docs', href: '#' },
      { name: 'System Requirements', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub', color: 'hover:text-white' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-blue-400' },
    { icon: Discord, href: '#', label: 'Discord', color: 'hover:text-indigo-400' },
    { icon: Mail, href: '#', label: 'Email', color: 'hover:text-purple-400' },
  ];

  return (
    <footer className="relative border-t border-purple-500/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 dot-pattern opacity-5" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="py-20 border-b border-purple-500/20"
        >
          <HolographicCard className="max-w-4xl mx-auto">
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-8 glow-purple">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-5xl font-bold text-gradient-cyber mb-6">
                Stay Updated
              </h3>
              <p className="text-gray-400 mb-10 text-lg leading-relaxed max-w-2xl mx-auto">
                Get the latest updates, exclusive features, and insider content delivered directly to your inbox. 
                Join our community of power users and developers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full px-6 py-4 glass border-glow rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-purple-500/5 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                <Button variant="purple" size="lg" className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Subscribe</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                No spam, unsubscribe at any time. We respect your privacy.
              </p>
            </div>
          </HolographicCard>
        </motion.div>

        {/* Main Footer Content */}
        <div className="py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center glow-purple">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute inset-0 border-2 border-purple-500/30 rounded-xl animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <span className="text-3xl font-bold text-gradient-cyber">
                  Nova
                </span>
              </div>
              
              <p className="text-gray-400 mb-8 leading-relaxed text-lg">
                Empowering users worldwide with cutting-edge system optimization tools. 
                Built by developers, for developers and power users who demand excellence.
              </p>
              
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.1 }}
                    className={`w-12 h-12 glass border-glow rounded-xl flex items-center justify-center text-gray-400 ${social.color} transition-all duration-300 group`}
                  >
                    <social.icon className="w-6 h-6" />
                    <div className="absolute inset-0 bg-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Links Sections */}
            {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 + 0.2 }}
                viewport={{ once: true }}
              >
                <h4 className="text-white font-bold mb-6 text-lg">{category}</h4>
                <ul className="space-y-4">
                  {links.map((link, linkIndex) => (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: categoryIndex * 0.1 + linkIndex * 0.05 + 0.4 }}
                      viewport={{ once: true }}
                    >
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-purple-400 transition-colors duration-300 text-sm flex items-center group"
                      >
                        <span>{link.name}</span>
                        <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="py-8 border-t border-purple-500/20"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm mb-4 md:mb-0 flex items-center">
              <span>© 2024 Nova. Made with</span>
              <div className="w-4 h-4 bg-red-500 rounded-full mx-2 animate-pulse" />
              <span>for the community.</span>
            </div>
            
            <div className="flex items-center space-x-8 text-sm text-gray-400">
              <a href="#" className="hover:text-purple-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Cookies</a>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400">All systems operational</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;