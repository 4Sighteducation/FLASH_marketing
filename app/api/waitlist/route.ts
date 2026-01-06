import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://qkapwhyxcpgzahuemucg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered!' },
        { status: 400 }
      );
    }

    // Get current count to determine position
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    const position = (count || 0) + 1;
    // Extended beta: first N waitlist users are eligible for 1 year of Pro (auto-grant on account creation).
    const TOP_N = 50;
    const isTopN = position <= TOP_N;

    const resolvedSource =
      typeof source === 'string' && source.trim().length > 0 && source.trim().length <= 40
        ? source.trim()
        : 'launch_banner';

    // Insert new waitlist entry
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: email.toLowerCase(),
          position,
          // Keep legacy column for compatibility with existing tooling, but we're using TOP_N now.
          is_top_twenty: isTopN,
          // New columns (added in FLASH DB migration) that drive the auto-grant trigger.
          auto_pro_enabled: isTopN,
          auto_pro_days: 365,
          source: resolvedSource,
          notified: false,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save email. Please try again.' },
        { status: 500 }
      );
    }

    // Send notification email via SendGrid (if configured)
    try {
      const sendGridApiKey = process.env.SENDGRID_API_KEY;
      if (sendGridApiKey) {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendGridApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: email.toLowerCase() }],
                subject: isTopN
                  ? '🎉 You\'re in! FL4SH Pro FREE for 1 Year!' 
                  : '✨ You\'re on the FL4SH Early Access List!'
              }
            ],
            from: {
              email: 'hello@fl4shcards.com',
              name: 'FL4SH Team'
            },
            content: [
              {
                type: 'text/html',
                value: isTopN
                  ? `
                    <h2>🎉 Congratulations! You're in the first ${TOP_N}!</h2>
                    <p>You're one of the first ${TOP_N} people to join our early access list, which means you'll get <strong>FL4SH Pro FREE for an entire year</strong> when you create an account with this same email address.</p>
                    <h3>What happens next?</h3>
                    <ul>
                      <li>Download the app from the App Store</li>
                      <li>Create an account using this email</li>
                      <li>Pro will unlock automatically (can take a minute; log out/in if needed)</li>
                    </ul>
                    <p>Thanks for being an early supporter!</p>
                    <p>The FL4SH Team<br>
                    <a href="https://www.fl4shcards.com">fl4shcards.com</a></p>
                  `
                  : `
                    <h2>✨ Welcome to FL4SH Early Access!</h2>
                    <p>Thanks for joining our early access list! You're position <strong>#${position}</strong> on the list.</p>
                    <h3>What happens next?</h3>
                    <ul>
                      <li>We'll email you on launch day (Feb 1st, 2025)</li>
                      <li>You'll get early access to the app</li>
                      <li>Plus a special launch bonus!</li>
                    </ul>
                    <p>Stay tuned for updates as we approach launch day!</p>
                    <p>The FL4SH Team<br>
                    <a href="https://www.fl4shcards.com">fl4shcards.com</a></p>
                  `
              }
            ]
          })
        });

        // Notify admin
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendGridApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: 'admin@4sighteducation.com' }],
                subject: `New Waitlist Signup #${position}${isTopN ? ` 🎉 TOP ${TOP_N}!` : ''} (${resolvedSource})`
              }
            ],
            from: {
              email: 'hello@fl4shcards.com',
              name: 'FL4SH Waitlist'
            },
            content: [
              {
                type: 'text/html',
                value: `
                  <h3>New Waitlist Signup</h3>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Position:</strong> #${position}</p>
                  <p><strong>Top ${TOP_N}:</strong> ${isTopN ? 'YES 🎉' : 'No'}</p>
                  <p><strong>Source:</strong> ${resolvedSource}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                `
              }
            ]
          })
        });
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      position,
      isTopN,
      message: isTopN
        ? `You\'re in the top ${TOP_N}! Check your email for details.`
        : 'Successfully joined the waitlist!'
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

