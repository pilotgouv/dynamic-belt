import Link from "next/link";
import { ArrowRight, Shield, TrendingUp, Zap, BarChart3, Lock, CheckCircle2, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-montserrat text-slate-900 selection:bg-blue-100 selection:text-blue-900">

      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">PILOT</span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-blue-600 transition-colors">Fonctionnalités</a>
            <a href="#security" className="hover:text-blue-600 transition-colors">Sécurité</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Tarifs</a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              Connexion
            </Link>
            <Link href="/signup" className="group px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-full transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
              Créer un compte
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-40 pb-20 md:pt-52 md:pb-32 px-6 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-3xl opacity-60 -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-bold uppercase tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Nouveau : Moteur Financier V2
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Voyez le <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">profit réel</span> <br />
            de votre business.
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Finance, Ads et Trafic unifiés. Décidez avec des chiffres réels, consolidés en temps réel, pas des estimations.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/signup" className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
              Commencer l'essai gratuit
              <ChevronRight size={18} />
            </Link>
            <button className="w-full md:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold rounded-full border border-slate-200 shadow-sm transition-all hover:border-slate-300">
              Voir comment ça marche
            </button>
          </div>
        </div>

        {/* Dashboard Preview (Stylized) */}
        <div className="mt-20 max-w-6xl mx-auto relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-2 overflow-hidden">
            <div className="bg-slate-50 rounded-xl aspect-[16/9] flex items-center justify-center border border-slate-100 relative overflow-hidden group">
              {/* Mock UI Elements */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white opacity-50" />
              <div className="relative z-10 text-center space-y-4 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center text-blue-600">
                  <BarChart3 size={32} />
                </div>
                <p className="font-medium text-slate-400">Dashboard Preview</p>
              </div>
            </div>
          </div>
          {/* Glow Effect behind dashboard */}
          <div className="absolute -inset-4 bg-blue-500/20 blur-3xl -z-10 rounded-[3rem]" />
        </div>
      </section>

      {/* --- WHY PILOT (Cards) --- */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Pourquoi les leaders choisissent PILOT</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Une suite d'outils conçue pour la clarté et la performance.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Profit Réel", desc: "Calcul automatique du Net Profit après COGS, Ads, Taxes et Frais.", icon: <TrendingUp className="text-blue-600" /> },
              { title: "Données Unifiées", desc: "Connecteurs officiels (Meta, Google, Shopify, Stripe) en un seul lieu.", icon: <Zap className="text-cyan-500" /> },
              { title: "Prêt pour le Board", desc: "Rapports financiers élégants et auditables pour vos investisseurs.", icon: <Shield className="text-indigo-500" /> },
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-[#F8FAFC] border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all hover:translate-y-[-4px]">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURE GRID --- */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-slate-900 leading-tight">
                Tout ce dont vous avez besoin pour <span className="text-blue-600">scaler sereinement</span>.
              </h2>
              <div className="space-y-6">
                {[
                  "Tableaux de bord financiers temps réel",
                  "Analyse de rentabilité produit (SKU level)",
                  "Tracking publicitaire (ROAS, MER, CAC)",
                  "Gestion de trésorerie prévisionnelle",
                  "Reporting automatisé par email",
                  "Alertes de performance"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <CheckCircle2 size={14} strokeWidth={3} />
                    </div>
                    <span className="text-slate-700 font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 mt-8">
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 h-64 flex flex-col justify-end">
                  <div className="text-4xl font-bold text-slate-900 mb-1">24%</div>
                  <div className="text-sm font-medium text-slate-400">Croissance Mensuelle</div>
                </div>
                <div className="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-500/20 h-48 flex flex-col justify-center text-white">
                  <TrendingUp size={32} className="mb-4" />
                  <div className="font-bold text-lg">Suivi ROAS</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-48 flex flex-col justify-center">
                  <Zap size={32} className="text-yellow-500 mb-4" />
                  <div className="font-bold text-slate-900 text-lg">Alertes IA</div>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl shadow-xl h-64 flex flex-col justify-end text-white">
                  <div className="text-4xl font-bold mb-1">1.2s</div>
                  <div className="text-sm font-medium text-slate-400">Temps de synchronisation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECURITY --- */}
      <section id="security" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center text-blue-600 mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Sécurité de niveau bancaire</h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Vos données sont chiffrées (AES-256) et stockées sur des infrastructures certifiées.
            PILOT utilise uniquement des accès en lecture seule via les APIs officielles.
          </p>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-16">Investissez dans votre clarté</h2>
          <div className="grid md:grid-cols-3 gap-8 items-center">

            {/* STARTER */}
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="font-bold text-slate-900 mb-2">Starter</h3>
              <div className="text-4xl font-bold text-slate-900 mb-6">0€<span className="text-base font-normal text-slate-400">/mois</span></div>
              <p className="text-sm text-slate-500 mb-8 font-medium">Pour découvrir la puissance de PILOT.</p>
              <ul className="space-y-4 mb-8 text-sm font-medium text-slate-600">
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-blue-500" /> 1 Connexion</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Dashboard Essentiel</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-blue-500" /> 7 jours d'historique</li>
              </ul>
              <Link href="/signup" className="block w-full py-3 rounded-xl bg-slate-100 text-slate-900 font-bold text-center hover:bg-slate-200 transition-colors">
                Commencer Gratuitement
              </Link>
            </div>

            {/* PRO (Highlighted) */}
            <div className="p-10 bg-slate-900 rounded-3xl shadow-2xl relative transform md:scale-105 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                Le plus populaire
              </div>
              <h3 className="font-bold text-white mb-2">Pro</h3>
              <div className="text-5xl font-bold text-white mb-6">49€<span className="text-base font-normal text-slate-400">/mois</span></div>
              <p className="text-sm text-slate-300 mb-8 font-medium">Pour les e-commerçants en croissance.</p>
              <ul className="space-y-4 mb-8 text-sm font-medium text-slate-300">
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-cyan-400" /> Connexions Illimitées</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-cyan-400" /> Analyse Rentabilité</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-cyan-400" /> 1 An d'historique</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-cyan-400" /> Support Prioritaire</li>
              </ul>
              <Link href="/signup" className="block w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-center hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                Essayer Pro (14 jours offerts)
              </Link>
            </div>

            {/* BUSINESS */}
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="font-bold text-slate-900 mb-2">Business</h3>
              <div className="text-4xl font-bold text-slate-900 mb-6">199€<span className="text-base font-normal text-slate-400">/mois</span></div>
              <p className="text-sm text-slate-500 mb-8 font-medium">Pour les agences et grands comptes.</p>
              <ul className="space-y-4 mb-8 text-sm font-medium text-slate-600">
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Multi-Organisations</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-blue-500" /> API Access</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-blue-500" /> User Roles</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Custom Onboarding</li>
              </ul>
              <Link href="/contact" className="block w-full py-3 rounded-xl bg-slate-100 text-slate-900 font-bold text-center hover:bg-slate-200 transition-colors">
                Contacter les Ventes
              </Link>
            </div>

          </div>
          <p className="text-center text-slate-400 text-sm mt-8">Aucune carte bancaire requise pour l'inscription.</p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="font-bold text-slate-900">PILOT © 2026</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900">Mentions Légales</a>
            <a href="#" className="hover:text-slate-900">Confidentialité</a>
            <a href="#" className="hover:text-slate-900">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
