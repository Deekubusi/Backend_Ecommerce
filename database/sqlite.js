const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "category-dashboard.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect SQLite:", err);
  } else {
    console.log("connection to SQLite database is success");
  }
});



const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      //this is users table creation
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
        //this is categories table creation
     db.run(
  `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    item_count INTEGER DEFAULT 0,
    image TEXT DEFAULT '',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
  `,
  (err) => {
    if (err) reject(err);
    else resolve();
  }
);

    });
  });
};


const userOperations = {
  //finding by email
  findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });
  },
    //finding by id
  findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT id, name, email FROM users WHERE id = ?",
        [id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });
  },

  create({ name, email, password }) {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, password],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, email });
        }
      );
    });
  },
};

const categoryOperations = {
  // getting categories by user
  findByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM categories WHERE created_by = ?",
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else {
            resolve(
              rows.map((row) => ({
                id: row.id,
                name: row.name,
                itemCount: row.item_count,
                image: row.image,
              }))
            );
          }
        }
      );
    });
  },

 //for creating new category
  create({ name, itemCount = 0, image = "", createdBy }) {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO categories (name, item_count, image, created_by)
        VALUES (?, ?, ?, ?)
        `,
        [name, itemCount, image, createdBy],
        function (err) {
          if (err) reject(err);
          else {
            resolve({
              id: this.lastID,
              name,
              itemCount,
              image,
            });
          }
        }
      );
    });
  },

  // upadating category
  update(id, userId, data) {
    return new Promise((resolve, reject) => {
      const { name, itemCount, image } = data;

      let sql = `UPDATE categories SET name = ?`;
      const params = [name];

      if (itemCount !== undefined) {
        sql += `, item_count = ?`;
        params.push(itemCount);
      }

      if (image !== undefined) {
        sql += `, image = ?`;
        params.push(image);
      }

      sql += ` WHERE id = ? AND created_by = ?`;
      params.push(id, userId);

      db.run(sql, params, function (err) {
        if (err) return reject(err);

        if (this.changes === 0) return resolve(null);

        db.get(
          "SELECT * FROM categories WHERE id = ?",
          [id],
          (err, row) => {
            if (err) reject(err);
            else {
              resolve({
                id: row.id,
                name: row.name,
                itemCount: row.item_count,
                image: row.image,
              });
            }
          }
        );
      });
    });
  },

  // deleteing category
  delete(id, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM categories WHERE id = ? AND created_by = ?",
        [id, userId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  },
};



module.exports = {
  db,
  initDatabase,
  userOperations,
  categoryOperations,
};
