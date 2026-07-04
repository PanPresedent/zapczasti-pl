-- Пользователи (расширение стандартной таблицы auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  imie text,
  nazwisko text,
  telefon text,
  typ_konta text check (typ_konta in ('private', 'company')),
  nazwa_firmy text,
  nip text,
  adres text,
  miasto text,
  marketing boolean default false,
  opis_firmy text,
  prefix_artykulu text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Dla istniejących baz (idempotentne dodanie kolumn):
alter table public.profiles add column if not exists miasto text;
alter table public.profiles add column if not exists marketing boolean default false;
alter table public.profiles add column if not exists opis_firmy text;
alter table public.profiles add column if not exists prefix_artykulu text;

-- Migracja typ_konta: 'kupujacy'/'sprzedawca' -> 'private'/'company'
update public.profiles set typ_konta = 'company' where typ_konta = 'sprzedawca';
update public.profiles set typ_konta = 'private' where typ_konta = 'kupujacy';
alter table public.profiles drop constraint if exists profiles_typ_konta_check;
alter table public.profiles add constraint profiles_typ_konta_check check (typ_konta in ('private', 'company'));

-- Объявления
create table public.ogloszenia (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  tytul text not null,
  opis text,
  cena decimal(10,2),
  marka text,
  model text,
  rok_od integer,
  rok_do integer,
  kategoria text,
  nazwa_czesci text,
  numer_oem text,
  numer_artykulu text,
  miasto text,
  zdjecia text[],
  status text default 'aktywne' check (status in ('aktywne', 'nieaktywne', 'sprzedane', 'oczekuje')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.ogloszenia add column if not exists numer_artykulu text;

-- Избранное
create table public.ulubione (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  ogloszenie_id uuid references public.ogloszenia(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, ogloszenie_id)
);

-- Сообщения
create table public.wiadomosci (
  id uuid default gen_random_uuid() primary key,
  nadawca_id uuid references public.profiles(id),
  odbiorca_id uuid references public.profiles(id),
  ogloszenie_id uuid references public.ogloszenia(id),
  tresc text not null,
  przeczytana boolean default false,
  created_at timestamp with time zone default now()
);

-- Включить Row Level Security
alter table public.profiles enable row level security;
alter table public.ogloszenia enable row level security;
alter table public.ulubione enable row level security;
alter table public.wiadomosci enable row level security;

-- Политики доступа для profiles
create policy "Профиль виден всем" on public.profiles for select using (true);
create policy "Пользователь создаёт свой профиль" on public.profiles for insert with check (auth.uid() = id);
create policy "Пользователь редактирует свой профиль" on public.profiles for update using (auth.uid() = id);

-- Политики для объявлений
create policy "Объявления видны всем" on public.ogloszenia for select using (status = 'aktywne');
create policy "Пользователь добавляет объявление" on public.ogloszenia for insert with check (auth.uid() = user_id);
create policy "Пользователь редактирует своё объявление" on public.ogloszenia for update using (auth.uid() = user_id);
create policy "Пользователь удаляет своё объявление" on public.ogloszenia for delete using (auth.uid() = user_id);

-- Политики для избранного
create policy "Пользователь видит своё избранное" on public.ulubione for select using (auth.uid() = user_id);
create policy "Пользователь добавляет в избранное" on public.ulubione for insert with check (auth.uid() = user_id);
create policy "Пользователь удаляет из избранного" on public.ulubione for delete using (auth.uid() = user_id);

-- Политики для сообщений (виден только отправитель/получатель)
create policy "Пользователь видит свои сообщения" on public.wiadomosci for select using (auth.uid() = nadawca_id or auth.uid() = odbiorca_id);
create policy "Пользователь отправляет сообщение" on public.wiadomosci for insert with check (auth.uid() = nadawca_id);
create policy "Получатель отмечает прочитанным" on public.wiadomosci for update using (auth.uid() = odbiorca_id);

-- Триггер: автоматическое создание профиля при регистрации
-- (данные берутся из user_metadata, переданных в supabase.auth.signUp)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, imie, nazwisko, telefon, typ_konta, nazwa_firmy, nip, adres
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'imie',
    new.raw_user_meta_data ->> 'nazwisko',
    new.raw_user_meta_data ->> 'telefon',
    new.raw_user_meta_data ->> 'typ_konta',
    new.raw_user_meta_data ->> 'nazwa_firmy',
    new.raw_user_meta_data ->> 'nip',
    new.raw_user_meta_data ->> 'adres'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Тригер: автоматическое обновление updated_at в объявлениях
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ogloszenia_set_updated_at on public.ogloszenia;
create trigger ogloszenia_set_updated_at
  before update on public.ogloszenia
  for each row execute function public.set_updated_at();
