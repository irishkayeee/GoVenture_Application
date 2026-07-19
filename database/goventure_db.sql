-- GoVenture database setup
-- Covers the whole app: accounts, tour catalog, bookings, payments,
-- document checklist, client<->staff messaging, and trip requests.
--
-- NOTE: The admin Dashboard's charts/trends/heatmaps are computed on read
-- from bookings + payments — they are reporting queries, not stored tables.

CREATE DATABASE IF NOT EXISTS goventure_app_db;
USE goventure_app_db;

-- ============================================================
-- ACCOUNTS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(75) NOT NULL,
    last_name VARCHAR(75) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','staff','client') NOT NULL DEFAULT 'client',
    address VARCHAR(255) NULL,
    phone VARCHAR(30) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Demo accounts (passwords hashed with PHP password_hash()).
-- admin@goventure.com    / Admin@123     (role: admin)
-- client@goventure.com   / Client@123    (role: client)
-- everyone else below    / Password@123
INSERT INTO users (first_name, last_name, email, password, role, address, phone, created_at) VALUES
('System', 'Administrator', 'admin@goventure.com',       '$2y$10$B6PgAQWRXlJnG0TZCXO2Ru8s8N5h/85nT3DXbu1QFEildBfKu/aEa', 'admin',  'GoVenture HQ, Cebu City',        '+63 917 000 1111', '2026-01-05 09:00:00'),
('Go',     'Client',        'client@goventure.com',      '$2y$10$0BhQ0GEE6SLu5gPJkVEwDeXXpFHhT1d4Ftmwlm9kgABhnger9vKTe', 'client', NULL,                              NULL,               CURRENT_TIMESTAMP),
('Maria',  'Santos',        'maria.santos@goventure.com','$2y$10$TBYlGothtIMJO/dqvE9rAeIxfaTWvNranemZsWAFP/K61SZy.Jcje', 'staff',  '456 Rizal St., Makati City',     '+63 917 111 2222', '2026-06-13 09:00:00'),
('Carlo',  'Reyes',         'carlo.reyes@goventure.com', '$2y$10$TBYlGothtIMJO/dqvE9rAeIxfaTWvNranemZsWAFP/K61SZy.Jcje', 'staff',  '12 Mabini St., Quezon City',     '+63 917 222 3333', '2026-06-10 09:00:00'),
('Mia',    'Reyes',         'mia.reyes@email.com',       '$2y$10$TBYlGothtIMJO/dqvE9rAeIxfaTWvNranemZsWAFP/K61SZy.Jcje', 'client', '88 Osmeña Blvd, Cebu City',      '+63 917 333 4444', '2026-05-02 09:00:00'),
('Jared',  'Abellera',      'jaredabellera@gmail.com',   '$2y$10$TBYlGothtIMJO/dqvE9rAeIxfaTWvNranemZsWAFP/K61SZy.Jcje', 'client', '14 Katipunan Ave, Quezon City',  '+63 917 777 8888', '2026-03-30 09:00:00'),
('Rico',   'Santos',        'rico.santos@gmail.com',     '$2y$10$TBYlGothtIMJO/dqvE9rAeIxfaTWvNranemZsWAFP/K61SZy.Jcje', 'client', '9 Del Pilar St, Palawan',        '+63 917 888 9999', '2026-03-22 09:00:00'),
('Anna',   'Cruz',          'anna.cruz@gmail.com',       '$2y$10$TBYlGothtIMJO/dqvE9rAeIxfaTWvNranemZsWAFP/K61SZy.Jcje', 'client', '77 Colon St, Cebu City',         '+63 917 999 0000', '2026-03-10 09:00:00'),
('Liza',   'Fernandez',     'liza.fernandez@gmail.com',  '$2y$10$TBYlGothtIMJO/dqvE9rAeIxfaTWvNranemZsWAFP/K61SZy.Jcje', 'client', '6 Fuente Circle, Cebu City',     '+63 918 222 3333', '2026-02-14 09:00:00');

-- ============================================================
-- TOUR CATALOG
-- One tour package can have several itinerary days, several
-- inclusion/exclusion line items, several departure date ranges,
-- and several reviews.
-- ============================================================

