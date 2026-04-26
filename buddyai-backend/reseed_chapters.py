"""
Run this once to populate the backend DB with all chapters using stable IDs.
These IDs must match what the frontend db.ts uses.
"""
import sqlite3, json, sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path

DB_PATH = Path(__file__).parent / "buddyai.db"

SUBJECTS = [
    ("math-9",  "Mathematics",    9,  "📐"),
    ("sci-9",   "Science",        9,  "🔬"),
    ("eng-9",   "English",        9,  "📖"),
    ("sst-9",   "Social Science", 9,  "🌍"),
    ("hin-9",   "Hindi",          9,  "🔤"),
    ("math-10", "Mathematics",   10,  "📐"),
    ("sci-10",  "Science",       10,  "🔬"),
    ("eng-10",  "English",       10,  "📖"),
    ("sst-10",  "Social Science",10,  "🌍"),
    ("hin-10",  "Hindi",         10,  "🔤"),
]

CHAPTERS = [
    # id, subject_id, num, title, content, summary, key_topics
    ("math-9-ch1","math-9",1,"Number Systems",
     "Chapter 1: Number Systems\n\nRational numbers can be written as p/q. Irrational numbers like sqrt(2) and pi cannot. Together they form Real Numbers.\n\nKey Concepts:\n1. Rational Numbers: p/q where q≠0. Examples: 3, 2/7, 0.75\n2. Irrational Numbers: non-repeating, non-terminating decimals. Examples: sqrt(2), pi\n3. Real Numbers: all rational + irrational numbers\n4. Laws of Exponents: a^m x a^n = a^(m+n)\n\nSummary: Real numbers include rational and irrational numbers.",
     "Real numbers include rational and irrational numbers.",
     '["Rational Numbers","Irrational Numbers","Real Numbers","Laws of Exponents"]'),

    ("math-9-ch2","math-9",2,"Polynomials",
     "Chapter 2: Polynomials\n\nA polynomial is a₀+a₁x+...+aₙxⁿ.\n\nKey Concepts:\n1. Degree: highest power of variable\n2. Types: constant(0), linear(1), quadratic(2), cubic(3)\n3. Zeroes: value of x where polynomial=0\n4. Factorisation: (a+b)²=a²+2ab+b²\n\nSummary: Polynomials are fundamental in algebra.",
     "Polynomials, degrees, types, and factorisation.",
     '["Polynomial Definition","Degree of Polynomial","Types of Polynomials","Zeroes of Polynomial","Factorisation"]'),

    ("math-9-ch3","math-9",3,"Coordinate Geometry",
     "Chapter 3: Coordinate Geometry\n\nKey Concepts:\n1. Cartesian Plane: x-axis and y-axis\n2. Coordinates: (x,y) identify a point\n3. Quadrants: I, II, III, IV\n4. Distance Formula: d=sqrt((x2-x1)²+(y2-y1)²)\n5. Midpoint: ((x1+x2)/2,(y1+y2)/2)\n\nSummary: Coordinate geometry uses algebra to study shapes.",
     "Cartesian plane and coordinate geometry concepts.",
     '["Cartesian Plane","Coordinates","Quadrants","Distance Formula","Section Formula"]'),

    ("sci-9-ch1","sci-9",1,"Matter in Our Surroundings",
     "Chapter 1: Matter in Our Surroundings\n\nMatter has mass and occupies space.\n\nKey Concepts:\n1. Three States: Solid (definite shape+volume), Liquid (definite volume), Gas (no definite shape/volume)\n2. Intermolecular Forces: hold particles together\n3. Effect of Heat: solid→liquid→gas\n4. Evaporation: liquid→gas at any temperature\n\nSummary: Matter exists in three states due to particle arrangement.",
     "Physical nature and three states of matter.",
     '["Physical Nature of Matter","Three States of Matter","Intermolecular Forces","Effect of Heat","Evaporation"]'),

    ("sci-9-ch2","sci-9",2,"Atoms and Molecules",
     "Chapter 2: Atoms and Molecules\n\nKey Concepts:\n1. Atom: smallest unit in chemical reactions\n2. Molecule: two or more atoms combined\n3. Chemical Formula: e.g. H2O, CO2\n4. Molecular Mass: sum of atomic masses\n5. Mole: 6.022×10²³ particles\n\nSummary: Atoms and molecules are the basis of all matter.",
     "Atoms, molecules, and chemical formulas.",
     '["Atom","Molecule","Chemical Formula","Molecular Mass","Mole Concept"]'),

    ("sci-9-ch3","sci-9",3,"The Fundamental Unit of Life",
     "Chapter 3: The Fundamental Unit of Life\n\nKey Concepts:\n1. Cell: smallest structural unit of life\n2. Cell Membrane: controls entry/exit\n3. Nucleus: control center\n4. Cell Wall: only in plant cells\n5. Organelles: mitochondria (energy), ribosomes (protein)\n\nSummary: Cells are the fundamental units of life.",
     "Cells as the fundamental unit of life.",
     '["Cell Structure","Cell Membrane","Nucleus","Cell Wall","Organelles"]'),

    ("sci-9-ch4","sci-9",4,"Structure of the Atom",
     "Chapter 4: Structure of the Atom\n\nKey Concepts:\n1. Sub-atomic particles: Proton(+), Neutron(0), Electron(-)\n2. Thomson model: electrons in positive sphere\n3. Rutherford model: nucleus with electrons orbiting\n4. Bohr model: electrons in fixed orbits\n5. Atomic number: number of protons\n\nSummary: Atoms have protons, neutrons, and electrons.",
     "Structure of atom with protons, neutrons, electrons.",
     '["Sub-atomic particles","Atomic Number","Mass Number","Bohr Model","Rutherford Model"]'),

    ("eng-9-ch1","eng-9",1,"The Fun They Had",
     "Chapter 1: The Fun They Had by Isaac Asimov\n\nSet in 2157, Margie and Tommy find an old book about school. Mechanical teachers replace humans.\n\nKey Concepts:\n1. Setting: year 2157\n2. Characters: Margie (11), Tommy (13), mechanical teacher\n3. Theme: technology in education vs human teaching\n4. Symbolism: old school=human connection\n\nSummary: Technology may change education but human connection remains vital.",
     "Science fiction story about future education.",
     '["Setting","Characters","Theme","Narrative Point of View","Symbolism"]'),

    ("eng-9-ch2","eng-9",2,"The Sound of Music",
     "Chapter 2: The Sound of Music\n\nEvelyn became deaf at age 8 but became one of Britain's finest violinists.\n\nKey Concepts:\n1. Evelyn: born 1914, deaf at 8\n2. Achievement: renowned violinist\n3. Overcoming Adversity: turned deafness into strength\n4. Inspiration: inspired deaf children\n\nSummary: Determination helps overcome any challenge.",
     "Inspiring story of deaf violinist Evelyn Dale.",
     '["Background","Achievement","Overcoming Adversity","Inspiration","Famous Quote"]'),

    ("sst-9-ch1","sst-9",1,"French Revolution",
     "Chapter 1: The French Revolution (1789-1799)\n\nKey Concepts:\n1. Causes: social inequality, financial crisis, Enlightenment\n2. Storming of Bastille: July 14, 1789\n3. Declaration: Liberty, Equality, Fraternity\n4. Reign of Terror: 1793-1794\n5. Napoleon: rose to power 1799\n\nSummary: French Revolution ended feudalism and spread democratic ideas.",
     "French Revolution and its impact on world history.",
     '["Causes","Important Events","Declaration of Rights","End of Feudalism","Legacy"]'),

    ("sst-9-ch2","sst-9",2,"Socialism in Europe",
     "Chapter 2: Socialism in Europe\n\nKey Concepts:\n1. Origins: response to industrialisation inequalities\n2. Karl Marx: developed scientific socialism\n3. Communist Manifesto (1848): Workers of the world, unite!\n4. Russian Revolution: October 1917\n5. Planned Economy: government controls production\n\nSummary: Socialism arose as a response to capitalist inequalities.",
     "Rise of socialism in Europe and Russia.",
     '["Origins","Karl Marx","Communist Manifesto","Russian Revolution","Planned Economy"]'),

    ("sst-9-ch3","sst-9",3,"Nazism and the Rise of Hitler",
     "Chapter 3: Nazism and the Rise of Hitler\n\nKey Concepts:\n1. Causes: Treaty of Versailles, economic crisis\n2. Nazi Party: founded 1920\n3. Hitler: Chancellor 1933\n4. Holocaust: 6 million Jews killed 1941-1945\n5. WWII: 1939-1945\n\nSummary: Extremism and propaganda can lead to catastrophic consequences.",
     "Rise of Nazism in Germany and the Holocaust.",
     '["Causes","Nazi Party","Hitlers Rise","Holocaust","World War II"]'),

    ("hin-9-ch1","hin-9",1,"दो बैलों की कथा",
     "पाठ 1: दो बैलों की कथा\n\nमुख्य बिंदु:\n1. दो बैल एक साथ खेत जोतते थे\n2. एकता और साहस का संदेश\n3. सच्ची मित्रता से कठिनाइयाँ पार होती हैं\n\nसारांश: एकजुट होकर किसी भी कठिनाई का सामना किया जा सकता है।",
     "दो बैलों की मित्रता और एकता की कथा।",
     '["बैलों की जोड़ी","जंगल में आँधी","एकता और साहस","मित्रता","सहयोग"]'),

    ("math-10-ch1","math-10",1,"Real Numbers",
     "Chapter 1: Real Numbers\n\nKey Concepts:\n1. Euclid's Division Lemma: a=bq+r, 0≤r<b\n2. Fundamental Theorem of Arithmetic: every composite = unique prime product\n3. Decimal Expansions: rational = terminating or repeating\n4. Irrational: non-terminating non-repeating\n5. LCM × HCF = product of two numbers\n\nSummary: Real numbers explored via Euclid's lemma and prime factorisation.",
     "Real numbers, Euclid's lemma, and number theory.",
     '["Euclids Division Lemma","Fundamental Theorem of Arithmetic","Decimal Expansions","Irrational Numbers","Operations on Real Numbers"]'),

    ("math-10-ch2","math-10",2,"Polynomials",
     "Chapter 2: Polynomials\n\nKey Concepts:\n1. Zeroes and coefficients relationship\n2. For ax²+bx+c: sum of zeroes=-b/a, product=c/a\n3. Division Algorithm: p(x)=q(x)g(x)+r(x)\n4. Remainder Theorem: remainder when divided by (x-a) is p(a)\n\nSummary: Polynomials' zeroes relate to their coefficients.",
     "Polynomials, zeroes, and division algorithm.",
     '["Polynomial Definition","Zeroes of Polynomial","Relationship Between Zeroes and Coefficients","Division Algorithm","Remainder Theorem"]'),

    ("math-10-ch3","math-10",3,"Quadratic Equations",
     "Chapter 3: Quadratic Equations\n\nStandard form: ax²+bx+c=0, a≠0\n\nKey Concepts:\n1. Roots: solutions of ax²+bx+c=0\n2. Discriminant: D=b²-4ac\n3. Quadratic Formula: x=(-b±√D)/2a\n4. D>0: real unequal roots\n5. D=0: real equal roots; D<0: no real roots\n\nSummary: Discriminant determines nature of roots.",
     "Quadratic equations and their solutions.",
     '["Standard Form","Roots","Discriminant","Quadratic Formula","Nature of Roots"]'),

    ("sci-10-ch1","sci-10",1,"Chemical Reactions and Equations",
     "Chapter 1: Chemical Reactions and Equations\n\nKey Concepts:\n1. Chemical Reaction: substances transform into new ones\n2. Balancing: equal atoms on both sides\n3. Types: Combination, Decomposition, Displacement, Double Displacement\n4. Oxidation-Reduction: gain/loss of oxygen\n5. Examples: 2H₂+O₂→2H₂O\n\nSummary: Chemical equations represent reactions with conservation of mass.",
     "Chemical reactions and equation balancing.",
     '["Chemical Reaction","Chemical Equation","Balancing Equations","Types of Reactions","Oxidation-Reduction"]'),

    ("sci-10-ch2","sci-10",2,"Acids Bases and Salts",
     "Chapter 2: Acids Bases and Salts\n\nKey Concepts:\n1. Acids: release H⁺, sour taste, turn litmus red\n2. Bases: release OH⁻, bitter taste, turn litmus blue\n3. Neutralisation: acid+base→salt+water\n4. pH Scale: 0-14, 7=neutral\n5. Salts: ionic compounds from acids and bases\n\nSummary: pH scale and neutralisation are key concepts.",
     "Acids, bases, salts, and their properties.",
     '["Acids","Bases","Neutralisation","pH Scale","Salts"]'),

    ("sci-10-ch3","sci-10",3,"Metals and Non-metals",
     "Chapter 3: Metals and Non-metals\n\nKey Concepts:\n1. Metals: lustrous, malleable, conduct electricity\n2. Non-metals: brittle, poor conductors\n3. Reactivity Series: K>Na>Ca>Mg>Al>Zn>Fe>Cu>Ag>Au\n4. Alloys: mixtures with improved properties\n5. Extraction: from ores using various methods\n\nSummary: Metals and non-metals differ in physical and chemical properties.",
     "Metals, non-metals, and reactivity series.",
     '["Physical Properties","Chemical Properties","Extraction","Alloys","Reactivity Series"]'),

    ("eng-10-ch1","eng-10",1,"A Letter to God",
     "Chapter 1: A Letter to God by Elena Garro\n\nLencho's crops are destroyed by hail. He writes a letter to God asking for 100 pesos. The postmaster collects money and sends 70 pesos.\n\nKey Concepts:\n1. Characters: Lencho, postmaster\n2. Theme: faith, hope, kindness\n3. Irony: Lencho doubts the postmaster's honesty\n4. Setting: remote Mexican village\n\nSummary: Pure faith and human kindness are the central themes.",
     "Story about faith, hope, and human kindness.",
     '["Characters","Setting","Theme","Symbolism","Resolution"]'),

    ("eng-10-ch2","eng-10",2,"Nelson Mandela",
     "Chapter 2: Nelson Mandela\n\nNelson Mandela spent 27 years in prison fighting apartheid, then became South Africa's first black president in 1994.\n\nKey Concepts:\n1. Apartheid: racial segregation system in South Africa\n2. Struggle: imprisoned 1962-1990\n3. Nobel Peace Prize: 1993\n4. Presidency: first black president 1994\n5. Values: reconciliation over revenge\n\nSummary: Mandela chose reconciliation, becoming a global symbol of peace.",
     "Nelson Mandela's fight against apartheid.",
     '["Background","Apartheid","Struggle","Presidency","Values"]'),

    ("sst-10-ch1","sst-10",1,"Nationalism in India",
     "Chapter 1: Nationalism in India\n\nKey Concepts:\n1. Swadeshi Movement: use Indian goods\n2. Indian National Congress: founded 1885\n3. Non-Cooperation Movement: 1920\n4. Civil Disobedience: 1930 Salt March\n5. Partition: 1947\n\nSummary: Indian nationalism emerged through anti-colonial struggle.",
     "Rise of nationalism in India.",
     '["Swadeshi Movement","Indian National Congress","Non-Cooperation Movement","Civil Disobedience","Partition"]'),

    ("sst-10-ch2","sst-10",2,"The Nationalist Movement in Indo-China",
     "Chapter 2: The Nationalist Movement in Indo-China\n\nIndo-China (Vietnam, Laos, Cambodia) was under French colonial rule from 1885, then Japanese occupation 1941-1945.\n\nKey Concepts:\n1. French Colonisation: 1885-1945\n2. Japanese Occupation: 1941-1945 during WWII\n3. Ho Chi Minh: leader of Vietnamese independence, lived 1890-1969\n4. Viet Minh: revolutionary independence organization founded 1941\n5. First Indochina War: 1946-1954, ended with Geneva Accords\n\nImportant Facts:\n- French colonized Indo-China: 1885\n- Ho Chi Minh founded Viet Minh: 1941\n- First Indochina War: 1946-1954\n- Geneva Accords: 1954 divided Vietnam at 17th parallel\n- Vietnam War: 1955-1975\n\nSummary: The nationalist movement in Indo-China shows how colonies fought for freedom. French colonisation was replaced by a long independence struggle led by Ho Chi Minh and the Viet Minh.",
     "Nationalist movement in Vietnam against French colonisation.",
     '["French Colonisation","Japanese Occupation","Ho Chi Minh","Viet Minh","Independence"]'),

    ("sst-10-ch3","sst-10",3,"Industrialisation",
     "Chapter 3: Industrialisation\n\nKey Concepts:\n1. Industrial Revolution: started Britain 1760s\n2. Factory System: production moved to factories\n3. Urbanisation: people moved to cities\n4. Problems: pollution, child labour, poor conditions\n5. Spread: Britain → Europe → USA → Japan\n\nSummary: Industrialisation brought progress and problems.",
     "Industrial revolution and its global impact.",
     '["Industrial Revolution","Factory System","Urbanisation","Problems","Spread"]'),

    ("hin-10-ch1","hin-10",1,"सूरदास के पद",
     "पाठ 1: सूरदास के पद\n\nसूरदास (1478-1581) हिंदी के महान भक्त कवि थे। उनके पदों में कृष्ण प्रेम और भक्ति भावना है।\n\nमुख्य बिंदु:\n1. भक्ति भाव\n2. कृष्ण की बाल लीलाएँ\n3. सरल और मधुर भाषा\n\nसारांश: सूरदास के पद भक्ति साहित्य के रत्न हैं।",
     "सूरदास जी के प्रसिद्ध भक्ति पद।",
     '["सूरदास जी","भक्ति भाव","कृष्ण प्रेम","बाल लीलाएँ","संत कवि"]'),
]

def reseed():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Ensure subjects exist
    for sid, name, grade, emoji in SUBJECTS:
        cursor.execute(
            "INSERT OR IGNORE INTO subjects (id, name, grade, icon_emoji, display_order) VALUES (?,?,?,?,?)",
            (sid, name, grade, emoji, 1)
        )

    # Upsert all chapters
    for row in CHAPTERS:
        cid, subj_id, num, title, content, summary, topics = row
        cursor.execute("""
            INSERT INTO chapters (id, subject_id, chapter_number, title, content, content_summary, key_topics, is_published)
            VALUES (?,?,?,?,?,?,?,1)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                content=excluded.content,
                content_summary=excluded.content_summary,
                key_topics=excluded.key_topics,
                is_published=1
        """, (cid, subj_id, num, title, content, summary, topics))
        print(f"  OK {cid}: {title}")

    conn.commit()
    conn.close()
    print("\nAll chapters seeded successfully.")

if __name__ == "__main__":
    reseed()
