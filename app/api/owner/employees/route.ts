import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function generateTemporaryPassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#?$%';
  let password = '';

  for (let index = 0; index < length; index += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return password;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = authHeader.replace('Bearer ', '').trim();
  const publicClient = createClient(supabaseUrl, supabaseAnonKey);

  const { data: userData, error: userError } = await publicClient.auth.getUser(accessToken);
  if (userError || !userData.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Employee account creation is not configured on the server.' },
      { status: 500 },
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: ownerProfile, error: ownerProfileError } = await adminClient
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (ownerProfileError || ownerProfile?.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can create employee accounts.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    password?: string;
  } | null;

  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password?.trim() || generateTemporaryPassword();

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
    },
  });

  if (createUserError || !createdUserData.user?.id) {
    console.error('Failed to create Supabase auth user:', createUserError);
    return NextResponse.json({ error: 'Failed to create employee account.' }, { status: 500 });
  }

  const { error: profileError } = await adminClient.from('users').upsert({
    id: createdUserData.user.id,
    name,
    email,
    role: 'employee',
  });

  if (profileError) {
    console.error('Failed to create employee profile:', profileError);
    return NextResponse.json({ error: 'Employee account was created but profile sync failed.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    employee: {
      email,
      temporaryPassword: password,
    },
  });
}
