# High-Scale Energy Ingestion Engine

A high-performance backend system for ingesting and correlating EV charging telemetry data from two independent sources: **chargers** (AC energy consumption) and **vehicles** (DC energy delivery).

## Scale Requirements

The system is designed to handle **14.4 million records daily**:

- **10,000 chargers** reporting every **minute** = 14.4M meter readings/day
- **10,000 vehicles** reporting simultaneously during charging sessions

## Architecture Overview

### The Data Correlation Problem

EV charging infrastructure has a fundamental challenge: **two independent data streams** that must be correlated:

```
┌─────────────────┐                      ┌─────────────────┐
│   CHARGER       │                      │    VEHICLE      │
│                 │                      │                 │
│  Reports:       │                      │  Reports:       │
│  - meterId      │                      │  - vehicleId    │
│  - kwhConsumedAc│                      │  - chargerId    │
│  - voltage      │                      │  - soc          │
│  - timestamp    │                      │  - kwhDeliveredDc│
│                 │                      │  - batteryTemp  │
└────────┬────────┘                      └────────┬────────┘
         │                                        │
         │              ┌──────────┐              │
         └─────────────►│ CORRELATE├◄─────────────┘
                        │ BY       │
                        │ chargerId│
                        └────┬─────┘
                             │
                             ▼
                   ┌─────────────────┐
                   │  Analytics:     │
                   │  - AC consumed  │
                   │  - DC delivered │
                   │  - Efficiency % │
                   └─────────────────┘
```

### Solution: ChargerId-Based Correlation

The correlation strategy uses `chargerId` (meterId) as the linking key:

