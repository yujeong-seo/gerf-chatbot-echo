-- =============================================================================
-- Great Exhibition Road Festival 2026 — Full Database
-- Source: https://www.greatexhibitionroadfestival.co.uk/whats-on/
-- Schema: zones · events · event_sessions
-- Generated from live website inspection, May 2026
-- =============================================================================

PRAGMA foreign_keys = ON;

-- =============================================================================
-- TABLE: zones
-- 8 themed areas at the heart of the Festival.
-- Sources: /zones/<slug>/ pages
-- =============================================================================

CREATE TABLE IF NOT EXISTS zones (
    zone_id          TEXT PRIMARY KEY,   -- URL slug
    title            TEXT NOT NULL,
    venue_name       TEXT,
    venue_address    TEXT,
    lat              REAL,
    lng              REAL,
    w3w_code         TEXT,               -- what3words navigation code
    age_restriction  TEXT,               -- plain-English label
    amenities        TEXT,               -- zone-level only (bar, food, etc.)
    long_description TEXT,               -- full narrative for vector embedding
    zone_url         TEXT
);

INSERT INTO zones VALUES (
    'family-fun-zone',
    'Family Fun Zone',
    'Kensington Gardens, East Albert Lawn',
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    NULL,
    'Best suited for children under 12 and families',
    'Food stalls and green space on site. Accessible portable toilets. Relaxed session available Sunday morning.',
    'The Family Fun Zone is packed full of brilliant activities especially designed for children under 12 and their families in an exciting new space in Kensington Gardens. Whether you are a budding engineer, medic, adventure seeker or nature lover, there is something for you! Watch lively family-friendly shows on the Family Stage and see an eclectic mix of pop-up performers. Meet engineers trying to break records with solar aircraft, have a go at folding the perfect paper aeroplane and explore the inner workings of a nuclear reactor. Learn about the components of blood and how this vital fluid travels around the body, then help to build a blood-themed art installation. Imagine yourself in the coldest place on Earth as you become a polar explorer. Then discover the wildlife and history of the Royal Parks, find out how owning a pet can affect your local environment or climb like a gecko as you delve into the potential of nature-inspired materials. Families with children under five can drop in to enjoy stories, songs, rhymes and crafts made just for them.',
    'https://www.greatexhibitionroadfestival.co.uk/zones/family-fun-zone/'
);

INSERT INTO zones VALUES (
    'adults-only-zone',
    'Adults Only Zone',
    'Beit Quadrangle, Imperial College London',
    '2 Prince Consort Road, South Kensington, London SW7 2BB',
    51.49993, -0.17806,
    'retain.bills.shut',
    '18+ only',
    'Bar and restaurant on site. Step-free access and accessible toilets.',
    'Interactive, honest and sometimes provocative, visit our Adults Only Zone to grab a drink, a bite to eat and a slice of science. Discover science that connects directly to our bodies, relationships and lived experiences. Chat to researchers from the Women''s Health Network as you make your own fridge magnet to take home. Then become a star in a Bollywood dance class exploring the night sky led by Bollyqueer. Want to know what''s happening in your brain when you''re in a situationship versus with your soul mate? Take the Science of Attraction Quiz to discover the secret of desire in the brain. Keen for some science comedy? Head towards the Science Cabaret for live performances blending art and science. When you''re in between shows, learn life-saving CPR while you boogie to disco classics. Then find out your true age using movie-making technology that tracks your walking speed. This zone is for 18+ only.',
    'https://www.greatexhibitionroadfestival.co.uk/zones/adults-only-zone/'
);

INSERT INTO zones VALUES (
    'nextgen-zone',
    'NextGen Zone',
    'The Smith Centre, Science Museum',
    'Imperial College Road, London SW7 2BX',
    51.49791, -0.17481,
    'gentle.united.rivers',
    'Best suited for ages 13–25',
    NULL,
    'Join us at the NextGen Zone, a high-energy hub designed by and for the innovators of tomorrow. The NextGen Zone is a space for teens and young adults where art and science collide. No need to be an expert to enjoy it, just step inside! Marvel at the wacky advances in robotics, discover the unexpected side of human biology or unleash and challenge your creativity. Find the fun in the fundamentals of science and art in interactive displays, hands-on workshops, and chats with experts. Are you ready to tackle the big decision to stop a future pandemic? What about DIY-ing your own lab equipment? Can you challenge a robotic arm and win? Or explore the layers of art through a different lens? If you are feeling less active, then kick back and watch a match of robo-football, take a pic in our photobooth or chat with the Young Producers about the hidden heritage of the area.',
    'https://www.greatexhibitionroadfestival.co.uk/zones/nextgen-zone/'
);

INSERT INTO zones VALUES (
    'happiness-and-health-zone',
    'Happiness and Health Zone',
    'Queen''s Tower Rooms, Sherfield Building',
    'Level 1 Sherfield Building, South Kensington Campus, London SW7 2AZ',
    51.49863, -0.17735,
    NULL,
    'Suitable for all ages',
    NULL,
    'Meet scientists, doctors, and engineers and discover how they are transforming the future of our happiness and health! Explore exciting innovations including AI-powered diagnostics and wearable health tech, as you get hands-on with the latest medical advancements changing the way we prevent, diagnose, and treat diseases. Come and create your own zine and explore how invisible disabilities, such as Sickle Cell, shape people''s everyday experiences. Step back in time into a West Indies living room from the 1970s to discover how diseases travel the globe, before immersing yourself in the sound of our cells. Then take part in interactive activities that show how simple choices can improve your wellbeing and the health of those around you.',
    'https://www.greatexhibitionroadfestival.co.uk/zones/happiness-and-health-zone/'
);

INSERT INTO zones VALUES (
    'be-a-scientist-zone',
    'Be A Scientist Zone',
    'Flowers Building, Imperial College London',
    'South Kensington, London SW7 2DD',
    51.4975, -0.17786,
    NULL,
    'Suitable for all ages',
    NULL,
    'Get involved in cutting-edge science and shape the future of Imperial research in the Be A Scientist Zone. From trying out surgical robots to designing new wearable tech jewellery, find researchers keen to work with you. In this Zone you are a part of the research! Help our scientists and engineers shape the direction of science by taking part in research happening right now. Have fun and have your say on what future research could look like. Step inside and become part of the experiment. Train future surgery robots by playing a robot-controlled version of the board game Operation, play a life-sized game of Snakes and Ladders or get creative as you learn about epilepsy and design your own seizure-predicting wearable jewellery to inform the future of wearable tech.',
    'https://www.greatexhibitionroadfestival.co.uk/zones/be-a-scientist-zone/'
);

INSERT INTO zones VALUES (
    'world-science-zone',
    'World Science Zone',
    'Business School, Imperial College London',
    'Exhibition Road, London SW7 2AZ',
    51.49933, -0.17478,
    NULL,
    'Suitable for all ages',
    NULL,
    'Step inside the World Science Zone and explore pioneering projects from every corner of the planet. Discover the bold ideas and boundary-pushing research tackling everything from disease eradication and clean energy to intelligent cities, soft robotics and the future of food. Whether you want to play malarial video games, or take a breezy behind-the-scenes tour of wind tunnels, there is something to surprise every curious mind. Design your own soft, squishy robot inspired by flexible fibrebots that can navigate inside the human body. Explore how intelligent transport networks and low-carbon hydrogen could reshape tomorrow''s sustainable cities. Or remotely operate autonomous underwater robots used to inspect offshore wind farms. And when you''re ready for a break, pull up a chair at our future-food dining table, where researchers will offer a glimpse of next-generation meat alternatives designed to cut emissions, protect biodiversity and feed a growing world.',
    'https://www.greatexhibitionroadfestival.co.uk/zones/world-science-zone/'
);

INSERT INTO zones VALUES (
    'underground-adventure-zone',
    'Underground Adventure Zone',
    'Prince''s Gardens',
    'Prince''s Gardens, South Kensington, London SW7',
    51.49928, -0.17296,
    NULL,
    'Suitable for all ages',
    'Large marquee in a garden with grass and paths. Step-free access and accessible portable toilets.',
    'Enter the Underground Adventure Zone marquee to explore the world beneath your feet. Discover a subterranean world, home to burrowing animals, sprouting seeds and vast, interconnected fungal networks. Meet researchers to learn about these animals, plants and fungi through games, hands-on activities and crafts. Join Earthbeat, an underground silent disco where you can dance your way through the sub-surface ecosystem. Delve deeper as rocks reveal the secrets of long-extinct fossilised creatures, along with the minerals and metals used in everything from technology and buildings to food and even toothpaste. The ground itself can be unpredictable and pose challenges to engineers. Explore how vibrations in the earth can affect bridges and buildings and watch (and feel) quicksand being made.',
    'https://www.greatexhibitionroadfestival.co.uk/zones/underground-adventure-zone/'
);

INSERT INTO zones VALUES (
    'tech-zone',
    'Tech Zone',
    'Sir Alexander Fleming Building, Imperial College London',
    'Imperial College Road, London SW7 2AZ',
    51.49783, -0.17658,
    'piper.ridge.trail',
    'Suitable for all ages',
    NULL,
    'Experience the ground-breaking technologies that are shaping our world, from robots and medical wearables, to spacecraft inspired by origami. Come along to the Robot Playground to discover how robots are transforming healthcare, aiding exploration in challenging or remote environments, protecting and monitoring entire ecosystems and extending human physical capabilities. Race a robot to see how laboratory research has developed over the last 175 years. Explore how smart home technologies can spot subtle changes in your wellbeing and turn yourself into a 3D avatar! Then drive through a virtual South Kensington, navigating traffic as a VR pedestrian. Discover how light can reveal what''s happening inside the body, then explore the magic of the digital world. Step upstairs to find an immersive digital art piece that explores the strangeness of the quantum world and new ways to sense the world around us. With hands-on activities, immersive experiences and inspiring research at every turn, the Tech Zone celebrates the creativity and curiosity driving the technologies of tomorrow.',
    'https://www.greatexhibitionroadfestival.co.uk/zones/tech-zone/'
);


-- =============================================================================
-- TABLE: events
-- One row per event. Multi-slot events flagged; sessions stored in event_sessions.
-- Sources: /whats-on/ listing + /event/<slug>/ detail pages
-- =============================================================================

