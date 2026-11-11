import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { isValidEmail, isValidPhone, isRequired } from '@/lib/validators';
import * as contactService from '@/services/contactService';

const contactCards = [
  {
    icon: MapPin,
    title: 'Visit Us',
    lines: ['Surabi Silks', 'MG Road, Thrissur', 'Kerala, India — 680001'],
  },
  {
    icon: Phone,
    title: 'Call Us',
    lines: ['+91 98765 43210', 'Mon — Sat, 10 am – 7 pm IST'],
  },
  {
    icon: Mail,
    title: 'Email Us',
    lines: ['support@surabsilks.com', 'We reply within 24 hours'],
  },
];

const initialForm = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!isRequired(form.name)) errs.name = 'Name is required';
    if (!isRequired(form.email)) errs.email = 'Email is required';
    else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address';
    if (form.phone && !isValidPhone(form.phone)) errs.phone = 'Enter a valid phone number';
    if (!isRequired(form.subject)) errs.subject = 'Subject is required';
    if (!isRequired(form.message)) errs.message = 'Message is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStatus('loading');
    try {
      const res = await contactService.submitEnquiry(form);
      setResult(res);
      setStatus('success');
      setForm(initialForm);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="flex justify-center">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact Us' }]} />
          </div>
          <ScrollReveal>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-6 mb-3">Get in Touch</h1>
            <p className="text-white/70 max-w-xl mx-auto">
              Have a question about our products, need styling advice, or want to place a bulk order? We'd love to hear from you.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="max-w-7xl mx-auto px-4 mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {contactCards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 100} className="bg-white border border-neutral-100 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
                <card.icon size={22} />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-2">{card.title}</h3>
              {card.lines.map((line, idx) => (
                <p key={idx} className="text-sm text-neutral-500">{line}</p>
              ))}
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Form + Map */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-10 md:gap-16">
          {/* Form */}
          <div>
            <ScrollReveal>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Send Us a Message</h2>
              <p className="text-neutral-500 text-sm mb-8">
                Fill in the form below and our team will respond within one business day.
              </p>
            </ScrollReveal>

            {status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Enquiry Submitted</h3>
                <p className="text-green-700 text-sm mb-1">{result?.message}</p>
                {result?.referenceId && (
                  <p className="text-green-600 text-xs">Reference: {result.referenceId}</p>
                )}
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-sm text-primary-600 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Input
                    label="Full Name *"
                    placeholder="Your name"
                    value={form.name}
                    onChange={set('name')}
                    error={errors.name}
                  />
                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                    error={errors.email}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Input
                    label="Phone Number"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={set('phone')}
                    error={errors.phone}
                  />
                  <Input
                    label="Subject *"
                    placeholder="e.g. Bulk order enquiry"
                    value={form.subject}
                    onChange={set('subject')}
                    error={errors.subject}
                  />
                </div>
                <Textarea
                  label="Message *"
                  placeholder="Tell us how we can help..."
                  rows={5}
                  value={form.message}
                  onChange={set('message')}
                  error={errors.message}
                />

                {status === 'error' && (
                  <p className="text-sm text-error">Something went wrong. Please try again.</p>
                )}

                <Button type="submit" size="lg" isLoading={status === 'loading'}>
                  Submit Enquiry
                </Button>
              </form>
            )}
          </div>

          {/* Map placeholder + Hours */}
          <div className="space-y-6">
            <div className="bg-neutral-100 rounded-2xl h-72 md:h-80 flex items-center justify-center">
              <div className="text-center text-neutral-400">
                <MapPin size={32} className="mx-auto mb-2" />
                <p className="text-sm font-medium">Map will appear here</p>
                <p className="text-xs">Google Maps integration pending business location confirmation</p>
              </div>
            </div>
            <div className="bg-neutral-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock size={20} className="text-primary-600" />
                <h3 className="font-semibold text-neutral-800">Business Hours</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Monday — Saturday</span>
                  <span className="text-neutral-800 font-medium">10:00 AM — 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Sunday</span>
                  <span className="text-neutral-800 font-medium">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
