import Database, { type Database as SqliteDatabase } from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'bus.db');

const db: SqliteDatabase = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS bus_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      route_number TEXT UNIQUE NOT NULL,
      start_station TEXT NOT NULL,
      end_station TEXT NOT NULL,
      first_bus_time TEXT NOT NULL,
      last_bus_time TEXT NOT NULL,
      price REAL DEFAULT 2.0,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS route_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      stop_order INTEGER NOT NULL,
      distance_km REAL DEFAULT 0,
      FOREIGN KEY (route_id) REFERENCES bus_routes(id) ON DELETE CASCADE,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      wait_time_rating INTEGER NOT NULL CHECK(wait_time_rating BETWEEN 1 AND 5),
      crowdedness_rating INTEGER NOT NULL CHECK(crowdedness_rating BETWEEN 1 AND 5),
      comment TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (route_id) REFERENCES bus_routes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      route_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (route_id) REFERENCES bus_routes(id) ON DELETE CASCADE,
      UNIQUE(user_id, route_id)
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      query TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed data
  const existingRoutes = db.prepare('SELECT COUNT(*) as count FROM bus_routes').get() as { count: number };
  if (existingRoutes.count > 0) return;

  console.log('Seeding database with initial data...');

  const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
  const adminHash = bcrypt.hashSync('123456', 10);
  const userHash = bcrypt.hashSync('123456', 10);
  insertUser.run('admin', adminHash, 'admin');
  insertUser.run('user', userHash, 'user');

  const insertRoute = db.prepare(`
    INSERT INTO bus_routes (name, route_number, start_station, end_station, first_bus_time, last_bus_time, price, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertStation = db.prepare('INSERT INTO stations (name, latitude, longitude) VALUES (?, ?, ?)');
  const insertRouteStation = db.prepare('INSERT INTO route_stations (route_id, station_id, stop_order, distance_km) VALUES (?, ?, ?, ?)');

  const routesData = [
    {
      name: '火车站 — 科技园',
      route_number: '1',
      start_station: '火车站',
      end_station: '科技园',
      first_bus_time: '06:00',
      last_bus_time: '22:30',
      price: 2.0,
      description: '贯穿城市东西的主干线路，连接火车站和高新科技园区',
      stations: [
        { name: '火车站', lat: 31.23, lng: 121.47, dist: 0 },
        { name: '人民广场', lat: 31.23, lng: 121.48, dist: 1.2 },
        { name: '南京路', lat: 31.23, lng: 121.49, dist: 0.8 },
        { name: '外滩', lat: 31.24, lng: 121.49, dist: 1.5 },
        { name: '陆家嘴', lat: 31.24, lng: 121.50, dist: 1.0 },
        { name: '世纪大道', lat: 31.23, lng: 121.52, dist: 1.8 },
        { name: '张江高科', lat: 31.21, lng: 121.59, dist: 3.2 },
        { name: '科技园', lat: 31.20, lng: 121.61, dist: 1.5 },
      ],
    },
    {
      name: '大学城 — 体育中心',
      route_number: '2',
      start_station: '大学城',
      end_station: '体育中心',
      first_bus_time: '06:30',
      last_bus_time: '21:00',
      price: 2.0,
      description: '途经多所高校，连接大学城和体育中心',
      stations: [
        { name: '大学城', lat: 31.03, lng: 121.43, dist: 0 },
        { name: '交通大学', lat: 31.03, lng: 121.44, dist: 1.0 },
        { name: '徐家汇', lat: 31.20, lng: 121.44, dist: 2.5 },
        { name: '衡山路', lat: 31.21, lng: 121.45, dist: 0.9 },
        { name: '淮海路', lat: 31.22, lng: 121.46, dist: 1.3 },
        { name: '新天地', lat: 31.22, lng: 121.48, dist: 1.0 },
        { name: '老西门', lat: 31.22, lng: 121.49, dist: 0.8 },
        { name: '体育中心', lat: 31.18, lng: 121.44, dist: 2.1 },
      ],
    },
    {
      name: '机场快线',
      route_number: '3',
      start_station: '浦东机场',
      end_station: '购物中心',
      first_bus_time: '05:30',
      last_bus_time: '23:00',
      price: 5.0,
      description: '机场直达线路，连接浦东机场与市中心商业区',
      stations: [
        { name: '浦东机场', lat: 31.14, lng: 121.81, dist: 0 },
        { name: '机场保税区', lat: 31.16, lng: 121.78, dist: 3.0 },
        { name: '龙阳路', lat: 31.20, lng: 121.55, dist: 8.5 },
        { name: '世纪公园', lat: 31.21, lng: 121.54, dist: 1.2 },
        { name: '静安寺', lat: 31.22, lng: 121.45, dist: 4.5 },
        { name: '南京西路', lat: 31.23, lng: 121.46, dist: 0.9 },
        { name: '人民广场', lat: 31.23, lng: 121.47, dist: 0.8 },
        { name: '购物中心', lat: 31.23, lng: 121.48, dist: 1.0 },
      ],
    },
    {
      name: '火车站 — 新区',
      route_number: '4',
      start_station: '火车站',
      end_station: '新区',
      first_bus_time: '06:00',
      last_bus_time: '22:00',
      price: 2.0,
      description: '贯穿南北的骨干线路，连接老城区和新开发区',
      stations: [
        { name: '火车站', lat: 31.25, lng: 121.46, dist: 0 },
        { name: '天目路', lat: 31.26, lng: 121.47, dist: 1.1 },
        { name: '虹口足球场', lat: 31.27, lng: 121.48, dist: 1.5 },
        { name: '五角场', lat: 31.30, lng: 121.51, dist: 2.8 },
        { name: '复旦大学', lat: 31.30, lng: 121.50, dist: 1.0 },
        { name: '黄兴路', lat: 31.31, lng: 121.52, dist: 1.5 },
        { name: '中原路', lat: 31.32, lng: 121.53, dist: 1.2 },
        { name: '新区', lat: 31.34, lng: 121.55, dist: 2.0 },
      ],
    },
    {
      name: '南部环线',
      route_number: '5',
      start_station: '南方公园',
      end_station: '医院',
      first_bus_time: '06:15',
      last_bus_time: '21:30',
      price: 2.0,
      description: '南部地区环线，途经公园、医院和居民区',
      stations: [
        { name: '南方公园', lat: 31.15, lng: 121.45, dist: 0 },
        { name: '梅陇', lat: 31.15, lng: 121.43, dist: 1.8 },
        { name: '莲花路', lat: 31.14, lng: 121.41, dist: 1.5 },
        { name: '莘庄', lat: 31.11, lng: 121.38, dist: 3.0 },
        { name: '南方商城', lat: 31.13, lng: 121.40, dist: 2.5 },
        { name: '锦江乐园', lat: 31.15, lng: 121.42, dist: 1.8 },
        { name: '上海南站', lat: 31.16, lng: 121.43, dist: 1.0 },
        { name: '医院', lat: 31.17, lng: 121.44, dist: 1.2 },
      ],
    },
    {
      name: '北部快线',
      route_number: '6',
      start_station: '市政府',
      end_station: '图书馆',
      first_bus_time: '06:45',
      last_bus_time: '20:30',
      price: 2.0,
      description: '北部快速公交线路，主要服务政府机关和文教区域',
      stations: [
        { name: '市政府', lat: 31.23, lng: 121.47, dist: 0 },
        { name: '人民大道', lat: 31.24, lng: 121.47, dist: 0.8 },
        { name: '上海博物馆', lat: 31.23, lng: 121.48, dist: 1.0 },
        { name: '大世界', lat: 31.23, lng: 121.49, dist: 0.9 },
        { name: '豫园', lat: 31.23, lng: 121.49, dist: 0.7 },
        { name: '城隍庙', lat: 31.23, lng: 121.50, dist: 0.8 },
        { name: '南浦大桥', lat: 31.21, lng: 121.50, dist: 2.0 },
        { name: '图书馆', lat: 31.20, lng: 121.49, dist: 1.5 },
      ],
    },
  ];

  const insertMany = db.transaction(() => {
    for (const routeData of routesData) {
      const routeResult = insertRoute.run(
        routeData.name,
        routeData.route_number,
        routeData.start_station,
        routeData.end_station,
        routeData.first_bus_time,
        routeData.last_bus_time,
        routeData.price,
        routeData.description
      );
      const routeId = routeResult.lastInsertRowid as number;

      for (let i = 0; i < routeData.stations.length; i++) {
        const s = routeData.stations[i];
        const stationResult = insertStation.run(s.name, s.lat, s.lng);
        const stationId = stationResult.lastInsertRowid as number;
        insertRouteStation.run(routeId, stationId, i + 1, s.dist);
      }
    }
  });

  insertMany();
  console.log('Database seeded successfully!');
}

export { db, initDatabase };
