'use client'

import Navigation from '../components/Navigation'
import '../legal.css'

export default function Support() {
  return (
    <>
      <Navigation />
      <main className="legal-page">
        <div className="container">
          <h1>Support</h1>
          <p className="updated">We usually reply within 24 hours.</p>

          <section>
            <h2>Contact Support</h2>
            <p>If you need help with your account, subscriptions, or anything else, reach us here:</p>
            <div className="contact-box">
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:support@fl4shcards.com">support@fl4shcards.com</a>
              </p>
              <p>
                <strong>Contact form:</strong>{' '}
                <a href="/contact">www.fl4shcards.com/contact</a>
              </p>
            </div>
          </section>

          <section>
            <h2>Common Questions</h2>

            <h3>How do I restore my subscription?</h3>
            <p>
              In the app, open <strong>Profile</strong> → <strong>Subscription</strong> →{' '}
              <strong>Restore Purchase</strong>.
            </p>

            <h3>How do I cancel?</h3>
            <p>
              Subscriptions are managed by Apple. You can cancel anytime in your iPhone settings:
              <strong> Settings</strong> → <strong>Apple ID</strong> → <strong>Subscriptions</strong>.
            </p>

            <h3>I can’t access Pro features (Past Papers)</h3>
            <p>
              Make sure you are signed into the same Apple ID used to purchase the subscription, then try{' '}
              <strong>Restore Purchase</strong>. If it still doesn’t work, email us and include your account
              email address.
            </p>
          </section>

          <section>
            <h2>Report a Bug</h2>
            <p>
              Please email <a href="mailto:support@fl4shcards.com">support@fl4shcards.com</a> with:
            </p>
            <ul>
              <li>Your device model and iOS version</li>
              <li>What you expected vs what happened</li>
              <li>Steps to reproduce (if you can)</li>
              <li>Screenshots/screen recording (if possible)</li>
            </ul>
          </section>
        </div>
      </main>
    </>
  )
}