CREATE TABLE IF NOT EXISTS events (
    event_id                      TEXT PRIMARY KEY,
    zone_id                       TEXT REFERENCES zones(zone_id),
    title                         TEXT NOT NULL,
    -- Location
    venue_name                    TEXT,
    venue_room                    TEXT,
    venue_address                 TEXT,
    lat                           REAL,
    lng                           REAL,
    -- Schedule
    dates                         TEXT,   -- 'Saturday' | 'Sunday' | 'Both' | 'Friday'
    time                          TEXT,   -- '12:00–18:00' | 'multi-slot — see sessions'
    is_multi_slot                 INTEGER DEFAULT 0,  -- 0=false, 1=true
    -- Content
    short_description             TEXT,
    long_description              TEXT,
    experience_type               TEXT,   -- 'Exhibit'|'Performance'|'Workshop'|'Talk & Tour'
    -- Visitor: Age
    audience_tags                 TEXT,   -- comma-separated e.g. 'Adults, Family (ages 5+)'
    age_label                     TEXT,   -- human-readable
    age_min                       INTEGER,
    age_max                       INTEGER,
    children_must_be_accompanied  INTEGER DEFAULT 0,
    -- Visitor: Accessibility
    access_step_free              INTEGER,  -- 1=yes, 0=no, NULL=not stated
    access_toilets                INTEGER,
    access_bsl                    INTEGER DEFAULT 0,
    access_captioned              INTEGER DEFAULT 0,
    access_relaxed                INTEGER DEFAULT 0,
    access_notes                  TEXT,
    -- Visitor: Registration
    registration_type             TEXT,  -- 'drop-in'|'free-ticket'|'paid-ticket'
    booking_url                   TEXT,
    arrival_notes                 TEXT,
    -- Meta
    image_url                     TEXT,
    event_url                     TEXT
);


-- =============================================================================
-- TABLE: event_sessions
-- One row per time slot. Only populated for is_multi_slot = 1 events.
-- =============================================================================

CREATE TABLE IF NOT EXISTS event_sessions (
    session_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      TEXT NOT NULL REFERENCES events(event_id),
    date          TEXT NOT NULL,   -- 'Saturday 6 June' | 'Sunday 7 June'
    time_start    TEXT NOT NULL,   -- 'HH:MM' 24-hour
    time_end      TEXT NOT NULL,
    session_notes TEXT             -- e.g. 'BSL + live captioning', 'Saturday only'
);


-- =============================================================================
-- EVENT DATA
-- Ordered by zone, then alphabetically within zone.
-- Unzoned / street events appear at the end.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- FAMILY FUN ZONE
-- ---------------------------------------------------------------------------

INSERT INTO events VALUES (
    'family-fun-zone-relaxed-session', 'family-fun-zone',
    'Family Fun Zone: Relaxed Session',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Sunday', '11:00–12:00', 0,
    'A relaxed session for families with neurodivergent members who may need a quieter, calmer environment to explore the Family Fun Zone.',
    'A dedicated relaxed session giving families with neurodivergent members the chance to explore the Family Fun Zone before the main crowds arrive. The zone will be quieter and calmer during this hour, allowing visitors to move at their own pace.',
    'Exhibit',
    'Family (ages 5+), Family (under 5s)',
    'All family ages — relaxed/quiet session', 0, NULL, 1,
    1, 1, 0, 0, 1,
    'Dedicated quiet session before main opening. Step-free access and accessible portable toilets throughout the Family Fun Zone.',
    'free-ticket',
    'https://www.eventbrite.com/e/1985057931710?aff=oddtdtcreator',
    NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/family-fun-zone-relaxed-session/'
);

INSERT INTO events VALUES (
    'family-stage-2026', 'family-fun-zone',
    'Family Stage',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Head to our Family Stage and enjoy a programme packed with interactive performances, music, and science shows especially for families.',
    'The Family Stage hosts a packed programme of interactive performances, live music and science shows designed especially for families throughout both festival days.',
    'Performance',
    'Family (ages 5+)',
    'All family ages', 0, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/family-stage-2026/'
);

INSERT INTO events VALUES (
    'under-the-maypole', 'family-fun-zone',
    'Under the Maypole',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Stop off under our 12 foot maypole for a programme of pop-up entertainment, whether it''s dance, music or playing with sound, there''s something for everyone!',
    'Stop off under a 12-foot maypole for a programme of pop-up entertainment throughout the festival, covering dance, music and sound play. Something for every member of the family.',
    'Performance',
    'Family (ages 5+)',
    'All family ages', 0, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/whats-on/event/under-the-maypole/'
);

INSERT INTO events VALUES (
    'culture-and-creativity-in-french-and-german', 'family-fun-zone',
    'Culture and Creativity in French',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Get creative while practising French language skills! Write a poem, enjoy storytelling and play games!',
    'Get creative while practising French language skills through poetry writing, storytelling and games in this family-friendly drop-in activity.',
    'Workshop',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/culture-and-creativity-in-french-and-german/'
);

INSERT INTO events VALUES (
    'whats-in-our-blood', 'family-fun-zone',
    'What''s in Your Blood?',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Discover what your blood is actually made of and how it keeps you healthy by helping us build a giant blood-themed sculpture.',
    'Discover what blood is actually made of and how it keeps you healthy by contributing to the construction of a giant blood-themed sculpture.',
    'Workshop',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/whats-in-our-blood/'
);

INSERT INTO events VALUES (
    'the-atomic-arcade', 'family-fun-zone',
    'The Atomic Arcade',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Explore how a nuclear reactor works through an interactive arcade game, and use a Geiger counter to test the radioactivity of commonly found items!',
    'Explore the inner workings of a nuclear reactor through an interactive arcade game, and use a real Geiger counter to test the radioactivity of everyday household items.',
    'Exhibit',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/the-atomic-arcade/'
);

INSERT INTO events VALUES (
    'molecules-and-red-cells', 'family-fun-zone',
    'Molecules and Red Cells',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Make candy models to learn more about the structure of molecules, and race blood cells though mazes to discover how disease affects blood flow.',
    'Make candy models to explore molecule structure, and race blood cells through mazes to discover how disease affects blood flow in this hands-on family science activity.',
    'Workshop',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/molecules-and-red-cells/'
);

INSERT INTO events VALUES (
    'eco-pawprints-2026', 'family-fun-zone',
    'Eco Pawprints',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Did you know how much owning a pet can impact the environment? Learn how we can reduce our pets'' eco pawprints!',
    'Learn about the surprising environmental impact of pet ownership and discover practical ways to reduce your pet''s eco pawprint.',
    'Exhibit',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/eco-pawprints-2026/'
);

INSERT INTO events VALUES (
    'discover-the-royal-parks-2026', 'family-fun-zone',
    'Discover the Royal Parks',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Explore the Royal Parks'' incredible wildlife and unique heritage through hands-on activities for all ages.',
    'Explore the incredible wildlife and unique heritage of the Royal Parks through a variety of hands-on activities suitable for all ages.',
    'Exhibit',
    'Family (ages 5+)',
    'All ages', 0, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/discover-the-royal-parks-2026/'
);

INSERT INTO events VALUES (
    'soaring-sailing-solar-planes', 'family-fun-zone',
    'Soaring Sailing Solar Planes',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Check out a solar-powered, unmanned aircraft developed for a record-breaking flight attempt by a team of aeronautical engineers!',
    'See a solar-powered, unmanned aircraft developed for a record-breaking flight attempt by aeronautical engineers and learn about the technology behind sustainable aviation.',
    'Exhibit',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/soaring-sailing-solar-planes/'
);

INSERT INTO events VALUES (
    'future-of-flight', 'family-fun-zone',
    'Future of Flight',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Take the ultimate test of your engineering skills by designing, flying and redesigning the perfect paper plane.',
    'Test your engineering skills by designing, flying and iteratively redesigning the perfect paper plane in this hands-on family activity.',
    'Workshop',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/future-of-flight/'
);

-- MULTI-SLOT: Rocket Mice
INSERT INTO events VALUES (
    'rocket-mice', 'family-fun-zone',
    'Rocket Mice',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', 'multi-slot — see sessions', 1,
    'Build your very own rocket mice and launch them into the air using the power of a squeeze!',
    'Sometimes it IS rocket science! Families with young children are invited to join the Science Museum Explainer team to build and launch very own rockets using the power of a squeeze. Explore what your rocket will look like and how high it can get your astronaut-mouse to fly.',
    'Workshop',
    'Family (under 5s)',
    'Best suited for children under 5', 0, 5, 1,
    1, 1, 0, 0, 0,
    'Step-free access and accessible portable toilets in the Family Fun Zone.',
    'drop-in', NULL, NULL,
    'https://www.greatexhibitionroadfestival.co.uk/media/event_images/rocket_mice.png',
    'https://www.greatexhibitionroadfestival.co.uk/event/rocket-mice/'
);

INSERT INTO events VALUES (
    'antarctica-the-coolest-place-on-earth', 'family-fun-zone',
    'Antarctica: The Coolest Place on Earth',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Take a trip to Antarctica and find out what it''s like to conduct research on the coldest, driest and most remote continent on Earth!',
    'Take a virtual trip to Antarctica and experience what it is like to conduct research on the coldest, driest and most remote continent on Earth. Look out for penguins!',
    'Exhibit',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/antarctica-the-coolest-place-on-earth/'
);

INSERT INTO events VALUES (
    'wonderful-materials', 'family-fun-zone',
    'Wonderful Materials',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Climb like a gecko, reflect like a beetle, or sense heat like a dog''s nose as you explore the potential of nature-inspired materials.',
    'Climb like a gecko, reflect like a beetle, or sense heat like a dog''s nose as you explore the exciting potential of nature-inspired materials science.',
    'Exhibit',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/wonderful-materials/'
);

INSERT INTO events VALUES (
    'the-story-song-wriggle-and-rhyme-tent', 'family-fun-zone',
    'The Story, Song, Wriggle and Rhyme Tent',
    'Kensington Gardens, East Albert Lawn', NULL,
    'Kensington Gardens, East Albert Lawn, London W8 4PU',
    51.5027, -0.1778,
    'Both', '12:00–18:00', 0,
    'Visit our fun-packed tent for stories, sing-alongs, and rhyme and movement sessions for children under 5 and their families.',
    'A dedicated tent for children under 5 and their families, offering stories, sing-alongs, rhymes and movement sessions throughout both festival days.',
    'Performance',
    'Family (under 5s)',
    'Designed for children under 5 and their families', 0, 5, 1,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/the-story-song-wriggle-and-rhyme-tent/'
);


-- ---------------------------------------------------------------------------
-- ADULTS ONLY ZONE
-- ---------------------------------------------------------------------------

