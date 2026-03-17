-- Characters collection
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_pl TEXT NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
  description TEXT,
  avatar_url TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Add character reference to game_players
ALTER TABLE game_players ADD COLUMN character_id TEXT REFERENCES characters(id);

-- Seed male characters
INSERT INTO characters (id, slug, name, name_pl, gender, description, avatar_url, sort_order) VALUES
  ('chr_don', 'don', 'The Don', 'Don', 'male', 'Szef mafii. Elegancki garnitur, cygaro, władczy wzrok.', '/avatars/don.webp', 1),
  ('chr_detective', 'detective', 'The Detective', 'Detektyw', 'male', 'Trencz, fedora, przenikliwe spojrzenie. Zawsze o krok przed przestępcami.', '/avatars/detective.webp', 2),
  ('chr_doctor', 'doctor', 'The Doctor', 'Doktor', 'male', 'Biały fartuch i stetoskop. Leczy rany, ale zna też trucizny.', '/avatars/doctor.webp', 3),
  ('chr_boxer', 'boxer', 'The Boxer', 'Bokser', 'male', 'Rękawice bokserskie i blizna. Rozwiązuje problemy pięściami.', '/avatars/boxer.webp', 4),
  ('chr_priest', 'priest', 'The Priest', 'Ksiądz', 'male', 'Koloratka i tajemnice. Spowiedź to jego najlepsza broń.', '/avatars/priest.webp', 5),
  ('chr_thief', 'thief', 'The Thief', 'Złodziej', 'male', 'Maska i czarna czapka. Kradnie serca i portfele.', '/avatars/thief.webp', 6),
  ('chr_gambler', 'gambler', 'The Gambler', 'Hazardzista', 'male', 'Karty w ręku i poker face. Życie to jedna wielka gra.', '/avatars/gambler.webp', 7),
  ('chr_mechanic', 'mechanic', 'The Mechanic', 'Mechanik', 'male', 'Kombinezon i klucz francuski. Naprawia samochody i zaciera ślady.', '/avatars/mechanic.webp', 8);

-- Seed female characters
INSERT INTO characters (id, slug, name, name_pl, gender, description, avatar_url, sort_order) VALUES
  ('chr_femme_fatale', 'femme-fatale', 'The Femme Fatale', 'Femme Fatale', 'female', 'Czerwona sukienka i tajemniczy uśmiech. Niebezpieczna jak trucizna.', '/avatars/femme-fatale.webp', 9),
  ('chr_journalist', 'journalist', 'The Journalist', 'Dziennikarka', 'female', 'Notatnik i aparat. Odkrywa prawdę, nawet gdy jest niewygodna.', '/avatars/journalist.webp', 10),
  ('chr_artist', 'artist', 'The Artist', 'Artystka', 'female', 'Beret i pędzel. Maluje portrety i fałszuje dokumenty.', '/avatars/artist.webp', 11),
  ('chr_judge', 'judge', 'The Judge', 'Sędzia', 'female', 'Toga i młotek. Jej wyroki są ostateczne.', '/avatars/judge.webp', 12),
  ('chr_singer', 'singer', 'The Singer', 'Piosenkarka', 'female', 'Mikrofon i szal. Śpiewa w klubie, słucha przy barze.', '/avatars/singer.webp', 13),
  ('chr_spy', 'spy', 'The Spy', 'Szpieg', 'female', 'Ciemne okulary i słuchawka. Wie więcej niż mówi.', '/avatars/spy.webp', 14),
  ('chr_florist', 'florist', 'The Florist', 'Kwiaciarka', 'female', 'Róże i kolce. Słodki uśmiech, ostre spojrzenie.', '/avatars/florist.webp', 15),
  ('chr_lawyer', 'lawyer', 'The Lawyer', 'Prawniczka', 'female', 'Teczka i okulary. Zna prawo i wie jak je obejść.', '/avatars/lawyer.webp', 16);
