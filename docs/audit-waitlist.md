# Audit waitlist — настройка Supabase

Заглушка `/audit` принимает email и сохраняет в таблицу `audit_waitlist` Supabase. Параллельно летит уведомление в Telegram-бот (тот же, что принимает заявки с главной).

## 1. Создание проекта и таблицы

1. https://supabase.com → New project → регион `eu-central-1` (Frankfurt) или ближайший. План Free.
2. Из `Project Settings → API` скопировать:
   - **Project URL** → в env `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** → в env `SUPABASE_SERVICE_ROLE_KEY` (секрет, никогда не экспонировать на клиент)
3. `SQL Editor → New query` → выполнить:

```sql
create table if not exists public.audit_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.audit_waitlist enable row level security;

-- Anon может только вставлять (на случай, если форма пойдёт напрямую через anon client)
create policy "audit_waitlist anon insert"
  on public.audit_waitlist
  for insert
  to anon
  with check (true);

-- SELECT и DELETE не разрешены никому через RLS.
-- service_role ключ bypass'ает RLS автоматически — доступ остаётся
-- у владельца проекта через Supabase Studio и API-роутов сервера.
```

4. Проверить в `Table Editor`: таблица `audit_waitlist` с колонками `id / email / created_at`, RLS включён.

## 2. Env в Vercel

`Project Settings → Environment Variables` → добавить на `Production, Preview, Development`:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key

Redeploy после сохранения (Vercel подтягивает env при билде).

## 3. Тестирование формы

1. Открыть https://vibecraft.kz/audit.
2. Ввести тестовый email `test@example.kz`, отправить.
3. В Telegram должно прийти: `🟣 Заявка на аудит (waitlist) — vibecraft.kz/audit\nEmail: test@example.kz`.
4. В Supabase `Table Editor → audit_waitlist` должна появиться строка.
5. Повторная отправка того же email: форма показывает «Вы уже в списке» (не ошибка, 200 с `duplicate: true`).

## 4. Выгрузка лидов

Через Supabase Studio: `Table Editor → audit_waitlist → Export CSV`. Альтернатива — SQL запрос:

```sql
select email, created_at
from audit_waitlist
order by created_at desc;
```

Публичного endpoint для выгрузки нет (RLS запрещает select для anon, service_role key только на сервере).
