import sqlite3
chapters_to_add = [
    ('metals-nonmetals', 'sci-9', 3, 'Metals and Non-metals', 'Chapter 3: Metals and Non-metals\n\nIntroduction:\nAll matter is either a metal or non-metal. Metals are found on the left side of the periodic table, while non-metals are on the right. Metals like iron, copper, and gold have been used since ancient times.\n\nKey Concepts:\n1. Metals: Lustrous, malleable, good conductors of heat and electricity (e.g., Iron, Copper, Aluminum)\n2. Non-metals: Brittle, poor conductors (e.g., Oxygen, Nitrogen, Sulfur)\n3. Metalloids: Elements with properties of both (e.g., Silicon, Germanium)\n4. Reactivity Series: Metals arranged by reactivity\n5. Oxidation: Reaction with oxygen\n\nImportant Facts:\n- Sodium and potassium are highly reactive\n- Gold and silver are less reactive\n- Non-metals form oxides that are generally acidic', 'Metals and non-metals have different properties and uses.', '["Metals","Non-metals","Metalloids","Reactivity Series","Oxidation"]'),
    ('struc-atom', 'sci-9', 4, 'Structure of the Atom', 'Chapter 4: Structure of the Atom\n\nIntroduction:\nAtoms are made of even smaller particles called protons, neutrons, and electrons. J.J. Thomson discovered electrons. Rutherford discovered the nucleus.\n\nKey Concepts:\n1. Sub-atomic particles: Proton (+), Neutron (0), Electron (-)\n2. Thomson model: Electrons embedded in positive sphere\n3. Rutherford model: Nucleus with electrons around\n4. Bohr model: Electrons in fixed orbits\n5. Atomic number: Number of protons\n6. Mass number: Protons + Neutrons\n\nImportant Facts:\n- Proton determines element identity\n- Neutrons add mass\n- Electrons determine chemical behavior', 'Atoms have protons, neutrons, and electrons.', '["Sub-atomic particles","Atomic Number","Mass Number","Bohr Model"]'),
    ('poems-9', 'eng-9', 1, 'Poems', 'English poetry chapter.', 'English poetry.', '["Poetry"]'),
    ('prose-9', 'eng-9', 2, 'Prose', 'English prose chapter.', 'English prose.', '["Prose"]'),
    ('nelson-mandela', 'eng-9', 3, 'Nelson Mandela', 'Chapter about Nelson Mandelas life and works.', 'Biography of Nelson Mandela.', '["Biography"]'),
    ('dust-leaf', 'eng-9', 4, 'A Tale of Two Birds', 'Chapter about A Tale of Two Birds.', 'Folk tale.', '["Folk Tale"]'),
]

conn = sqlite3.connect('buddyai.db')
cursor = conn.cursor()
for c in chapters_to_add:
    cursor.execute('INSERT OR IGNORE INTO chapters (id, subject_id, chapter_number, title, content, content_summary, key_topics, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, 1)', c)
conn.commit()
cursor.execute('SELECT id, title FROM chapters')
for row in cursor.fetchall():
    print(row)
conn.close()
print('Added chapters')