INSERT INTO events VALUES (
    'adults-only-zone-relaxed-session', 'adults-only-zone',
    'Adults Only Zone: Relaxed Session',
    'Beit Quadrangle, Imperial College London', NULL,
    '2 Prince Consort Road, South Kensington, London SW7 2BB',
    51.49993, -0.17806,
    'Sunday', '12:00–13:00', 0,
    'Enjoy a quieter, calmer environment to explore our Adults Only Zone with fewer crowds by signing up for this bookable relaxed session.',
    'A dedicated quiet hour before the main crowds arrive, giving adults a chance to explore the Adults Only Zone at their own pace in a calmer environment.',
    'Exhibit',
    'Adults',
    '18+ only', 18, NULL, 0,
    1, 1, 0, 0, 1,
    'Step-free access and accessible toilets in the Adults Only Zone.',
    'free-ticket',
    'https://www.eventbrite.com/e/1985057931710?aff=oddtdtcreator',
    NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/adults-only-zone-relaxed-session/'
);

INSERT INTO events VALUES (
    'zen-bus-creating-calm', 'adults-only-zone',
    'Zen Bus: Creating Calm',
    'Beit Quadrangle, Imperial College London', NULL,
    '2 Prince Consort Road, South Kensington, London SW7 2BB',
    51.49993, -0.17806,
    'Both', '12:00–18:00', 0,
    'Enjoy a different pace at the Festival as you hop on to the Zen Bus for playful, immersive zen experiences designed to bring joy, calm and connection.',
    'Step aboard the Zen Bus for playful, immersive zen experiences carefully designed to bring joy, calm and human connection in the midst of the busy festival.',
    'Exhibit',
    'Adults',
    '18+ only', 18, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/zen-bus-creating-calm/'
);

INSERT INTO events VALUES (
    'science-cabaret-2026', 'adults-only-zone',
    'Science Cabaret',
    'Beit Quadrangle, Imperial College London', NULL,
    '2 Prince Consort Road, South Kensington, London SW7 2BB',
    51.49993, -0.17806,
    'Both', '12:00–18:00', 0,
    'Science takes centre stage inside our Science Cabaret, full of high energy live shows and performances. Discover the science behind attraction, giggle away at award-winning comedy or make your own scientific mocktail!',
    'Science takes centre stage inside the Science Cabaret with a full programme of high-energy live shows blending art and science. Discover the science of attraction, enjoy award-winning comedy and make your own scientific mocktail.',
    'Performance',
    'Adults',
    '18+ only', 18, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/science-cabaret-2026/'
);

INSERT INTO events VALUES (
    'creative-connections-imperial-cosmologies', 'adults-only-zone',
    'Creative Connections: Imperial Cosmologies',
    'Beit Quadrangle, Imperial College London', NULL,
    '2 Prince Consort Road, South Kensington, London SW7 2BB',
    51.49993, -0.17806,
    'Both', '12:00–18:00', 0,
    'A Victorian inspired installation exploring Imperial College London''s history and heritage.',
    'A Victorian-inspired installation exploring Imperial College London''s history and heritage through immersive visual art.',
    'Exhibit',
    'Adults',
    '18+ only', 18, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/creative-connections-imperial-cosmologies/'
);

INSERT INTO events VALUES (
    'love-on-the-brain', 'adults-only-zone',
    'Love on the Brain',
    'Beit Quadrangle, Imperial College London', NULL,
    '2 Prince Consort Road, South Kensington, London SW7 2BB',
    51.49993, -0.17806,
    'Both', '12:00–18:00', 0,
    'Curious about why your heart races around someone you like? Create hormone-inspired origami while you explore the science of attraction and desire.',
    'Curious about why your heart races around someone you like? Create hormone-inspired origami while exploring the neuroscience and biology of attraction, desire and love.',
    'Workshop',
    'Adults',
    '18+ only', 18, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/love-on-the-brain/'
);

INSERT INTO events VALUES (
    'walking-through-the-ages', 'adults-only-zone',
    'Walking Through the Ages',
    'Beit Quadrangle, Imperial College London', NULL,
    '2 Prince Consort Road, South Kensington, London SW7 2BB',
    51.49993, -0.17806,
    'Both', '12:00–18:00', 0,
    'Explore what history tells us about how Londoners moved through the city, and discover what our walking patterns can reveal about our health.',
    'Explore what history tells us about how Londoners moved through the city, and discover what our walking patterns can reveal about our health. Movie-making technology is used to track walking speed and determine your true biological age.',
    'Exhibit',
    'Adults',
    '18+ only', 18, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/walking-through-the-ages/'
);

INSERT INTO events VALUES (
    'beads-and-biomes', 'adults-only-zone',
    'Beads and Biomes',
    'Beit Quadrangle, Imperial College London', NULL,
    '2 Prince Consort Road, South Kensington, London SW7 2BB',
    51.49993, -0.17806,
    'Both', '12:00–18:00', 0,
    'Pick up a petri dish, choose your fabric and create your own textile art to take home inspired by the fascinating world of the vaginal microbiome.',
    'Pick up a petri dish, choose your fabric and create your own textile art inspired by the fascinating world of the vaginal microbiome in this adults-only creative workshop.',
    'Workshop',
    'Adults',
    '18+ only', 18, NULL, 0,
    1, 1, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/beads-and-biomes/'
);

-- MULTI-SLOT: Bollywood Under the Stars
INSERT INTO events VALUES (
    'bollywood-under-the-stars', 'adults-only-zone',
    'Bollywood Under the Stars',
    'Beit Quadrangle, Imperial College London', NULL,
    '2 Prince Consort Road, South Kensington, London SW7 2BB',
    51.49993, -0.17806,
    'Both', 'multi-slot — see sessions', 1,
    'Step onto the dancefloor and get ready to shine in a fun beginner-friendly Bollywood dance class with researchers exploring how stars are born.',
    'Step onto the dancefloor for a beginner-friendly Bollywood dance class exploring how stars are born. Join researchers from Imperial College London''s Astrophysics Research Group and Bollyqueer, a Bollywood dance collective celebrating empowerment beyond gender norms. Dance through the epic journey of star formation — gliding like swirling gas clouds, bursting into life like a protostar and glowing with the energy of a newborn stellar nursery. The session includes a warm-up, an introduction to the science of the night sky and an accessible choreography to take home. No prior dance experience needed.',
    'Workshop',
    'Adults',
    '18+ only', 18, NULL, 0,
    1, 1, 0, 0, 0,
    'Zone is 18+ only. Step-free access and accessible toilets.',
    'free-ticket',
    'https://www.eventbrite.co.uk/e/1986315129021?aff=oddtdtcreator',
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/media/event_images/bollywood_under_the_stars.jpg',
    'https://www.greatexhibitionroadfestival.co.uk/event/bollywood-under-the-stars/'
);


-- ---------------------------------------------------------------------------
-- NEXTGEN ZONE
-- ---------------------------------------------------------------------------

INSERT INTO events VALUES (
    'revisiting-1851', 'nextgen-zone',
    'Uncovering 1851',
    'The Smith Centre, Science Museum', NULL,
    'Imperial College Road, London SW7 2BX',
    51.49791, -0.17481,
    'Both', '12:00–18:00', 0,
    'Explore hidden stories from the Great Exhibition of 1851 through a textile art installation created by our Young Producers.',
    'Explore the hidden stories from the Great Exhibition of 1851 through a striking textile art installation researched and created by the festival''s Young Producers programme.',
    'Exhibit',
    'Young People (13–25)',
    'Best suited for ages 13–25', 13, 25, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/revisiting-1851/'
);

INSERT INTO events VALUES (
    'RoboFootball', 'nextgen-zone',
    'RoboFootball',
    'The Smith Centre, Science Museum', NULL,
    'Imperial College Road, London SW7 2BX',
    51.49791, -0.17481,
    'Both', '12:00–18:00', 0,
    'Watch robots play football live! Discover how you can coordinate multiple intelligent agents to compete, strategise and win on the pitch—all without human control.',
    'Watch robots play football live and discover how multiple intelligent agents can be coordinated to compete, strategise and win on the pitch — all without any human control during the match.',
    'Exhibit',
    'Young People (13–25)',
    'Best suited for ages 13–25', 13, 25, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/RoboFootball/'
);

INSERT INTO events VALUES (
    'curate-a-great-exhibition', 'nextgen-zone',
    'Curate a Great Exhibition!',
    'The Smith Centre, Science Museum', NULL,
    'Imperial College Road, London SW7 2BX',
    51.49791, -0.17481,
    'Both', '12:00–18:00', 0,
    'Become a curator for the day with Assemblage Collective! In this hands-on workshop, you''ll design your very own miniature exhibition by crafting and designing a paper concertina.',
    'Become a curator for the day with Assemblage Collective! In this hands-on workshop you will design your very own miniature exhibition by crafting and designing a paper concertina booklet.',
    'Workshop',
    'Young People (13–25)',
    'Best suited for ages 13–25', 13, 25, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/curate-a-great-exhibition/'
);


-- ---------------------------------------------------------------------------
-- HAPPINESS AND HEALTH ZONE
-- ---------------------------------------------------------------------------

INSERT INTO events VALUES (
    'resist-the-resistance', 'happiness-and-health-zone',
    'Resist the Resistance!',
    'Queen''s Tower Rooms, Sherfield Building', 'Marquee at entrance',
    'Level 1 Sherfield Building, South Kensington Campus, London SW7 2AZ',
    51.49863, -0.17735,
    'Both', '12:00–18:00', 0,
    'Antibiotics have changed all our lives, but resistance to them is catching up. Play a game to explore antimicrobial resistance and discover how you can help protect these life-saving medicines.',
    'Antibiotics have changed all our lives, but resistance to them is catching up fast. Play an interactive game to explore antimicrobial resistance and discover what you can do to help protect these life-saving medicines for future generations.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/resist-the-resistance/'
);

INSERT INTO events VALUES (
    'making-the-invisible-visible', 'happiness-and-health-zone',
    'Making the Invisible Visible',
    'Queen''s Tower Rooms, Sherfield Building', NULL,
    'Level 1 Sherfield Building, South Kensington Campus, London SW7 2AZ',
    51.49863, -0.17735,
    'Both', '12:00–18:00', 0,
    'Make your own mini zine that creatively reflects on how invisible disabilities like Sickle Cell Disease can shape people''s everyday experiences.',
    'Make your own mini zine that creatively reflects on how invisible disabilities like Sickle Cell Disease can shape people''s everyday experiences, raising awareness through personal storytelling and art.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/making-the-invisible-visible/'
);

INSERT INTO events VALUES (
    'gene-home', 'happiness-and-health-zone',
    'Gene Home',
    'Queen''s Tower Rooms, Sherfield Building', NULL,
    'Level 1 Sherfield Building, South Kensington Campus, London SW7 2AZ',
    51.49863, -0.17735,
    'Both', '12:00–18:00', 0,
    'Set inside the 1970s living room of a Caribbean family in London, this immersive experience explores how genes, culture, community and migration shape health and identity.',
    'Set inside the recreated 1970s living room of a Caribbean family in London, this immersive experience explores how genes, culture, community and migration shape health and identity across generations.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/gene-home/'
);

