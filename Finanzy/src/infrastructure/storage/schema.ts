export const SCHEMA_VERSION = 1;

export const schema = `
CREATE TABLE profile (id INTEGER PRIMARY KEY CHECK(id=1), name TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, normalizedName TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('income','expense')), icon TEXT NOT NULL, color TEXT NOT NULL, isArchived INTEGER NOT NULL DEFAULT 0 CHECK(isArchived IN(0,1)), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, UNIQUE(normalizedName,type));
CREATE TABLE recurring_expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL CHECK(kind IN('subscription','installment')), name TEXT NOT NULL, categoryId INTEGER NOT NULL REFERENCES categories(id), amountCents INTEGER NOT NULL CHECK(typeof(amountCents)='integer' AND amountCents>0), dueDay INTEGER NOT NULL CHECK(dueDay BETWEEN 1 AND 31), startMonth TEXT NOT NULL, installmentCount INTEGER, cancelledFromMonth TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, CHECK((kind='subscription' AND installmentCount IS NULL) OR (kind='installment' AND installmentCount>0)));
CREATE TABLE expense_occurrences (id INTEGER PRIMARY KEY AUTOINCREMENT, recurringExpenseId INTEGER NOT NULL REFERENCES recurring_expenses(id), referenceMonth TEXT NOT NULL, dueDate TEXT NOT NULL, amountCents INTEGER NOT NULL CHECK(typeof(amountCents)='integer' AND amountCents>0), name TEXT NOT NULL, categoryId INTEGER NOT NULL REFERENCES categories(id), installmentNumber INTEGER, status TEXT NOT NULL CHECK(status IN('pending','paid','cancelled')), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, UNIQUE(recurringExpenseId,referenceMonth));
CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT NOT NULL, categoryId INTEGER NOT NULL REFERENCES categories(id), type TEXT NOT NULL CHECK(type IN('income','expense')), amountCents INTEGER NOT NULL CHECK(typeof(amountCents)='integer' AND amountCents>0), date TEXT NOT NULL, observation TEXT, isFavorite INTEGER NOT NULL DEFAULT 0 CHECK(isFavorite IN(0,1)), occurrenceId INTEGER UNIQUE REFERENCES expense_occurrences(id), operationKey TEXT UNIQUE, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE TABLE budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, categoryId INTEGER NOT NULL UNIQUE REFERENCES categories(id), limitCents INTEGER NOT NULL CHECK(typeof(limitCents)='integer' AND limitCents>0), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE TABLE goals (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, targetCents INTEGER NOT NULL CHECK(typeof(targetCents)='integer' AND targetCents>0), deadline TEXT, icon TEXT, isArchived INTEGER NOT NULL DEFAULT 0 CHECK(isArchived IN(0,1)), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE TABLE goal_movements (id INTEGER PRIMARY KEY AUTOINCREMENT, goalId INTEGER NOT NULL REFERENCES goals(id), kind TEXT NOT NULL CHECK(kind IN('opening','deposit','withdrawal')), amountCents INTEGER NOT NULL CHECK(typeof(amountCents)='integer' AND amountCents>0), date TEXT NOT NULL, operationKey TEXT NOT NULL UNIQUE, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
CREATE TABLE commands (operationKey TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, result TEXT NOT NULL);
CREATE TABLE notification_records (logicalKey TEXT PRIMARY KEY, kind TEXT NOT NULL, occurrenceId INTEGER REFERENCES expense_occurrences(id) ON DELETE CASCADE, scheduledAt TEXT, nativeId TEXT, state TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE holiday_cache (year INTEGER PRIMARY KEY, payload TEXT NOT NULL, fetchedAt TEXT NOT NULL);
CREATE TABLE maintenance (id INTEGER PRIMARY KEY CHECK(id=1), action TEXT NOT NULL);
CREATE TABLE sync_state (id INTEGER PRIMARY KEY CHECK(id=1), dirty INTEGER NOT NULL DEFAULT 1);
INSERT INTO sync_state(id,dirty) VALUES(1,1);
CREATE INDEX transactions_date_type ON transactions(date,type);
CREATE INDEX transactions_category_date ON transactions(categoryId,date);
CREATE INDEX occurrences_due_status ON expense_occurrences(dueDate,status);
CREATE INDEX goal_movements_goal ON goal_movements(goalId);
`;
