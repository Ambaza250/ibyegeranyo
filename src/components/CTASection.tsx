import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="glass rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Watching?
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto mb-8">
            Join now and get unlimited access to premium documentaries from Rwanda and around the world.
            Ad-free, high-quality content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              Subscribe Now
            </Link>
            <Link href="/documentaries" className="btn-secondary text-lg px-8 py-3">
              Browse Documentaries
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}