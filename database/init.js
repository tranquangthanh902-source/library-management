const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Local: database/library.db
// Deploy: set DB_PATH=/data/library.db (Railway Volume)
const dbPath = process.env.DB_PATH || path.join(__dirname, 'library.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'admin',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  ddc_code TEXT
);
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isbn TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT,
  year INTEGER,
  category_id INTEGER,
  quantity INTEGER DEFAULT 1,
  available INTEGER DEFAULT 1,
  cover_image TEXT,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS readers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reader_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  reader_type TEXT DEFAULT 'Sinh viên',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'Hoạt động'
);
CREATE TABLE IF NOT EXISTS borrow_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reader_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  borrow_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT DEFAULT 'Đang mượn',
  notes TEXT,
  FOREIGN KEY(reader_id) REFERENCES readers(id) ON DELETE CASCADE,
  FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT
);
`);

const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (!count) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users(username,password_hash,full_name,email,role) VALUES (?,?,?,?,?)')
    .run('admin', hash, 'Quản trị viên', 'admin@thuvien.local', 'admin');
}

const categoryCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
if (!categoryCount) {
  const cats = [
    ['000 Tổng quát','Tin học, kiến thức tổng quát','000'],
    ['100 Triết học','Triết học và tâm lý học','100'],
    ['200 Tôn giáo','Tôn giáo và thần học','200'],
    ['300 Khoa học xã hội','Xã hội học, kinh tế, pháp luật','300'],
    ['400 Ngôn ngữ','Ngôn ngữ học','400'],
    ['500 Khoa học tự nhiên','Toán, lý, hóa, sinh học','500'],
    ['600 Công nghệ','Kỹ thuật, công nghệ, y học ứng dụng','600'],
    ['700 Nghệ thuật','Nghệ thuật và thể thao','700'],
    ['800 Văn học','Văn học Việt Nam và thế giới','800'],
    ['900 Lịch sử & Địa lý','Lịch sử, địa lý, du lịch','900']
  ];
  const stmt = db.prepare('INSERT INTO categories(name,description,ddc_code) VALUES (?,?,?)');
  cats.forEach(c => stmt.run(...c));
}

const bookCount = db.prepare('SELECT COUNT(*) AS c FROM books').get().c;
if (!bookCount) {
  const catIds = db.prepare('SELECT id FROM categories ORDER BY id').all().map(x=>x.id);
  const books = [
    ['9786041230011','Clean Code','Robert C. Martin','Prentice Hall',2008,catIds[5],5,'Cuốn sách kinh điển về viết mã nguồn sạch.'],
    ['9786041230012','Lập trình C cơ bản','Nguyễn Văn A','NXB Giáo dục',2023,catIds[5],8,'Giáo trình lập trình C dành cho sinh viên.'],
    ['9786041230013','JavaScript hiện đại','Nguyễn Văn B','NXB Thông tin',2024,catIds[6],6,'Nhập môn JavaScript và phát triển web.'],
    ['9786041230014','Cơ sở dữ liệu','Trần Văn C','NXB Đại học',2022,catIds[6],7,'Kiến thức nền tảng về cơ sở dữ liệu.'],
    ['9786041230015','Kỹ thuật lập trình','Lê Văn D','NXB Khoa học',2023,catIds[6],4,'Tư duy và kỹ thuật giải quyết bài toán.'],
    ['9786041230016','Nhà giả kim','Paulo Coelho','NXB Văn học',2021,catIds[8],10,'Tác phẩm văn học nổi tiếng.'],
    ['9786041230017','Tuổi trẻ đáng giá bao nhiêu','Rosie Nguyễn','NXB Hội Nhà Văn',2020,catIds[8],9,'Những chia sẻ dành cho người trẻ.'],
    ['9786041230018','Dế Mèn phiêu lưu ký','Tô Hoài','NXB Kim Đồng',2022,catIds[8],12,'Tác phẩm thiếu nhi kinh điển Việt Nam.'],
    ['9786041230019','Đắc nhân tâm','Dale Carnegie','NXB Tổng hợp',2019,catIds[1],8,'Nghệ thuật giao tiếp và ứng xử.'],
    ['9786041230020','Lược sử thời gian','Stephen Hawking','NXB Trẻ',2020,catIds[5],5,'Khám phá vũ trụ và thời gian.']
  ];
  const stmt=db.prepare(`INSERT INTO books(isbn,title,author,publisher,year,category_id,quantity,available,description)
    VALUES (?,?,?,?,?,?,?, ?,?)`);
  books.forEach(b=>stmt.run(b[0],b[1],b[2],b[3],b[4],b[5],b[6],b[6],b[7]));
}

const readerCount = db.prepare('SELECT COUNT(*) AS c FROM readers').get().c;
if (!readerCount) {
  const stmt=db.prepare(`INSERT INTO readers(reader_code,full_name,email,phone,address,reader_type)
    VALUES (?,?,?,?,?,?)`);
  for(let i=1;i<=20;i++){
    stmt.run(`DG${String(i).padStart(3,'0')}`,`Bạn đọc ${i}`,`reader${i}@example.com`,`09${String(10000000+i)}`,'Đà Nẵng','Sinh viên');
  }
}

module.exports = db;
