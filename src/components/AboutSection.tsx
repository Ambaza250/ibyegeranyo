import Link from 'next/link';

export function AboutSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              About <span className="text-gold">Aime Christian</span>
            </h2>
            <p className="text-text-secondary mb-6">
              Aime Christian is an independent documentary maker dedicated to telling 
              compelling stories from Rwanda and around the world. Our documentaries 
              cover a wide range of topics including:
            </p>
            <ul className="grid grid-cols-2 gap-3 mb-8">
              {[
                'History',
                'Economics',
                'Politics',
                'Social Welfare',
                'Lifestyle',
                'Diplomacy',
                'Investigations',
                'Current Affairs',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/about" className="btn-primary">
              Learn More
            </Link>
          </div>

          {/* Image/Visual */}
          <div className="relative">
            <div className="aspect-video rounded-lg glass-light p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-primary">A</span>
                </div>
                <h3 className="text-white font-semibold text-xl mb-2">
                  Independent Documentary Maker
                </h3>
                <p className="text-text-muted text-sm">
                  Premium, ad-free content
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}