import { useParams, Link } from 'react-router';
import { ArrowLeft, Calendar, User, ArrowRight } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import SmartImage from '@/components/ui/SmartImage';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { blogPosts } from '@/data/blogPosts';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function RelatedCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <div className="rounded-xl overflow-hidden border border-neutral-100 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-[16/10] overflow-hidden">
          <SmartImage
            src={post.image}
            alt={post.title}
            containerClassName="w-full h-full"
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-primary-600 uppercase tracking-wider">{post.category}</span>
          <h4 className="text-sm font-semibold text-neutral-800 mt-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {post.title}
          </h4>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 font-medium group-hover:gap-2 transition-all">
            Read <ArrowRight size={10} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogArticlePage() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-neutral-800 mb-3">Article Not Found</h1>
        <p className="text-neutral-500 mb-6">The article you're looking for doesn't exist.</p>
        <Link to="/blog" className="text-primary-600 hover:underline text-sm font-medium">
          Back to Blog
        </Link>
      </div>
    );
  }

  const related = blogPosts
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);
  const backfill = related.length < 3
    ? blogPosts.filter((p) => p.id !== post.id && !related.includes(p)).slice(0, 3 - related.length)
    : [];
  const relatedPosts = [...related, ...backfill];

  const contentHtml = post.content
    .split('\n')
    .map((line) => {
      if (line.startsWith('## ')) return `<h2 class="text-xl font-semibold text-neutral-800 mt-8 mb-3">${line.slice(3)}</h2>`;
      if (line.startsWith('**') && line.endsWith('**')) return `<p class="font-semibold text-neutral-700 mt-4 mb-1">${line.slice(2, -2)}</p>`;
      if (line.startsWith('- ')) return `<li class="text-neutral-600 ml-4 list-disc">${line.slice(2)}</li>`;
      if (line.startsWith('| ')) return '';
      if (line.startsWith('|--')) return '';
      if (line.trim() === '') return '<br />';
      return `<p class="text-neutral-600 leading-relaxed mb-3">${line}</p>`;
    })
    .join('\n');

  return (
    <div>
      {/* Hero image */}
      <div className="relative h-48 sm:h-64 md:h-96 bg-neutral-900 overflow-hidden">
        <SmartImage
          src={post.image}
          alt={post.title}
          loading="eager"
          containerClassName="w-full h-full"
          className="w-full h-full opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 sm:-mt-16 md:-mt-20 relative z-10">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]} />

        <article className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 sm:p-6 md:p-10 mt-4">
          <span className="text-xs font-medium text-primary-600 uppercase tracking-wider">{post.category}</span>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mt-2 mb-4 leading-tight">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-neutral-400 mb-8 pb-6 border-b border-neutral-100">
            <span className="flex items-center gap-1.5"><User size={14} /> {post.author}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(post.date)}</span>
          </div>

          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>

        {/* Back link */}
        <div className="mt-8 mb-4">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
            <ArrowLeft size={16} /> Back to Blog
          </Link>
        </div>
      </div>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-14 md:py-16">
          <ScrollReveal as="h2" className="text-xl md:text-2xl font-semibold text-neutral-900 mb-6">Related Articles</ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((p) => (
              <RelatedCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
