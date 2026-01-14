import KPICard from '@/components/KPICard';
import styles from './page.module.css';
import { DollarSign, TrendingUp, ShoppingBag, Activity, Sparkles, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.welcome}>Vue Générale</h1>
          <p className={styles.date}>Mardi 14 Janvier 2026</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Action buttons could go here */}
        </div>
      </header>

      {/* AI Summary Section - The "Cerveau Analytique" */}
      <section className={styles.aiSection}>
        <div className={styles.aiHeader}>
          <Sparkles size={18} />
          Analyse Intelligence Artificielle
        </div>
        <p className={styles.aiContent}>
          Votre marge brute globale est saine (36%), mais <span className="text-destructive">Meta Ads</span> dilue votre profitabilité ce mois-ci.
          Alors que Google Ads génère un ROAS de 4.2 (Contribution: +2,400€), Meta Ads tourne à perte avec un ROAS de 1.4 (Contribution: -450€).
          Conseil : Réallouez 20% du budget Meta vers Google pour récupérer ~800€ de profit net immediat.
        </p>
      </section>

      {/* KPI Grid */}
      <div>
        <h2 className={styles.sectionTitle}>Performance Financière</h2>
        <div className={styles.grid}>
          <KPICard
            title="Chiffre d'Affaires"
            value="124,500 €"
            trendValue={12.5}
            icon={DollarSign}
          />
          <KPICard
            title="Dépenses Publicitaires"
            value="32,150 €"
            trendValue={5.2}
            icon={Activity}
          />
          <KPICard
            title="Profit Estimé"
            value="45,200 €"
            trendValue={8.4}
            icon={TrendingUp}
          />
          <KPICard
            title="Marge Globale"
            value="36.3%"
            trendValue={-1.2}
            icon={ShoppingBag}
          />
          <KPICard
            title="Trafic (30j)"
            value="45,200"
            trendValue={15.3}
            icon={Users}
          />
        </div>
      </div>

      {/* Placeholder for Graphs/Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', minHeight: '400px' }}>
        <div className="glass" style={{ borderRadius: '12px', padding: '1.5rem' }}>
          <h3 className={styles.sectionTitle}>Évolution du Chiffre d&apos;Affaires</h3>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            [Graphique d&apos;évolution - 30 derniers jours]
          </div>
        </div>
        <div className="glass" style={{ borderRadius: '12px', padding: '1.5rem' }}>
          <h3 className={styles.sectionTitle}>Répartition par Canal</h3>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            [Pie Chart]
          </div>
        </div>
      </div>
    </div>
  );
}
