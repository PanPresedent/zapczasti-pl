-- Пользователи (расширение стандартной таблицы auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  imie text,
  nazwisko text,
  telefon text,
  typ_konta text check (typ_konta in ('kupujacy', 'sprzedawca')),
  nazwa_firmy text,
  nip text,
  adres text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

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
  miasto text,
  zdjecia text[],
  status text default 'aktywne' check (status in ('aktywne', 'nieaktywne', 'sprzedane', 'oczekuje')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

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
