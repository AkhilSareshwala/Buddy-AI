import sqlite3
conn = sqlite3.connect('buddyai.db')
cursor = conn.cursor()
cursor.execute("INSERT OR IGNORE INTO subjects (id, name, grade, icon_emoji) VALUES ('eng-9', 'English', 9, '📖')")
conn.commit()
cursor.execute("SELECT id, title FROM chapters WHERE id = 'nelson-mandela'")
print(cursor.fetchone())
conn.close()
print("Done")