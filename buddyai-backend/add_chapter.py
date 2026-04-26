import sqlite3
conn = sqlite3.connect('buddyai.db')
cursor = conn.cursor()
cursor.execute('''
    INSERT OR IGNORE INTO chapters (id, subject_id, chapter_number, title, content, content_summary, key_topics)
    VALUES (?, ?, ?, ?, ?, ?, ?)
''', (
    'sci-9-ch2',
    'sci-9',
    2,
    'Atoms and Molecules',
    '''Chapter 2: Atoms and Molecules

Introduction:
Everything in the universe is made of tiny particles called atoms. Atoms are the building blocks of matter. Ancient Greek philosophers first proposed the idea of atoms, but it was John Dalton who gave the first scientific theory about atoms.

Key Concepts:
1. Atom: The smallest particle of an element that can take part in a chemical reaction
2. Molecule: A group of two or more atoms chemically bonded together
3. Atomic Mass Unit (amu): 1/12th of the mass of a carbon-12 atom
4. Mole Concept: 1 mole = 6.022 × 10²³ particles (Avogadro number)
5. Chemical Formula: Representation of a molecule using element symbols

Important Facts / Formulas:
- Mass of 1 atom of Carbon-12 = 1.992 × 10⁻²³ g
- Atomic mass = Mass of 1 atom × 12 / Mass of 1 carbon-12 atom
- Molar mass = Mass of 1 mole of substance

Summary:
Atoms combine to form molecules. The mole concept helps us count particles. Understanding atoms and molecules is fundamental to chemistry.''',
    'Atoms and molecules are the building blocks of matter.',
    '["Atom","Molecule","Atomic Mass Unit","Mole Concept","Chemical Formula"]'
))
conn.commit()
cursor.execute('SELECT id, title FROM chapters')
rows = cursor.fetchall()
for row in rows:
    print({"id": row[0], "title": row[1]})
conn.close()
print('Added Atoms and Molecules')