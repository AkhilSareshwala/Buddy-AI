export interface Database {
  users: User[];
  sessions: ChatSession[];
  messages: Message[];
  subjects: Subject[];
  chapters: Chapter[];
  chapterSessions: ChapterSession[];
  testAttempts: TestAttempt[];
  testQuestions: TestQuestion[];
  weakTopics: WeakTopic[];
  chapterProgress: ChapterProgress[];
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  grade: string;
  streak: number;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  subject: string;
  topic: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  grade: number;
  iconEmoji: string;
  displayOrder: number;
  createdAt: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  chapterNumber: number;
  title: string;
  content: string;
  contentSummary: string;
  keyTopics: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterSession {
  id: string;
  studentId: string;
  chapterId: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface TestAttempt {
  id: string;
  studentId: string;
  chapterId: string;
  attemptNumber: number;
  status: string;
  score: number | null;
  totalQuestions: number;
  scorePercent: number | null;
  startedAt: string;
  completedAt: string | null;
}

export interface TestQuestion {
  id: string;
  attemptId: string;
  questionNumber: number;
  questionType: string;
  questionText: string;
  options: string | null;
  correctAnswer: string;
  explanation: string | null;
  topicTag: string | null;
  studentAnswer: string | null;
  isCorrect: boolean | null;
  answeredAt: string | null;
}

export interface WeakTopic {
  id: string;
  studentId: string;
  chapterId: string;
  topicName: string;
  timesWrong: number;
  timesCorrect: number;
  isResolved: boolean;
  lastUpdatedAt: string;
}

export interface ChapterProgress {
  id: string;
  studentId: string;
  chapterId: string;
  status: string;
  messagesCount: number;
  bestScorePercent: number | null;
  lastAccessedAt: string;
}

const DB_KEY = "buddyai_db";

const STABLE_ID_MARKER = "math-9-ch1"; // present only after migration to stable IDs

export async function initDatabase(): Promise<void> {
  try {
    const existing = localStorage.getItem(DB_KEY);

    if (!existing) {
      // Fresh install — seed from scratch
      const db: Database = {
        users: [], sessions: [], messages: [], subjects: [], chapters: [],
        chapterSessions: [], testAttempts: [], testQuestions: [], weakTopics: [], chapterProgress: [],
      };
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      await seedDatabase();
      return;
    }

    const db: Database = JSON.parse(existing);

    // Detect stale data: old chapter IDs were random UUIDs; new ones are slugs like 'math-9-ch1'
    const hasStableIds = db.chapters.some(c => c.id === STABLE_ID_MARKER);
    const needsReseed = db.subjects.length === 0 || db.chapters.length === 0 || !hasStableIds;

    if (needsReseed) {
      console.log("[BuddyAI] Migrating to stable chapter IDs...");
      // Preserve user accounts and messages, wipe stale chapter/subject data
      db.subjects = [];
      db.chapters = [];
      db.chapterSessions = [];
      db.chapterProgress = [];
      db.testAttempts = [];
      db.testQuestions = [];
      db.weakTopics = [];
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      await seedDatabase();
    }
  } catch (e) {
    console.error("Failed to init database:", e);
  }
}


export function getDb(): Database {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    return {
      users: [],
      sessions: [],
      messages: [],
      subjects: [],
      chapters: [],
      chapterSessions: [],
      testAttempts: [],
      testQuestions: [],
      weakTopics: [],
      chapterProgress: [],
    };
  }
  return JSON.parse(data);
}

function saveDb(db: Database): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function timestamp(): string {
  return new Date().toISOString();
}

async function seedDatabase(): Promise<void> {
  const db = getDb();

  // Stable subject IDs — must match backend SQLite
  const SUBJECT_IDS: Record<string, string> = {
    "math-9": "math-9",
    "sci-9": "sci-9",
    "eng-9": "eng-9",
    "sst-9": "sst-9",
    "hin-9": "hin-9",
    "math-10": "math-10",
    "sci-10": "sci-10",
    "eng-10": "eng-10",
    "sst-10": "sst-10",
    "hin-10": "hin-10",
  };

  const subjectsData = [
    { id: "math-9", name: "Mathematics", grade: 9, iconEmoji: "📐", displayOrder: 1 },
    { id: "sci-9", name: "Science", grade: 9, iconEmoji: "🔬", displayOrder: 2 },
    { id: "eng-9", name: "English", grade: 9, iconEmoji: "📖", displayOrder: 3 },
    { id: "sst-9", name: "Social Science", grade: 9, iconEmoji: "🌍", displayOrder: 4 },
    { id: "hin-9", name: "Hindi", grade: 9, iconEmoji: "🔤", displayOrder: 5 },
    { id: "math-10", name: "Mathematics", grade: 10, iconEmoji: "📐", displayOrder: 1 },
    { id: "sci-10", name: "Science", grade: 10, iconEmoji: "🔬", displayOrder: 2 },
    { id: "eng-10", name: "English", grade: 10, iconEmoji: "📖", displayOrder: 3 },
    { id: "sst-10", name: "Social Science", grade: 10, iconEmoji: "🌍", displayOrder: 4 },
    { id: "hin-10", name: "Hindi", grade: 10, iconEmoji: "🔤", displayOrder: 5 },
  ];

  for (const s of subjectsData) {
    db.subjects.push({ ...s, createdAt: timestamp() });
  }

  const chapters = getChapterData(SUBJECT_IDS);
  for (const c of chapters) {
    db.chapters.push({ ...c, createdAt: timestamp(), updatedAt: timestamp() });
  }

  saveDb(db);
}

function getChapterData(subjectIds: Record<string, string>): (Omit<Chapter, "createdAt" | "updatedAt">)[] {
  return [
    {
      id: "math-9-ch1",
      subjectId: subjectIds["math-9"],
      chapterNumber: 1,
      title: "Number Systems",
      content: `Chapter 1: Number Systems

Introduction:
The number system is the foundation of mathematics. In this chapter, we learn about different types of numbers that we use in our daily lives. Numbers help us count, measure, and compare things around us. Understanding number systems is essential for solving mathematical problems.

In Class 9, we focus on real numbers, which include both rational and irrational numbers. Rational numbers can be written as a fraction (like 3/4 or 7/2), while irrational numbers cannot be expressed as a simple fraction (like √2 or π).

Key Concepts:
1. Rational Numbers: Numbers that can be expressed as a fraction p/q where q is not zero. Examples: 3, -5, 2/7, 0.75
2. Irrational Numbers: Numbers that cannot be written as a fraction. Their decimal expansions are non-repeating and non-terminating. Examples: √2, √3, π
3. Real Numbers: The set of all rational and irrational numbers. Every point on the number line represents a real number.
4. Operations on Real Numbers: We can add, subtract, multiply, and divide real numbers following specific rules.
5. Representing Numbers on Number Line: Using decimal expansion and construction methods to locate numbers on a line.

Important Facts / Formulas:
- √2 ≈ 1.41421356
- √3 ≈ 1.7320508
- π ≈ 3.14159
- (√a)² = a for a ≥ 0
- √ab = √a × √b

Summary:
This chapter introduces us to the world of real numbers. We learned about rational and irrational numbers, their properties, and how to work with them. Understanding number systems helps us in algebra, geometry, and everyday calculations.`,
      contentSummary: "This chapter introduces students to real numbers, both rational and irrational.",
      keyTopics: ["Rational Numbers", "Irrational Numbers", "Real Numbers", "Operations on Real Numbers", "Representing Numbers on Number Line"],
      isPublished: true,
    },
    {
      id: "math-9-ch2",
      subjectId: subjectIds["math-9"],
      chapterNumber: 2,
      title: "Polynomials",
      content: `Chapter 2: Polynomials

Introduction:
Polynomials are algebraic expressions that contain variables and coefficients. They are used extensively in mathematics and science to represent relationships between quantities. Understanding polynomials is crucial for solving algebraic equations.

In this chapter, we learn about the degree of polynomials, their types, and how to perform operations on them. Polynomials form the basis for understanding more advanced algebraic concepts.

Key Concepts:
1. Polynomial: An algebraic expression of the form a₀ + a₁x + a₂x² + ... + aₙxⁿ where aₙ ≠ 0
2. Degree of Polynomial: The highest power of the variable in the polynomial
3. Types of Polynomials: Constant (degree 0), Linear (degree 1), Quadratic (degree 2), Cubic (degree 3)
4. Zeroes of a Polynomial: The value of x when the polynomial equals zero
5. Factorisation: Breaking a polynomial into factors

Important Facts / Formulas:
- (a + b)² = a² + 2ab + b²
- (a - b)² = a² - 2ab + b²
- (a + b)³ = a³ + 3a²b + 3ab² + b³
- (a - b)³ = a³ - 3a²b + 3ab² - b³
- a³ + b³ = (a + b)(a² - ab + b²)

Summary:
Polynomials are fundamental in algebra. We learned about their degrees, types, zeroes, and factorisation methods. This knowledge helps in solving equations and understanding algebraic relationships.`,
      contentSummary: "This chapter covers polynomials, their degrees, types, and factorisation.",
      keyTopics: ["Polynomial Definition", "Degree of Polynomial", "Types of Polynomials", "Zeroes of Polynomial", "Factorisation"],
      isPublished: true,
    },
    {
      id: "math-9-ch3",
      subjectId: subjectIds["math-9"],
      chapterNumber: 3,
      title: "Coordinate Geometry",
      content: `Chapter 3: Coordinate Geometry

Introduction:
Coordinate geometry combines algebra and geometry using a coordinate system. It allows us to represent geometric shapes using algebraic equations. The Cartesian plane, named after mathematician René Descartes, is the foundation of this system.

In this chapter, we learn about the Cartesian plane, coordinates of points, and how to calculate distances between points. This is useful in navigation, mapping, and many real-world applications.

Key Concepts:
1. Cartesian Plane: A plane with two perpendicular axes (x-axis and y-axis) intersecting at the origin
2. Coordinates: The x and y values that uniquely identify a point's position (x, y)
3. Quadrants: Four regions divided by the axes, numbered I, II, III, IV
4. Distance Formula: d = √[(x₂-x₁)² + (y₂-y₁)²] to find distance between two points
5. Section Formula: Finding coordinates that divide a line segment in a given ratio

Important Facts / Formulas:
- Origin (0, 0) is where axes meet
- Distance from origin: d = √(x² + y²)
- Midpoint: M = ((x₁+x₂)/2, (y₁+y₂)/2)
- Slope of line: m = (y₂-y₁)/(x₂-x₁)
- Equation of x-axis: y = 0
- Equation of y-axis: x = 0

Summary:
Coordinate geometry provides a powerful way to study geometric shapes using algebra. We learned about the Cartesian plane, coordinates, distance formula, and section formula. These concepts are used in navigation, engineering, and computer graphics.`,
      contentSummary: "This chapter introduces the Cartesian plane and coordinate geometry concepts.",
      keyTopics: ["Cartesian Plane", "Coordinates", "Quadrants", "Distance Formula", "Section Formula"],
      isPublished: true,
    },
    {
      id: "sci-9-ch1",
      subjectId: subjectIds["sci-9"],
      chapterNumber: 1,
      title: "Matter in Our Surroundings",
      content: `Chapter 1: Matter in Our Surroundings

Introduction:
Everything around us is made of matter. Matter is anything that has mass and occupies space. In this chapter, we explore the physical properties of matter and the three states in which it exists: solid, liquid, and gas.

Understanding matter helps us explain everyday observations like ice melting, water boiling, and how clouds form. Matter behaves differently under different conditions of temperature and pressure.

Key Concepts:
1. Physical Nature of Matter: Matter is made up of particles (atoms and molecules) with spaces between them
2. Three States of Matter: Solid (definite shape and volume), Liquid (definite volume, no definite shape), Gas (no definite shape or volume)
3. Intermolecular Forces: Forces between particles that hold them together
4. Effect of Heat: Adding heat increases particle movement, changing matter from solid to liquid to gas
5. Evaporation: Process where liquid changes to gas at any temperature

Important Facts / Formulas:
- Matter is made of tiny particles
- Particles are in continuous motion
- Heat energy converts solid → liquid → gas
- Evaporation causes cooling
- Density = Mass/Volume

Summary:
Matter exists in three states due to the arrangement and movement of particles. We learned about physical properties, effects of heat, and processes like evaporation and fusion. This knowledge applies to many daily phenomena.`,
      contentSummary: "This chapter explores the physical nature and three states of matter.",
      keyTopics: ["Physical Nature of Matter", "Three States of Matter", "Intermolecular Forces", "Effect of Heat", "Evaporation"],
      isPublished: true,
    },
    {
      id: "sci-9-ch2",
      subjectId: subjectIds["sci-9"],
      chapterNumber: 2,
      title: "Atoms and Molecules",
      content: `Chapter 2: Atoms and Molecules

Introduction:
Atoms are the building blocks of matter. Everything around us is made of atoms. Molecules are formed when atoms combine together. Understanding atoms and molecules helps us understand chemical reactions and the laws of chemical combination.

In this chapter, we learn about the structure of atoms, molecular compounds, and the rules for writing chemical formulas. The concept of mole helps us count atoms and molecules in given amounts.

Key Concepts:
1. Atom: Smallest unit of matter that takes part in chemical reactions
2. Molecule: Two or more atoms chemically combined
3. Chemical Formula: Representation of a compound using symbols (e.g., H₂O for water)
4. Molecular Mass: Sum of atomic masses of all atoms in a molecule
5. Mole Concept: 1 mole = 6.022 × 10²³ particles (Avogadro number)

Important Facts / Formulas:
- NaCl (Sodium Chloride)
- CO₂ (Carbon Dioxide)
- H₂SO₄ (Sulfuric Acid)
- Molecular Mass = Sum of atomic masses
- 1 mole = 6.022 × 10²³

Summary:
Atoms and molecules form the basis of all matter. We learned about atomic structure, molecular compounds, and how to write chemical formulas. This chapter connects chemistry to mathematics through molecular mass calculations.`,
      contentSummary: "This chapter introduces atoms, molecules, and chemical formulas.",
      keyTopics: ["Atom", "Molecule", "Chemical Formula", "Molecular Mass", "Mole Concept"],
      isPublished: true,
    },
    {
      id: "sci-9-ch3",
      subjectId: subjectIds["sci-9"],
      chapterNumber: 3,
      title: "The Fundamental Unit of Life",
      content: `Chapter 3: The Fundamental Unit of Life

Introduction:
Cells are the basic structural and functional units of all living organisms. The cell theory states that all living things are made of cells. Understanding the cell helps us understand how living things function.

In this chapter, we explore the structure of plant and animal cells, and the functions of different cell organelles. Cells are often called the fundamental unit of life.

Key Concepts:
1. Cell: The smallest structural and functional unit of life
2. Cell Membrane: Outer covering that controls what enters and leaves the cell
3. Nucleus: Control center that directs cell activities
4. Cell Wall: Rigid outer covering in plant cells (not in animal cells)
5. Organelles: Structures inside cell that perform specific functions (mitochondria, ribosomes, etc.)

Important Facts / Formulas:
- All living things are made of cells
- Cells come from pre-existing cells
- Plant cells have cell wall; animal cells don't
- Mitochondria: Powerhouse of the cell
- Ribosomes: Site of protein synthesis

Summary:
Cells are the fundamental units of life. We learned about cell structure in plants and animals, and the functions of various organelles. Understanding cells helps us understand how our bodies work.`,
      contentSummary: "This chapter explores cells as the fundamental unit of life.",
      keyTopics: ["Cell Structure", "Cell Membrane", "Nucleus", "Cell Wall", "Organelles"],
      isPublished: true,
    },
    {
      id: "eng-9-ch1",
      subjectId: subjectIds["eng-9"],
      chapterNumber: 1,
      title: "The Fun They Had",
      content: `Chapter 1: The Fun They Had

Introduction:
"The Fun They Had" is a science fiction story by Isaac Asimov that explores the future of education. The story is set in 2157 when robots teach children in schools. Margie and Tommy find an old book about school and compare it to their mechanical teaching.

This story makes us think about the role of teachers, the value of human interaction in learning, and how technology might change education.

Key Concepts:
1. Setting: The year 2157, a future world with robot teachers
2. Characters: Margie (11 years old), Tommy (13 years old), and the mechanical teacher
3. Theme: Technology in education, human vs. machine teaching
4. Narrative Point of View: Third person, focusing on Margie
5. Symbolism: The old school building represents human connection

Important Facts / Formulas:
- Isaac Asimov wrote the story in 1951
- The story shows concerns about automated education
- Margie was suspicious about the old school
- The County Inspector adjusts the mechanical teacher
- Tommy finds the book in the attic

Summary:
This story explores how technology might change education. The children in the story find joy in learning from books and human teachers, showing the importance of human connection in education.`,
      contentSummary: "A science fiction story about education in the future.",
      keyTopics: ["Setting", "Characters", "Theme", "Narrative Point of View", "Symbolism"],
      isPublished: true,
    },
    {
      id: "eng-9-ch2",
      subjectId: subjectIds["eng-9"],
      chapterNumber: 2,
      title: "The Sound of Music",
      content: `Chapter 2: The Sound of Music

Introduction:
This chapter features Evelyn Dale, a deaf musician who became a source of inspiration for millions. Despite being deaf from the age of 8, she learned to play the violin and performed across Europe. Her story teaches us about determination and overcoming obstacles.

Evelyn's journey shows that with passion and hard work, one can achieve anything despite challenges.

Key Concepts:
1. Background: Evelyn was born in 1914 and became deaf at age 8
2. Achievement: She became one of Britain's finest violinists
3. Overcoming Adversity: Used to being deaf as an asset, not hindrance
4. Inspiration: She inspired thousands of deaf children
5. Famous Quote: "Deaf? Perhaps. But in spite of the roar of the cannon, I have no doubt that music is still the supreme art."

Important Facts / Formulas:
- Born in 1914 in London
- Father was a music teacher
- Learned violin at age 8 despite being deaf
- Performed for Queen Elizabeth in 1957
- Inspired the film "Touch of the Violin"

Summary:
Evelyn's story teaches us about determination. Despite being deaf, she became a world-renowned violinist. Her story inspires us to overcome our challenges and pursue our dreams.`,
      contentSummary: "The inspiring story of deaf violinist Evelyn Dale.",
      keyTopics: ["Background", "Achievement", "Overcoming Adversity", "Inspiration", "Famous Quote"],
      isPublished: true,
    },
    {
      id: "eng-9-ch3",
      subjectId: subjectIds["eng-9"],
      chapterNumber: 3,
      title: "The Little Girl",
      content: `Chapter 3: The Little Girl

Introduction:
"The Little Girl" is a heartwarming story by Katherine Paterson about the relationship between a grandmother and granddaughter. The story explores how children sometimes see their grandparents in a new light as they grow older.

The little girl learns to understand her grandmother's strictness comes from love.

Key Concepts:
1. Characters: The little girl (narrator), grandmother (Kaya)
2. Setting: A small town in America
3. Theme: Understanding, love behind strict behavior
4. Character Development: The girl's perception of her grandmother changes
5. Symbolism: The white house symbolizes grandma's purity of love

Important Facts / Formulas:
- The girl hid when her grandmother called
- She thought grandma was cold and unfriendly
- One day she saw her grandmother crying
- She realized grandma's strictness was love
- She now understands and respects her

Summary:
This story teaches us about understanding and empathy. The little girl learns that our elders show love in different ways, and we need to understand their perspective.`,
      contentSummary: "A story about understanding between a granddaughter and grandmother.",
      keyTopics: ["Characters", "Setting", "Theme", "Character Development", "Symbolism"],
      isPublished: true,
    },
    {
      id: "sst-9-ch1",
      subjectId: subjectIds["sst-9"],
      chapterNumber: 1,
      title: "French Revolution",
      content: `Chapter 1: The French Revolution

Introduction:
The French Revolution (1789-1799) was a period of radical political and societal change in France. It began with the Storming of the Bastille on July 14, 1789, and ended with Napoleon's rise to power. The revolution changed the course of world history.

The revolution was caused by social inequality, financial crisis, and ideas from Enlightenment thinkers like Rousseau and Voltaire.

Key Concepts:
1. Causes: Social inequality, financial crisis, Enlightenment ideas
2. Important Events: Storming of Bastille, Reign of Terror, Rise of Napoleon
3. Declaration of Rights of Man: "Liberty, Equality, Fraternity"
4. End of Feudalism: Destruction of the old social order
5. Legacy: Ideas spread across Europe and the world

Important Facts / Formulas:
- Storming of Bastille: July 14, 1789 (Bastille Day in France)
- King Louis XVI executed: January 21, 1793
- Reign of Terror: 1793-1794
- Napoleon became Emperor: 1804
- Three Estates: Clergy, Nobles, Commoners

Summary:
The French Revolution was one of the most important events in modern history. It ended feudalism and promoted ideas of liberty, equality, and fraternity that inspires democratic movements worldwide.`,
      contentSummary: "This chapter covers the French Revolution and its impact.",
      keyTopics: ["Causes", "Important Events", "Declaration of Rights", "End of Feudalism", "Legacy"],
      isPublished: true,
    },
    {
      id: "sst-9-ch2",
      subjectId: subjectIds["sst-9"],
      chapterNumber: 2,
      title: "Socialism in Europe",
      content: `Chapter 2: Socialism in Europe

Introduction:
Socialism is an economic and political system where the community owns and controls the means of production. In this chapter, we learn about how socialism developed in Europe in the 19th century as a response to the problems caused by industrialisation.

Socialism aimed to create a more equal society by eliminating the ownership of production by a few.

Key Concepts:
1. Origins: Response to industrialisation and capitalist inequalities
2. Karl Marx: Developed scientific socialism with Friedrich Engels
3. Communist Manifesto: "Workers of the world, unite!"
4. Russian Revolution: 1917 - First successful socialist revolution
5. Planned Economy: Government controls production and distribution

Important Facts / Formulas:
- Published: The Communist Manifesto in 1848
- Key Work: Das Kapital (1867)
- Russian Revolution: October 1917
- USSR formed: 1922
- Cold War: capitalism vs. socialism (1947-1991)

Summary:
Socialism developed as a response to capitalist inequalities. We learned about Marx's theories, the Russian Revolution, and how socialist ideas shaped 20th century history.`,
      contentSummary: "This chapter explores the rise of socialism in Europe.",
      keyTopics: ["Origins", "Karl Marx", "Communist Manifesto", "Russian Revolution", "Planned Economy"],
      isPublished: true,
    },
    {
      id: "sst-9-ch3",
      subjectId: subjectIds["sst-9"],
      chapterNumber: 3,
      title: "Nazism and the Rise of Hitler",
      content: `Chapter 3: Nazism and the Rise of Hitler

Introduction:
Nazism was the extremist ideology of the Nazi Party in Germany led by Adolf Hitler. After Germany's defeat in World War I, economic crisis and national humiliation led to the rise of Nazism. This chapter examines how extremist movements gain power.

Understanding this period helps us prevent similar tragedies from happening again.

Key Concepts:
1. Causes: Treaty of Versailles, economic crisis, loss of national pride
2. Nazi Party: Founded 1920, named from "National Socialist"
3. Hitler's Rise: Became Chancellor in 1933
4. Holocaust: Systematic murder of 6 million Jews
5. World War II: Started 1939, ended 1945 with Hitler's death

Important Facts / Formulas:
- Treaty of Versailles: June 28, 1919
- Great Depression: 1929 worsened conditions
- Hitler became Chancellor: January 30, 1933
- Holocaust: 1941-1945
- World War II ended: May 8, 1945

Summary:
This chapter teaches us about the dangers of extremism, propaganda, and dictatorship. The rise of Hitler shows how economic crisis and national humiliation can lead to tragedy.`,
      contentSummary: "This chapter covers the rise of Nazism in Germany.",
      keyTopics: ["Causes", "Nazi Party", "Hitler's Rise", "Holocaust", "World War II"],
      isPublished: true,
    },
    {
      id: "hin-9-ch1",
      subjectId: subjectIds["hin-9"],
      chapterNumber: 1,
      title: "दो बैलों की कथा",
      content: `पाठ 1: दो बैलों की कथा

परिचय:
यह कथा हिंदी साहित्य की प्रसिद्ध कृति है। इस कथा में दो बैलों की जोड़ी के बारे में बताया गया है जो एक साथ खेत जोतते थे। एक दिन उनका मालिक उन्हें गाँव के पास के एक जंगल में छोड़कर जाता है।

कथा का उद्देश्य यह दर्शाना है कि सच्ची मित्रता और आपसी सहयोग से कठिनाइयों को पार किया जा सकता है।

मुख्य बिंदु:
1. दो बैल एक साथ खेत जोतते थे
2. मालिक उन्हें जंगल में छोड़कर गया
3. जंगल में भयंकर आँधी आई
4. दोनों बैलों ने मिलकर आँधी का सामना किया
5. सुबह पाते हैं कि वे सुरक्षित हैं

महत्वपूर्ण तथ्य:
- कथा का मूल संदेश: साहस और एकता
- पाठ की भाषा: सरल और सुगम
- पाठ का उद्देश्य: मित्रता का महत्व
- साहस से काम करने की प्रेरणा
- एकता में बल होता है

सारांश:
यह कथा बच्चों को साहस, एकता और मित्रता का संदेश देती है। दो बैलों की कहानी यह दर्शाती है कि एकजुट होकर किसी भी कठिनाई का सामना किया जा सकता है।`,
      contentSummary: "दो बैलों की मित्रता और एकता की प्रेरणादायक कथा।",
      keyTopics: ["बैलों की जोड़ी", "जंगल में आँधी", "एकता और साहस", "मित्रता", "सहयोग"],
      isPublished: true,
    },
    {
      id: "hin-9-ch2",
      subjectId: subjectIds["hin-9"],
      chapterNumber: 2,
      title: "ल्हासा की ओर",
      content: `पाठ 2: ल्हासा की ओर

परिचय:
'ल्हासा की ओर' तिब्बत की राजधानी ल्हासा की यात्रा का वर्णन है। यह पाठ तिब्बत की संस्कृति, प्राकृतिक सौंदर्य और वहाँ के लोगों के जीवन का परिचय देता है। तिब्बत को 'छतरी जैसा देश' भी कहा जाता है।

कथा में तिब्बत की ऊँचाई, वायु का अभाव, और वहाँ के जीवन का वर्णन है।

मुख्य बिंदु:
1. ल्हासा तिब्बत की राजधानी है
2. तिब्बत की ऊँचाई समुद्र से 12,000 फीट है
3. वहाँ वायु कम होती है
4. बौद्ध मठ और मंदिर हैं
5. पर्वत और नदियाँ सुंदर हैं

महत्वपूर्ण तथ्य:
- तिब्बत को 'छतरी जैसा देश' कहते हैं
- वायु का दबाव कम होता है
- यात्रा कठि�� ल���किन रोमांचक है
- बौद्ध धर्म का महत्व
- प्राकृतिक सौंदर्य अद्भुत है

सारांश:
यह पाठ हमें तिब्बत की संस्कृति और प्राकृतिक सौंदर्य से अवगत कराता है। ऊँचाई पर जीवन कठिन होता है लेकिन सुंदर भी।`,
      contentSummary: "ल्हासा और तिब्बत की संस्कृति का परिचय।",
      keyTopics: ["ल्हासा", "तिब्बत", "ऊँचाई", "बौद्ध संस्कृति", "प्राकृतिक सौंदर्य"],
      isPublished: true,
    },
    {
      id: "hin-9-ch3",
      subjectId: subjectIds["hin-9"],
      chapterNumber: 3,
      title: "साँवले सपनों की याद",
      content: `पाठ 3: साँवले सपनों की याद

परिचय:
'साँवले सपनों की याद' एक भावनापूर्ण कविता है जो बचपन की यादों को व्यक्त करती है। कवि ने अपने बचपन के दिनों को याद किया है जो अब विद्य हो गए हैं। यह कविता सभी को अपने बचपन की यादों से जोड़ती है।

कविता में प्रकृति, गाँव, और बचपन के दिनों का वर्णन है।

मुख्य बिंदु:
1. बचपन की खेती और खेत
2. नदी में स्नान और मछली पकड़ना
3. पेड़ों पर चढ़ना और फल तोड़ना
4. रात के आकाश में तारे देखना
5. दादा-दादी की कहानियाँ

महत्वपूर्ण तथ्य:
- कवि की प्रकृति प्रेम
- बचपन की पवित्र यादें
- सादगी में ख़ुशी
- परिवार और गाँव का महत्व
- समय बीतने का दर्द

सारांश:
यह कविता हमें बचपन की प्यारी यादों से जोड़ती है। कवि ने अपने बचपन के सुंदर दिनों को याद किया है जो अब सपने हो गए हैं।`,
      contentSummary: "बचपन की यादों और स्नेह की भावनापूर्ण कविता।",
      keyTopics: ["बचपन", "प्रकृति", "परिवार", "यादें", "सपने"],
      isPublished: true,
    },
    {
      id: "math-10-ch1",
      subjectId: subjectIds["math-10"],
      chapterNumber: 1,
      title: "Real Numbers",
      content: `Chapter 1: Real Numbers

Introduction:
Real numbers include all rational and irrational numbers. This chapter builds on Class 9 number systems and explores Euclid's division lemma, the Fundamental Theorem of Arithmetic, and decimal expansions.

Understanding real numbers is essential for higher mathematics and applications in science and engineering.

Key Concepts:
1. Euclid's Division Lemma: For any two positive integers a and b, there exist unique integers q and r such that a = bq + r, where 0 ≤ r < b
2. Fundamental Theorem of Arithmetic: Every composite number can be expressed as a product of prime numbers uniquely
3. Decimal Expansions: Rational numbers have terminating or repeating decimal expansions
4. Irrational Numbers: Non-terminating, non-repeating decimals that cannot be expressed as fractions
5. Operations: Adding, subtracting, multiplying, and dividing real numbers

Important Facts / Formulas:
- √2 is irrational
- √3 is irrational
- π is irrational (approximately 3.14159)
- LCM × HCF = Product of two numbers
- If √2 = a/b (in lowest terms), then 2 divides a and b, contradiction

Summary:
This chapter explores real numbers in depth. We learned about Euclid's lemma, prime factorisation, and how to differentiate between rational and irrational numbers.`,
      contentSummary: "This chapter covers real numbers, Euclid's lemma, and number theory.",
      keyTopics: ["Euclid's Division Lemma", "Fundamental Theorem of Arithmetic", "Decimal Expansions", "Irrational Numbers", "Operations on Real Numbers"],
      isPublished: true,
    },
    {
      id: "math-10-ch2",
      subjectId: subjectIds["math-10"],
      chapterNumber: 2,
      title: "Polynomials",
      content: `Chapter 2: Polynomials

Introduction:
A polynomial is an algebraic expression with variables and coefficients. This chapter covers the relationship between zeroes and coefficients, and the division algorithm for polynomials.

Polynomials are used extensively in engineering, physics, and economics to model real-world situations.

Key Concepts:
1. Polynomial: Expression in the form a₀ + a₁x + a₂x² + ... + aₙxⁿ
2. Zeroes of Polynomial: Values of x where p(x) = 0
3. Relationship between Zeroes and Coefficients: For quadratic ax² + bx + c, sum = -b/a, product = c/a
4. Division Algorithm: If p(x) is divided by g(x), then p(x) = q(x)g(x) + r(x)
5. Remainder Theorem: Remainder when divided by (x - a) is p(a)

Important Facts / Formulas:
- Linear polynomial: degree 1
- Quadratic polynomial: degree 2
- Cubic polynomial: degree 3
- Sum of zeroes = -b/a
- Product of zeroes = c/a

Summary:
We learned about polynomials, their zeroes, and the relationship between them. The division algorithm helps in factorising polynomials.`,
      contentSummary: "This chapter covers polynomials, zeroes, and the division algorithm.",
      keyTopics: ["Polynomial Definition", "Zeroes of Polynomial", "Relationship Between Zeroes and Coefficients", "Division Algorithm", "Remainder Theorem"],
      isPublished: true,
    },
    {
      id: "math-10-ch3",
      subjectId: subjectIds["math-10"],
      chapterNumber: 3,
      title: "Quadratic Equations",
      content: `Chapter 3: Quadratic Equations

Introduction:
A quadratic equation is a polynomial equation of degree 2. It has the form ax² + bx + c = 0, where a ≠ 0. This chapter covers methods to solve quadratic equations.

Quadratic equations are used in physics, business, and engineering to model situations involving squares.

Key Concepts:
1. Standard Form: ax² + bx + c = 0 where a ≠ 0
2. Roots: Solutions that satisfy the equation
3. Discriminant: D = b² - 4ac determines nature of roots
4. Quadratic Formula: x = (-b ± √D) / 2a
5. Nature of Roots: D > 0 (real and unequal), D = 0 (real and equal), D < 0 (no real roots)

Important Facts / Formulas:
- Sum of roots = -b/a
- Product of roots = c/a
- For D = 0, roots are real and equal
- For D > 0, roots are real and unequal
- For D < 0, roots are imaginary

Summary:
Quadratic equations are solved using factorisation, completing the square, and the quadratic formula. The discriminant tells us about the nature of roots.`,
      contentSummary: "This chapter covers quadratic equations and their solutions.",
      keyTopics: ["Standard Form", "Roots", "Discriminant", "Quadratic Formula", "Nature of Roots"],
      isPublished: true,
    },
    {
      id: "sci-10-ch1",
      subjectId: subjectIds["sci-10"],
      chapterNumber: 1,
      title: "Chemical Reactions and Equations",
      content: `Chapter 1: Chemical Reactions and Equations

Introduction:
Chemical reactions involve the transformation of substances into new substances with different properties. Writing chemical equations helps us understand these changes. This chapter covers types of chemical reactions and how to balance equations.

Key Concepts:
1. Chemical Reaction: Process where substances change into new substances
2. Chemical Equation: Representation using symbols and formulas
3. Balancing: Equal atoms on both sides (law of conservation of mass)
4. Types: Combination, Decomposition, Displacement, Double Displacement
5. Oxidation-Reduction: Gain/loss of oxygen or electrons

Important Facts / Formulas:
- Reactants → Products
- 2H₂ + O₂ → 2H₂O
- Fe + CuSO₄ → FeSO₄ + Cu
- Zn + HCl → ZnCl₂ + H₂
- NaOH + HCl → NaCl + H₂O

Summary:
Chemical reactions are the heart of chemistry. We learned to write and balance equations, and about different types of reactions including oxidation-reduction.`,
      contentSummary: "This chapter covers chemical reactions and how to write equations.",
      keyTopics: ["Chemical Reaction", "Chemical Equation", "Balancing Equations", "Types of Reactions", "Oxidation-Reduction"],
      isPublished: true,
    },
    {
      id: "sci-10-ch2",
      subjectId: subjectIds["sci-10"],
      chapterNumber: 2,
      title: "Acids Bases and Salts",
      content: `Chapter 2: Acids Bases and Salts

Introduction:
Acids, bases, and salts are three important classes of compounds. Acids taste sour, bases taste bitter and feel slippery, and salts are formed from the reaction between acids and bases. This chapter covers their properties and uses.

Understanding acids and bases is important in daily life, industry, and biology.

Key Concepts:
1. Acids: Release H⁺ ions, taste sour, turn litmus red
2. Bases: Release OH⁻ ions, taste bitter, turn litmus blue
3. Neutralisation: Acid + Base → Salt + Water
4. pH Scale: 0-14, 7 is neutral, <7 acidic, >7 basic
5. Salts: Ionic compounds formed from acids and bases

Important Facts / Formulas:
- HCl (Hydrochloric acid)
- NaOH (Sodium hydroxide)
- NaCl (Common salt)
- pH of lemon = 2
- pH of soap = 9-10

Summary:
Acids, bases, and salts are essential compounds. We learned about their properties, the pH scale, and neutralisation reactions that produce salts.`,
      contentSummary: "This chapter covers acids, bases, salts, and their properties.",
      keyTopics: ["Acids", "Bases", "Neutralisation", "pH Scale", "Salts"],
      isPublished: true,
    },
    {
      id: "sci-10-ch3",
      subjectId: subjectIds["sci-10"],
      chapterNumber: 3,
      title: "Metals and Non-metals",
      content: `Chapter 3: Metals and Non-metals

Introduction:
Elements are classified into metals and non-metals based on their properties. Metals are lustrous, malleable, and conduct electricity, while non-metals are dull and poor conductors. This chapter covers their properties and reactions.

Key Concepts:
1. Physical Properties: Metals (lustrous, malleable) vs Non-metals (brittle, dull)
2. Chemical Properties: Reactivity of metals
3. Extraction: Metals occur as ores, extracted by various methods
4. Alloys: Mixtures of metals with improved properties
5. Reactivity Series: K > Na > Ca > Mg > Al > Zn > Fe > Cu > Ag > Au

Important Facts / Formulas:
- Iron oxide = Fe₂O₃ (rust)
- Sodium + Water = NaOH + H₂
- Copper + Silver nitrate = Silver + Copper nitrate
- Gold is the most malleable metal
- Graphite conducts electricity

Summary:
Metals and non-metals have different properties and uses. We learned about their physical and chemical properties, extraction, and the reactivity series.`,
      contentSummary: "This chapter covers metals, non-metals, and their properties.",
      keyTopics: ["Physical Properties", "Chemical Properties", "Extraction", "Alloys", "Reactivity Series"],
      isPublished: true,
    },
    {
      id: "eng-10-ch1",
      subjectId: subjectIds["eng-10"],
      chapterNumber: 1,
      title: "A Letter to God",
      content: `Chapter 1: A Letter to God

Introduction:
"A Letter to God" is a story by Elena Garro about a farmer named Lencho who writes a letter to God asking for help after his crops are destroyed by hail. The letter is found by the postmaster who decides to help him.

This story shows faith, hope, and human kindness.

Key Concepts:
1. Characters: Lencho (farmer), postmaster, post office employees
2. Setting: A remote village in Mexico
3. Theme: Faith, hope, kindness
4. Symbolism: The $100 represents hope and faith
5. Resolution: People respond to Lencho's faith

Important Facts / Formulas:
- Lencho was a farmer
- Hail destroyed his crops
- He wrote "To God" on the envelope
- The postmaster collected $70
- Lencho thought God sent the money

Summary:
This story teaches about faith in God and the kindness of strangers. The postmaster and others responded to Lencho's pure faith.`,
      contentSummary: "A story about faith, hope, and human kindness.",
      keyTopics: ["Characters", "Setting", "Theme", "Symbolism", "Resolution"],
      isPublished: true,
    },
    {
      id: "eng-10-ch2",
      subjectId: subjectIds["eng-10"],
      chapterNumber: 2,
      title: "Nelson Mandela",
      content: `Chapter 2: Nelson Mandela

Introduction:
This chapter is a biographical extract about Nelson Mandela, the first black President of South Africa who fought against apartheid. He spent 27 years in prison before becoming a world symbol of peace and reconciliation.

This story teaches about courage, forgiveness, and the struggle for freedom.

Key Concepts:
1. Background: Born in 1918 in South Africa
2. Apartheid: System of racial segregation
3. Struggle: 27 years in prison (1962-1990)
4. Presidency: First black president in 1994
5. Values: Reconciliation over revenge

Important Facts / Formulas:
- Nobel Peace Prize: 1993
- His cell number: 46664
- "I have fought against white domination"
- "I have also fought against black domination"
- Long Walk to Freedom (autobiography)

Summary:
Nelson Mandela's story teaches about courage, forgiveness, and working for peace. He chose reconciliation over revenge, setting an example for the world.`,
      contentSummary: "The inspiring story of Nelson Mandela and his fight against apartheid.",
      keyTopics: ["Background", "Apartheid", "Struggle", "Presidency", "Values"],
      isPublished: true,
    },
    {
      id: "eng-10-ch3",
      subjectId: subjectIds["eng-10"],
      chapterNumber: 3,
      title: "Two Stories About Flying",
      content: `Chapter 3: Two Stories About Flying

Introduction:
This chapter contains two stories: "I" by Jane Yolen about a boy who learns to fly, and "The Black Eagle" about a pilot who helps villagers. Both stories explore the theme of overcoming challenges through courage and perseverance.

Key Concepts:
1. "I" Story: A boy with broken wings learns to fly
2. "The Black Eagle" Story: An airplane pilot helps villagers
3. Theme: Overcoming limitations through determination
4. Symbolism: Flying represents freedom and hope
5. Message: Believe in yourself

Important Facts / Formulas:
- First story: Boy named Icarus in modern retelling
- Second story: The Black Eagle was an airplane
- Both stories use flying as metaphor
- Courage helps overcome challenges
- Self-belief leads to success

Summary:
Both stories teach about overcoming challenges through courage. Whether learning to fly or helping others, determination leads to success.`,
      contentSummary: "Two inspiring stories about overcoming challenges through courage.",
      keyTopics: ["First Story", "Second Story", "Theme", "Symbolism", "Message"],
      isPublished: true,
    },
    {
      id: "sst-10-ch1",
      subjectId: subjectIds["sst-10"],
      chapterNumber: 1,
      title: "Nationalism in India",
      content: `Chapter 1: Nationalism in India

Introduction:
Nationalism in India developed during the independence movement against British rule. This chapter explores how Indian nationalism emerged, the different forms it took, and its impact on the nation-building process.

Key Concepts:
1. Swadeshi Movement: Using Indian goods, opposing British products
2. Indian National Congress: Founded 1885, led independence struggle
3. Muslim League: Represented Muslim interests
4. Partition: India and Pakistan created in 1947
5. Secularism: State does not favor any religion

Important Facts / Formulas:
- Founded: Indian National Congress, 1885
- Partition: August 15, 1947
- Independence day: August 15
- Republic day: January 26
- "Sarfaroshi ki tamanna"

Summary:
Indian nationalism emerged through anti-colonial struggle. We learned about different movements, leaders, and how India became a sovereign nation.`,
      contentSummary: "This chapter covers the rise of nationalism in India.",
      keyTopics: ["Swadeshi Movement", "Indian National Congress", "Muslim League", "Partition", "Secularism"],
      isPublished: true,
    },
    {
      id: "sst-10-ch2",
      subjectId: subjectIds["sst-10"],
      chapterNumber: 2,
      title: "The Nationalist Movement in Indo-China",
      content: `Chapter 2: The Nationalist Movement in Indo-China

Introduction:
Indo-China (Vietnam, Laos, Cambodia) experienced French colonial rule and then Japanese occupation during World War II. This chapter explores how nationalist movements emerged and fought for independence.

Key Concepts:
1. French Colonisation: 1885-1945
2. Japanese Occupation: 1941-1945
3. Ho Chi Minh: Leader of Vietnamese independence
4. Viet Minh: Revolutionary organization
5. Independence: 1954 after First Indochina War

Important Facts / Formulas:
- French colonized: 1885
- Ho Chi Minh: 1890-1969
- Japanese occupied: 1941
- First Indochina War: 1946-1954
- Geneva Accords: 1954

Summary:
The nationalist movement in Indo-China shows how colonies fought for freedom. We learned about French colonisation, Japanese occupation, and the successful independence struggle.`,
      contentSummary: "This chapter covers the nationalist movement in Vietnam.",
      keyTopics: ["French Colonisation", "Japanese Occupation", "Ho Chi Minh", "Viet Minh", "Independence"],
      isPublished: true,
    },
    {
      id: "sst-10-ch3",
      subjectId: subjectIds["sst-10"],
      chapterNumber: 3,
      title: "Industrialisation",
      content: `Chapter 3: Industrialisation

Introduction:
Industrialisation transformed societies from agrarian to industrial economies. This chapter explores the industrial revolution, its spread, and its impact on society, including both positive effects and problems.

Key Concepts:
1. Industrial Revolution: Started in Britain in the 18th century
2. Factory System: Production shifted from homes to factories
3. Urbanisation: Migration from villages to cities
4. Problems: Pollution, poor working conditions
5. Spread: From Britain to Europe, USA, Japan, and colonies

Important Facts / Formulas:
- Started: Britain, 1760s
- Key inventions: Steam engine, spinning jenny
- Manchester: First industrial city
- Child labour in factories
- Pollution increased

Summary:
Industrialisation changed the world. We learned how it started in Britain, spread globally, and brought both progress (new products, jobs) and problems (pollution, inequality).`,
      contentSummary: "This chapter explores the industrial revolution and its impact.",
      keyTopics: ["Industrial Revolution", "Factory System", "Urbanisation", "Problems", "Spread"],
      isPublished: true,
    },
    {
      id: "hin-10-ch1",
      subjectId: subjectIds["hin-10"],
      chapterNumber: 1,
      title: "सूरदास के पद",
      content: `पाठ 1: सूरदास के पद

परिचय:
सूरदास (1478-1581) ह��ं��ी साहित्य के महान कवि थे। उनके पदों में भक्ति भावना और ईश्वर प्रेम प्रकट होता है। सूरदास जी ने कृष्ण की लीलाओं का वर्णन अपने पदों में किया है।

पदों में श्रीकृष्ण के बालस्वरूप और बाल-लीलाओं का सुंदर वर्णन है।

मुख्य बिंदु:
1. सूरदास जी के पद प्रसिद्ध हैं
2. पदों में कृष्ण प्रेम का वर्णन
3. बाल कृष्ण की लीलाएँ
4. भक्ति भावना प्रमुख
5. सरल और मधुर भाषा

महत्वपूर्ण तथ्य:
- सूरदास जी का जन्म 1478 में हुआ
- वे संत कवि थे
- 'सूर' उपाधि प्राप्त थी
- उनके पद आज भी प्रसिद्ध हैं
- भक्ति साहित्य के रत्न हैं

सारांश:
सूरदास जी के पद हिंदी साहित्य के अमूल्य निधि हैं। उनमें भक्ति भाव और ईश्वर प्रेम की अभिव्यक्ति होती है। ये पद आज भी लोगों को प्रेरित करते हैं।`,
      contentSummary: "सूरदास जी के प्रसिद्ध भक्ति पदों का संग्रह।",
      keyTopics: ["सूरदास जी", "भक्ति भाव", "कृष्ण प्रेम", "बाल लीलाएँ", "संत कवि"],
      isPublished: true,
    },
    {
      id: "hin-10-ch2",
      subjectId: subjectIds["hin-10"],
      chapterNumber: 2,
      title: "राम-लक्ष्मण-परशुराम संवाद",
      content: `पाठ 2: राम-लक्ष्मण-परशुराम संवाद

परिचय:
यह पाठ रामायण से एक महत्वपूर्ण प्रसंग है। जब राम और लक्ष्मण अयोध्या जा रहे थे, तब मार्ग में परशुराम जी से उनकी भेंट हुई। यह संवाद राम के गुणों और परशुराम की विनम्रता को दर्शाता है।

इस संवाद से राम की विनम्रता और परशुराम की सरलता प्रकट होती है।

मुख्य बिंदु:
1. राम जी की विनम्रता
2. परशुराम जी की शांति
3. क्षत्रिय धर्म का वर्णन
4. वानर सेना का संकल्प
5. राम का राजा बनना

महत्वपूर्ण तथ्य:
- परशुराम जी ब्राह्मण थे
- उन्होंने राम को आशीर् दी
- राम ने विनम्रता से बात की
- लक्ष्मण ने धनुष उठाया
- यह घटना बहुत महत्वपूर्ण है

सारांश:
यह संवाद राम की विनम्रता और परशुराम की शांति को दर्शाता है। राम ने विनम्रता से परशुराम जी की बात सुनी और आशीर्वाद प्राप्त किया।`,
      contentSummary: "राम-लक्ष्मण और परशुराम के बीच महत्वपूर्ण संवाद।",
      keyTopics: ["राम की विनम्रता", "परशुराम जी", "संवाद", "क्षत्रिय धर्म", "आशीर्वाद"],
      isPublished: true,
    },
    {
      id: "hin-10-ch3",
      subjectId: subjectIds["hin-10"],
      chapterNumber: 3,
      title: "आत्मत्राण",
      content: `पाठ 3: आत्मत्राण

परिचय:
'आत्मत्राण' एक प्रेरणादायक कथा है। यह कथा दर्शाती है कि इच्छाशक्ति से कठिनाइयों को पार किया जा सकता है। मुख्य पात्र सीमा है जो अपनी माँ की मदद करती है।

यह कथा आत्मविश्वास और संकल्प का संदेश देती है।

मुख्य बिंदु:
1. सीमा ने अपनी माँ की मदद की
2. पिता की अनुपस्थिति में भार
3. इच्छाशक्ति से काम करना
4. घर का काम और पढ़ाई दोनों
5. परिवार के लिए त्याग

महत्वपूर्ण तथ्य:
- सीमा की माँ बीमार थी
- पिता गाँव से बाहर थे
- सीमा ने घर का काम संभाला
- उसने पढ़ाई नहीं छोड़ी
- उसका संकल्प प्रशंसनीय है

सारांश:
यह कथा आत्मविश्वास और संकल्प की शक्ति को दर्शाती है। सीमा ने अपने परिवार के लिए सब कुछ कर दिया, जो प्रेरणादायक है।`,
      contentSummary: "इच्छाशक्ति और आत्मविश्वास की प्रेरणादायक कथा।",
      keyTopics: ["सीमा", "इच्छाशक्ति", "परिवार", "संकल्प", "त्याग"],
      isPublished: true,
    },
  ];
}

// User functions
export function createUser(email: string, passwordHash: string, name: string, grade: string): User {
  const user: User = {
    id: generateId(),
    email,
    passwordHash,
    name,
    grade,
    streak: 0,
    createdAt: timestamp(),
  };

  const db = getDb();
  db.users.push(user);
  saveDb(db);

  return user;
}

export function getUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db.users.find((u) => u.email === email);
}