INSERT INTO events VALUES (
    'medicine-metabolism-meals-and-me', 'happiness-and-health-zone',
    'Medicine, Metabolism, Meals and Me',
    'Queen''s Tower Rooms, Sherfield Building', NULL,
    'Level 1 Sherfield Building, South Kensington Campus, London SW7 2AZ',
    51.49863, -0.17735,
    'Both', '12:00–18:00', 0,
    'Explore how culture, food and traditional knowledge shape our health in this creative workshop!',
    'Explore how culture, food and traditional knowledge from around the world shape our health and wellbeing in this creative and participatory workshop.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/medicine-metabolism-meals-and-me/'
);


-- ---------------------------------------------------------------------------
-- BE A SCIENTIST ZONE
-- ---------------------------------------------------------------------------

INSERT INTO events VALUES (
    'heart-heroes', 'be-a-scientist-zone',
    'Heart Heroes',
    'Flowers Building, Imperial College London', NULL,
    'South Kensington, London SW7 2DD',
    51.4975, -0.17786,
    'Both', '12:00–18:00', 0,
    'Roll the giant dice and put your heart to the test! Learn about heart rate variability and what it tells us about how our bodies respond to stress, movement and relaxation.',
    'Roll the giant dice and put your heart to the test! Learn about heart rate variability and what it reveals about how our bodies respond to stress, movement and relaxation — and contribute to real ongoing research.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/heart-heroes/'
);

INSERT INTO events VALUES (
    'ladders-to-immunity', 'be-a-scientist-zone',
    'Ladders to Immunity',
    'Flowers Building, Imperial College London', NULL,
    'South Kensington, London SW7 2DD',
    51.4975, -0.17786,
    'Both', '12:00–18:00', 0,
    'Try out a life-sized twist on Snakes and Ladders where vaccines take centre stage. Alternatively become a scientist, interviewing your friends and family to support ongoing medical research.',
    'Try out a life-sized twist on Snakes and Ladders where vaccines take centre stage. Or become a scientist by interviewing your friends and family to support ongoing medical research happening in real time.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/ladders-to-immunity/'
);

INSERT INTO events VALUES (
    'breathe-bark-and-predict-seizures', 'be-a-scientist-zone',
    'Breathe, Bark and Predict Seizures',
    'Flowers Building, Imperial College London', NULL,
    'South Kensington, London SW7 2DD',
    51.4975, -0.17786,
    'Both', '12:00–18:00', 0,
    'Learn about epilepsy and design your own seizure-predicting jewellery, helping to inspire the future of wearable technology supporting people with epilepsy.',
    'Learn about epilepsy and design your own seizure-predicting jewellery, helping to inspire the future of wearable technology that could support people living with epilepsy.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/breathe-bark-and-predict-seizures/'
);

INSERT INTO events VALUES (
    'robodoc-robots-and-radiation', 'be-a-scientist-zone',
    'RoboDoc: Robots and Radiation',
    'Flowers Building, Imperial College London', NULL,
    'South Kensington, London SW7 2DD',
    51.4975, -0.17786,
    'Both', '12:00–18:00', 0,
    'Explore the past, present and future of medical imaging and robotic surgery through interactive games.',
    'Explore the past, present and future of medical imaging and robotic surgery through hands-on interactive games. Train future surgery robots by playing a robot-controlled version of the board game Operation.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/robodoc-robots-and-radiation/'
);


-- ---------------------------------------------------------------------------
-- WORLD SCIENCE ZONE
-- ---------------------------------------------------------------------------

INSERT INTO events VALUES (
    'steaming-fibres-and-fabrics', 'world-science-zone',
    'STEAMing Fibres and Fabrics',
    'Business School, Imperial College London', NULL,
    'Exhibition Road, London SW7 2AZ',
    51.49933, -0.17478,
    'Both', '12:00–18:00', 0,
    'Find out how medical robotics and innovative fibre-based devices are revolutionising surgery.',
    'Find out how medical robotics and innovative fibre-based devices — including flexible fibrebots that can navigate inside the human body — are revolutionising surgery and healthcare.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/steaming-fibres-and-fabrics/'
);

INSERT INTO events VALUES (
    'worlds-within-us', 'world-science-zone',
    'Worlds Within Us',
    'Business School, Imperial College London', NULL,
    'Exhibition Road, London SW7 2AZ',
    51.49933, -0.17478,
    'Both', '12:00–18:00', 0,
    'Consider your relationship with the different organisms living inside your body through this interactive art installation.',
    'Consider your relationship with the trillions of different organisms living inside your body through this thought-provoking interactive art installation.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/worlds-within-us/'
);

INSERT INTO events VALUES (
    'make-a-body-bot', 'world-science-zone',
    'Make a Body Bot',
    'Business School, Imperial College London', NULL,
    'Exhibition Road, London SW7 2AZ',
    51.49933, -0.17478,
    'Both', '12:00–18:00', 0,
    'Create your own textile body bots with artist Woo Jin Joo and bring them to life using pull-string mechanisms!',
    'Create your own textile body bots with artist Woo Jin Joo and bring them to life using pull-string mechanisms in this creative hands-on workshop at the World Science Zone.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/make-a-body-bot/'
);


-- ---------------------------------------------------------------------------
-- UNDERGROUND ADVENTURE ZONE
-- ---------------------------------------------------------------------------

INSERT INTO events VALUES (
    'spores-galore-wearable-wonders', 'underground-adventure-zone',
    'Spores Galore: Wearable Wonders',
    'Prince''s Gardens', NULL,
    'Prince''s Gardens, South Kensington, London SW7',
    51.49928, -0.17296,
    'Both', '12:00–18:00', 0,
    'Create a unique wearable spore patch inspired by a host of funky fungal friends that thrive beneath our feet!',
    'Create a unique wearable spore patch inspired by the diversity of fungi that thrive beneath our feet in this craft-based workshop inside the Underground Adventure Zone.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    1, 1, 0, 0, 0,
    'Zone is a large marquee on grass with step-free access and accessible portable toilets.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/spores-galore-wearable-wonders/'
);

INSERT INTO events VALUES (
    'glow-and-grow-illuminating-bioengineering', 'underground-adventure-zone',
    'Glow and Grow: Illuminating Bioengineering',
    'Prince''s Gardens', NULL,
    'Prince''s Gardens, South Kensington, London SW7',
    51.49928, -0.17296,
    'Both', '12:00–18:00', 0,
    'Check out luminous cells and soundscapes inspired by molecular biology, before creating your own contributions to our glowing gazebo gallery.',
    'Check out luminous cells and soundscapes inspired by molecular biology, then create your own glowing contributions for the gazebo gallery in this immersive bioengineering exhibit.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    1, 1, 0, 0, 0,
    'Zone is a large marquee on grass with step-free access and accessible portable toilets.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/glow-and-grow-illuminating-bioengineering/'
);

-- MULTI-SLOT: Earthbeat
INSERT INTO events VALUES (
    'earthbeat-the-underground-disco', 'underground-adventure-zone',
    'Earthbeat: The Underground Disco',
    'Prince''s Gardens', NULL,
    'Prince''s Gardens, South Kensington, London SW7',
    51.49928, -0.17296,
    'Both', 'multi-slot — see sessions', 1,
    'Bring your best moves for Earthbeat, an immersive dance experience for all ages, inspired by secret worlds pulsing beneath our feet.',
    'Beneath our feet, a hidden world pulses with life! Every day, scientists are discovering more about complex relationships within our soil, particularly the vast mycelium networks of fungi. At Earthbeat you will step into this secret world, recreating it together on the dancefloor. Developed by artists Geraldine Cox and Emma Bellerby, with support from scientists from the Imperial Fungal Network, Earthbeat is inspired by the joyful, communal spirit of ceilidh dancing, reimagined as a silent disco for the whole family. No dance experience is needed — just grab a pair of silent disco headphones and bring your curiosity, energy and imagination.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 1,
    1, 1, 0, 0, 0,
    'Large marquee on grass with step-free access and accessible portable toilets. Advance ticket gives priority access; arrive 10 minutes before start time.',
    'free-ticket',
    'https://www.eventbrite.co.uk/e/1986028981145?aff=oddtdtcreator',
    'Arrive 10 minutes before start time. Free event with overbooking — early arrival reduces risk of reallocation.',
    'https://www.greatexhibitionroadfestival.co.uk/media/event_images/earthbeat_2.jpg',
    'https://www.greatexhibitionroadfestival.co.uk/event/earthbeat-the-underground-disco/'
);


-- ---------------------------------------------------------------------------
-- TECH ZONE
-- ---------------------------------------------------------------------------

INSERT INTO events VALUES (
    'resonating-possibilities', 'tech-zone',
    'Resonating Possibilities',
    'Sir Alexander Fleming Building, Imperial College London', NULL,
    'Imperial College Road, London SW7 2AZ',
    51.49783, -0.17658,
    'Both', '12:00–18:00', 0,
    'Step inside an immersive and interactive digital art piece that explores the strangeness of the quantum world and challenges perceptions of our role in shaping reality.',
    'Step inside an immersive and interactive digital art piece that explores the strangeness of the quantum world and challenges our perceptions of reality and our role in shaping it.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    1, 1, 0, 0, 0,
    'Tech Zone has step-free access and accessible toilets on each floor.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/resonating-possibilities/'
);

INSERT INTO events VALUES (
    'robot-playground', 'tech-zone',
    'Robot Playground',
    'Sir Alexander Fleming Building, Imperial College London', NULL,
    'Imperial College Road, London SW7 2AZ',
    51.49783, -0.17658,
    'Both', '12:00–18:00', 0,
    'Journey into a world where robots and humans collaborate to create positive change!',
    'Step into the Robot Playground and journey into a world where robots and humans collaborate to create positive change. Learn how robots are transforming healthcare, aiding exploration in challenging environments, protecting ecosystems, boosting productivity, assisting in the home and extending human physical capabilities.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    1, 1, 0, 0, 0,
    'Step-free access. Accessible toilet facilities on each floor, plus adapted toilet on ground floor.',
    'drop-in', NULL, NULL,
    'https://www.greatexhibitionroadfestival.co.uk/media/event_images/robot_playground.jpg',
    'https://www.greatexhibitionroadfestival.co.uk/event/robot-playground/'
);

