import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, BarChart3, Layers, Target } from 'lucide-react';

export const runtime = 'nodejs';

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect('/reports');
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'var(--font-sans)', color: '#1a1a1a' }}>

      {/* Navigation */}
      <nav style={{
        maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image src="/brand/logopilot.png" alt="PILOT" width={40} height={40} style={{ borderRadius: '8px' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>PILOT</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#666', fontWeight: 500, textDecoration: 'none' }}>Login</Link>
          <Link href="/signup"
            style={{
              background: '#000', color: '#fff', padding: '0.6rem 1.2rem',
              borderRadius: '50px', fontWeight: 600, textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            Create Account
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{
        maxWidth: '1000px', margin: '6rem auto 4rem', textAlign: 'center', padding: '0 2rem'
      }}>
        <div style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: '50px', background: '#f5f5f7',
          color: '#666', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem'
        }}>
          v2.6 Now Available • Real-time Profit Tracking
        </div>
        <h1 style={{
          fontSize: '4.5rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.5rem',
          background: 'linear-gradient(180deg, #000 0%, #444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          See the <span style={{ color: '#007AFF' }}>real profit</span><br />of your business.
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Finance, Ads, and Traffic — unified. Stop guessing your margins. Detect subsidized channels and optimize for net profit, not just ROAS.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/signup"
            style={{
              background: '#007AFF', color: '#fff', padding: '1rem 2rem',
              borderRadius: '50px', fontWeight: 600, textDecoration: 'none',
              fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(0,122,255,0.3)'
            }}
          >
            Start Free Trial
          </Link>
          <Link href="#features"
            style={{
              background: '#fff', color: '#1a1a1a', padding: '1rem 2rem', border: '1px solid #e1e1e1',
              borderRadius: '50px', fontWeight: 600, textDecoration: 'none',
              fontSize: '1.1rem'
            }}
          >
            See How It Works
          </Link>
        </div>
      </header>

      {/* Hero Image / Dashboard Mockup */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto 8rem', padding: '0 2rem', position: 'relative'
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #f5f5f7 0%, #fff 100%)', borderRadius: '24px',
          padding: '2rem', border: '1px solid #e1e1e1', boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
        }}>
          {/* Abstract Representation of the Dashboard - or utilize an existing component if we had one ready for public view */}
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#ccc' }}>
            <BarChart3 size={64} style={{ marginBottom: '1rem', opacity: 0.2 }} />
            <p style={{ fontWeight: 500 }}>Premium Analytics Boardroom</p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" style={{ maxWidth: '1200px', margin: '0 auto 8rem', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <FeatureCard
            icon={<Target size={24} color="#007AFF" />}
            title="Truthful Reporting"
            desc="We don't use estimates. We sync every order, refund, and ad click to give you specific, penny-perfect profit reports."
          />
          <FeatureCard
            icon={<Layers size={24} color="#007AFF" />}
            title="Unified Data Stack"
            desc="Connect Shopify, Meta Ads, and GA4 in seconds. We normalize the data so you can compare Apples to Apples."
          />
          <FeatureCard
            icon={<BarChart3 size={24} color="#007AFF" />}
            title="Boardroom Ready"
            desc="Generate PDF-ready executive summaries. Impress investors and partners with clarity and confidence."
          />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #eee', padding: '4rem 2rem', textAlign: 'center', color: '#888' }}>
        <p>&copy; 2026 PILOT Data. All rights reserved.</p>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div style={{ padding: '2rem', background: '#f9f9f9', borderRadius: '16px' }}>
      <div style={{ marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#666', lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}
