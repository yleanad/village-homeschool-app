import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Pricing = () => {
  const { user } = useAuth();

  const handleSubscribe = async (plan) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/subscription/checkout?plan=${plan}`,
        {},
        {
          withCredentials: true,
          headers: {
            'Origin': window.location.origin
          }
        }
      );
      
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.detail || 'Failed to start checkout');
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: 9.99,
      period: '/month',
      features: [
        'Unlimited family connections',
        'Event creation & RSVP',
        'Direct messaging',
        'Map-based discovery',
        'Calendar integration'
      ],
      featured: false
    },
    {
      id: 'annual',
      name: 'Annual',
      price: 89.99,
      period: '/year',
      savings: 'Save $30!',
      features: [
        'Everything in Monthly',
        'Priority support',
        'Early access to features',
        'Family verification badge',
        'Community events access'
      ],
      featured: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F1DE]">
      {/* Header */}
      <nav className="bg-white border-b border-[#E0E0E0] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#2A9D8F] flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-fraunces text-xl font-semibold text-[#264653]">Village Friends</span>
          </Link>
          {user ? (
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto py-16 px-4" data-testid="pricing-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#264653] mb-4">
            Choose Your Plan
          </h1>
          <p className="text-[#5F6F75] text-lg max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`pricing-card ${plan.featured ? 'featured' : ''}`}
            >
              <h3 className="font-fraunces text-xl font-semibold text-[#264653] mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-fraunces text-4xl font-bold text-[#264653]">
                  ${plan.price}
                </span>
                <span className="text-[#5F6F75]">{plan.period}</span>
              </div>
              {plan.savings && (
                <p className="text-sm text-[#2A9D8F] font-medium mb-4">{plan.savings}</p>
              )}
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-[#5F6F75]">
                    <Check className="w-4 h-4 text-[#2A9D8F] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button
                onClick={() => handleSubscribe(plan.id)}
                className={`w-full ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}
                data-testid={`subscribe-${plan.id}-btn`}
              >
                {user ? 'Subscribe Now' : 'Start Free Trial'}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="font-fraunces text-2xl font-bold text-[#264653] text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! You can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.'
              },
              {
                q: 'What happens after my free trial?',
                a: 'After your 14-day free trial, you\'ll need to choose a plan to continue using Village Friends. You won\'t be charged during the trial.'
              },
              {
                q: 'Is my payment secure?',
                a: 'Absolutely. We use Stripe for payment processing, which is trusted by millions of businesses worldwide.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-[#E0E0E0]">
                <h4 className="font-semibold text-[#264653] mb-2">{faq.q}</h4>
                <p className="text-[#5F6F75]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
