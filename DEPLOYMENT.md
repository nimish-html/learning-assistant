# Deployment Guide

## Environment Configuration

### Development Environment

1. Copy environment template:
```bash
cp .env.example .env.local
```

2. Configure required variables:
- `XAI_API_KEY`: Get from XAI platform
- `NEXT_PUBLIC_SUPABASE_URL`: From Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From Supabase project API settings

### Production Environment

#### Vercel Deployment

1. **Environment Variables Setup**:
   - Go to Vercel project settings
   - Add all environment variables from `.env.example`
   - Ensure `NEXT_PUBLIC_*` variables are properly set
   - Keep sensitive keys secure (don't expose service role keys)

2. **Deployment Configuration**:
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set output directory: `.next`
   - Enable automatic deployments on push

#### Other Platforms

For other deployment platforms (Netlify, Railway, etc.):

1. Configure environment variables according to platform documentation
2. Ensure build settings match Next.js requirements
3. Set up proper domain and SSL configuration

## Database Setup for Production

### Supabase Configuration

1. **Project Setup**:
   - Create production Supabase project
   - Configure custom domain if needed
   - Set up proper backup schedule

2. **Security Configuration**:
   - Enable Row Level Security (RLS) on all tables
   - Configure authentication settings
   - Set up proper CORS policies
   - Review and test security policies

3. **Performance Optimization**:
   - Configure connection pooling
   - Set up database indexes
   - Monitor query performance
   - Configure caching strategies

### Required Database Schema

The application requires these tables with proper RLS policies:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved results table
CREATE TABLE saved_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Saved results policies
CREATE POLICY "Users can view own saved results" ON saved_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved results" ON saved_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved results" ON saved_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved results" ON saved_results
  FOR DELETE USING (auth.uid() = user_id);
```

## Security Checklist

### Pre-deployment Security Review

- [ ] Environment variables properly configured
- [ ] No sensitive data in client-side code
- [ ] RLS policies tested and working
- [ ] Authentication flows tested
- [ ] CORS settings configured
- [ ] Security headers enabled
- [ ] SSL/TLS properly configured

### Post-deployment Verification

- [ ] Authentication works in production
- [ ] Database connections successful
- [ ] All API endpoints responding
- [ ] Error handling working properly
- [ ] Performance monitoring set up
- [ ] Backup systems operational

## Monitoring and Maintenance

### Recommended Monitoring

1. **Application Monitoring**:
   - Set up error tracking (Sentry, LogRocket, etc.)
   - Monitor API response times
   - Track user authentication success rates

2. **Database Monitoring**:
   - Monitor Supabase dashboard metrics
   - Set up alerts for connection limits
   - Track query performance

3. **Infrastructure Monitoring**:
   - Monitor deployment platform metrics
   - Set up uptime monitoring
   - Track resource usage

### Maintenance Tasks

- Regular dependency updates
- Security patch reviews
- Database performance optimization
- Backup verification
- Log rotation and cleanup

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Verify variable names match exactly
   - Check platform-specific configuration
   - Ensure `NEXT_PUBLIC_` prefix for client-side variables

2. **Database Connection Issues**:
   - Verify Supabase URL and keys
   - Check network connectivity
   - Review RLS policies

3. **Authentication Problems**:
   - Verify Supabase auth configuration
   - Check email settings
   - Review redirect URLs

4. **Build Failures**:
   - Check TypeScript errors
   - Verify all dependencies installed
   - Review Next.js configuration