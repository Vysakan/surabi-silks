import { Link } from 'react-router';
import { Mail, Phone } from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategoryTree';

// Shop details shown in the footer: change these to your real ones.
const CONTACT_EMAIL = 'support@surabsilks.com';
const CONTACT_PHONE = '+91 98765 43210';
const FOOTER_CATEGORY_LIMIT = 5;

function Column({ title, children }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-black mb-4">{title}</h4>
      <ul className="space-y-2.5 text-sm text-neutral-600">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="hover:text-black hover:underline underline-offset-4 transition-colors">{children}</Link>
    </li>
  );
}

export default function Footer() {
  const { categories } = useCategoryTree();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-surface)] border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-14 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-x-6 gap-y-10">
          <div className="col-span-2 lg:col-span-1 max-w-sm">
            <Link to="/" className="inline-block mb-4" aria-label="Surabhi Silks home">
              <img src="/logo.jpg" alt="Surabhi Silks" className="h-12 w-auto" />
            </Link>
            <p className="text-sm text-neutral-600 leading-relaxed">
              The finest handloom textiles from across India: authentic silks, cottons and fabrics, delivered to your doorstep.
            </p>
          </div>

          <Column title="Shop">
            {categories.slice(0, FOOTER_CATEGORY_LIMIT).map((cat) => (
              <FooterLink key={cat.id} to={`/shop/${cat.slug}`}>{cat.name}</FooterLink>
            ))}
            <FooterLink to="/shop?sort=newest">New arrivals</FooterLink>
            <FooterLink to="/shop">Shop all</FooterLink>
          </Column>

          <Column title="Help">
            <FooterLink to="/contact-us">Contact us</FooterLink>
            <FooterLink to="/about-us">About us</FooterLink>
            <FooterLink to="/blog">Blog</FooterLink>
            <FooterLink to="/account/orders">Track your order</FooterLink>
            <FooterLink to="/wishlist">Wishlist</FooterLink>
          </Column>

          <Column title="Get in touch">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 hover:text-black">
                <Mail size={15} strokeWidth={1.6} /> {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <a href={`tel:${CONTACT_PHONE.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 hover:text-black">
                <Phone size={15} strokeWidth={1.6} /> {CONTACT_PHONE}
              </a>
            </li>
            <li className="text-neutral-500">Mon–Sat, 10am–7pm IST</li>
          </Column>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-300/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-neutral-500">
          <p>&copy; {year} Surabhi Silks. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/login" className="hover:text-black">Sign in</Link>
            <Link to="/register" className="hover:text-black">Create account</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
