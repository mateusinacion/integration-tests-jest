CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  house TEXT NOT NULL,
  title TEXT,
  alive INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO characters (name, house, title, alive) VALUES
  ('Jon Snow', 'Stark', 'Lord Commander of the Night''s Watch', 1),
  ('Arya Stark', 'Stark', NULL, 1),
  ('Sansa Stark', 'Stark', 'Queen in the North', 1),
  ('Eddard Stark', 'Stark', 'Warden of the North', 0),
  ('Daenerys Targaryen', 'Targaryen', 'Mother of Dragons', 0),
  ('Tyrion Lannister', 'Lannister', 'Hand of the King', 1),
  ('Cersei Lannister', 'Lannister', 'Queen of the Seven Kingdoms', 0),
  ('Jaime Lannister', 'Lannister', 'Kingslayer', 0),
  ('Brienne of Tarth', 'Tarth', 'Lord Commander of the Kingsguard', 1),
  ('Samwell Tarly', 'Tarly', 'Grand Maester', 1);
