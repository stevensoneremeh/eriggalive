# Test User Credentials

## 🧪 Test Users for Each Tier

### 1. **Grassroot Tier** 🌱
- **Email**: `grassroot@test.com`
- **Password**: `TestPass123!`
- **Username**: `grassroot_fan`
- **Features**: Basic access, free content only
- **Coins**: 50
- **Level**: 5

### 2. **Pioneer Tier** 👑
- **Email**: `pioneer@test.com`
- **Password**: `TestPass123!`
- **Username**: `pioneer_supporter`
- **Features**: Premium content access, exclusive tracks
- **Coins**: 275 (300 - 25 spent)
- **Level**: 15

### 3. **Elder Tier** 🛡️
- **Email**: `elder@test.com`
- **Password**: `TestPass123!`
- **Username**: `elder_vip`
- **Features**: VIP content, early access, exclusive albums
- **Coins**: 1150 (1200 - 50 spent)
- **Level**: 35

### 4. **Blood Tier** 🩸
- **Email**: `blood@test.com`
- **Password**: `TestPass123!`
- **Username**: `blood_legend`
- **Features**: All content, exclusive access, special privileges
- **Coins**: 4800 (5000 - 200 spent)
- **Level**: 50

### 5. **Admin User** ⚡
- **Email**: `admin@test.com`
- **Password**: `AdminPass123!`
- **Username**: `admin_user`
- **Features**: Full admin access, content management
- **Coins**: 10000
- **Level**: 100

### 6. **Moderator User** 🛡️
- **Email**: `moderator@test.com`
- **Password**: `ModPass123!`
- **Username**: `mod_user`
- **Features**: Moderation tools, community management
- **Coins**: 3000
- **Level**: 75

## 🎨 Tier-Specific Dashboard Colors

Each tier has unique dashboard styling:

- **Grassroot**: Green theme (`#16a34a`)
- **Pioneer**: Orange theme (`#ff8c00`)
- **Elder**: Gold theme (`#ffd700`)
- **Blood**: Red theme (`#dc2626`)

## 💳 Test Payment Credentials

### Paystack Test Cards
- **Successful Payment**: `4084084084084081`
- **Insufficient Funds**: `4084084084084081` (amount > 300000)
- **Invalid Card**: `4084084084084082`

### Test Scenarios
1. **Coin Purchase**: Use Pioneer tier user to buy coins
2. **Content Access**: Use Elder tier to access premium albums
3. **Tier Upgrade**: Test upgrading from Grassroot to Pioneer
4. **Event Tickets**: Purchase tickets with different tier users
5. **Merchandise**: Order products with various payment methods

## 🔧 Setup Instructions

1. **Create Auth Users in Supabase**:
   - Go to Supabase Dashboard > Authentication > Users
   - Create users with the emails above
   - Set passwords as specified

2. **Update User UUIDs**:
   - Copy the generated UUIDs from Supabase Auth
   - Update the `11-create-test-users.sql` file with actual UUIDs
   - Run the SQL script

3. **Environment Variables**:
   - Copy `.env.example` to `.env.local`
   - Update with your actual Supabase credentials
   - Use test keys for payment gateways

4. **Database Setup**:
   - Run all SQL files in order (01-11)
   - Verify tables are created successfully
   - Check that RLS policies are active

## 🚀 Testing Checklist

- [ ] All tier users can login successfully
- [ ] Dashboard shows tier-specific colors
- [ ] Coin balances display correctly
- [ ] Premium content access works per tier
- [ ] Payment integration functions with test cards
- [ ] Theme switching works (light/dark)
- [ ] Mobile responsiveness verified
- [ ] Admin functions accessible to admin user
- [ ] Moderation tools work for moderator
- [ ] Email notifications sent properly

## 📞 Support

If you encounter issues:
1. Check Supabase logs for database errors
2. Verify environment variables are set correctly
3. Ensure RLS policies allow proper access
4. Check browser console for client-side errors
5. Review network tab for API call failures
\`\`\`

## 5. Updated Database Types
