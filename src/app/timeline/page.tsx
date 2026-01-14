"use client";

import React from 'react';
import styles from './timeline.module.css';
import { MOCK_TIMELINE } from '@/services/mockData';
import { Flag, GitCommit, Zap } from 'lucide-react';

export default function TimelinePage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Historique Business</h1>
                <p className={styles.subtitle}>La chronologie de vos décisions et leurs impacts.</p>
            </div>

            <div className={styles.timeline}>
                {MOCK_TIMELINE.map((event) => (
                    <div key={event.id} className={styles.eventCard}>
                        <div className={`${styles.dot} ${event.type === 'milestone' ? styles.dotMilestone :
                                event.type === 'decision' ? styles.dotDecision : styles.dotExternal
                            }`} />

                        <div className={styles.date}>{event.date}</div>

                        <h3 className={styles.eventTitle} style={{
                            color: event.type === 'milestone' ? 'var(--accent-gold)' : 'var(--text-primary)'
                        }}>
                            {event.type === 'milestone' && <Flag size={14} style={{ display: 'inline', marginRight: '8px' }} />}
                            {event.type === 'decision' && <GitCommit size={14} style={{ display: 'inline', marginRight: '8px' }} />}
                            {event.title}
                        </h3>

                        <p className={styles.eventDesc}>{event.description}</p>

                        {event.impact && (
                            <div className={styles.impactBadge}>
                                <Zap size={12} className="text-gold" />
                                Impact : {event.impact}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
