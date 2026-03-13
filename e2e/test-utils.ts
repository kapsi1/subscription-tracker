import { Client } from 'pg';


/**
 * Cleans up a user and all their associated data (subscriptions, etc.)
 * by directly querying the PostgreSQL database.
 */
export async function cleanupUser(email: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/subscription_tracker?schema=public',
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Get user ID
    const res = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      await client.query('ROLLBACK');
      return; // User not found, nothing to clean up
    }
    const userId = res.rows[0].id;

    // 2. Delete related records (Alerts and PaymentHistory cascade from Subscriptions typically,
    // but we can delete Subscriptions directly which should trigger Prisma's cascade or we delete manually)
    // Note: Prisma schema shows Subscriptions have Alerts and PaymentHistories
    // Let's get all subscripton IDs for this user first
    const subsRes = await client.query('SELECT id FROM "Subscription" WHERE "userId" = $1', [userId]);
    const subIds = subsRes.rows.map(r => r.id);

    if (subIds.length > 0) {
      // Delete alerts and payments for these subscriptions
      await client.query('DELETE FROM "Alert" WHERE "subscriptionId" = ANY($1)', [subIds]);
      await client.query('DELETE FROM "PaymentHistory" WHERE "subscriptionId" = ANY($1)', [subIds]);
      
      // Delete the subscriptions
      await client.query('DELETE FROM "Subscription" WHERE "userId" = $1', [userId]);
    }

    // 3. Delete push subscriptions
    await client.query('DELETE FROM "PushSubscription" WHERE "userId" = $1', [userId]);

    // 4. Delete the user
    await client.query('DELETE FROM "User" WHERE id = $1', [userId]);
    
    await client.query('COMMIT');
    console.log(`Successfully cleaned up test user: ${email}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Failed to cleanup user ${email}:`, error);
  } finally {
    await client.end();
  }
}

/**
 * Gets the password reset token for a user from the database.
 */
export async function getUserResetToken(email: string): Promise<string | null> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/subscription_tracker?schema=public',
  });
  await client.connect();
  try {
    const res = await client.query('SELECT "passwordResetToken" FROM "User" WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0].passwordResetToken;
  } catch (error) {
    console.error(`Failed to get reset token for ${email}:`, error);
    return null;
  } finally {
    await client.end();
  }
}
