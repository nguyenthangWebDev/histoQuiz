# HistoQuiz - Ứng dụng trắc nghiệm lịch sử Việt Nam

HistoQuiz là ứng dụng trắc nghiệm lịch sử Việt Nam giúp người dùng ôn tập và củng cố kiến thức lịch sử một cách thú vị và hiệu quả.

## Tính năng hiện tại
- Trắc nghiệm theo chủ đề lịch sử
- Nhiều cấp độ khó dễ khác nhau
- Chế độ trộn ngẫu nhiên câu hỏi
- Tính điểm và hiển thị kết quả chi tiết
- Hỗ trợ offline với Service Worker
- Cache dữ liệu để tăng tốc độ tải

## Kế hoạch mở rộng

### Kiến trúc tổng quan
1. **Frontend**
   - Framework: React/Next.js
   - State Management: Redux hoặc Context API
   - UI: Tiếp tục sử dụng Tailwind CSS
   - PWA (Progressive Web App) để hỗ trợ offline

2. **Backend**
   - Node.js + Express.js hoặc NestJS
   - Authentication: JWT + OAuth (Google, Facebook)
   - Database: MongoDB (chính) + Redis (cache)

3. **DevOps/Infrastructure**
   - Docker & Docker Compose
   - CI/CD: GitHub Actions
   - Hosting: Vercel (frontend), Heroku/Digital Ocean (backend)
   - CDN: Cloudflare

### Chi tiết các tính năng cần phát triển

#### 1. Hệ thống người dùng
- Đăng ký/đăng nhập
- Profiles với thống kê học tập
- Hệ thống xếp hạng
- Quản lý tiến độ học tập
- Social sharing

#### 2. Nội dung
- Quản lý câu hỏi có cấu trúc
- Hệ thống phân loại/tags
- Nhiều định dạng câu hỏi (trắc nghiệm, điền khuyết, kéo thả)
- Hình ảnh, video minh họa
- Admin panel để quản lý nội dung

#### 3. Gamification
- Hệ thống điểm thưởng
- Huy hiệu thành tích
- Levels và streaks
- Leaderboards
- Battle mode (1vs1)

#### 4. Analytics & Business
- Google Analytics tích hợp
- Theo dõi hành vi người dùng
- Hệ thống đề xuất nội dung
- Plan trả phí (Premium)
- Mobile app (React Native)

### Lộ trình triển khai
1. **Phase 1: MVP+**
   - Chuyển đổi frontend sang React/Next.js
   - Xây dựng API backend cơ bản
   - Hệ thống đăng nhập/đăng ký
   - Lưu trạng thái học tập

2. **Phase 2: Social & Gamification**
   - Hệ thống xếp hạng
   - Huy hiệu và thành tích
   - Chia sẻ xã hội
   - Tối ưu hiệu suất

3. **Phase 3: Monetization & Scaling**
   - Premium content
   - Subscription plans
   - Mobile app
   - API public cho developers

### Công nghệ chi tiết từng lớp

#### Database Schema
- Users
- Questions (với version history)
- Categories/Topics
- UserProgress
- Achievements
- Subscriptions
- Statistics