INSERT INTO events VALUES (
    'orbital-origami', 'tech-zone',
    'Orbital Origami',
    'Sir Alexander Fleming Building, Imperial College London', NULL,
    'Imperial College Road, London SW7 2AZ',
    51.49783, -0.17658,
    'Both', '12:00–18:00', 0,
    'Join a paper folding workshop and watch a live demo of a foldable Mars heat shield, revealing how creative ideas are shaping future spacecraft design!',
    'Join a paper folding workshop and watch a live demonstration of a foldable Mars heat shield, revealing how origami-inspired creative ideas are shaping the design of future spacecraft.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    1, 1, 0, 0, 0,
    'Step-free access and accessible toilets in the Tech Zone.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/orbital-origami/'
);


-- ---------------------------------------------------------------------------
-- UNZONED / STREET / CROSS-VENUE EVENTS
-- (zone_id = NULL — appear on Exhibition Road or multiple venues)
-- ---------------------------------------------------------------------------

-- Innovation Lates — pre-festival Friday evening event
INSERT INTO events VALUES (
    'innovation-lates', NULL,
    'Innovation Lates',
    'Science Museum', NULL,
    'Exhibition Road, South Kensington, London SW7 2DD',
    51.49799, -0.17459,
    'Friday', '18:30–22:00', 0,
    'Head to the Science Museum on the eve of the Great Exhibition Road Festival, for an adults-only, after-hours takeover of the museum.',
    'Head to the Science Museum on the eve of the Great Exhibition Road Festival for an adults-only, after-hours evening takeover. A special preview event before the main festival weekend begins.',
    'Exhibit',
    'Adults',
    '18+ only', 18, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'free-ticket',
    'https://www.eventbrite.com/e/1985057931710?aff=oddtdtcreator',
    NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/whats-on/event/innovation-lates/'
);

-- Goethe-Institut events
INSERT INTO events VALUES (
    'wuschels-mission-interactive-workshop', NULL,
    'Wuschel''s Mission: Interactive Workshop',
    'Goethe-Institut', 'Library',
    '50 Princes Gate, Exhibition Road, London SW7 2PH',
    51.49960, -0.17409,
    'Both', '12:00–18:00', 0,
    'Help Wuschel, the main character of a new German learning resource for primary schools, complete his mission through puzzles and a sticker treasure hunt.',
    'Help Wuschel — the main character of a new German learning resource for primary schools — complete his mission through puzzles and a sticker treasure hunt at the Goethe-Institut.',
    'Workshop',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/wuschels-mission-interactive-workshop/'
);

INSERT INTO events VALUES (
    'experience-the-great-exhibition-of-1851-in-vr', NULL,
    'Experience the Great Exhibition of 1851 in VR',
    'Goethe-Institut', 'Library',
    '50 Princes Gate, Exhibition Road, London SW7 2PH',
    51.49960, -0.17409,
    'Both', '12:00–17:00', 0,
    'To mark 175 years since the Great Exhibition of 1851, researcher and digital designer Keith Wood brings a VR simulation of the original exhibits to the Goethe-Institut.',
    'To mark 175 years since the Great Exhibition of 1851, researcher and digital designer Keith Wood brings a VR simulation of the original Crystal Palace exhibits to the Goethe-Institut. Step into history.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/experience-the-great-exhibition-of-1851-in-vr/'
);

INSERT INTO events VALUES (
    'creating-the-world-of-wuschel', NULL,
    'Creating the World of Wuschel',
    'Goethe-Institut', 'Library',
    '50 Princes Gate, Exhibition Road, London SW7 2PH',
    51.49960, -0.17409,
    'Both', '12:00–18:00', 0,
    'Discover the world of Wuschel through original illustrations by The Gruffalo illustrator Axel Scheffler.',
    'Discover the world of Wuschel, the main character of a new German learning resource for primary schools, through original illustrations by The Gruffalo illustrator Axel Scheffler.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/creating-the-world-of-wuschel/'
);

-- MULTI-SLOT: Moving Through Time
INSERT INTO events VALUES (
    'moving-through-time-a-dance-experiment', NULL,
    'Moving Through Time: A Dance Experiment',
    'Goethe-Institut', 'Auditorium',
    '50 Princes Gate, Exhibition Road, London SW7 2PH',
    51.49960, -0.17409,
    'Both', 'multi-slot — see sessions', 1,
    'Part-disco, part-scientific experiment, join us for a unique movement session that delves into the deeply personal nature of time.',
    'Part-disco, part-scientific experiment — join this unique movement session that delves into the deeply personal and subjective nature of time, blending dance with science.',
    'Performance',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/moving-through-time-a-dance-experiment/'
);

-- MULTI-SLOT: German Taster Session (Sunday only)
INSERT INTO events VALUES (
    'german-taster-session-for-adults', NULL,
    'German Taster Session for Adults',
    'Goethe-Institut', 'Library',
    '50 Princes Gate, Exhibition Road, London SW7 2PH',
    51.49960, -0.17409,
    'Sunday', 'multi-slot — see sessions', 1,
    'Try your first German phrases in this drop-in taster session and get a feel for language learning at the Goethe-Institut.',
    'Try your first German phrases in this drop-in taster session and get a feel for language learning at the Goethe-Institut. No prior German knowledge required.',
    'Workshop',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/german-taster-session-for-adults/'
);

-- Natural History Museum
INSERT INTO events VALUES (
    'garden-bioblitz', NULL,
    'Garden Bioblitz',
    'Natural History Museum', 'Nature Discovery Garden',
    'Cromwell Road, London SW7 5BD',
    51.49652, -0.17637,
    'Both', '12:00–16:00', 0,
    'Explore the Natural History Museum''s Nature Discovery Garden and join their Learning and Science teams to discover the range of plants and animals that live there.',
    'Explore the Natural History Museum''s Nature Discovery Garden and join their Learning and Science teams to discover the remarkable range of plants and animals that thrive there. Note: closes at 16:00, two hours before other events.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0,
    'Note: ends at 16:00, earlier than most festival events.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/garden-bioblitz/'
);

-- V&A talks (Saturday only)
INSERT INTO events VALUES (
    'dancing-nature-science-storytelling-through-ballet', NULL,
    'Dancing Nature: Science Storytelling Through Ballet',
    'V&A', 'The Lydia and Manfred Gorvy Lecture Theatre',
    'Cromwell Road, London SW7 2RL',
    51.49663, -0.17391,
    'Saturday', '13:30–14:25', 0,
    'Join our Biology Ballerina for an exploration of the natural world through pliés and pirouettes.',
    'Join our Biology Ballerina for a captivating exploration of the natural world through pliés and pirouettes — where science storytelling meets dance performance.',
    'Performance',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 1, 0,
    'Live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/dancing-nature-science-storytelling-through-ballet/'
);

INSERT INTO events VALUES (
    'britains-first-black-musical-superstar', NULL,
    'Britain''s First Black Musical Superstar',
    'V&A', 'The Lydia and Manfred Gorvy Lecture Theatre',
    'Cromwell Road, London SW7 2RL',
    51.49663, -0.17391,
    'Saturday', '15:00–15:55', 0,
    'Musicians and historians bring to life a recently rediscovered work by one of Victorian Britain''s most celebrated musical figures.',
    'Musicians and historians bring to life a recently rediscovered work by one of Victorian Britain''s most celebrated musical figures, shining a light on a trailblazing Black artist from the era of the Great Exhibition.',
    'Performance',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 1, 0,
    'Live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/britains-first-black-musical-superstar/'
);

INSERT INTO events VALUES (
    'queer-albert-hall', NULL,
    'Queer Albert Hall',
    'V&A', 'The Lydia and Manfred Gorvy Lecture Theatre',
    'Cromwell Road, London SW7 2RL',
    51.49663, -0.17391,
    'Saturday', '16:30–17:15', 0,
    'Uncover the Royal Albert Hall''s surprising role as a gathering place for London''s LGBTQ+ community, from covert acts of self expression to moments of bold queer visibility.',
    'Uncover the Royal Albert Hall''s surprising role as a gathering place for London''s LGBTQ+ community, from covert acts of self-expression to moments of bold, public queer visibility across the decades.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 1, 0,
    'Live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/queer-albert-hall/'
);

-- V&A talks (Sunday only)
INSERT INTO events VALUES (
    'revisiting-the-great-exhibition-of-1851', NULL,
    'Revisiting the Great Exhibition of 1851',
    'V&A', 'The Lydia and Manfred Gorvy Lecture Theatre',
    'Cromwell Road, London SW7 2RL',
    51.49663, -0.17391,
    'Sunday', '13:30–14:25', 0,
    'The Great Exhibition of 1851 was the largest public event in its history. How should we reflect on its legacy 175 years later?',
    'The Great Exhibition of 1851 was the largest public event in history, hosting 100,000 exhibits inside a giant Crystal Palace. How should we reflect on its complex legacy — including empire, industry, and global exchange — 175 years on?',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 1, 1, 0,
    'BSL interpretation and live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/revisiting-the-great-exhibition-of-1851/'
);

INSERT INTO events VALUES (
    'the-joy-of-playing-music', NULL,
    'The Joy of Playing Music',
    'V&A', 'The Lydia and Manfred Gorvy Lecture Theatre',
    'Cromwell Road, London SW7 2RL',
    51.49663, -0.17391,
    'Sunday', '15:00–15:55', 0,
    'Explore what happens inside our brains, within our communities and across our history when people make music together.',
    'Explore what happens inside our brains, within our communities and across our history when people make music together — a talk spanning neuroscience, culture and the human story of music.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 1, 0,
    'Live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/the-joy-of-playing-music/'
);

INSERT INTO events VALUES (
    'design-your-own-crystal-palace', NULL,
    'Design Your Own Crystal Palace',
    'V&A', 'The Lydia and Manfred Gorvy Lecture Theatre',
    'Cromwell Road, London SW7 2RL',
    51.49663, -0.17391,
    'Sunday', '16:20–17:15', 0,
    'Doodle along as architects and engineers explore how modern design, values and science could shape a 21st century Crystal Palace.',
    'Doodle along as architects and engineers explore how modern design principles, contemporary values and cutting-edge science could shape a 21st-century Crystal Palace.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 1, 0,
    'Live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/design-your-own-crystal-palace/'
);

-- Fleming Building talks
INSERT INTO events VALUES (
    'growing-food-in-space', NULL,
    'Growing Food in Space',
    'Sir Alexander Fleming Building, Imperial College London', 'G16 Lecture Theatre',
    'Imperial College Road, London SW7 2AZ',
    51.49783, -0.17658,
    'Saturday', '14:00–14:55', 0,
    'Helen Sharman, the first Briton in space, hosts scientists and an experimental chef to explore the evolving science of space food.',
    'Helen Sharman, the first Briton in space, hosts scientists and an experimental chef to explore the evolving science of space food — from early astronaut rations to the frontier of growing food on long-haul missions.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 1, 0,
    'Live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/growing-food-in-space/'
);

