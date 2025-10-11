import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/utils/admin-auth'

// Get user wallet details
export async function GET(request: Request) {
  try {
    // Verify admin access using established pattern
    const { isAdmin, user, error } = await verifyAdminAccess()
    if (!isAdmin || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get wallet details with transaction history
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError && walletError.code !== 'PGRST116') {
      throw walletError
    }

    // Get recent transactions
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (txError) {
      throw txError
    }

    // Get user details
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('username, email, tier, coins')
      .eq('id', userId)
      .single()

    if (userError) {
      throw userError
    }

    return NextResponse.json({
      wallet: wallet || { user_id: userId, coin_balance: 0, total_earned: 0, total_spent: 0 },
      transactions: transactions || [],
      user: userDetails,
    })
  } catch (error) {
    console.error('Wallet management error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet details' }, { status: 500 })
  }
}

// Credit or debit user wallet
export async function POST(request: Request) {
  try {
    // Verify admin access using established pattern
    const { isAdmin, user, error } = await verifyAdminAccess()
    if (!isAdmin || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { userId, amount, type, description, reference } = body

    // Validate input
    if (!userId || !amount || !type || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (type !== 'credit' && type !== 'debit') {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    // Get or create wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError && walletError.code !== 'PGRST116') {
      throw walletError
    }

    let currentBalance = wallet?.coin_balance || 0

    // Check if debit would result in negative balance
    if (type === 'debit' && currentBalance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Calculate new balance
    const newBalance = type === 'credit' ? currentBalance + amount : currentBalance - amount
    const totalEarned = wallet?.total_earned || 0
    const totalSpent = wallet?.total_spent || 0

    // Update wallet
    const { error: updateError } = await supabase
      .from('user_wallets')
      .upsert({
        user_id: userId,
        coin_balance: newBalance,
        total_earned: type === 'credit' ? totalEarned + amount : totalEarned,
        total_spent: type === 'debit' ? totalSpent + amount : totalSpent,
        updated_at: new Date().toISOString(),
      })

    if (updateError) {
      throw updateError
    }

    // Create transaction record
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'admin_adjustment',
        amount: type === 'credit' ? amount : -amount,
        description: `[ADMIN] ${description}`,
        reference_id: reference || `admin-${Date.now()}`,
        metadata: { admin_id: user.id, admin_email: user.email },
      })

    if (txError) {
      throw txError
    }

    // Also update the users table coins field for backward compatibility
    const { error: coinsError } = await supabase
      .from('users')
      .update({ coins: newBalance })
      .eq('id', userId)

    if (coinsError) {
      console.warn('Failed to update users.coins:', coinsError)
    }

    // Log admin action with error handling
    const { error: auditError } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: user.id,
        action_type: 'wallet_adjustment',
        target_type: 'user',
        target_id: userId,
        description: `${type === 'credit' ? 'Credited' : 'Debited'} ${amount} coins: ${description}`,
        metadata: { amount, type, newBalance, reference },
      })

    if (auditError) {
      console.error('Failed to log admin action:', auditError)
      // Don't fail the request, but log the error
      // The wallet adjustment has already succeeded
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${type === 'credit' ? 'credited' : 'debited'} ${amount} coins`,
      newBalance,
      auditLogged: !auditError,
    })
  } catch (error) {
    console.error('Wallet adjustment error:', error)
    return NextResponse.json({ error: 'Failed to adjust wallet' }, { status: 500 })
  }
}
