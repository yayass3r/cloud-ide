import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return NextResponse.json({
    hasServiceKey: !!key,
    keyLength: key?.length || 0,
    keyPrefix: key?.substring(0, 20) || 'NOT_SET',
    keySuffix: key?.substring(key.length - 20) || 'NOT_SET',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
    nodeEnv: process.env.NODE_ENV || 'NOT_SET',
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.includes('SUPABASE') || k.includes('NEXT_PUBLIC') || k.includes('JWT') || k.includes('NETLIFY')
    ).join(', '),
  })
}