export function getUserById(id: string): User | undefined {
  const db = getDb();
  return db.users.find((u) => u.id === id);
}

export function updateUser(id: string, updates: Partial<User>): User | undefined {
  const db = getDb();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;

  db.users[idx] = { ...db.users[idx], ...updates };
  saveDb(db);
  return db.users[idx];
}

export function updateStreak(userId: string, streak: number): void {
  updateUser(userId, { streak });
}

// Session functions
export function createSession(userId: string, subject: string, topic: string | null): ChatSession {
  const session: ChatSession = {
    id: generateId(),
    userId,
    subject,
    topic,
    createdAt: timestamp(),
  };

  const db = getDb();
  db.sessions.push(session);
  saveDb(db);

  return session;
}

export function getSessionsByUser(userId: string): ChatSession[] {
  const db = getDb();
  return db.sessions
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSessionById(id: string): ChatSession | undefined {
  const db = getDb();
  return db.sessions.find((s) => s.id === id);
}

// Message functions
export function createMessage(
  sessionId: string,
  userId: string,
  role: "user" | "assistant",
  content: string
): Message {
  const message: Message = {
    id: generateId(),
    sessionId,
    userId,
    role,
    content,
    createdAt: timestamp(),
  };

  const db = getDb();
  db.messages.push(message);
  saveDb(db);

  return message;
}

export function getMessagesBySession(sessionId: string): Message[] {
  const db = getDb();
  return db.messages
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// Subject functions
export function getSubjects(): Subject[] {
  const db = getDb();
  return db.subjects.sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return a.displayOrder - b.displayOrder;
  });
}

export function getSubjectById(id: string): Subject | undefined {
  const db = getDb();
  return db.subjects.find((s) => s.id === id);
}

// Chapter functions
export function getChapters(): Chapter[] {
  const db = getDb();
  return db.chapters;
}

export function getChaptersBySubject(subjectId: string): Chapter[] {
  const db = getDb();
  return db.chapters
    .filter((c) => c.subjectId === subjectId)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);
}

export function getChapterById(id: string): Chapter | undefined {
  const db = getDb();
  return db.chapters.find((c) => c.id === id);
}

export function getSubjectChaptersCount(): Record<string, number> {
  const db = getDb();
  const counts: Record<string, number> = {};
  for (const s of db.subjects) {
    counts[s.id] = db.chapters.filter((c) => c.subjectId === s.id).length;
  }
  return counts;
}