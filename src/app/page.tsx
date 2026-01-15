import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, BarChart3, Layers, Target } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export default async function Home() {
  const session = await auth();
  if (session && session.user) {
    if (session.user.email === 'vicariofpro@gmail.com') {
      try {
        await prisma.user.update({
          where: { email: 'vicariofpro@gmail.com' },
          data: { plan: 'premium' }
        });
        // Also upgrade their org if found
        // We can't easily guess org ID here without query, so just user is good start.
      } catch (e) {
        console.error("Auto-upgrade failed", e);
      }
    }
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
          v2.6 Disponible • Suivi des Profits en Temps Réel
        </div>
        <h1 style={{
          fontSize: '4.5rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.5rem',
          background: 'linear-gradient(180deg, #000 0%, #444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Voyez le <span style={{ color: '#007AFF' }}>profit réel</span><br />de votre business.
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Finance, Ads, et Trafic — unifiés. Arrêtez de deviner vos marges. Détectez les canaux subventionnés et optimisez pour le profit net, pas juste le ROAS.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/signup"
            style={{
              background: '#007AFF', color: '#fff', padding: '1rem 2rem',
              borderRadius: '50px', fontWeight: 600, textDecoration: 'none',
              fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(0,122,255,0.3)'
            }}
          >
            Commencer l'Essai Gratuit
          </Link>
          <Link href="#features"
            style={{
              background: '#fff', color: '#1a1a1a', padding: '1rem 2rem', border: '1px solid #e1e1e1',
              borderRadius: '50px', fontWeight: 600, textDecoration: 'none',
              fontSize: '1.1rem'
            }}
          >
            Voir Comment Ça Marche
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
            <p style={{ fontWeight: 500 }}>Boardroom Analytique Premium</p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" style={{ maxWidth: '1200px', margin: '0 auto 8rem', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <FeatureCard
            icon={<Target size={24} color="#007AFF" />}
            title="Reporting Véritable"
            desc="Pas d'estimations approximatives. Nous synchronisons chaque commande, remboursement et clic publicitaire pour vous donner un rapport de profit précis au centime près."
          />
          <FeatureCard
            icon={<Layers size={24} color="#007AFF" />}
            title="Stack de Données Unifiée"
            desc="Connectez Shopify, Meta Ads et GA4 en quelques secondes. Nous normalisons les données pour que vous puissiez comparer ce qui est comparable."
          />
          <FeatureCard
            icon={<BarChart3 size={24} color="#007AFF" />}
            title="Prêt pour le Board"
            desc="Générez des résumés exécutifs PDF. Impressionnez vos investisseurs et partenaires avec clarté et confiance."
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