CREATE TABLE IF NOT EXISTS tour_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destination VARCHAR(150) NOT NULL,
    tagline VARCHAR(150) NULL,
    full_location VARCHAR(200) NULL,
    category ENUM('charter','custom') NOT NULL DEFAULT 'charter',
    region ENUM('domestic','overseas') NOT NULL DEFAULT 'overseas',
    description TEXT NULL,
    duration VARCHAR(50) NOT NULL,
    price_from DECIMAL(10,2) NOT NULL,
    rating DECIMAL(2,1) NOT NULL DEFAULT 0,
    review_count INT NOT NULL DEFAULT 0,
    gradient_start VARCHAR(10) NULL,
    gradient_end VARCHAR(10) NULL,
    status ENUM('Active','Draft','Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tour_itinerary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    day_number INT NOT NULL,
    time_label VARCHAR(50) NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    FOREIGN KEY (tour_id) REFERENCES tour_packages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tour_inclusions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    type ENUM('inclusion','exclusion') NOT NULL,
    item_text VARCHAR(255) NOT NULL,
    FOREIGN KEY (tour_id) REFERENCES tour_packages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tour_departures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    FOREIGN KEY (tour_id) REFERENCES tour_packages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tour_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    user_id INT NULL,
    reviewer_name VARCHAR(100) NOT NULL,
    rating TINYINT NOT NULL,
    review_text TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES tour_packages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO tour_packages (destination, tagline, full_location, category, region, description, duration, price_from, rating, review_count, gradient_start, gradient_end, status) VALUES
('Bali, Indonesia', 'Island of the Gods', 'Denpasar, Bali, Indonesia', 'charter', 'overseas', 'Discover the cultural and natural beauty of Bali with our immersive full-day adventure. Wander through iconic landmarks, experience authentic local hospitality along the way, and create unforgettable memories that last a lifetime.', '5 Days / 4 Nights', 25999, 4.8, 4, '#1B3A66', '#2E5C94', 'Active'),
('Bangkok, Thailand', 'City of Angels', 'Bangkok, Thailand', 'custom', 'overseas', 'Immerse yourself in the vibrant energy of Bangkok — from golden temples to bustling floating markets. This package blends culture, food, and city life into one unforgettable escape.', '5 Days / 4 Nights', 18999, 4.8, 2, '#1D6FB8', '#4FA8E0', 'Active'),
('Boracay Island', 'White Beach Paradise', 'Boracay Island, Aklan, Philippines', 'charter', 'domestic', 'Sink your feet into the powder-white sands of Boracay. This getaway is built for relaxation — turquoise water, island hopping, and unforgettable sunsets on White Beach.', '4 Days / 3 Nights', 15999, 4.8, 2, '#5B21A6', '#8B4FD1', 'Active'),
('Da Nang, Vietnam', 'The Coastal Dream', 'Da Nang, Vietnam', 'charter', 'overseas', 'Explore Vietnam''s coastal gem — golden bridges, ancient towns, and pristine beaches. Da Nang offers the perfect mix of culture, cuisine, and seaside relaxation.', '5 Days / 4 Nights', 18999, 4.8, 2, '#1F5C42', '#3E8A64', 'Active'),
('Tokyo, Japan', 'Neon Lights & Zen Gardens', 'Tokyo, Japan', 'custom', 'overseas', 'Experience the striking contrast of Tokyo — futuristic skylines beside centuries-old shrines. This tour covers the city''s icons plus quieter moments of calm.', '6 Days / 5 Nights', 32999, 4.8, 2, '#C9A227', '#E0C34F', 'Active'),
('Cebu, Philippines', 'Queen City of the South', 'Cebu City, Cebu, Philippines', 'charter', 'domestic', 'From historic landmarks to swimming with whale sharks, Cebu packs adventure and heritage into one dynamic escape in the heart of the Visayas.', '4 Days / 3 Nights', 14500, 4.8, 1, '#B8871F', '#D9A83E', 'Active'),
('Kyoto, Japan', 'City of Ten Thousand Shrines', 'Kyoto, Japan', 'custom', 'overseas', 'Step back into old Japan among Kyoto''s bamboo groves, geisha districts, and thousands of vermillion torii gates. A tour built for culture and quiet beauty.', '5 Days / 4 Nights', 35200, 4.8, 1, '#B85F17', '#D17B2E', 'Active'),
('Phuket, Thailand', 'Pearl of the Andaman', 'Phuket, Thailand', 'charter', 'overseas', 'Turquoise waters, limestone cliffs, and vibrant nightlife — Phuket delivers the best of Thailand''s Andaman coast in one relaxed island getaway.', '5 Days / 4 Nights', 11000, 4.8, 1, '#0F8C7C', '#2FBFA8', 'Active');

INSERT INTO tour_itinerary (tour_id, day_number, time_label, title, description) VALUES
((SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), 1, '8:00 AM – 6:00 PM', 'Arrival & City Tour', 'Arrive at the airport and meet your tour guide. Proceed to the hotel, freshen up, then explore the city''s top landmarks including the historic district, local markets, and scenic viewpoints.'),
((SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), 2, '7:30 AM – 4:00 PM', 'Nature Adventure', 'Head out to Bali''s lush countryside for a guided trek through rice terraces, waterfalls, and jungle viewpoints, capped off with a traditional lunch overlooking the valley.'),
((SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), 3, 'Full Day', 'Free Day / Optional Activities', 'Enjoy a free day to relax at the resort or join optional add-ons like a spa session, surfing lesson, or a sunset cruise along the coast.'),
((SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), 4, '6:00 AM – 12:00 PM', 'Departure', 'Early breakfast at the hotel, followed by a transfer to the airport for your flight home. End of tour.'),

((SELECT id FROM tour_packages WHERE destination = 'Bangkok, Thailand'), 1, '9:00 AM – 5:00 PM', 'Arrival & Temple Tour', 'Arrive and check in, then visit the Grand Palace and Wat Arun with a licensed local guide.'),
((SELECT id FROM tour_packages WHERE destination = 'Bangkok, Thailand'), 2, '6:30 AM – 1:00 PM', 'Floating Market Tour', 'Early trip to the Damnoen Saduak floating market followed by a Thai cooking demonstration.'),
((SELECT id FROM tour_packages WHERE destination = 'Bangkok, Thailand'), 3, 'Full Day', 'Free Day / Optional Activities', 'Explore on your own or join an optional day trip to Ayutthaya''s ancient ruins.'),
((SELECT id FROM tour_packages WHERE destination = 'Bangkok, Thailand'), 4, '5:00 AM – 11:00 AM', 'Departure', 'Breakfast at the hotel, then transfer to the airport for departure.'),

((SELECT id FROM tour_packages WHERE destination = 'Boracay Island'), 1, '10:00 AM – 6:00 PM', 'Arrival & Beach Time', 'Arrive via Caticlan, transfer to the resort, and spend the afternoon relaxing on White Beach.'),
((SELECT id FROM tour_packages WHERE destination = 'Boracay Island'), 2, '8:00 AM – 3:00 PM', 'Island Hopping', 'Visit Crystal Cove, Puka Shell Beach, and Crocodile Island with snorkeling stops along the way.'),
((SELECT id FROM tour_packages WHERE destination = 'Boracay Island'), 3, '6:00 AM – 10:00 AM', 'Departure', 'Sunrise breakfast on the beach, then transfer back to Caticlan for your flight home.'),

((SELECT id FROM tour_packages WHERE destination = 'Da Nang, Vietnam'), 1, '9:00 AM – 5:00 PM', 'Arrival & Golden Bridge', 'Arrive and transfer to Ba Na Hills to see the iconic Golden Bridge and French Village.'),
((SELECT id FROM tour_packages WHERE destination = 'Da Nang, Vietnam'), 2, '8:00 AM – 4:00 PM', 'Hoi An Ancient Town', 'Guided walking tour of Hoi An''s lantern-lit streets, tailor shops, and riverside markets.'),
((SELECT id FROM tour_packages WHERE destination = 'Da Nang, Vietnam'), 3, 'Full Day', 'Free Day / Optional Activities', 'Relax at My Khe Beach or join an optional Marble Mountains excursion.'),
((SELECT id FROM tour_packages WHERE destination = 'Da Nang, Vietnam'), 4, '6:00 AM – 12:00 PM', 'Departure', 'Breakfast at the hotel, then transfer to the airport for your flight home.'),

((SELECT id FROM tour_packages WHERE destination = 'Tokyo, Japan'), 1, '10:00 AM – 6:00 PM', 'Arrival & Shinjuku', 'Arrive and settle in, then explore Shinjuku''s skyline and neon-lit streets by night.'),
((SELECT id FROM tour_packages WHERE destination = 'Tokyo, Japan'), 2, '8:00 AM – 5:00 PM', 'Asakusa & Senso-ji', 'Visit Senso-ji Temple, Nakamise shopping street, and a river cruise along the Sumida.'),
((SELECT id FROM tour_packages WHERE destination = 'Tokyo, Japan'), 3, '9:00 AM – 5:00 PM', 'Mt. Fuji Day Trip', 'Full-day excursion to the Mt. Fuji area with a scenic lake cruise and cable car ride.'),
((SELECT id FROM tour_packages WHERE destination = 'Tokyo, Japan'), 4, 'Full Day', 'Free Day / Optional Activities', 'Explore Shibuya and Harajuku at your own pace, or join an optional theme park add-on.'),
((SELECT id FROM tour_packages WHERE destination = 'Tokyo, Japan'), 5, '6:00 AM – 12:00 PM', 'Departure', 'Breakfast at the hotel, then transfer to Narita/Haneda for your flight home.'),

((SELECT id FROM tour_packages WHERE destination = 'Cebu, Philippines'), 1, '10:00 AM – 6:00 PM', 'Arrival & City Tour', 'Arrive and visit Magellan''s Cross, Basilica del Santo Niño, and Fort San Pedro.'),
((SELECT id FROM tour_packages WHERE destination = 'Cebu, Philippines'), 2, '5:00 AM – 3:00 PM', 'Oslob & Kawasan Falls', 'Early trip to swim with whale sharks in Oslob, followed by canyoneering at Kawasan Falls.'),
((SELECT id FROM tour_packages WHERE destination = 'Cebu, Philippines'), 3, '6:00 AM – 10:00 AM', 'Departure', 'Free morning at leisure, then transfer to the airport for your flight home.'),

((SELECT id FROM tour_packages WHERE destination = 'Kyoto, Japan'), 1, '10:00 AM – 6:00 PM', 'Arrival & Gion District', 'Arrive and stroll through Gion, Kyoto''s historic geisha district, by early evening.'),
((SELECT id FROM tour_packages WHERE destination = 'Kyoto, Japan'), 2, '8:00 AM – 5:00 PM', 'Fushimi Inari & Arashiyama', 'Visit the iconic torii gates of Fushimi Inari, then the bamboo grove in Arashiyama.'),
((SELECT id FROM tour_packages WHERE destination = 'Kyoto, Japan'), 3, 'Full Day', 'Free Day / Optional Activities', 'Explore Kinkaku-ji at your own pace or join an optional tea ceremony experience.'),
((SELECT id FROM tour_packages WHERE destination = 'Kyoto, Japan'), 4, '6:00 AM – 12:00 PM', 'Departure', 'Breakfast at the hotel, then transfer to Kansai Airport for your flight home.'),

((SELECT id FROM tour_packages WHERE destination = 'Phuket, Thailand'), 1, '10:00 AM – 6:00 PM', 'Arrival & Patong Beach', 'Arrive and check in, then unwind at Patong Beach as the sun sets.'),
((SELECT id FROM tour_packages WHERE destination = 'Phuket, Thailand'), 2, '8:00 AM – 4:00 PM', 'Phi Phi Islands Tour', 'Speedboat day trip to Phi Phi Islands with snorkeling stops at Maya Bay and Monkey Beach.'),
((SELECT id FROM tour_packages WHERE destination = 'Phuket, Thailand'), 3, 'Full Day', 'Free Day / Optional Activities', 'Relax at the resort or join an optional Big Buddha and old town tour.'),
((SELECT id FROM tour_packages WHERE destination = 'Phuket, Thailand'), 4, '6:00 AM – 12:00 PM', 'Departure', 'Breakfast at the hotel, then transfer to Phuket International Airport.');

-- Same default inclusion/exclusion template applied to every tour (matches the app's mock behavior).
INSERT INTO tour_inclusions (tour_id, type, item_text)
SELECT id, 'inclusion', t.item_text FROM tour_packages
CROSS JOIN (
    SELECT 'Room accommodation with daily breakfast' AS item_text
    UNION ALL SELECT 'Sightseeing tours as specified in the itinerary'
    UNION ALL SELECT 'Private coach with English-speaking tour guide'
    UNION ALL SELECT 'Round-trip airfare via Philippine Airlines'
) AS t;

INSERT INTO tour_inclusions (tour_id, type, item_text)
SELECT id, 'exclusion', t.item_text FROM tour_packages
CROSS JOIN (
    SELECT 'Expenses of a personal nature (calls, mini bar, etc.)' AS item_text
    UNION ALL SELECT 'Tips for drivers and guide'
    UNION ALL SELECT 'Single supplement'
    UNION ALL SELECT 'Travel Insurance'
    UNION ALL SELECT 'Philippine Travel tax'
) AS t;

INSERT INTO tour_departures (tour_id, start_datetime, end_datetime) VALUES
((SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), '2026-08-05 08:00:00', '2026-08-09 22:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), '2026-09-02 08:00:00', '2026-09-06 22:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), '2026-10-14 08:00:00', '2026-10-18 22:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Da Nang, Vietnam'), '2026-08-20 09:00:00', '2026-08-23 20:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Da Nang, Vietnam'), '2026-09-15 09:00:00', '2026-09-18 20:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Cebu, Philippines'), '2026-08-10 07:00:00', '2026-08-13 18:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Cebu, Philippines'), '2026-09-05 07:00:00', '2026-09-08 18:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Boracay Island'), '2026-07-25 08:00:00', '2026-07-28 20:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Boracay Island'), '2026-08-15 08:00:00', '2026-08-18 20:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Bangkok, Thailand'), '2026-08-08 10:00:00', '2026-08-11 21:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Bangkok, Thailand'), '2026-09-10 10:00:00', '2026-09-13 21:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Tokyo, Japan'), '2026-09-20 08:00:00', '2026-09-25 21:00:00'),
((SELECT id FROM tour_packages WHERE destination = 'Tokyo, Japan'), '2026-10-05 08:00:00', '2026-10-10 21:00:00');