INSERT INTO events VALUES (
    'myth-busting-the-immune-system', NULL,
    'Myth Busting the Immune System',
    'Sir Alexander Fleming Building, Imperial College London', 'G16 Lecture Theatre',
    'Imperial College Road, London SW7 2AZ',
    51.49783, -0.17658,
    'Saturday', '15:30–16:15', 0,
    'Can orange juice really ward off the common cold? Unpack the science behind the claims to "supercharge" our immunity.',
    'Can orange juice really ward off the common cold? How does aging affect our immune system? Is mental health linked to inflammation? Unpack the science behind popular claims to "supercharge" our immunity.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 1, 0,
    'Live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/myth-busting-the-immune-system/'
);

INSERT INTO events VALUES (
    'the-robot-doctor-will-see-you-now', NULL,
    'The Robot Doctor Will See You Now',
    'Sir Alexander Fleming Building, Imperial College London', 'G16 Lecture Theatre',
    'Imperial College Road, London SW7 2AZ',
    51.49783, -0.17658,
    'Saturday', '17:00–17:55', 0,
    'Learn how robotics and artificial intelligence are transforming medicine, and what the future holds, at this live podcast recording.',
    'Learn how robotics and artificial intelligence are transforming medicine, and what the future holds, at this live podcast recording featuring leading researchers in medical AI and robotic surgery.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 1, 0,
    'Live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/the-robot-doctor-will-see-you-now/'
);

INSERT INTO events VALUES (
    'plant-powered-vaccines', NULL,
    'Plant-Powered Vaccines',
    'Sir Alexander Fleming Building, Imperial College London', 'G16 Lecture Theatre',
    'Imperial College Road, London SW7 2AZ',
    51.49783, -0.17658,
    'Sunday', '14:00–14:45', 0,
    'Discover how turning leaves into lifesaving vaccines could help African nations take control of their health security.',
    'Discover how turning plant leaves into lifesaving vaccines could help African nations take control of their own health security and reduce dependence on global supply chains.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 1, 0,
    'Live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/plant-powered-vaccines/'
);

INSERT INTO events VALUES (
    '50-years-on-mars', NULL,
    '50 Years on Mars',
    'Sir Alexander Fleming Building, Imperial College London', 'G16 Lecture Theatre',
    'Imperial College Road, London SW7 2AZ',
    51.49783, -0.17658,
    'Sunday', '15:30–16:15', 0,
    'From the first landing to scientists discovering the strongest signs yet of ancient Martian life, join a five-decade journey of robotic exploration of the Red Planet.',
    'From the first landing to scientists discovering the strongest signs yet of ancient Martian life, join a five-decade journey of robotic exploration of the Red Planet, charting what we have learned and what lies ahead.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 1, 1, 0,
    'BSL interpretation and live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/50-years-on-mars/'
);

INSERT INTO events VALUES (
    'ideas-that-will-change-the-world', NULL,
    'Ideas That Will Change the World',
    'Sir Alexander Fleming Building, Imperial College London', 'G16 Lecture Theatre',
    'Imperial College Road, London SW7 2AZ',
    51.49783, -0.17658,
    'Sunday', '17:00–17:55', 0,
    'Three leading researchers make the case for their work being the next big thing in science—with the audience crowning a winner!',
    'Three leading researchers make the case for their work being the next big thing in science — with the audience voting to crown a winner in this lively competition-format talk.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 1, 0,
    'Live captioning provided.',
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/ideas-that-will-change-the-world/'
);

-- City and Guilds Building
INSERT INTO events VALUES (
    'cosmic-chalk-drawing', NULL,
    'Cosmic Chalk Drawing',
    'City and Guilds Building, Imperial College London', 'Dalby Court',
    'South Kensington, London SW7 2BX',
    51.49844, -0.17478,
    'Both', '12:00–18:00', 0,
    'Step into a cosmic playground where chalk, movement and imagination bring black holes and galaxies to life.',
    'Step into a cosmic outdoor playground where chalk, movement and imagination come together to bring black holes and galaxies to life in a giant collaborative artwork.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/cosmic-chalk-drawing/'
);

INSERT INTO events VALUES (
    'space-craft-corner', NULL,
    'Space Craft Corner',
    'City and Guilds Building, Imperial College London', 'Shields Space',
    'South Kensington, London SW7 2BX',
    51.49844, -0.17478,
    'Both', '12:00–18:00', 0,
    'Make your own black hole-inspired decorative ornaments with theoretical physicists studying the surprising science behind these extreme objects.',
    'Make your own black hole-inspired decorative ornaments alongside theoretical physicists who study the surprising and extreme science behind these cosmic objects.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/space-craft-corner/'
);

-- MULTI-SLOT: Super Cool Chemistry Show
INSERT INTO events VALUES (
    'super-cool-chemistry-show', NULL,
    'Super Cool Chemistry Show',
    'City and Guilds Building, Imperial College London', 'LT200 Lecture Theatre',
    'South Kensington, London SW7 2BX',
    51.49844, -0.17478,
    'Both', 'multi-slot — see sessions', 1,
    'Come see chemistry brought to life through amazing reactions, slime and explosions at this family-friendly science show!',
    'Join real life chemists and explore how we make tiny molecules at massive scales. Meet Hydrogen, and through amazing reactions, slime and explosions discover how we create and transport the chemicals we use every day. In this interactive show we will explore the real-life uses of chemistry as we ooze, pop, explode and freeze our way towards a more sustainable future! Supported by the Royal Society of Chemistry.',
    'Performance',
    'Family (ages 5+)',
    'Best suited for ages 5–12', 5, 12, 1,
    NULL, NULL, 1, 1, 0,
    'BSL interpretation and live captioning at the 15:40 show on Sunday only. Use what3words code limes.fully.exam to find the precise location inside the City and Guilds Building.',
    'free-ticket',
    'https://www.eventbrite.com/e/1985057931710?aff=oddtdtcreator',
    'Arrive 10 minutes before the start time. Advance tickets give priority access; space may be reallocated if you arrive late.',
    'https://www.greatexhibitionroadfestival.co.uk/media/event_images/super_cool_chemistry_show.jpg',
    'https://www.greatexhibitionroadfestival.co.uk/event/super-cool-chemistry-show/'
);

-- Dyson Building
INSERT INTO events VALUES (
    'discover-design-engineering', NULL,
    'Discover Design Engineering',
    'Dyson Building, Imperial College London', NULL,
    'Imperial College Road, London SW7 2DB',
    51.49795, -0.17449,
    'Both', '12:00–18:00', 0,
    'From robotics to new materials, meet the student innovators, researchers and start-up founders whose emerging technologies are reshaping everyday life.',
    'From robotics to new materials, meet the student innovators, researchers and start-up founders whose emerging technologies are reshaping everyday life and tackling global challenges.',
    'Exhibit',
    'Adults, Young People (13–25)',
    'All ages (especially 13–25)', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/discover-design-engineering/'
);

-- Dangoor Plaza
INSERT INTO events VALUES (
    'creative-connections-imperial-letters', NULL,
    'Creative Connections: Imperial Letters',
    'Dangoor Plaza', NULL,
    'Imperial College Road, South Kensington, London SW7 2AZ',
    51.49798, -0.17713,
    'Both', '12:00–18:00', 0,
    'A bold and thought-provoking artwork exploring Imperial College London''s history and heritage.',
    'A bold and thought-provoking public artwork exploring Imperial College London''s history and heritage through large-scale letterforms.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/creative-connections-imperial-letters/'
);

INSERT INTO events VALUES (
    'bandstand-2026', NULL,
    'Bandstand',
    'Dangoor Plaza', NULL,
    'Imperial College Road, South Kensington, London SW7 2AZ',
    51.49798, -0.17713,
    'Both', '12:00–18:00', 0,
    'Get ready to dance the afternoon away at our Bandstand! Join us for a programme packed with traditional music, dance workshops and performances.',
    'Get ready to dance the afternoon away at the Festival Bandstand! A programme packed with traditional music from around the world, dance workshops and live performances throughout both festival days.',
    'Performance',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/bandstand-2026/'
);

-- Imperial College Road (outdoor)
INSERT INTO events VALUES (
    'designing-for-a-greener-future', NULL,
    'Designing for a Greener Future',
    'Imperial College Road', NULL,
    'Imperial College Road, South Kensington, London SW7',
    51.49795, -0.17717,
    'Both', '12:00–18:00', 0,
    'Rethink and create with waste and Science Owl. Design, build and race your own car made from broken toys and household materials.',
    'Rethink and create with waste alongside Science Owl. Design, build and race your own car made entirely from broken toys and everyday household materials.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/designing-for-a-greener-future/'
);

INSERT INTO events VALUES (
    'electricity-of-tomorrow', NULL,
    'Electricity of Tomorrow',
    'Imperial College Road', NULL,
    'Imperial College Road, South Kensington, London SW7',
    51.49795, -0.17717,
    'Both', '12:00–18:00', 0,
    'Explore how your electricity will be generated and used in the future through interactive models and games.',
    'Explore how electricity will be generated and used in the future through hands-on interactive models and games, from renewable energy sources to smart grid technology.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/electricity-of-tomorrow/'
);

INSERT INTO events VALUES (
    'future-food-live-2026', NULL,
    'Future Food Live',
    'Imperial College Road', NULL,
    'Imperial College Road, South Kensington, London SW7',
    51.49795, -0.17717,
    'Both', '12:00–18:00', 0,
    'Explore new flavours and ingredients, as chefs and scientists whip up dishes for you to sample right there and then!',
    'Explore new flavours and ingredients as chefs and scientists collaborate to whip up next-generation dishes for you to sample on the spot, from lab-grown proteins to sustainable alternatives.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/future-food-live-2026/'
);

INSERT INTO events VALUES (
    'uk-wildlife-wonders', NULL,
    'UK Wildlife Wonders',
    'Imperial College Road', NULL,
    'Imperial College Road, South Kensington, London SW7',
    51.49795, -0.17717,
    'Both', '12:00–18:00', 0,
    'Discover how UK wildlife sustains our everyday lives through a creative workshop and join a vibrant parade celebrating biodiversity and imagination.',
    'Discover how UK wildlife sustains our everyday lives through a creative workshop, then join a vibrant parade celebrating biodiversity and imagination as it winds through the festival.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/uk-wildlife-wonders/'
);

