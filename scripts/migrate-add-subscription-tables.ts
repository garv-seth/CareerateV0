// Database migration to add subscription and billing tables
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function migrate() {
  console.log("🚀 Starting database migration for subscription tables...");

  try {
    // Add new fields to users table
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT,
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
    `);
    console.log("✅ Updated users table with new fields");

    // Create subscription_plans table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        stripe_monthly_price_id TEXT,
        stripe_yearly_price_id TEXT,
        features JSONB DEFAULT '[]',
        limits JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        is_popular BOOLEAN DEFAULT false,
        trial_days INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created subscription_plans table");

    // Create user_subscriptions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id VARCHAR NOT NULL REFERENCES subscription_plans(id),
        stripe_subscription_id TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
        billing_cycle TEXT NOT NULL DEFAULT 'monthly',
        current_period_start TIMESTAMP NOT NULL,
        current_period_end TIMESTAMP NOT NULL,
        trial_start TIMESTAMP,
        trial_end TIMESTAMP,
        canceled_at TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT false,
        quantity INTEGER DEFAULT 1,
        unit_amount DECIMAL(10,2),
        currency TEXT DEFAULT 'usd',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created user_subscriptions table");

    // Create usage_tracking table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS usage_tracking (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id VARCHAR,
        subscription_id VARCHAR REFERENCES user_subscriptions(id) ON DELETE SET NULL,
        metric_type TEXT NOT NULL,
        metric_value INTEGER NOT NULL DEFAULT 0,
        period TEXT NOT NULL DEFAULT 'current_month',
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        reset_at TIMESTAMP NOT NULL,
        "limit" INTEGER DEFAULT -1,
        last_increment TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created usage_tracking table");

    // Create billing_history table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS billing_history (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_id VARCHAR REFERENCES user_subscriptions(id) ON DELETE SET NULL,
        stripe_invoice_id TEXT UNIQUE,
        stripe_payment_intent_id TEXT,
        invoice_number TEXT,
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'usd',
        status TEXT NOT NULL,
        payment_status TEXT,
        description TEXT,
        invoice_url TEXT,
        pdf_url TEXT,
        due_date TIMESTAMP,
        paid_at TIMESTAMP,
        attempted_at TIMESTAMP,
        next_payment_attempt TIMESTAMP,
        failure_reason TEXT,
        line_items JSONB DEFAULT '[]',
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created billing_history table");

    // Create payment_methods table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stripe_payment_method_id TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        brand TEXT,
        last4 TEXT,
        expiry_month INTEGER,
        expiry_year INTEGER,
        fingerprint TEXT,
        is_default BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        billing_details JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created payment_methods table");

    // Insert default subscription plans
    await db.execute(`
      INSERT INTO subscription_plans (name, display_name, description, monthly_price, yearly_price, features, limits, is_popular, sort_order)
      VALUES 
        ('free', 'Free Plan', 'Perfect for getting started', 0, 0, 
         '["Basic AI assistance", "1 project", "Community support"]'::jsonb,
         '{"projects": 1, "aiGenerations": 5, "storageGB": 1, "collaborators": 0, "apiCalls": 100}'::jsonb,
         false, 1),
        ('starter', 'Starter Plan', 'For individual developers', 29, 290,
         '["Advanced AI features", "5 projects", "Email support", "Basic integrations"]'::jsonb,
         '{"projects": 5, "aiGenerations": 50, "storageGB": 5, "collaborators": 2, "apiCalls": 1000}'::jsonb,
         false, 2),
        ('professional', 'Professional Plan', 'For growing teams', 99, 990,
         '["Unlimited AI generations", "Unlimited projects", "Real-time collaboration", "Priority support", "All integrations"]'::jsonb,
         '{"projects": -1, "aiGenerations": -1, "storageGB": 100, "collaborators": 10, "apiCalls": 10000}'::jsonb,
         true, 3),
        ('enterprise', 'Enterprise Plan', 'For large organizations', 299, 2990,
         '["Everything in Professional", "Advanced security", "Custom integrations", "Dedicated support", "SLA guarantee"]'::jsonb,
         '{"projects": -1, "aiGenerations": -1, "storageGB": 1000, "collaborators": -1, "apiCalls": 100000}'::jsonb,
         false, 4)
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log("✅ Inserted default subscription plans");

    console.log("🎉 Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate().catch(console.error);
}

export { migrate };
