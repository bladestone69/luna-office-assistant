import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SA AI Office — Pre-Register Now · AI Tools for South African Businesses",
  description: "Five AI tools for South African businesses: answer calls, manage WhatsApp, handle HR, chase debt, and coordinate teams. Pre-register now — early access pricing.",
};

export default function LandingPage() {
  return (
    <>
      <div className="bg-grid"></div>
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      <div className="orb orb3"></div>
      <div className="stars" id="stars"></div>

      {/* NAV */}
      <nav className="nav" id="navbar">
        <a href="#" className="nav-brand">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#navGrad)"/>
            <path d="M16 6L8 12V20L16 26L24 20V12L16 6Z" fill="white" fillOpacity="0.9"/>
            <circle cx="16" cy="16" r="4" fill="url(#navGrad2)"/>
            <defs>
              <linearGradient id="navGrad" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#4A90D9"/>
                <stop offset="100%" stopColor="#9B59B6"/>
              </linearGradient>
              <linearGradient id="navGrad2" x1="12" y1="12" x2="20" y2="20">
                <stop offset="0%" stopColor="#60A5FA"/>
                <stop offset="100%" stopColor="#9B59B6"/>
              </linearGradient>
            </defs>
          </svg>
          SA AI Office
        </a>
        <div className="nav-links">
          <a href="#products">Products</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <a href="https://www.auraoffice.xyz/login" className="btn-nav" style={{ marginRight: 6 }}>Login</a>
          <a href="#register" className="btn-nav">Pre-Register →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          Early Access — Limited Spots Available
        </div>
        <div className="hero-eyebrow">Your Office. Run by AI.</div>
        <h1 className="hero-title">
          <span className="line1">Never Miss</span>
          <span className="line2">Another Call.</span>
          <span className="line3">Never Chase a Payment Again.</span>
        </h1>
        <p className="hero-subtitle">
          SA AI Office puts five AI tools in your business — answering calls, managing WhatsApp,
          handling HR compliance, chasing debt, and coordinating field teams.
          From R199/month. Built for South African businesses.
        </p>
        <p className="hero-tagline">
          Powered by WhatsApp. Available in English. POPIA compliant.
        </p>
        <div className="hero-cta-group">
          <a href="#register" className="btn-primary">Pre-Register Now — It&apos;s Free →</a>
          <a href="#products" className="btn-secondary">See All Products</a>
        </div>
        <div className="hero-proof">
          <div className="proof-item"><span className="check">✓</span> No credit card required</div>
          <div className="proof-item"><span className="check">✓</span> Early access pricing</div>
          <div className="proof-item"><span className="check">✓</span> Cancel anytime</div>
          <div className="proof-item"><span className="check">✓</span> POPIA compliant</div>
        </div>
      </section>

      {/* PROOF BAR */}
      <div className="proof-bar">
        <div className="proof-stat">
          <div className="proof-stat-num">2.4M</div>
          <div className="proof-stat-label">SA SMEs</div>
        </div>
        <div className="proof-bar-sep"></div>
        <div className="proof-stat">
          <div className="proof-stat-num">R180B</div>
          <div className="proof-stat-label">Lost to missed calls annually</div>
        </div>
        <div className="proof-bar-sep"></div>
        <div className="proof-stat">
          <div className="proof-stat-num">93%</div>
          <div className="proof-stat-label">SA users on WhatsApp</div>
        </div>
        <div className="proof-bar-sep"></div>
        <div className="proof-stat">
          <div className="proof-stat-num">R199</div>
          <div className="proof-stat-label">Per month — less than a PA&apos;s hour</div>
        </div>
      </div>

      {/* PROBLEM */}
      <section className="problem-section">
        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-icon">📞</div>
            <h3>You lose calls every day.</h3>
            <p>Your receptionist is on another call. A client hangs up. You call back — no answer. That was a R5,000 booking. It happens three times a week. That&apos;s R60,000 in lost revenue every year.</p>
          </div>
          <div className="problem-card">
            <div className="problem-icon">💸</div>
            <h3>Your debtors are killing your cash flow.</h3>
            <p>You invoiced R180,000. Your client hasn&apos;t paid in 60 days. You hate chasing money — it feels confrontational. So you wait. And wait. Meanwhile your rent is due.</p>
          </div>
          <div className="problem-card">
            <div className="problem-icon">😓</div>
            <h3>Your team is drowning in admin.</h3>
            <p>Your staff are brilliant at their jobs. But they spend 3 hours a day on WhatsApp replies, scheduling, and chasing paperwork. That&apos;s not why you hired them.</p>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="section" id="products">
        <div className="section-eyebrow">The Products</div>
        <h2 className="section-title">Five AI Tools. One Platform.</h2>
        <div className="section-subtitle">
          Each one solves a real, daily pain point. Use one or use them all.
          Every one of them works on WhatsApp — the app your clients already live on.
        </div>
        <div className="products-list">
          {/* Luna Office */}
          <div className="product-row">
            <div className="product-info">
              <div className="product-number" style={{ color: "var(--blue)" }}>Product 01</div>
              <div className="product-logo" style={{ background: "linear-gradient(135deg,#4A90D9,#9B59B6)" }}>
                <svg viewBox="0 0 36 36" fill="none"><path d="M18 3C10.268 3 4 9.268 4 17C4 24.732 10.268 31 18 31C25.732 31 32 24.732 32 17C32 9.268 25.732 3 18 3Z" fill="white" fillOpacity="0.2"/><path d="M18 5C11.373 5 6 10.373 6 17C6 23.627 11.373 29 18 29C24.627 29 30 23.627 30 17C30 10.373 24.627 5 18 5Z" stroke="white" strokeWidth="1.5" fill="none"/><path d="M12 17.5C12 14.46 14.46 12 17.5 12H19C22.314 12 25 14.686 25 18V19C25 22.314 22.314 25 19 25H17.5C14.46 25 12 22.54 12 19.5V17.5Z" fill="white" fillOpacity="0.6"/><circle cx="14" cy="18" r="1.5" fill="#070E1A"/><circle cx="22" cy="18" r="1.5" fill="#070E1A"/><path d="M16 21C16 21 17.5 22.5 20 21" stroke="#070E1A" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </div>
              <div className="product-name">Luna Office</div>
              <p className="product-tagline">An AI receptionist that answers your phone, books appointments, and routes calls — 24/7.</p>
              <ul className="product-features">
                <li>AI voice call answering — never puts a caller on hold</li>
                <li>Books appointments and sends reminders automatically</li>
                <li>Works after hours, weekends, and during load shedding</li>
                <li>Routes urgent calls straight to your mobile</li>
                <li>WhatsApp integration for client convenience</li>
              </ul>
              <div className="product-pricing">
                <div className="price-chip"><div className="pc-amount">R499</div><div className="pc-label">/month</div><div className="pc-desc">Starter · 100 calls</div></div>
                <div className="price-chip"><div className="pc-amount">R799</div><div className="pc-label">/month</div><div className="pc-desc">Professional · Unlimited calls</div></div>
              </div>
              <a href="#register" className="product-cta">Pre-Register Free →</a>
            </div>
            <div className="product-visual" style={{ background: "linear-gradient(135deg,rgba(74,144,217,0.1),rgba(155,89,182,0.05))" }}>
              <div className="product-visual-icon" style={{ background: "linear-gradient(135deg,rgba(74,144,217,0.15),rgba(155,89,182,0.1))", border: "1px solid rgba(74,144,217,0.2)" }}>
                <svg viewBox="0 0 64 64" fill="none"><path d="M32 8C19.85 8 10 17.85 10 30C10 42.15 19.85 52 32 52C44.15 52 54 42.15 54 30C54 17.85 44.15 8 32 8Z" fill="#4A90D9" fillOpacity="0.2"/><path d="M32 12C22.06 12 14 20.06 14 30C14 39.94 22.06 48 32 48C41.94 48 50 39.94 50 30C50 20.06 41.94 12 32 12Z" stroke="#4A90D9" strokeWidth="2" fill="none"/><path d="M23 30C23 25.582 26.582 22 31 22H33C37.418 22 41 25.582 41 30V32C41 36.418 37.418 40 33 40H31C26.582 40 23 36.418 23 32V30Z" fill="#4A90D9" fillOpacity="0.6"/><circle cx="27" cy="30" r="2.5" fill="#070E1A"/><circle cx="37" cy="30" r="2.5" fill="#070E1A"/><path d="M29 36C29 36 31 38.5 35 36" stroke="#070E1A" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div className="product-visual-label">AI Receptionist<br/><span style={{ fontSize: 11, color: "var(--gray-700)" }}>Never misses a call</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how-it-works" style={{ paddingTop: 40 }}>
        <div className="section-eyebrow">Getting Started</div>
        <h2 className="section-title">Up and Running in 10 Minutes.</h2>
        <div className="section-subtitle">
          No technical knowledge required. No hardware to install.
          If you can use WhatsApp, you can run SA AI Office.
        </div>
        <div className="steps-row">
          <div className="step-card">
            <div className="step-num">1</div>
            <div className="step-title">Pre-Register</div>
            <div className="step-desc">Tell us about your business and which products interest you.</div>
            <div className="step-time">⏱️ Takes 2 minutes</div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div className="step-title">Connect Your WhatsApp</div>
            <div className="step-desc">Link your existing business WhatsApp number in 5 simple steps.</div>
            <div className="step-time">⏱️ Takes 5 minutes</div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div className="step-title">AI Goes to Work</div>
            <div className="step-desc">Your AI is live. It starts answering calls and handling admin from day one.</div>
            <div className="step-time">✅ Live immediately</div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing" style={{ paddingTop: 40 }}>
        <div className="section-eyebrow">Pricing</div>
        <h2 className="section-title">Simple Pricing. No Surprises.</h2>
        <div className="section-subtitle">Pay only for what you use. Scale as you grow.</div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-name">Luna Office</div>
            <div className="pricing-desc">AI Receptionist</div>
            <div className="pricing-amount">R499</div>
            <div className="pricing-period">per month · from</div>
            <ul className="pricing-features">
              <li>100 AI calls per month</li>
              <li>WhatsApp enquiry handling</li>
              <li>Appointment booking</li>
              <li>Email support</li>
            </ul>
            <a href="#register" className="btn-primary">Pre-Register</a>
          </div>
          <div className="pricing-card popular">
            <div className="pricing-name">Full Suite</div>
            <div className="pricing-desc">All 5 Products Bundle</div>
            <div className="pricing-amount">R1,499</div>
            <div className="pricing-period">per month · save R750+</div>
            <ul className="pricing-features">
              <li>All 5 AI products included</li>
              <li>Unlimited calls on Luna Office</li>
              <li>WhatsApp-native, English</li>
              <li>Priority onboarding</li>
              <li>Dedicated support</li>
            </ul>
            <a href="#register" className="btn-primary">Pre-Register</a>
          </div>
          <div className="pricing-card">
            <div className="pricing-name">Aira</div>
            <div className="pricing-desc">WhatsApp Business AI</div>
            <div className="pricing-amount">R199</div>
            <div className="pricing-period">per month · from</div>
            <ul className="pricing-features">
              <li>50 WhatsApp conversations/mo</li>
              <li>Order taking &amp; invoicing</li>
              <li>Reminders &amp; broadcasts</li>
              <li>Load shedding mode</li>
            </ul>
            <a href="#register" className="btn-primary">Pre-Register</a>
          </div>
        </div>
      </section>

      {/* PRE-REGISTER FORM */}
      <section className="section" id="register" style={{ paddingTop: 40 }}>
        <div className="section-eyebrow">Join Us</div>
        <h2 className="section-title">Pre-Register Now.</h2>
        <div className="section-subtitle">Be first in line when we launch. Pre-registration is free.</div>
        <div className="register-section">
          <div className="register-header">
            <h3>Reserve Your Spot</h3>
            <p>No payment required now. We&apos;ll contact you when you&apos;re ready to start.</p>
          </div>
          <div className="form-fields" id="formFields">
            <form className="register-grid" id="preRegisterForm" noValidate>
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input type="text" id="firstName" name="firstName" placeholder="Thabo" required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input type="text" id="lastName" name="lastName" placeholder="Mkhize" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Business Email *</label>
                <input type="email" id="email" name="email" placeholder="thabo@example.co.za" required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Business Phone *</label>
                <input type="tel" id="phone" name="phone" placeholder="+27 81 234 5678" required />
              </div>
              <div className="form-group">
                <label htmlFor="business">Business Name *</label>
                <input type="text" id="business" name="business" placeholder="Mkhize Electrical" required />
              </div>
              <div className="form-group">
                <label htmlFor="industry">Industry *</label>
                <select id="industry" name="industry" required>
                  <option value="" disabled>Select your industry</option>
                  <option value="medical">Medical / Healthcare</option>
                  <option value="legal">Legal / Attorney</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="home_services">Home Services</option>
                  <option value="retail">Retail / Spaza Shop</option>
                  <option value="it">IT / Technology</option>
                  <option value="construction">Construction / Trade</option>
                  <option value="finance">Finance / Accounting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group full">
                <label htmlFor="products">Products You&apos;re Interested In *</label>
                <select id="products" name="products" required>
                  <option value="" disabled>Select the product you want</option>
                  <option value="luna_office">Luna Office — AI Receptionist</option>
                  <option value="aira">Aira — WhatsApp Business AI</option>
                  <option value="lekgotla">Lekgotla — HR &amp; Compliance</option>
                  <option value="vault">Vault — Debt Collection</option>
                  <option value="atlas">Atlas — Field Dispatch</option>
                  <option value="full_suite">Full Suite — All 5 Products</option>
                </select>
              </div>
              <div className="form-group full">
                <label htmlFor="message">Anything else? (Optional)</label>
                <textarea id="message" name="message" placeholder="Tell us about your business..."></textarea>
              </div>
              <div className="form-group full register-submit">
                <button type="submit" className="btn-primary">Reserve My Spot →</button>
                <p>We&apos;ll be in touch within 24 hours. No spam. No payment required now.</p>
              </div>
            </form>
          </div>
          <div className="form-success" id="formSuccess">
            <div className="form-success-icon">🎉</div>
            <h3>You&apos;re on the list!</h3>
            <p>Thank you — we&apos;ll be in touch within 24 hours.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="section-eyebrow">Questions</div>
        <h2 className="section-title">Frequently Asked</h2>
        <div className="section-subtitle">Real questions from real SA business owners.</div>
        <div className="faq-list">
          <div className="faq-item">
            <button className="faq-q">Does my client need to download an app?<span className="faq-icon">+</span></button>
            <div className="faq-a">No. Your clients interact with all our AI tools directly through WhatsApp — the app they already have and use every day.</div>
          </div>
          <div className="faq-item">
            <button className="faq-q">What happens during load shedding?<span className="faq-icon">+</span></button>
            <div className="faq-a">Our systems run entirely in the cloud — not from your office. As long as your team has mobile data, our AI keeps running.</div>
          </div>
          <div className="faq-item">
            <button className="faq-q">Is my client&apos;s data safe? (POPIA)<span className="faq-icon">+</span></button>
            <div className="faq-a">Yes. POPIA compliance is built into the product. All data is stored securely. We never use your client data to train our AI models.</div>
          </div>
          <div className="faq-item">
            <button className="faq-q">Can I cancel anytime?<span className="faq-icon">+</span></button>
            <div className="faq-a">Yes. No lock-in contracts. No cancellation fees. Month-to-month on all plans.</div>
          </div>
          <div className="faq-item">
            <button className="faq-q">How long does setup take?<span className="faq-icon">+</span></button>
            <div className="faq-a">Most businesses are fully operational within 10 minutes. Connect your WhatsApp, set your hours, and you&apos;re live.</div>
          </div>
          <div className="faq-item">
            <button className="faq-q">Do you offer support in South Africa?<span className="faq-icon">+</span></button>
            <div className="faq-a">Yes. Our support team is based in South Africa and works during SA business hours (08:00–17:00 CAT).</div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta" id="signup">
        <div className="final-cta-title">Your competitors<br/>are already using AI.</div>
        <p className="final-cta-sub">The SA businesses that adopt AI in the next 24 months will be the ones that survive the next decade.</p>
        <p className="final-cta-sub2">Pre-registration is free · No payment now · Early access pricing · Cancel anytime</p>
        <div className="final-cta-buttons">
          <a href="#register" className="btn-primary" style={{ fontSize: 16, padding: "18px 40px" }}>Pre-Register Now →</a>
          <a href="mailto:aoraaiclaw@gmail.com" className="btn-secondary" style={{ fontSize: 16, padding: "18px 40px" }}>Talk to Us First</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#" style={{ fontSize: 18, fontWeight: 800, color: "var(--white)", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="url(#fNavGrad)"/>
                <path d="M16 6L8 12V20L16 26L24 20V12L16 6Z" fill="white" fillOpacity="0.9"/>
                <circle cx="16" cy="16" r="4" fill="url(#fNavGrad2)"/>
                <defs>
                  <linearGradient id="fNavGrad" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stopColor="#4A90D9"/><stop offset="100%" stopColor="#9B59B6"/></linearGradient>
                  <linearGradient id="fNavGrad2" x1="12" y1="12" x2="20" y2="20"><stop offset="0%" stopColor="#60A5FA"/><stop offset="100%" stopColor="#9B59B6"/></linearGradient>
                </defs>
              </svg>
              SA AI Office
            </a>
            <p>Five AI tools built for South African businesses. We answer calls, manage WhatsApp, handle HR, chase debt, and coordinate field teams — from R199/month.</p>
          </div>
          <div className="footer-col">
            <h4>Products</h4>
            <a href="#products">Luna Office</a>
            <a href="#products">Aira</a>
            <a href="#products">Lekgotla</a>
            <a href="#products">Vault</a>
            <a href="#products">Atlas</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-col">
            <h4>Get In Touch</h4>
            <a href="mailto:aoraaiclaw@gmail.com">aoraaiclaw@gmail.com</a>
            <a href="#register">Pre-Register</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 SA AI Office. A product of Lockdown Studios. All rights reserved. · POPIA Compliant · Built in South Africa 🇿🇦</div>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </>
  );
}
