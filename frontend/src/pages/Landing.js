import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, Shield, MessageCircle, Heart, ArrowRight, Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Landing = () => {
  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Find Nearby Families",
      description: "Discover homeschool families in your area using our smart location-based search and interactive map."
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Schedule Meetups",
      description: "Easily plan playdates, field trips, and group activities with our integrated calendar system."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Safety First",
      description: "All families go through ID verification and email verification for a trusted community."
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Connect & Chat",
      description: "Message other families, coordinate meetups, and build lasting friendships."
    }
  ];

  const testimonials = [
    {
      quote: "Village Friends helped us find our homeschool tribe! Our kids now have wonderful friends to learn and play with.",
      name: "Sarah M.",
      image: "https://images.unsplash.com/photo-1621291569636-a96ce37f5be8?crop=entropy&cs=srgb&fm=jpg&q=85&w=100&h=100&fit=crop"
    },
    {
      quote: "The safety features give me peace of mind. I love that families are verified before connecting.",
      name: "Jennifer K.",
      image: "https://images.unsplash.com/photo-1760633549227-901e0c3cf9d3?crop=entropy&cs=srgb&fm=jpg&q=85&w=100&h=100&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#E0E0E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <div className="w-10 h-10 rounded-full bg-[#5B9A8B] flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-fraunces text-xl font-semibold text-[#2C3E50]">Village Friends</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="nav-link">Features</a>
              <a href="#pricing" className="nav-link">Pricing</a>
              <a href="#testimonials" className="nav-link">Stories</a>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-[#2C3E50] font-medium" data-testid="login-btn">
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-[#5B9A8B] hover:bg-[#4A8275] text-white rounded-full px-6" data-testid="get-started-btn">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="hero-blob top-20 -right-40 opacity-60" />
        <div className="hero-blob bottom-0 -left-40 opacity-40" style={{ animationDelay: '-5s' }} />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 bg-[#5B9A8B]/10 text-[#5B9A8B] rounded-full text-sm font-semibold mb-6">
                🏡 Building Community Together
              </span>
              <h1 className="font-fraunces text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2C3E50] leading-tight mb-6">
                Where Homeschool Families{' '}
                <span className="text-[#5B9A8B]">Find Their Village</span>
              </h1>
              <p className="text-lg text-[#5F6F75] mb-8 max-w-lg">
                Connect with nearby homeschool families, arrange playdates, and give your children the gift of friendship and community.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button className="btn-primary text-lg" data-testid="hero-cta">
                    Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" className="btn-secondary text-lg">
                    Learn More
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-[#5F6F75]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5B9A8B]" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5B9A8B]" />
                  <span>No credit card required</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1763738173696-3354654fa8fe?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                  alt="Kids playing together"
                  className="w-full h-[400px] lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2C3E50]/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <img src="https://images.unsplash.com/photo-1621291569636-a96ce37f5be8?w=40&h=40&fit=crop" alt="" className="w-8 h-8 rounded-full border-2 border-white" />
                        <img src="https://images.unsplash.com/photo-1760633549227-901e0c3cf9d3?w=40&h=40&fit=crop" alt="" className="w-8 h-8 rounded-full border-2 border-white" />
                        <img src="https://images.unsplash.com/photo-1764816636564-25eadaf07a44?w=40&h=40&fit=crop" alt="" className="w-8 h-8 rounded-full border-2 border-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">500+ families connected</p>
                        <p className="text-white/80 text-xs">Join our growing community</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#2C3E50] mb-4">
              Everything You Need to Build Community
            </h2>
            <p className="text-[#5F6F75] text-lg max-w-2xl mx-auto">
              Village Friends provides all the tools homeschool families need to connect, plan, and grow together.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#F5F3EE] rounded-2xl p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5B9A8B]/10 flex items-center justify-center text-[#5B9A8B] mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-fraunces text-xl font-semibold text-[#2C3E50] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#5F6F75]">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Co-op Premium Feature */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#D4B896]/20 to-[#C8907A]/10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4B896]/30 text-[#8B7355] rounded-full text-sm font-semibold mb-6">
              <Crown className="w-4 h-4" />
              Premium Feature
            </span>
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#2C3E50] mb-4">
              Co-op & Group Management
            </h2>
            <p className="text-[#5F6F75] text-lg max-w-2xl mx-auto">
              Create and manage homeschool co-ops, activity clubs, and support groups. Post announcements, organize events, and build your community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Create Groups", desc: "Start co-ops, clubs, or support groups for your community" },
              { title: "Post Announcements", desc: "Keep members informed with pinned updates" },
              { title: "Organize Events", desc: "Schedule group activities and field trips" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h3 className="font-fraunces text-lg font-semibold text-[#2C3E50] mb-2">{item.title}</h3>
                <p className="text-[#5F6F75] text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#2C3E50] mb-4">
              How Village Friends Works
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Your Profile", description: "Sign up and create your family profile. Tell us about your kids and interests." },
              { step: "02", title: "Discover Families", description: "Browse nearby homeschool families using our map and search features." },
              { step: "03", title: "Connect & Meet", description: "Send messages, plan meetups, and build lasting friendships!" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#5B9A8B] text-white font-fraunces text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-fraunces text-xl font-semibold text-[#2C3E50] mb-2">{item.title}</h3>
                <p className="text-[#5F6F75]">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-[#F5F3EE]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#2C3E50] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-[#5F6F75] text-lg">
              Start with a 14-day free trial. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="pricing-card"
            >
              <h3 className="font-fraunces text-xl font-semibold text-[#2C3E50] mb-2">Monthly</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-fraunces text-4xl font-bold text-[#2C3E50]">$9.99</span>
                <span className="text-[#5F6F75]">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                {["Unlimited family connections", "Event creation & RSVP", "Direct messaging", "Map-based discovery", "Calendar integration"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[#5F6F75]">
                    <Check className="w-4 h-4 text-[#5B9A8B]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className="w-full btn-secondary" data-testid="pricing-monthly">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="pricing-card featured"
            >
              <h3 className="font-fraunces text-xl font-semibold text-[#2C3E50] mb-2">Annual</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-fraunces text-4xl font-bold text-[#2C3E50]">$89.99</span>
                <span className="text-[#5F6F75]">/year</span>
              </div>
              <p className="text-sm text-[#5B9A8B] font-medium mb-4">Save $30 compared to monthly!</p>
              <ul className="space-y-3 mb-6">
                {["Everything in Monthly", "Co-op & Group Management", "Post announcements", "Group events", "Priority support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[#5F6F75]">
                    <Check className="w-4 h-4 text-[#5B9A8B]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className="w-full btn-primary" data-testid="pricing-annual">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#2C3E50] mb-4">
              Families Love Village Friends
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#F5F3EE] rounded-2xl p-8"
              >
                <p className="text-[#5F6F75] text-lg mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                  <span className="font-semibold text-[#2C3E50]">{testimonial.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#2C3E50]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Find Your Village?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Join hundreds of homeschool families who have found connection, support, and friendship through Village Friends.
            </p>
            <Link to="/register">
              <Button className="bg-[#C8907A] hover:bg-[#B07A66] text-white rounded-full px-8 py-3 text-lg font-semibold" data-testid="cta-button">
                Start Your Free Trial Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-[#2C3E50]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#5B9A8B] flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-fraunces text-white font-semibold">Village Friends</span>
            </div>
            <div className="flex items-center gap-6 text-white/70 text-sm">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
            <p className="text-white/50 text-sm">
              © 2024 Village Friends. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
