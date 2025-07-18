This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account
- XAI API key

### Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Configure the following environment variables in `.env.local`:

#### Required Variables

- `XAI_API_KEY`: Your XAI API key for AI question generation
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

#### Optional Variables

- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side operations (keep secure, not needed for basic functionality)

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to find your project URL and anon key
3. Run the database migrations (see Database Setup section)
4. Configure Row Level Security policies as needed

### Database Setup

The application requires the following database tables:

1. `profiles` - User profile information
2. `saved_results` - User's saved question sets

Database migrations should be applied through Supabase dashboard or CLI. The required schema is defined in the design documentation.

## Getting Started

After setting up your environment variables, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

### Production Environment Variables

For production deployment, ensure all environment variables are properly configured:

1. **Vercel Deployment**:
   - Add environment variables in your Vercel project settings
   - Ensure `NEXT_PUBLIC_*` variables are set for client-side access
   - Keep sensitive keys (like service role keys) secure

2. **Other Platforms**:
   - Configure environment variables according to your platform's documentation
   - Ensure Supabase URLs are accessible from your deployment environment
   - Test authentication flows in production environment

### Database Configuration for Production

1. Ensure Row Level Security (RLS) policies are properly configured
2. Verify database connection limits and performance settings
3. Set up proper backup and monitoring for your Supabase project
4. Configure CORS settings if deploying to custom domains

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
