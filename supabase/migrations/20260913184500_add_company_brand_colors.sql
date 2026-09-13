alter table public.company_profiles
  add column if not exists primary_color text not null default '#0C4D46',
  add column if not exists secondary_color text not null default '#B5914E';

alter table public.company_profiles
  drop constraint if exists company_profiles_primary_color_format,
  drop constraint if exists company_profiles_secondary_color_format;

alter table public.company_profiles
  add constraint company_profiles_primary_color_format check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint company_profiles_secondary_color_format check (secondary_color ~ '^#[0-9A-Fa-f]{6}$');
