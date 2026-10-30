import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-3">
              Surabi <span className="text-primary-400">Silks</span>
            </h3>
            <p className="text-sm leading-relaxed">
              Curating the finest handloom textiles from across India. Authentic silks, cottons, and fabrics delivered to your doorstep.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop/sarees" className="hover:text-white transition-colors">Sarees</Link></li>
              <li><Link to="/shop/fabrics" className="hover:text-white transition-colors">Fabrics</Link></li>
              <li><Link to="/shop/dress-materials" className="hover:text-white transition-colors">Dress Materials</Link></li>
              <li><Link to="/shop/accessories" className="hover:text-white transition-colors">Accessories</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white transition-colors cursor-pointer">Shipping & Delivery</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Returns & Exchange</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Size Guide</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">FAQ</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Contact Us</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>support@surabsilks.com</li>
              <li>+91 98765 43210</li>
              <li>Mon - Sat, 10am - 7pm IST</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>&copy; {new Date().getFullYear()} Surabi Silks. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="cursor-pointer hover:text-white">Privacy Policy</span>
            <span className="cursor-pointer hover:text-white">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
