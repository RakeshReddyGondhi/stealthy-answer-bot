# Free AI API Setup Guide & Time-Based Access Control

## 🎉 NEW: Switched to FREE Groq API!

Your app now uses **Groq's free API** instead of paid OpenAI. This means:

✅ **Completely FREE** - No credit card required  
✅ **Fast responses** - Even faster than OpenAI  
✅ **Still requires internet** - Connects to Groq cloud for AI answers  
✅ **Generous free tier** - 14,400 requests per day on free plan

---

## 📋 Step 1: Get Your FREE Groq API Key

### Sign Up (Takes 2 minutes):

1. **Visit**: [https://console.groq.com](https://console.groq.com)
2. **Click** "Sign Up" (top right)
3. **Use**: Google/GitHub account or email
4. **Verify** your email (if using email)

### Get Your API Key:

1. **Go to**: [https://console.groq.com/keys](https://console.groq.com/keys)
2. **Click**: "Create API Key"
3. **Name it**: "Stealthy Answer Bot" (or anything)
4. **Copy** the key (starts with `gsk_...`)
5. **Save it** somewhere safe - you'll need it!

### Free Tier Limits:
- ✅ **14,400 requests per day**
- ✅ **60 requests per minute**  
- ✅ **No credit card needed**
- ✅ **All models available** (Llama 3.1, Mixtral, etc.)

---

## ⚙️ Step 2: Configure Your App

### Update `config.json`:

Replace `YOUR_FREE_GROQ_API_KEY` with your actual key:

```json
{
  "name": "stealthy-answer-bot-config",
  "aiProvider": "groq",
  "groqApiKey": "gsk_your_actual_key_here",
  "groqModel": "llama-3.1-70b-versatile"
}
```

### Available Models (All FREE):

- `llama-3.1-70b-versatile` (Recommended - Best for general questions)
- `llama-3.1-8b-instant` (Faster, good for quick answers)
- `mixtral-8x7b-32768` (Great for technical questions)
- `gemma2-9b-it` (Good for coding questions)

---

## ⏰ Step 3: Time-Based Access Control

### What's New?

Admins can now grant **temporary access** instead of permanent approval:

**Example**: Grant user access for 2 hours, then it expires automatically.

### How It Works:

#### For Admins:

1. **User requests access** → Request appears in admin dashboard
2. **Admin selects duration**:
   - 30 minutes
   - 1 hour
   - 2 hours  
   - 3 hours
   - 6 hours
   - 12 hours
   - 24 hours
   - Custom (any duration)
3. **Click "Grant Access"** → User can use app for that duration
4. **Automatic expiration** → Access revoked when time runs out

#### For Users:

- **Timer displays** remaining time in the app
- **Warning shown** when less than 10 minutes left  
- **Request new access** when time expires

### Admin Functions (Database):

```sql
-- Grant 2 hours of access
SELECT grant_time_based_access('request-id-here', 120);

-- Grant 30 minutes
SELECT grant_time_based_access('request-id-here', 30);

-- Check if user has valid access
SELECT is_access_valid('user-id-here');

-- Manually expire all outdated access
SELECT auto_expire_access();
```

---

## 🚀 Step 4: Apply the Migration

After pulling the latest changes:

```bash
# Reset database to apply new migration
supabase db reset

# Or push specific migration
supabase db push
```

---

## 📊 Comparison: OpenAI vs Groq

| Feature | OpenAI (OLD) | Groq (NEW) |
|---------|--------------|------------|
| **Cost** | ❌ Paid ($0.03/1K tokens) | ✅ FREE |
| **Speed** | ~2-3 seconds | ~0.5-1 second |
| **Free Tier** | ❌ $5 trial credit only | ✅ 14,400 requests/day |
| **Requires Credit Card** | ❌ Yes | ✅ No |
| **Model Quality** | GPT-4 | Llama 3.1 (Similar) |
| **Internet Required** | ✅ Yes | ✅ Yes |

---

## 🔧 Troubleshooting

### Error: "Invalid API Key"
**Solution**: Check that you copied the complete key from Groq console (starts with `gsk_`)

### Error: "Rate limit exceeded"
**Solution**: Wait 1 minute. Free tier has 60 requests/minute limit.

### Error: "Model not found"
**Solution**: Check model name in `config.json`. Use one of the models listed above.

### Access Expires Too Quickly
**Solution**: Admin can grant longer durations (up to 24 hours) or unlimited access (leave expires_at as NULL).

---

## 💡 Pro Tips

1. **Backup your API key** - Save it in a password manager
2. **Use llama-3.1-70b** - Best balance of quality and speed
3. **Monitor usage** - Check [Groq console](https://console.groq.com/usage) for limits
4. **Grant appropriate time** - 1-2 hours is usually sufficient for interviews
5. **Test locally first** - Before deploying to production

---

## 🆘 Need Help?

- **Groq Docs**: [https://console.groq.com/docs](https://console.groq.com/docs)
- **Groq Discord**: [https://discord.gg/groq](https://discord.gg/groq)
- **GitHub Issues**: [Open an issue](../../issues)

---

## 📝 What Changed?

### Files Modified:
1. **`config.json`** - Switched from OpenAI to Groq
2. **`supabase/migrations/20251115120000_add_time_based_access.sql`** - Added time-based access control

### New Features:
- ✅ Free AI API (Groq instead of OpenAI)
- ✅ Time-based access control
- ✅ Automatic access expiration  
- ✅ Admin can set custom durations
- ✅ User timer display
- ✅ 'expired' status for outdated requests

---

## 🎯 Summary

**Before**: Paid OpenAI API + permanent user access  
**After**: FREE Groq API + time-limited user access

**Result**: 
- 💰 Save money (no API costs)
- ⏱️ Better control (time-based access)
- 🚀 Faster responses (Groq is faster)
- ✅ Still requires internet (Groq cloud API)

---

**Last Updated**: November 15, 2025  
**Version**: 2.0 (Free API + Time-Based Access)