1. **Charger readings** are stored with their `meterId`
2. **Vehicle readings** include both `vehicleId` AND `chargerId` (the charger they're connected to)
3. **Analytics** correlates by querying meter readings for the same charger(s) a vehicle used

This enables calculating:

- **Charging efficiency**: DC energy delivered ÷ AC energy consumed
- **Energy losses**: Difference between AC input and DC output
- **Per-vehicle performance**: 24-hour summaries with correlated data

### Hot/Cold Data Path Architecture

To handle 14.4M records/day while maintaining fast dashboard access:

```
              ┌─────────────────────────────────────────────────────┐
              │                 Incoming Reading                    │
              └─────────────────────────┬───────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼                                       ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │    COLD DATA PATH     │             │     HOT DATA PATH     │
        │                       │             │                       │
        │  INSERT (append-only) │             │  UPSERT (update or    │
        │                       │             │  insert)              │
        │  • meter_readings     │             │  • charger_current_   │
        │  • vehicle_readings   │             │    status             │
        │                       │             │  • vehicle_current_   │
        │  Historical data for  │             │    status             │
        │  analytics & audit    │             │                       │
        │                       │             │  Latest state for     │
        │  Indexed by:          │             │  real-time dashboards │
        │  (chargerId+timestamp)│             │                       │
        │  (vehicleId+timestamp)│             │  Primary key:         │
        └───────────────────────┘             │  meterId / vehicleId  │
                                              └───────────────────────┘
```

**Cold Path Benefits:**

- Complete audit trail of all readings
- Time-series queries for analytics
- Composite indexes on (entityId + timestamp) for efficient range queries

**Hot Path Benefits:**

- O(1) lookup for current status of any charger/vehicle
- UPSERT eliminates read-before-write overhead
- Bounded table size (one row per entity)

### Database Schema

```sql
-- COLD DATA: Historical readings (append-only, grows continuously)
meter_readings
├── id (UUID, PK)
├── charger_id (indexed)    -- Links to meterId
├── kwh_consumed_ac
├── voltage
├── timestamp (indexed)
└── created_at

vehicle_readings
├── id (UUID, PK)
├── vehicle_id (indexed)
├── charger_id (indexed)    -- KEY: Links vehicle to charger for correlation
├── soc
├── kwh_delivered_dc
├── battery_temp
├── timestamp (indexed)
└── created_at

-- HOT DATA: Current status (bounded size, constantly updated)
charger_current_status
├── meter_id (PK)           -- One row per charger
├── kwh_consumed_ac
├── voltage
├── timestamp
└── updated_at

vehicle_current_status
├── vehicle_id (PK)         -- One row per vehicle
├── charger_id
├── soc
├── kwh_delivered_dc
├── battery_temp
├── timestamp
└── updated_at
```

## API Endpoints

### Meter Readings (Charger Telemetry)

| Method | Endpoint                 | Description                                 |
| ------ | ------------------------ | ------------------------------------------- |
| POST   | `/meter-readings`        | Ingest a single meter reading               |
| GET    | `/meter-readings/status` | Get all chargers' current status (hot path) |

### Vehicle Readings (Vehicle Telemetry)

| Method | Endpoint                   | Description                                 |
| ------ | -------------------------- | ------------------------------------------- |
| POST   | `/vehicle-readings`        | Ingest a single vehicle reading             |
| GET    | `/vehicle-readings/status` | Get all vehicles' current status (hot path) |

### Analytics

| Method | Endpoint                            | Description                                      |
| ------ | ----------------------------------- | ------------------------------------------------ |
| GET    | `/analytics/performance/:vehicleId` | 24-hour performance summary with correlated data |

**Example Analytics Response:**

```json
{
  "vehicleId": "VH-001",
  "timeRange": {
    "start": "2026-02-09T12:00:00.000Z",
    "end": "2026-02-10T12:00:00.000Z"
  },
  "totalEnergyConsumedAc": 45.5,
  "totalEnergyDeliveredDc": 41.2,
  "efficiencyRatio": 0.905,
  "avgBatteryTemperature": 32.5,
  "dataPoints": 1440
}
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### 1. Start the Database

```bash
cd api
docker compose -f docker/docker-compose.yml up -d
```

This starts:

- **PostgreSQL 15** on `localhost:5432`
- **pgAdmin** on `localhost:5050` (admin@fleet.com / admin)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Default configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=fleet_user
DB_PASSWORD=fleet_pass
DB_NAME=fleet_db
PORT=3000
```

### 4. Start the API Server

```bash
npm run start:dev
```

API available at `http://localhost:3000`

### 5. Test the Endpoints

**Ingest a meter reading:**

```bash
curl -X POST http://localhost:3000/meter-readings \
  -H "Content-Type: application/json" \
  -d '{
    "meterId": "CHG-001",
    "kwhConsumedAc": 15.5,
    "voltage": 240.0,
    "timestamp": "2026-02-10T12:00:00Z"
  }'
```

**Ingest a vehicle reading:**

```bash
curl -X POST http://localhost:3000/vehicle-readings \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VH-001",
    "chargerId": "CHG-001",
    "soc": 75,
    "kwhDeliveredDc": 14.2,
    "batteryTemp": 32.0,
    "timestamp": "2026-02-10T12:00:00Z"
  }'
```

**Get vehicle performance analytics:**

```bash
curl http://localhost:3000/analytics/performance/VH-001
```

## Technology Stack

- **NestJS** - TypeScript backend framework
- **TypeORM** - Database ORM with PostgreSQL
- **PostgreSQL 15** - Primary database
- **Luxon** - Date/time handling for analytics
- **class-validator** - DTO validation

## Project Structure

```
api/
├── src/
│   ├── meter-readings/          # Charger telemetry ingestion
│   │   ├── entities/
│   │   │   ├── meter-reading.entity.ts        # Cold path
│   │   │   └── charger-current-status.entity.ts # Hot path
│   │   └── meter-readings.service.ts
│   ├── vehicle-readings/        # Vehicle telemetry ingestion
│   │   ├── entities/
│   │   │   ├── vehicle-reading.entity.ts      # Cold path
│   │   │   └── vehicle-current-status.entity.ts # Hot path
│   │   └── vehicle-readings.service.ts
│   ├── analytics/               # Data correlation & analytics
│   │   └── analytics.service.ts
│   └── config/
│       └── typeorm.config.ts
├── docker/
    └── docker-compose.yml       # PostgreSQL + pgAdmin
```