INSERT INTO events VALUES (
    'the-power-of-water', NULL,
    'The Power of Water',
    'Imperial College Road', NULL,
    'Imperial College Road, South Kensington, London SW7',
    51.49795, -0.17717,
    'Both', '12:00–18:00', 0,
    'Create waves, test sea defences, trigger a storm in a teacup and step inside a world-class hydrodynamics lab.',
    'Create waves, test sea defences, trigger a storm in a teacup and step inside a world-class hydrodynamics lab to discover how engineers protect coasts and manage water.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/the-power-of-water/'
);

INSERT INTO events VALUES (
    'steelpan-jam-along', NULL,
    'Steelpan Jam-along',
    'Imperial College Road', NULL,
    'Imperial College Road, South Kensington, London SW7',
    51.49795, -0.17717,
    'Both', '12:00–18:00', 0,
    'Join Nostalgia, the UK''s first steel band, as they welcome you to play, learn, and explore the rich heritage of steelpan music.',
    'Join Nostalgia, the UK''s first steel band, as they welcome visitors to play, learn and explore the rich cultural heritage of steelpan music in this open, participatory musical experience.',
    'Performance',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/steelpan-jam-along/'
);

INSERT INTO events VALUES (
    'sound-of-serotonin', NULL,
    'Sound of Serotonin',
    'Imperial College Road', NULL,
    'Imperial College Road, South Kensington, London SW7',
    51.49795, -0.17717,
    'Both', '12:00–18:00', 0,
    'Ever wondered what happiness sounds like? See how scientists turn serotonin signals into music in this interactive blend of neuroscience and art!',
    'Ever wondered what happiness sounds like? See how scientists convert serotonin signals from the brain into music in this interactive blend of neuroscience and art.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/sound-of-serotonin/'
);

-- Maths Exploratorium (Imperial College entrance)
INSERT INTO events VALUES (
    'maths-exploratorium-2026', NULL,
    'Maths Exploratorium',
    'Imperial College Entrance, Imperial College London', NULL,
    'South Kensington Campus, London SW7 2AZ',
    51.49907, -0.17491,
    'Both', '12:00–18:00', 0,
    'Step inside our interactive maths marquee to experience a side of maths you never knew existed. Ready to play?',
    'Step inside an interactive maths marquee to experience a side of mathematics you never knew existed — through puzzles, games and hands-on exploration. Ready to play?',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/maths-exploratorium-2026/'
);

-- Exhibition Road (street-level events)
INSERT INTO events VALUES (
    'main-stage-2026', NULL,
    'Main Stage',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Head to our Main Stage for a jam-packed schedule of vibrant and lively music, from Jazz and classic brass bands to Cuban and Congolese fusion!',
    'Head to the Main Stage for a jam-packed schedule of vibrant and lively music spanning jazz and classic brass bands to Cuban and Congolese fusion — the sonic heartbeat of the festival.',
    'Performance',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/main-stage-2026/'
);

INSERT INTO events VALUES (
    'the-fabric-of-us', NULL,
    'The Fabric of Us',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Help us create a woven installation showcasing how our diverse experiences shape understanding of how our brains age and neurodegenerative diseases.',
    'Help create a growing woven installation that showcases how our diverse lived experiences shape our understanding of brain ageing and neurodegenerative diseases.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/the-fabric-of-us/'
);

INSERT INTO events VALUES (
    'maths-in-motion', NULL,
    'Maths in Motion',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Make art inspired by maths and its connections to the Islamic print tradition of Ebru marbling.',
    'Make art inspired by mathematics and its connections to the Islamic print tradition of Ebru marbling, exploring geometry, pattern and colour in this creative outdoor workshop.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/maths-in-motion/'
);

INSERT INTO events VALUES (
    'climate-friendly-pop-up-kitchen', NULL,
    'Climate Friendly Pop-Up Kitchen',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Sample delicious planet-friendly dishes and discover practical ways to reduce your food footprint.',
    'Sample delicious planet-friendly dishes and discover practical, actionable ways to reduce your food footprint in everyday life.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/climate-friendly-pop-up-kitchen/'
);

INSERT INTO events VALUES (
    'roaming-performances-2026', NULL,
    'Roaming Performances',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Experience wandering music, dance and other performances bringing the streets to life through the festival!',
    'Experience wandering music, dance and other surprise performances roaming through the festival, bringing the streets of Exhibition Road to life throughout both days.',
    'Performance',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/roaming-performances-2026/'
);

INSERT INTO events VALUES (
    'giant-dna-paper-modelling', NULL,
    'Giant DNA Paper Modelling',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Help us build a record-breaking paper DNA helix and discover how the code of life is assembled, decoded and understood.',
    'Help build a record-breaking paper DNA double helix and discover how the code of life is assembled, decoded and understood by scientists.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/giant-dna-paper-modelling/'
);

INSERT INTO events VALUES (
    'the-crystal-palace-sandcastle', NULL,
    'The Crystal Palace Sandcastle',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Watch a giant sand sculpture of the iconic Crystal Palace take shape across the festival weekend — presented by the Museum of Architecture.',
    'Watch a giant sand sculpture of the iconic Crystal Palace take shape over the full festival weekend, presented by the Museum of Architecture. A living artwork that grows before your eyes.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/the-crystal-palace-sandcastle/'
);

INSERT INTO events VALUES (
    'the-great-counter-exhibition-of-2026', NULL,
    'The Great Counter Exhibition of 2026',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Reimagine the Great Exhibition of 1851 for the 21st century, bringing your own personal stories and ideas into the spotlight.',
    'Reimagine the Great Exhibition of 1851 for the 21st century in this participatory installation that brings visitors'' own personal stories and ideas into the spotlight.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/the-great-counter-exhibition-of-2026/'
);

INSERT INTO events VALUES (
    'paint-lab-2026', NULL,
    'Paint Lab',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Exhibition Road is transformed into an open-air art gallery with ten new works painted live over the weekend, exploring how scientific ideas move through time.',
    'Exhibition Road is transformed into an open-air art gallery as ten new works are painted live over the weekend by artists exploring how scientific ideas move and evolve through time.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/paint-lab-2026/'
);

INSERT INTO events VALUES (
    'step-into-a-souvenir', NULL,
    'Step into a Souvenir',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Snap a photo against one of our large-scale backdrops and take home a memory of your own Festival day!',
    'Snap a photo against one of the festival''s large-scale illustrated backdrops and take home a unique memory of your Festival day.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/step-into-a-souvenir/'
);

INSERT INTO events VALUES (
    'machines-of-no-reason', NULL,
    'Machines of No Reason',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Invent, draw and print playful, imaginary machines which you can take home or exhibit with Royal College of Art graduate Tamsin Loxley.',
    'Invent, draw and print playful, imaginary machines to take home or exhibit, guided by Royal College of Art graduate Tamsin Loxley in this drop-in creative workshop.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/machines-of-no-reason/'
);

INSERT INTO events VALUES (
    '1851der-tent-2026', NULL,
    '1851der Tent',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Step inside a tent full of surprises for curious minds — visualise sound, learn about hydrogen heroes and create with the Inventors Lab!',
    'Step inside a tent full of surprises for curious minds — visualise sound waves, learn about hydrogen as a fuel of the future, and create inventions in the Inventors Lab.',
    'Exhibit',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/1851der-tent-2026/'
);

INSERT INTO events VALUES (
    'drop-in-design-the-circulation-department-2026', NULL,
    'Drop-in Design: The Circulation Department',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Create your own wearable art with artist Gayle Chong Kwan in this hands-on creative workshop.',
    'Create your own wearable art with artist Gayle Chong Kwan in this hands-on creative workshop exploring themes of circulation, exchange and community.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/drop-in-design-the-circulation-department-2026/'
);

-- MULTI-SLOT: Junk Sculptures
INSERT INTO events VALUES (
    'junk-sculptures', NULL,
    'Junk Sculptures',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', 'multi-slot — see sessions', 1,
    'Make your own junk sculpture using upcycled and everyday materials!',
    'Make your own junk sculpture using upcycled and everyday household materials in this drop-in creative workshop on Exhibition Road.',
    'Workshop',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/junk-sculptures/'
);

-- MULTI-SLOT: Giants on the Move
INSERT INTO events VALUES (
    'giants-on-the-move-a-puppet-street-parade', NULL,
    'Giants on the Move: A Puppet Street Parade',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', 'multi-slot — see sessions', 1,
    'Witness a stunning spectacle as handmade puppets, created from bamboo and dyed cloth, move along Exhibition Road.',
    'Witness a stunning spectacle as large handmade puppets, crafted from bamboo and dyed cloth, parade along Exhibition Road in this unmissable street performance.',
    'Performance',
    'Adults, Family (ages 5+)',
    'All ages', 0, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/giants-on-the-move-a-puppet-street-parade/'
);

-- Prints, Pigments and Press (Exhibition Road — Science Museum activity)
INSERT INTO events VALUES (
    'prints-pigments-and-press', NULL,
    'Prints, Pigments and Press',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', '12:00–18:00', 0,
    'Investigate the art of printing, and the science of pigments, in this hands-on creative workshop from the Science Museum!',
    'Investigate the art of printing and the science of pigments in this hands-on creative workshop presented by the Science Museum, exploring the chemistry and craft behind colour and print.',
    'Workshop',
    'Family (ages 5+)',
    'Family-friendly', 5, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/prints-pigments-and-press/'
);

-- MULTI-SLOT: Walks and Tours (Exhibition Road meeting point)
INSERT INTO events VALUES (
    'designing-the-va-the-story-of-our-museum', NULL,
    'Designing the V&A: The Story of our Museum',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', 'multi-slot — see sessions', 1,
    'Take an architectural tour of the stunning V&A, guiding you through the history and design of a building every bit as fascinating as the objects it contains!',
    'Take an architectural walking tour of the stunning V&A, guiding you through the history and design of a building every bit as fascinating as the objects it contains.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/designing-the-va-the-story-of-our-museum/'
);

-- MULTI-SLOT: South Ken Nature Tours
INSERT INTO events VALUES (
    'south-ken-nature-tours', NULL,
    'South Ken Nature Tours',
    'Exhibition Road', 'Departs from South Ken Culture Quarter Tent (south end of Exhibition Road)',
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', 'multi-slot — see sessions', 1,
    'Take part in a ''walkshop'' around South Kensington to learn about nature, biodiversity and wildlife in London.',
    'Take part in a walkshop around South Kensington to learn about nature, biodiversity and wildlife in London. Hear how London''s plants and animals are being affected by climate change and discuss what can be done about it. Tours depart from the South Ken Culture Quarter Tent at the south end of Exhibition Road.',
    'Talk & Tour',
    'Adults',
    'Best suited for adults', 18, NULL, 0,
    NULL, NULL, 0, 0, 0,
    'Tours depart from the South Ken Culture Quarter Tent at the south end of Exhibition Road.',
    'drop-in', NULL, NULL,
    'https://www.greatexhibitionroadfestival.co.uk/media/event_images/discover-south-kensingtons-nature-tour.jpg',
    'https://www.greatexhibitionroadfestival.co.uk/event/south-ken-nature-tours/'
);

