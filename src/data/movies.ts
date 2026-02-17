export interface Movie {
  id: number;
  title: string;
  year: number;
  rating: number;
  genre: string[];
  description: string;
  poster: string;
  duration: string;
}

export const categories = [
  "Все",
  "Боевик",
  "Комедия",
  "Драма",
  "Фантастика",
  "Триллер",
  "Ужасы",
  "Мелодрама",
] as const;

export type Category = (typeof categories)[number];

export const movies: Movie[] = [
  {
    id: 1,
    title: "Бегущий по лезвию 2049",
    year: 2017,
    rating: 8.0,
    genre: ["Фантастика", "Драма", "Триллер"],
    description: "Новый офицер полиции Лос-Анджелеса обнаруживает тайну, которая может погрузить в хаос то, что осталось от общества.",
    poster: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400&h=600&fit=crop",
    duration: "2ч 44м",
  },
  {
    id: 2,
    title: "Начало",
    year: 2010,
    rating: 8.8,
    genre: ["Фантастика", "Боевик", "Триллер"],
    description: "Вор, который крадёт корпоративные секреты с помощью технологии внедрения в сны, получает задание внедрить идею.",
    poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
    duration: "2ч 28м",
  },
  {
    id: 3,
    title: "Паразиты",
    year: 2019,
    rating: 8.5,
    genre: ["Драма", "Триллер", "Комедия"],
    description: "Жадность и классовая дискриминация угрожают вновь обретённому симбиозу между богатой семьёй Пак и бедным кланом Ким.",
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop",
    duration: "2ч 12м",
  },
  {
    id: 4,
    title: "Интерстеллар",
    year: 2014,
    rating: 8.7,
    genre: ["Фантастика", "Драма"],
    description: "Команда исследователей путешествует через червоточину в космосе в попытке обеспечить выживание человечества.",
    poster: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop",
    duration: "2ч 49м",
  },
  {
    id: 5,
    title: "Джон Уик",
    year: 2014,
    rating: 7.4,
    genre: ["Боевик", "Триллер"],
    description: "Бывший наёмный убийца выходит из отставки, чтобы отомстить гангстерам, которые отняли у него всё.",
    poster: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
    duration: "1ч 41м",
  },
  {
    id: 6,
    title: "Великий Гэтсби",
    year: 2013,
    rating: 7.2,
    genre: ["Драма", "Мелодрама"],
    description: "Писатель и мечтатель Ник Каррауэй прибывает в Нью-Йорк 1922 года и становится соседом загадочного миллионера.",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
    duration: "2ч 23м",
  },
  {
    id: 7,
    title: "Тихое место",
    year: 2018,
    rating: 7.5,
    genre: ["Ужасы", "Триллер", "Драма"],
    description: "Семья живёт в тишине, скрываясь от существ, которые охотятся по звуку.",
    poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop",
    duration: "1ч 30м",
  },
  {
    id: 8,
    title: "Безумный Макс: Дорога ярости",
    year: 2015,
    rating: 8.1,
    genre: ["Боевик", "Фантастика"],
    description: "В постапокалиптическом мире женщина восстаёт против тиранического правителя в поисках свободы.",
    poster: "https://images.unsplash.com/photo-1518676590747-1e3dcf5a4953?w=400&h=600&fit=crop",
    duration: "2ч 00м",
  },
  {
    id: 9,
    title: "Ла-Ла Ленд",
    year: 2016,
    rating: 8.0,
    genre: ["Мелодрама", "Комедия", "Драма"],
    description: "Джазовый пианист и начинающая актриса влюбляются друг в друга, пытаясь осуществить свои мечты в Лос-Анджелесе.",
    poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    duration: "2ч 08м",
  },
  {
    id: 10,
    title: "Дюна",
    year: 2021,
    rating: 8.0,
    genre: ["Фантастика", "Драма", "Боевик"],
    description: "Пол Атрейдес, блестящий и одарённый молодой человек, должен отправиться на самую опасную планету во вселенной.",
    poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop",
    duration: "2ч 35м",
  },
  {
    id: 11,
    title: "Мстители: Финал",
    year: 2019,
    rating: 8.4,
    genre: ["Боевик", "Фантастика", "Драма"],
    description: "После разрушительных событий оставшиеся Мстители должны собраться вновь, чтобы обратить действия Таноса.",
    poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=600&fit=crop",
    duration: "3ч 01м",
  },
  {
    id: 12,
    title: "Побег из Шоушенка",
    year: 1994,
    rating: 9.3,
    genre: ["Драма"],
    description: "Два заключённых находят утешение и искупление за долгие годы заключения через акты простой порядочности.",
    poster: "https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400&h=600&fit=crop",
    duration: "2ч 22м",
  },
];
