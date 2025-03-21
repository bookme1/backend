type GenreRaw = {
  genre: string;
  count: number;
  children?: GenreRaw[];
};

type GenreMapped = {
  genre: string;
  count: number;
  children: { genre: string; count: number }[];
};

export const genreMap: Record<string, string> = {
  'Детектив і кримінальний роман': 'Детектив',
  'Детектив і кримінальний роман, детектив': 'Детектив',
  Фантастика: 'Фантастика',
  'Фантастика, Художня література': 'Фантастика',
  Фентезі: 'Фентезі',
  'Фентезі, Художня література': 'Фентезі',
  Трилер: 'Трилер',
  'Пригодницька література': 'Пригоди',
  'Сімейні саги': 'Сімейна сага',
  'Біографічна художня література': 'Біографія',
  'Наукова фантастика': 'Фантастика',
  'Романтична література': 'Романтика',
  'Гумористична художня література': 'Гумор',
  'Жахи та надприродна фантастика': 'Жахи',
  'Історична проза': 'Історія',
  'Легенди, міфи та казки': 'Міфи',
  "П'єси, сценарії": "П'єси",
  'Релігійна і духовна література': 'Релігія',
  Освіта: 'Освіта',
  'Бізнес та управління': 'Бізнес',
  "Комп'ютерна наука": 'Програмування',
  'Політика та уряд': 'Політика',
  'Спосіб життя, хобі та дозвілля': 'Хобі',
  'Кулінарія. Їжа та напої': 'Кулінарія',
  'Здоров’я, відносини та особистісний розвиток': 'Саморозвиток',
  'Суспільство та соціальні науки': 'Соціологія',
  'Філософія та релігія': 'Філософія',
  Мистецтво: 'Мистецтво',
  'Історія та археологія': 'Історія',
  'Економіка, фінанси, бізнес та управління (менеджмент)': 'Економіка',
  'Графічні романи, комікси, мультфільми': 'Комікси',
  'Дитяча, підліткова та освітня література': 'Дитяча література',
  Дитячий: 'Дитяча література',
  Дитяча: 'Дитяча література',
  Діти: 'Дитяча література',
  'Наука: загальні питання': 'Наука',
  'Технології. Інженерія': 'Інженерія',
};

export const normalizeGenres = (genres: GenreRaw[]): GenreMapped[] => {
  const mergedGenres: Record<
    string,
    { count: number; children: Record<string, number> }
  > = {};

  genres.forEach((genre) => {
    const normalizedGenre = genreMap[genre.genre] || genre.genre;

    if (!mergedGenres[normalizedGenre]) {
      mergedGenres[normalizedGenre] = { count: 0, children: {} };
    }

    mergedGenres[normalizedGenre].count += genre.count;

    if (genre.children) {
      genre.children.forEach((sub) => {
        const normalizedSub = genreMap[sub.genre] || sub.genre;
        if (!mergedGenres[normalizedGenre].children[normalizedSub]) {
          mergedGenres[normalizedGenre].children[normalizedSub] = 0;
        }
        mergedGenres[normalizedGenre].children[normalizedSub] += sub.count;
      });
    }
  });

  return Object.entries(mergedGenres)
    .map(([genre, { count, children }]) => {
      let cleanedChildren = Object.entries(children)
        .map(([subGenre, subCount]) => ({ genre: subGenre, count: subCount }))
        .filter((sub) => sub.count > 2 && sub.genre.length < 55); // Filter rare and very long subgenres

      // ✅ Remove children in genre, if there is only 1 subgenre
      if (cleanedChildren.length === 1) {
        // genre = cleanedChildren[0].genre; // replace name of parent with child. Not the best UX
        cleanedChildren = [];
      }

      return { genre, count, children: cleanedChildren };
    })
    .filter((genre) => genre.count > 2) // Remove too rare genres(in future, take it to another genre)
    .sort((a, b) => b.count - a.count);
};

export const reverseGenreMap: Record<string, Set<string>> = Object.entries(
  genreMap,
).reduce(
  (acc, [original, mapped]) => {
    if (!acc[mapped]) {
      acc[mapped] = new Set();
    }
    acc[mapped].add(original);
    return acc;
  },
  {} as Record<string, Set<string>>,
);