INSERT INTO tour_reviews (tour_id, reviewer_name, rating, review_text) VALUES
((SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), 'Grace T.', 5, 'Absolutely magical trip! Bali exceeded all our expectations. Wayan was an incredible guide – knowledgeable, funny, and very attentive. The villa was stunning. Will definitely book again!'),
((SELECT id FROM tour_packages WHERE destination = 'Da Nang, Vietnam'), 'Miguel S.', 5, 'Da Nang was such a pleasant surprise — clean beaches, great food, and the Golden Bridge is unreal in person.'),
((SELECT id FROM tour_packages WHERE destination = 'Cebu, Philippines'), 'Anna P.', 5, 'Swimming with the whale sharks was a bucket-list moment. The itinerary was well-paced and the guide was great with kids too.'),
((SELECT id FROM tour_packages WHERE destination = 'Boracay Island'), 'Kevin D.', 4, 'Great value trip, the island-hopping was the highlight. Would''ve liked a bit more free time at White Beach.'),
((SELECT id FROM tour_packages WHERE destination = 'Bangkok, Thailand'), 'Patricia L.', 4, 'Loved the floating market day trip! Bangkok traffic made some transfers longer than expected, but overall a fun trip.');

-- ============================================================
-- BOOKINGS & PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    tour_id INT NOT NULL,
    departure_id INT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    travelers INT NOT NULL DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    balance_due DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method ENUM('GCash','Maya','Bank Transfer') NULL,
    payment_status ENUM('Unpaid','Partial','Fully Paid','Overdue','Refunded') NOT NULL DEFAULT 'Unpaid',
    status ENUM('Pending','Confirmed','Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tour_id) REFERENCES tour_packages(id),
    FOREIGN KEY (departure_id) REFERENCES tour_departures(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('GCash','Maya','Bank Transfer') NOT NULL,
    status ENUM('Pending','Fully Paid','Partial','Overdue','Refunded') NOT NULL DEFAULT 'Pending',
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

INSERT INTO bookings (booking_reference, user_id, tour_id, start_date, end_date, travelers, total_amount, balance_due, payment_method, payment_status, status, booked_at) VALUES
('GV-2026-00017', (SELECT id FROM users WHERE email = 'jaredabellera@gmail.com'), (SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), '2026-07-10', '2026-07-14', 1, 25999, 0,     'GCash', 'Fully Paid', 'Confirmed', '2026-06-19 10:00:00'),
('GV-2026-00016', (SELECT id FROM users WHERE email = 'jaredabellera@gmail.com'), (SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), '2026-07-10', '2026-07-14', 5, 83995, 83995, 'Maya',  'Unpaid',     'Pending',   '2026-06-18 10:00:00'),
('GV-2026-00015', (SELECT id FROM users WHERE email = 'mia.reyes@email.com'),     (SELECT id FROM tour_packages WHERE destination = 'Phuket, Thailand'), '2026-08-20', '2026-08-24', 2, 11000, 11000, 'GCash', 'Unpaid',     'Pending',   '2026-06-15 10:00:00'),
('GV-2026-00013', (SELECT id FROM users WHERE email = 'rico.santos@gmail.com'),   (SELECT id FROM tour_packages WHERE destination = 'Cebu, Philippines'), '2026-06-28', '2026-07-01', 3, 18500, 18500, 'Bank Transfer', 'Unpaid', 'Pending',   '2026-06-10 10:00:00'),
('GV-2026-00012', (SELECT id FROM users WHERE email = 'anna.cruz@gmail.com'),     (SELECT id FROM tour_packages WHERE destination = 'Kyoto, Japan'),     '2026-06-26', '2026-06-30', 2, 35200, 0,     'GCash', 'Fully Paid', 'Confirmed', '2026-06-05 10:00:00'),
('GV-2026-00018', (SELECT id FROM users WHERE email = 'liza.fernandez@gmail.com'),(SELECT id FROM tour_packages WHERE destination = 'Cebu, Philippines'), '2026-07-20', '2026-07-22', 2, 14500, 7250,  'GCash', 'Partial',    'Confirmed', '2026-06-20 10:00:00'),
('GV-2026-00020', (SELECT id FROM users WHERE email = 'jaredabellera@gmail.com'), (SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), '2026-07-10', '2026-07-14', 1, 25999, 0,     'GCash', 'Fully Paid', 'Confirmed', '2026-07-03 10:00:00'),
('GV-2026-00021', (SELECT id FROM users WHERE email = 'jaredabellera@gmail.com'), (SELECT id FROM tour_packages WHERE destination = 'Bali, Indonesia'), '2026-08-05', '2026-08-09', 1, 26499, 0,     'GCash', 'Fully Paid', 'Confirmed', '2026-07-10 10:00:00');

INSERT INTO payments (booking_id, amount, method, status, paid_at) VALUES
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00017'), 25999, 'GCash', 'Fully Paid', '2026-06-19 10:30:00'),
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00012'), 35200, 'GCash', 'Fully Paid', '2026-06-05 11:00:00'),
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00018'), 7250,  'GCash', 'Partial',    '2026-06-20 14:00:00'),
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00020'), 25999, 'GCash', 'Fully Paid', '2026-07-03 09:00:00'),
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00021'), 26499, 'GCash', 'Fully Paid', '2026-07-10 09:00:00');

-- QR payment methods shown on the admin Payments tab ("Payment Methods (QR)").
CREATE TABLE IF NOT EXISTS qr_payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method ENUM('GCash','Maya','Bank Transfer') NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    qr_image_path VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- REQUIRED DOCUMENTS (per booking checklist)
-- ============================================================

CREATE TABLE IF NOT EXISTS required_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    doc_key VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    instructions TEXT NULL,
    status ENUM('Pending Upload','Submitted','Approved') NOT NULL DEFAULT 'Pending Upload',
    file_path VARCHAR(255) NULL,
    uploaded_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

INSERT INTO required_documents (booking_id, doc_key, title, description, instructions, status, file_path, uploaded_at) VALUES
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00020'), 'valid-id',        'Government Valid ID',        'Any government-issued photo ID (Driver''s License, SSS, PhilHealth).', 'Accepted formats: JPG, PNG, PDF. Max size 10MB. Make sure the ID is not expired and all four corners are visible.', 'Submitted', 'uploads/documents/valid-id.jpg', '2026-07-04 09:00:00'),
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00020'), 'birth-cert',      'Birth Certificate',           'PSA-issued birth certificate.', 'Must be an original or certified true copy issued within the last 12 months. Scanned copies must be legible.', 'Pending Upload', NULL, NULL),
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00020'), 'bank-statement',  'Bank Statement',              'Last 3 months showing sufficient travel funds.', 'Upload a bank-certified statement or e-statement covering the last 3 months, with your name and account number visible.', 'Pending Upload', NULL, NULL),
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00020'), 'cert-employment', 'Certificate of Employment',   'Current employment certificate with monthly salary indicated.', 'Must be on company letterhead, signed by HR, and issued within the last 30 days.', 'Pending Upload', NULL, NULL),
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00020'), 'marriage-cert',   'Marriage Certificate',        'PSA-issued, if applicable.', 'Only required if traveling under a married name that differs from your valid ID.', 'Pending Upload', NULL, NULL),
((SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00020'), 'supporting-docs', 'Supporting Documents',        'Any additional documents requested by our travel team.', 'Check your Messages tab for specific requests from the GoVenture team, then upload the corresponding file here.', 'Pending Upload', NULL, NULL);

-- ============================================================
-- MESSAGING (client <-> staff, per booking)
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NULL,
    client_id INT NOT NULL,
    staff_id INT NULL,
    admin_unread TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_role ENUM('client','team') NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

INSERT INTO conversations (id, booking_id, client_id, staff_id) VALUES
(1, (SELECT id FROM bookings WHERE booking_reference = 'GV-2026-00017'), (SELECT id FROM users WHERE email = 'jaredabellera@gmail.com'), (SELECT id FROM users WHERE email = 'maria.santos@goventure.com'));

INSERT INTO messages (conversation_id, sender_role, message_text, sent_at) VALUES
(1, 'client', 'Hi! I just booked the Bali tour. Can you confirm my booking and let me know what documents I need to prepare?', '2026-06-19 14:00:00'),
(1, 'team',   'Hello Jared! Thank you for booking with GoVenture. Your booking GV-2026-00017 is confirmed. Please prepare your passport, 2x2 ID photos, and travel insurance. We will send the full checklist via email shortly!', '2026-06-19 15:00:00'),
(1, 'client', 'Great, thank you! One more question – is the Bali visa on arrival still free for Filipinos?', '2026-06-20 09:30:00'),
(1, 'team',   'Yes! As of 2026, Filipinos can enter Bali visa-on-arrival for free for up to 30 days. No need to arrange anything in advance.', '2026-06-20 10:00:00');

-- ============================================================
-- PLAN A TRIP (personalized trip requests)
-- ============================================================

CREATE TABLE IF NOT EXISTS trip_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    destination VARCHAR(150) NULL,
    date_from DATE NULL,
    date_to DATE NULL,
    travelers INT NOT NULL DEFAULT 1,
    budget_range VARCHAR(50) NULL,
    trip_pace ENUM('Relaxed','Balanced','Adventure') NOT NULL DEFAULT 'Balanced',
    accommodation ENUM('Budget','Mid Range','Luxury') NOT NULL DEFAULT 'Mid Range',
    special_requests TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trip_request_interests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    interest VARCHAR(50) NOT NULL,
    FOREIGN KEY (request_id) REFERENCES trip_requests(id) ON DELETE CASCADE
);

INSERT INTO trip_requests (id, user_id, destination, date_from, date_to, travelers, budget_range, trip_pace, accommodation, special_requests) VALUES
(1, (SELECT id FROM users WHERE email = 'mia.reyes@email.com'), 'Palawan, Philippines', '2026-09-10', '2026-09-14', 2, '₱20,000 – ₱30,000', 'Relaxed', 'Mid Range', 'Celebrating our anniversary — a quiet beachfront room would be lovely.');

INSERT INTO trip_request_interests (request_id, interest) VALUES
(1, 'Beaches'), (1, 'Island Hopping'), (1, 'Food');
