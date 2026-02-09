import Link from 'next/link';
import { TrendingUp, BarChart3, Users, Shield, Check } from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'MRR & ARR Tracking',
    description:
      'Automatic calculation of monthly and annual recurring revenue with movement breakdown: new, expansion, contraction, and churn.',
  },
  {
    icon: BarChart3,
    title: 'Cohort Retention',
    description:
      'Visual retention heatmap showing how each monthly cohort retains over time. Identify when and where customers drop off.',
  },
  {
    icon: Users,
    title: 'Customer Intelligence',
    description:
      'Searchable customer list with MRR contribution, lifetime value, subscription status, and churn risk indicators.',
  },
  {
    icon: Shield,
    title: 'Churn Analysis',
    description:
      'Track customer and revenue churn rates. Identify at-risk customers before they cancel.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: 19,
    features: ['Up to 200 customers', 'MRR / ARR dashboard', 'Customer overview', 'Revenue trends'],
  },
  {
    name: 'Growth',
    price: 49,
    popular: true,
    features: [
      'Up to 1,000 customers',
      'Everything in Starter',
      'Cohort retention analysis',
      'Churn rate tracking',
      'MRR movement breakdown',
    ],
  },
  {
    name: 'Pro',
    price: 99,
    features: [
      'Up to 2,000 customers',
      'Everything in Growth',
      'Customer segmentation',
      'CSV export',
      'Churn risk alerts',
      'Priority support',
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">ChurnLens</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Subscription analytics
            <br />
            for small SaaS teams
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto">
            Connect your Stripe account and get MRR tracking, cohort retention
            analysis, and churn intelligence. No spreadsheets required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex justify-center px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 text-base"
            >
              Start 14-day free trial
            </Link>
            <Link
              href="#features"
              className="inline-flex justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 text-base"
            >
              See features
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            No credit card required. Connects to your existing Stripe account.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            What you get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Simple pricing
          </h2>
          <p className="text-center text-gray-600 mb-12">
            All plans include a 14-day free trial.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-lg border p-6 flex flex-col ${
                  plan.popular
                    ? 'border-blue-500 ring-1 ring-blue-500'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <span className="self-start text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded mb-3">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium text-center block ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">ChurnLens</span>
          </div>
          <p className="text-sm text-gray-400">
            Subscription analytics for SaaS founders.
          </p>
        </div>
      </footer>
    </div>
  );
}
