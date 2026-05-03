import express from 'express';
import AdminJS from 'adminjs';
import { buildAuthenticatedRouter } from '@adminjs/express';
import * as AdminJSTypeorm from '@adminjs/typeorm';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';

import provider from './admin/auth-provider.js';
import options from './admin/options.js';
import initializeDb from './db/index.js';
import maintenanceRouter from './admin/routes/maintenance.js';
import balancesRouter from './admin/routes/balances.js';
import outstandingBalanceRouter from './admin/routes/outstanding-balance.js';
import withdrawRequestsRouter from './admin/routes/withdraw-requests.js';

const port = process.env.PORT || 3000;

const start = async () => {
  const app = express();

  AdminJS.registerAdapter({
    Database: AdminJSTypeorm.Database,
    Resource: AdminJSTypeorm.Resource,
  });

  await initializeDb();

  const admin = new AdminJS(options);

  if (process.env.NODE_ENV === 'production') {
    await admin.initialize();
  } else {
    admin.watch();
  }

  app.use(express.static('public'));

  const SQLiteStore = connectSqlite3(session);
  const sqliteStoreInstance = new SQLiteStore({
    db: 'sessions.sqlite',
    dir: './.adminjs',
    table: 'sessions',
  }) as any;

  const router = buildAuthenticatedRouter(
    admin,
    {
      cookiePassword: process.env.COOKIE_SECRET,
      cookieName: 'adminjs',
      provider,
    },
    null,
    {
      store: sqliteStoreInstance,
      secret: process.env.COOKIE_SECRET,
      saveUninitialized: false,
      resave: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    },
  );

  app.use(admin.options.rootPath, router);

  app.use('/admin/maintenance', maintenanceRouter);
  app.use('/admin/balances', balancesRouter);
  app.use('/admin/outstanding-balance', outstandingBalanceRouter);
  app.use('/admin/withdraw-requests', withdrawRequestsRouter);

  app.listen(port, () => {
    console.log(`AdminJS available at http://localhost:${port}${admin.options.rootPath}`);
  });
};

start();
