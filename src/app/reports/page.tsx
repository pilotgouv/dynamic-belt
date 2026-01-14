
import styles from './reports.module.css';
import ReportBuilder from './builder/ReportBuilder';

export default function ReportsPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Rapports & Analyses</h1>
                <p className={styles.subtitle}>Créez des rapports sur mesure pour vos investisseurs et votre équipe.</p>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>📈 Performance Hebdo</h3>
                    <p>KPIs financiers et tendances sur 7 jours.</p>
                    <button className={styles.button}>Générer</button>
                </div>
                <div className={styles.card}>
                    <h3>🎯 Efficacité Ads</h3>
                    <p>ROAS, CPA et Arbitrage par canal.</p>
                    <button className={styles.button}>Générer</button>
                </div>
                <div className={styles.card}>
                    <h3>🚦 Qualité Trafic</h3>
                    <p>Analyse du funnel et qualité des sessions.</p>
                    <button className={styles.button}>Générer</button>
                </div>
                <div className={styles.card}>
                    <h3>⚖️ Arbitrage Canaux</h3>
                    <p>Détection des canaux subventionnés.</p>
                    <button className={styles.button}>Générer</button>
                </div>
            </div>

            <div className={styles.createSection}>
                <h2>Rapport Personnalisé</h2>
                <ReportBuilder />
            </div>
        </div>
    );
}
