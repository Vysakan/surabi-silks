import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Search, ArrowRight, Calendar, User } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Pagination from '@/components/ui/Pagination';
import SmartImage from '@/components/ui/SmartImage';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { blogPosts, blogCategories } from '@/data/blogPosts';

const POSTS_PER_PAGE = 4;

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function BlogCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <div className="rounded-2xl overflow-hidden border border-neutral-100 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-[16/10] overflow-hidden">
          <SmartImage
            src={post.image}
            alt={post.title}
            containerClassName="w-full h-full"
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-5">
          <span className="text-xs font-medium text-primary-600 uppercase tracking-wider">
            {post.category}
          </span>
          <h3 className="text-lg font-semibold text-neutral-800 mt-1.5 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-neutral-500 line-clamp-2 mb-4">{post.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(post.date)}</span>
            </div>
            <span className="text-primary-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Read <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeaturedCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-neutral-100 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
          <SmartImage
            src={post.image}
            alt={post.title}
            containerClassName="w-full h-full"
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <span className="text-xs font-medium text-primary-600 uppercase tracking-wider">
            Featured — {post.category}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-800 mt-2 mb-3 group-hover:text-primary-600 transition-colors">
            {post.title}
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-5">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(post.date)}</span>
          </div>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 group-hover:gap-3 transition-all">
            Read Full Article <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const featured = blogPosts.find((p) => p.featured);

  const filtered = useMemo(() => {
    let list = blogPosts.filter((p) => !p.featured);
    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paged = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-18 text-center">
          <div className="flex justify-center">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />
          </div>
          <ScrollReveal>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-6 mb-3">The Surabi Journal</h1>
            <p className="text-white/70 max-w-xl mx-auto">
              Stories, styling guides, and textile wisdom from our world of handloom.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
        {/* Featured */}
        {featured && activeCategory === 'All' && !searchQuery && page === 1 && (
          <div className="mb-12">
            <FeaturedCard post={featured} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {blogCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-200 rounded-full placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>

        {/* Grid */}
        {paged.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
            {paged.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-neutral-400 text-lg">No articles found.</p>
            <button
              onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
              className="mt-3 text-sm text-primary-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
