create table if not exists vehicles (
  id text primary key,
  traccar_device_id integer not null,
  unique_id text not null unique,
  name text not null,
  type text not null check (type in ('main', 'truck', 'support')),
  color text,
  active integer not null default 1,
  visible integer not null default 1,
  sort_order integer not null default 0,
  created_at text not null,
  updated_at text not null
);

create table if not exists last_positions (
  vehicle_id text primary key,
  lat real not null,
  lng real not null,
  speed_kmh real,
  bearing real,
  accuracy real,
  battery real,
  charging integer,
  fix_time text not null,
  updated_at text not null
);

create table if not exists route_points (
  id integer primary key autoincrement,
  vehicle_id text not null,
  lat real not null,
  lng real not null,
  speed_kmh real,
  bearing real,
  accuracy real,
  fix_time text not null,
  created_at text not null
);

create table if not exists operator_events (
  id integer primary key autoincrement,
  type text not null,
  payload text,
  created_at text not null
);

create table if not exists settings (
  key text primary key,
  value text not null
);

create index if not exists idx_route_points_vehicle_fix_time on route_points(vehicle_id, fix_time);
