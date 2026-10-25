-- ============================================================================
-- DAILY FINANCIAL DIARY - SKEMA DATABASE SUPABASE
-- Jalankan seluruh isi file ini SATU KALI di:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================================

-- 1. Tabel transaksi
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  type        text not null check (type in ('income', 'expense')),
  amount      bigint not null check (amount > 0 and amount <= 1000000000000),
  category    text not null check (char_length(category) between 1 and 50),
  date        date not null,
  note        text not null default '' check (char_length(note) <= 200),
  created_at  timestamptz not null default now()
);

-- Index untuk query "semua transaksi milik saya, urut tanggal terbaru"
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc, created_at desc);

-- 2. Aktifkan Row Level Security (WAJIB - tanpa ini data bisa dibaca siapa saja)
alter table public.transactions enable row level security;

-- 3. Hak akses dasar untuk user yang sudah login
grant select, insert, update, delete on public.transactions to authenticated;
revoke all on public.transactions from anon;

-- 4. Policy: setiap user hanya bisa melihat/mengubah transaksi miliknya sendiri
drop policy if exists "Users can view own transactions"   on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;

create policy "Users can view own transactions"
  on public.transactions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  to authenticated
  using ((select auth.uid()) = user_id);