#### Supabase Database Schema
```sql
-- Cấu trúc Database trong Supabase

-- 1. Table: topics (tạo trước để các bảng khác tham chiếu)
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    parent_id UUID REFERENCES topics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table: questions
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answers JSONB NOT NULL,
    correct INTEGER NOT NULL,
    difficulty difficulty_level NOT NULL,
    topic TEXT NOT NULL,
    topic_id UUID REFERENCES topics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT questions_topic_check CHECK ((topic IS NOT NULL) OR (topic_id IS NOT NULL))
);

-- 3. Table: profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT NOT NULL,
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table: leaderboards
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    topic TEXT,
    topic_id UUID REFERENCES topics(id),
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT leaderboards_topic_check CHECK ((topic IS NOT NULL) OR (topic_id IS NOT NULL))
);

-- 5. Table: achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    requirement JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table: user_achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    UNIQUE(user_id, achievement_id)
);

-- 7. Table: user_progress
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    topic TEXT NOT NULL,
    topic_id UUID REFERENCES topics(id),
    correct_answers INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    last_quiz_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, topic),
    CONSTRAINT user_progress_topic_check CHECK ((topic IS NOT NULL) OR (topic_id IS NOT NULL))
);

-- Tạo dữ liệu ban đầu cho bảng topics từ file questions.js
INSERT INTO topics (name, slug, description, order_index) VALUES
('Thời kỳ Đại Việt', 'thoi-ky-dai-viet', 'Các câu hỏi về lịch sử Việt Nam thời kỳ Đại Việt từ thế kỷ X đến XIX', 1),
('Cách mạng Việt Nam', 'cach-mang-viet-nam', 'Các câu hỏi về phong trào cách mạng Việt Nam từ đầu thế kỷ XX đến 1975', 2),
('Việt Nam hiện đại', 'viet-nam-hien-dai', 'Các câu hỏi về lịch sử Việt Nam từ 1975 đến nay', 3),
('Bắc thuộc và khởi nghĩa', 'bac-thuoc-va-khoi-nghia', 'Các câu hỏi về thời kỳ Bắc thuộc và các cuộc khởi nghĩa giành độc lập', 4);

-- Tạo dữ liệu mẫu cho bảng questions (từ file questions.js)
-- Chủ đề: Thời kỳ Đại Việt
INSERT INTO questions (question, answers, correct, difficulty, topic, topic_id)
VALUES
(
    'Ai là người sáng lập triều đại phong kiến độc lập đầu tiên của Việt Nam vào năm 939?',
    '["Ngô Quyền", "Đinh Bộ Lĩnh", "Lê Hoàn", "Lý Công Uẩn"]',
    0,
    'easy',
    'thoi-ky-dai-viet',
    (SELECT id FROM topics WHERE slug = 'thoi-ky-dai-viet')
),
(
    'Chiến thắng Bạch Đằng năm 938 do Ngô Quyền lãnh đạo đã đánh bại quân xâm lược nào?',
    '["Quân Tống", "Quân Nam Hán", "Quân Nguyên", "Quân Minh"]',
    1,
    'easy',
    'thoi-ky-dai-viet',
    (SELECT id FROM topics WHERE slug = 'thoi-ky-dai-viet')
),
(
    'Nhà Lý dời kinh đô từ Hoa Lư về đâu vào năm 1010?',
    '["Thăng Long", "Phú Xuân", "Cổ Loa", "Hoa Lư"]',
    0,
    'easy',
    'thoi-ky-dai-viet',
    (SELECT id FROM topics WHERE slug = 'thoi-ky-dai-viet')
),
(
    'Ai là vị tướng chỉ huy chiến thắng Bạch Đằng năm 1288?',
    '["Trần Hưng Đạo", "Trần Quang Khải", "Trần Quốc Toản", "Trần Nhật Duật"]',
    0,
    'easy',
    'thoi-ky-dai-viet',
    (SELECT id FROM topics WHERE slug = 'thoi-ky-dai-viet')
),
(
    'Nhà Hồ được thành lập vào năm nào?',
    '["1225", "1400", "1428", "1527"]',
    1,
    'easy',
    'thoi-ky-dai-viet',
    (SELECT id FROM topics WHERE slug = 'thoi-ky-dai-viet')
);

-- Chủ đề: Cách mạng Việt Nam
INSERT INTO questions (question, answers, correct, difficulty, topic, topic_id)
VALUES
(
    'Hồ Chí Minh thành lập Đảng Cộng sản Việt Nam vào năm nào?',
    '["1925", "1930", "1940", "1945"]',
    1,
    'easy',
    'cach-mang-viet-nam',
    (SELECT id FROM topics WHERE slug = 'cach-mang-viet-nam')
),
(
    'Cách mạng Tháng Tám nổ ra vào năm nào?',
    '["1940", "1945", "1954", "1975"]',
    1,
    'easy',
    'cach-mang-viet-nam',
    (SELECT id FROM topics WHERE slug = 'cach-mang-viet-nam')
),
(
    'Ai là người đọc bản Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hòa ngày 2/9/1945?',
    '["Võ Nguyên Giáp", "Phạm Văn Đồng", "Hồ Chí Minh", "Tôn Đức Thắng"]',
    2,
    'easy',
    'cach-mang-viet-nam',
    (SELECT id FROM topics WHERE slug = 'cach-mang-viet-nam')
),
(
    'Chiến thắng Điện Biên Phủ diễn ra vào năm nào?',
    '["1945", "1954", "1968", "1975"]',
    1,
    'easy',
    'cach-mang-viet-nam',
    (SELECT id FROM topics WHERE slug = 'cach-mang-viet-nam')
),
(
    'Hiệp định Paris ký kết vào năm nào?',
    '["1954", "1968", "1973", "1975"]',
    2,
    'medium',
    'cach-mang-viet-nam',
    (SELECT id FROM topics WHERE slug = 'cach-mang-viet-nam')
);
```

#### API Endpoints
- /auth (đăng ký, đăng nhập, đăng xuất)
- /users (profile, settings)
- /questions (CRUD)
- /quizzes (tạo, lấy, nộp bài)
- /progress (lưu và lấy tiến độ)
- /leaderboards
- /achievements

#### Công cụ bổ sung
- ElasticSearch cho tìm kiếm
- WebSockets cho multiplayer mode
- Mailchimp/SendGrid cho email marketing
- Stripe cho thanh toán
- React Native cho mobile app

## Cách sử dụng phiên bản hiện tại
1. Mở file `index.html` trên trình duyệt
2. Chọn chủ đề câu hỏi
3. Cấu hình số lượng câu hỏi, thời gian và độ khó
4. Bắt đầu trắc nghiệm và hoàn thành bài kiểm tra

## Đóng góp
Chúng tôi chào đón mọi đóng góp để cải thiện HistoQuiz. Vui lòng tạo issue hoặc pull request nếu bạn muốn tham gia phát triển.