-- MULTI-SLOT: South Ken History Tours
INSERT INTO events VALUES (
    'south-ken-history-tours', NULL,
    'South Ken History Tours',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', 'multi-slot — see sessions', 1,
    'Discover secrets behind the brilliant facades of Exhibition Road during a short tour of the neighbourhood with the South Ken Culture Quarter.',
    'Discover the secrets behind the brilliant facades of Exhibition Road during a short walking tour of the neighbourhood with the South Ken Culture Quarter team.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/south-ken-history-tours/'
);

-- MULTI-SLOT: The Great Exhibition Experience Walk
INSERT INTO events VALUES (
    'the-great-exhibition-experience-walk', NULL,
    'The Great Exhibition Experience Walk',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', 'multi-slot — see sessions', 1,
    'Step back into 1851 and explore the many perspectives surrounding the Great Exhibition on this guided walk with Iya London.',
    'Step back into 1851 and explore the many perspectives surrounding the Great Exhibition on this guided walk with Iya London, examining empire, innovation and the stories often left untold.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/the-great-exhibition-experience-walk/'
);

-- MULTI-SLOT: The Great Exhibition and the Royal Parks Walking Tour
INSERT INTO events VALUES (
    'the-great-exhibition-and-the-royal-parks-walking-tour', NULL,
    'The Great Exhibition and the Royal Parks Walking Tour',
    'Exhibition Road', NULL,
    'Exhibition Road, South Kensington, London SW7',
    51.49819, -0.17408,
    'Both', 'multi-slot — see sessions', 1,
    'Discover the beautiful Royal Parks at the top of Exhibition Road and their instrumental role in hosting the Great Exhibition of 1851.',
    'Discover the beautiful Royal Parks at the top of Exhibition Road and their instrumental role in hosting the Great Exhibition of 1851, including how the parks were transformed and then restored after the event.',
    'Talk & Tour',
    'Adults',
    'Adults', 18, NULL, 0,
    NULL, NULL, 0, 0, 0, NULL,
    'drop-in', NULL, NULL,
    NULL,
    'https://www.greatexhibitionroadfestival.co.uk/event/the-great-exhibition-and-the-royal-parks-walking-tour/'
);


-- =============================================================================
-- EVENT SESSIONS
-- Only for is_multi_slot = 1 events.
-- =============================================================================

-- Rocket Mice (Sat: 13:30–15:30 + 17:00–18:00 | Sun: 13:30–15:30)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('rocket-mice', 'Saturday 6 June', '13:30', '15:30', NULL),
('rocket-mice', 'Saturday 6 June', '17:00', '18:00', 'Saturday only'),
('rocket-mice', 'Sunday 7 June',   '13:30', '15:30', NULL);

-- Bollywood Under the Stars (same 5 slots each day)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('bollywood-under-the-stars', 'Saturday 6 June', '12:30', '13:10', NULL),
('bollywood-under-the-stars', 'Saturday 6 June', '13:40', '14:20', NULL),
('bollywood-under-the-stars', 'Saturday 6 June', '15:00', '15:40', NULL),
('bollywood-under-the-stars', 'Saturday 6 June', '16:10', '16:50', NULL),
('bollywood-under-the-stars', 'Saturday 6 June', '17:20', '18:00', NULL),
('bollywood-under-the-stars', 'Sunday 7 June',   '12:30', '13:10', NULL),
('bollywood-under-the-stars', 'Sunday 7 June',   '13:40', '14:20', NULL),
('bollywood-under-the-stars', 'Sunday 7 June',   '15:00', '15:40', NULL),
('bollywood-under-the-stars', 'Sunday 7 June',   '16:10', '16:50', NULL),
('bollywood-under-the-stars', 'Sunday 7 June',   '17:20', '18:00', NULL);

-- Earthbeat: The Underground Disco (same 4 slots each day)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('earthbeat-the-underground-disco', 'Saturday 6 June', '12:45', '13:30', NULL),
('earthbeat-the-underground-disco', 'Saturday 6 June', '14:15', '15:00', NULL),
('earthbeat-the-underground-disco', 'Saturday 6 June', '15:45', '16:30', NULL),
('earthbeat-the-underground-disco', 'Saturday 6 June', '17:15', '18:00', NULL),
('earthbeat-the-underground-disco', 'Sunday 7 June',   '12:45', '13:30', NULL),
('earthbeat-the-underground-disco', 'Sunday 7 June',   '14:15', '15:00', NULL),
('earthbeat-the-underground-disco', 'Sunday 7 June',   '15:45', '16:30', NULL),
('earthbeat-the-underground-disco', 'Sunday 7 June',   '17:15', '18:00', NULL);

-- Super Cool Chemistry Show (Sat: 3 slots | Sun: 4 slots, last has BSL+captions)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('super-cool-chemistry-show', 'Saturday 6 June', '13:00', '13:40', NULL),
('super-cool-chemistry-show', 'Saturday 6 June', '14:20', '15:00', NULL),
('super-cool-chemistry-show', 'Saturday 6 June', '15:40', '16:20', NULL),
('super-cool-chemistry-show', 'Sunday 7 June',   '13:00', '13:40', NULL),
('super-cool-chemistry-show', 'Sunday 7 June',   '14:20', '15:00', NULL),
('super-cool-chemistry-show', 'Sunday 7 June',   '15:40', '16:20', 'BSL interpretation and live captioning'),
('super-cool-chemistry-show', 'Sunday 7 June',   '17:00', '17:40', NULL);

-- Moving Through Time: A Dance Experiment (same 3 slots each day)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('moving-through-time-a-dance-experiment', 'Saturday 6 June', '13:45', '14:25', NULL),
('moving-through-time-a-dance-experiment', 'Saturday 6 June', '15:15', '15:55', NULL),
('moving-through-time-a-dance-experiment', 'Saturday 6 June', '16:45', '17:25', NULL),
('moving-through-time-a-dance-experiment', 'Sunday 7 June',   '13:45', '14:25', NULL),
('moving-through-time-a-dance-experiment', 'Sunday 7 June',   '15:15', '15:55', NULL),
('moving-through-time-a-dance-experiment', 'Sunday 7 June',   '16:45', '17:25', NULL);

-- German Taster Session for Adults (Sunday only, 2 slots)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('german-taster-session-for-adults', 'Sunday 7 June', '13:00', '13:45', NULL),
('german-taster-session-for-adults', 'Sunday 7 June', '14:00', '14:45', NULL);

-- Junk Sculptures (same 2 blocks each day)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('junk-sculptures', 'Saturday 6 June', '12:00', '15:00', NULL),
('junk-sculptures', 'Saturday 6 June', '15:30', '18:00', NULL),
('junk-sculptures', 'Sunday 7 June',   '12:00', '15:00', NULL),
('junk-sculptures', 'Sunday 7 June',   '15:30', '18:00', NULL);

-- Giants on the Move: A Puppet Street Parade (same 2 parades each day)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('giants-on-the-move-a-puppet-street-parade', 'Saturday 6 June', '12:45', '13:15', NULL),
('giants-on-the-move-a-puppet-street-parade', 'Saturday 6 June', '15:15', '15:45', NULL),
('giants-on-the-move-a-puppet-street-parade', 'Sunday 7 June',   '12:45', '13:15', NULL),
('giants-on-the-move-a-puppet-street-parade', 'Sunday 7 June',   '15:15', '15:45', NULL);

-- Designing the V&A Tour (both days, 13:00–14:00)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('designing-the-va-the-story-of-our-museum', 'Saturday 6 June', '13:00', '14:00', NULL),
('designing-the-va-the-story-of-our-museum', 'Sunday 7 June',   '13:00', '14:00', NULL);

-- South Ken Nature Tours (Sat: 3 tours | Sun: 2 tours)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('south-ken-nature-tours', 'Saturday 6 June', '12:30', '13:30', NULL),
('south-ken-nature-tours', 'Saturday 6 June', '15:00', '16:00', NULL),
('south-ken-nature-tours', 'Saturday 6 June', '16:00', '17:00', NULL),
('south-ken-nature-tours', 'Sunday 7 June',   '13:00', '14:00', NULL),
('south-ken-nature-tours', 'Sunday 7 June',   '16:00', '17:00', NULL);

-- South Ken History Tours (Sat: 2 tours | Sun: 3 tours)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('south-ken-history-tours', 'Saturday 6 June', '12:00', '13:00', NULL),
('south-ken-history-tours', 'Saturday 6 June', '14:00', '15:00', NULL),
('south-ken-history-tours', 'Sunday 7 June',   '12:00', '13:00', NULL),
('south-ken-history-tours', 'Sunday 7 June',   '14:00', '15:00', NULL),
('south-ken-history-tours', 'Sunday 7 June',   '15:00', '16:00', 'Sunday only');

-- The Great Exhibition Experience Walk (same 2 slots each day)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('the-great-exhibition-experience-walk', 'Saturday 6 June', '14:15', '15:00', NULL),
('the-great-exhibition-experience-walk', 'Saturday 6 June', '16:30', '17:15', NULL),
('the-great-exhibition-experience-walk', 'Sunday 7 June',   '14:15', '15:00', NULL),
('the-great-exhibition-experience-walk', 'Sunday 7 June',   '16:30', '17:15', NULL);

-- The Great Exhibition and the Royal Parks Walking Tour (same 2 slots each day)
INSERT INTO event_sessions (event_id, date, time_start, time_end, session_notes) VALUES
('the-great-exhibition-and-the-royal-parks-walking-tour', 'Saturday 6 June', '14:30', '15:30', NULL),
('the-great-exhibition-and-the-royal-parks-walking-tour', 'Saturday 6 June', '16:15', '17:15', NULL),
('the-great-exhibition-and-the-royal-parks-walking-tour', 'Sunday 7 June',   '14:30', '15:30', NULL),
('the-great-exhibition-and-the-royal-parks-walking-tour', 'Sunday 7 June',   '16:15', '17:15', NULL);

-- =============================================================================
-- END OF FILE
-- Counts:
--   zones:          8 rows
--   events:        75 rows  (39 zoned + 36 unzoned/cross-venue)
--   event_sessions: 72 rows (14 multi-slot events)
-- =============================================================================
