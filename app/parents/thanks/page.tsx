import Image from 'next/image';
import Link from 'next/link';
import Navigation from '../../components/Navigation';

export default function ParentsThanksPage() {
  return (
    <>
      <Navigation />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <Image src="/flash_assets/flash-logo-transparent.png" alt="FL4SH" width={84} height={84} priority />
        </div>

        <h1 style={{ fontSize: 36, marginBottom: 8, textAlign: 'center' }}>Thanks — you’re all set</h1>
        <p style={{ opacity: 0.85, marginBottom: 18, textAlign: 'center' }}>
          We’ve emailed your child with a redeem link and code. They just need to install FL4SH and sign in.
        </p>
        <p style={{ opacity: 0.85, textAlign: 'center' }}>
          If they can’t find the email, ask them to check spam/junk and search for “FL4SH”.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
          <Link
            href="/parents"
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.18)',
              textDecoration: 'none',
              color: 'white',
            }}
          >
            Buy for another child
          </Link>
        </div>
      </main>
    </>
  );
}
