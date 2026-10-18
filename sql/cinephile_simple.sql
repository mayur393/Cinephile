-- Cinephile Lite uses a fresh database so an older cinephile database is never touched.
CREATE DATABASE IF NOT EXISTS cinephile_simple CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cinephile_simple;

-- Account records. Passwords are one-way hashes created by PHP password_hash().
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(40) NOT NULL UNIQUE,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The local starter movie catalogue used by public discovery pages.
CREATE TABLE IF NOT EXISTS movies (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    release_year SMALLINT UNSIGNED NOT NULL,
    runtime_min SMALLINT UNSIGNED NOT NULL,
    genre VARCHAR(60) NOT NULL,
    overview TEXT NOT NULL,
    poster_path VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_movies_title (title),
    INDEX idx_movies_genre (genre),
    INDEX idx_movies_year (release_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One current rating per user and movie; the composite key allows updates.
CREATE TABLE IF NOT EXISTS ratings (
    user_id INT UNSIGNED NOT NULL,
    movie_id INT UNSIGNED NOT NULL,
    stars TINYINT UNSIGNED NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id),
    CONSTRAINT chk_ratings_stars CHECK (stars BETWEEN 1 AND 5),
    CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Written reviews are many-to-one from users and movies.
CREATE TABLE IF NOT EXISTS reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    movie_id INT UNSIGNED NOT NULL,
    review_text VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reviews_movie (movie_id),
    INDEX idx_reviews_user (user_id),
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A composite key prevents a movie appearing twice in one user's watchlist.
CREATE TABLE IF NOT EXISTS watchlist (
    user_id INT UNSIGNED NOT NULL,
    movie_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, movie_id),
    CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_watchlist_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Diary entries intentionally have their own id so repeat viewings are possible.
CREATE TABLE IF NOT EXISTS diary (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    movie_id INT UNSIGNED NOT NULL,
    watched_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_diary_user_date (user_id, watched_date),
    CONSTRAINT fk_diary_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_diary_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Twelve recognisable starter movies keep the first local demo useful without an external API.
INSERT INTO movies (title, release_year, runtime_min, genre, overview, poster_path) VALUES
('Interstellar', 2014, 169, 'Sci-Fi', 'A team of explorers travels through a wormhole in search of a future for humanity, while one family waits beneath the stars.', NULL),
('The Dark Knight', 2008, 152, 'Crime', 'Batman faces a criminal mastermind who turns Gotham into a test of courage, order, and moral choice.', NULL),
('Inception', 2010, 148, 'Sci-Fi', 'A specialist who enters dreams is offered a chance to erase his past by planting an idea inside a target’s mind.', NULL),
('Pulp Fiction', 1994, 154, 'Crime', 'Lives collide in a sharp, funny, and nonlinear collection of stories about chance, loyalty, and consequence.', NULL),
('Spirited Away', 2001, 125, 'Animation', 'A young girl enters a mysterious spirit world and must find her courage to rescue her parents and return home.', NULL),
('Dune', 2021, 155, 'Sci-Fi', 'A gifted heir travels to a dangerous desert world whose vast resources and ancient politics will shape his destiny.', NULL),
('Parasite', 2019, 132, 'Thriller', 'An ambitious family slowly enters the life of a wealthy household, creating a tense portrait of class and desire.', NULL),
('Whiplash', 2014, 107, 'Drama', 'A driven drummer joins an elite conservatory where an exacting teacher pushes ambition toward obsession.', NULL),
('The Matrix', 1999, 136, 'Action', 'A programmer discovers that the world he knows is an elaborate simulation and joins a fight to wake humanity.', NULL),
('Fight Club', 1999, 139, 'Drama', 'An insomniac office worker finds a new identity in an underground club that begins to grow beyond anyone’s control.', NULL),
('The Shawshank Redemption', 1994, 142, 'Drama', 'A banker sentenced to prison builds a quiet friendship and a patient hope that refuses to disappear.', NULL),
('Gladiator', 2000, 155, 'Historical', 'A betrayed Roman general is forced into the arena and turns survival into a path toward justice.', NULL);
