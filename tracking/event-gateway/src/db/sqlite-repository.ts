import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { GatewayVehicle, StoredPosition, VehicleType } from "../domain/vehicles.js";

const schema = `
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
`;

type VehicleRow = {
  id: string;
  traccar_device_id: number;
  unique_id: string;
  name: string;
  type: VehicleType;
  color: string | null;
  active: number;
  visible: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type PositionRow = {
  vehicle_id: string;
  lat: number;
  lng: number;
  speed_kmh: number | null;
  bearing: number | null;
  accuracy: number | null;
  battery: number | null;
  charging: number | null;
  fix_time: string;
  updated_at: string;
};

export class SqliteGatewayRepository {
  private readonly database: DatabaseSync;

  constructor(private readonly databasePath: string) {
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }

    this.database = new DatabaseSync(databasePath);
  }

  init(): void {
    if (this.databasePath !== ":memory:") {
      this.database.exec("pragma journal_mode = WAL;");
    }

    this.database.exec("pragma foreign_keys = ON;");
    this.database.exec(schema);
  }

  close(): void {
    this.database.close();
  }

  saveVehicle(vehicle: GatewayVehicle): void {
    this.database
      .prepare(
        `
        insert into vehicles (
          id, traccar_device_id, unique_id, name, type, color, active, visible, sort_order, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        on conflict(id) do update set
          traccar_device_id = excluded.traccar_device_id,
          unique_id = excluded.unique_id,
          name = excluded.name,
          type = excluded.type,
          color = excluded.color,
          active = excluded.active,
          visible = excluded.visible,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at
        `
      )
      .run(
        vehicle.id,
        vehicle.traccarDeviceId,
        vehicle.uniqueId,
        vehicle.name,
        vehicle.type,
        vehicle.color ?? null,
        vehicle.active ? 1 : 0,
        vehicle.visible ? 1 : 0,
        vehicle.sortOrder,
        vehicle.createdAt,
        vehicle.updatedAt
      );
  }

  loadVehicles(): GatewayVehicle[] {
    const rows = this.database
      .prepare("select * from vehicles order by sort_order asc, name asc")
      .all() as VehicleRow[];

    return rows.map((row) => ({
      id: row.id,
      traccarDeviceId: row.traccar_device_id,
      uniqueId: row.unique_id,
      name: row.name,
      type: row.type,
      color: row.color ?? undefined,
      active: row.active === 1,
      visible: row.visible === 1,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  savePosition(position: StoredPosition): void {
    this.database
      .prepare(
        `
        insert into last_positions (
          vehicle_id, lat, lng, speed_kmh, bearing, accuracy, battery, charging, fix_time, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        on conflict(vehicle_id) do update set
          lat = excluded.lat,
          lng = excluded.lng,
          speed_kmh = excluded.speed_kmh,
          bearing = excluded.bearing,
          accuracy = excluded.accuracy,
          battery = excluded.battery,
          charging = excluded.charging,
          fix_time = excluded.fix_time,
          updated_at = excluded.updated_at
        `
      )
      .run(
        position.vehicleId,
        position.lat,
        position.lng,
        position.speedKmh,
        position.bearing,
        position.accuracy,
        position.battery,
        position.charging === null ? null : position.charging ? 1 : 0,
        position.fixTime,
        position.updatedAt
      );
  }

  loadPositions(): Map<string, StoredPosition> {
    const rows = this.database.prepare("select * from last_positions").all() as PositionRow[];

    return new Map(
      rows.map((row) => [
        row.vehicle_id,
        {
          vehicleId: row.vehicle_id,
          lat: row.lat,
          lng: row.lng,
          speedKmh: row.speed_kmh ?? 0,
          bearing: row.bearing ?? 0,
          accuracy: row.accuracy,
          battery: row.battery,
          charging: row.charging === null ? null : row.charging === 1,
          fixTime: row.fix_time,
          updatedAt: row.updated_at
        }
      ])
    );
  }
}

