# Hệ thống xếp hạng (Leaderboard) - HistoQuiz

## Tổng quan
Hệ thống xếp hạng sẽ tạo động lực cho người dùng thông qua việc cạnh tranh lành mạnh, làm tăng tính gắn bó với ứng dụng, và cung cấp mục tiêu rõ ràng để người dùng phấn đấu.

## Thiết kế hệ thống

### 1. Điểm xếp hạng (Ranking Points)

- **Điểm cơ bản**: Tính dựa trên kết quả làm bài
  - Mỗi câu trả lời đúng: +10 điểm
  - Điểm thưởng tốc độ: +0-5 điểm (dựa trên thời gian trả lời)
  - Điểm thưởng chuỗi: +2 điểm cho mỗi câu đúng liên tiếp (tối đa +10)

- **Hệ số độ khó**:
  - Dễ: x1.0
  - Trung bình: x1.5
  - Khó: x2.0

- **Hệ số chủ đề**:
  - Chủ đề thay đổi mỗi tuần: x1.2
  - Chủ đề thử thách đặc biệt: x1.5

- **Công thức tính điểm**:
  ```
  Điểm xếp hạng = (Điểm cơ bản × Hệ số độ khó × Hệ số chủ đề) × (1 + Streak_bonus)
  ```

### 2. Bảng xếp hạng

- **Bảng xếp hạng toàn cầu**: Xếp hạng tất cả người dùng trên toàn hệ thống
- **Bảng xếp hạng bạn bè**: Chỉ hiển thị xếp hạng giữa bạn bè
- **Bảng xếp hạng theo thời gian**:
  - Hàng ngày (reset lúc 00:00)
  - Hàng tuần (reset vào Chủ Nhật)
  - Hàng tháng
  - Mọi thời đại (tổng điểm tích lũy)
- **Bảng xếp hạng theo chủ đề**: Riêng cho từng chủ đề lịch sử

### 3. Phân hạng và cấp độ

- **Cấp độ người dùng (Level)**:
  - Mỗi cấp độ yêu cầu số điểm nhất định để đạt được
  - Cấp độ hiển thị cạnh tên người dùng

- **Hạng (Tiers)**:
  - Đồng: 0-999 điểm
  - Bạc: 1,000-2,499 điểm
  - Vàng: 2,500-4,999 điểm
  - Bạch Kim: 5,000-9,999 điểm
  - Kim Cương: 10,000-19,999 điểm
  - Cao Thủ: 20,000+ điểm

- **Huy hiệu thứ hạng**: Biểu tượng đặc biệt cho người dùng xếp hạng top:
  - Top 3: Huy hiệu vàng/bạc/đồng
  - Top 10: Huy hiệu đặc biệt
  - Top 100: Huy hiệu danh dự

### 4. Tính năng xã hội và thử thách

- **Thử thách bạn bè**: Gửi lời mời thử thách trực tiếp đến bạn bè
- **Thông báo xếp hạng**: Thông báo khi bị vượt qua hoặc vượt qua người khác
- **Chia sẻ thành tích**: Chia sẻ thứ hạng lên mạng xã hội
- **Chế độ thi đấu trực tiếp**: Thi đấu trực tiếp với người chơi khác

### 5. Phần thưởng

- **Phần thưởng hàng ngày/tuần/tháng**:
  - Top 3: Huy hiệu đặc biệt + nội dung premium miễn phí
  - Top 10: Huy hiệu + điểm thưởng
  - Top 100: Điểm thưởng

- **Phần thưởng tiến bộ**:
  - Thưởng khi đạt mốc điểm nhất định
  - Thưởng khi thăng hạng

## Thiết kế cơ sở dữ liệu

### Bảng User (bổ sung vào schema hiện có)
```
{
  _id: ObjectId,
  username: String,
  ...
  totalPoints: Number,
  weeklyPoints: Number,
  monthlyPoints: Number,
  tier: String,
  level: Number,
  badges: Array<Badge>,
  streak: Number,
  lastActive: Date
}
```

### Bảng Leaderboard
```
{
  _id: ObjectId,
  type: String, // 'global', 'weekly', 'monthly', 'topic'
  topic: String, // nếu là leaderboard theo chủ đề
  period: Date, // cho weekly/monthly
  rankings: [
    {
      userId: ObjectId,
      username: String,
      points: Number,
      position: Number
    }
  ],
  updatedAt: Date
}
```

### Bảng UserAchievement
```
{
  _id: ObjectId,
  userId: ObjectId,
  type: String, // 'leaderboard', 'streak', 'level'
  achievement: String, // 'top_daily_3', 'tier_gold', etc.
  earnedAt: Date,
  metadata: Object // dữ liệu bổ sung
}
```

## API Endpoints

### 1. Endpoints lấy bảng xếp hạng
- `GET /api/leaderboards/global` - Bảng xếp hạng toàn cầu
- `GET /api/leaderboards/friends` - Bảng xếp hạng bạn bè
- `GET /api/leaderboards/daily` - Bảng xếp hạng hàng ngày
- `GET /api/leaderboards/weekly` - Bảng xếp hạng hàng tuần
- `GET /api/leaderboards/monthly` - Bảng xếp hạng hàng tháng
- `GET /api/leaderboards/topic/:topicId` - Bảng xếp hạng theo chủ đề

### 2. Endpoints cập nhật điểm
- `POST /api/leaderboards/update-score` - Cập nhật điểm sau khi hoàn thành bài quiz

### 3. Endpoints thách đấu
- `POST /api/challenges/create` - Tạo thử thách mới
- `GET /api/challenges/pending` - Lấy danh sách thử thách đang chờ
- `POST /api/challenges/:id/accept` - Chấp nhận thử thách

## Giao diện người dùng

### Màn hình bảng xếp hạng
- Hiển thị top 100 người dùng
- Luôn hiển thị vị trí của người dùng hiện tại
- Tab chuyển đổi giữa các loại bảng xếp hạng
- Nút chia sẻ thành tích

### Profile Card
- Hiển thị hạng hiện tại
- Huy hiệu và thành tích
- Cấp độ và thanh tiến trình
- Điểm số hiện tại

### Thông báo xếp hạng
- Thông báo khi thăng/giảm hạng
- Thông báo khi có người vượt qua
- Thông báo phần thưởng

## Chiến lược triển khai

### Phase 1: Cơ bản
- Triển khai hệ thống tính điểm
- Bảng xếp hạng toàn cầu và hàng tuần
- Hiển thị cấp độ cơ bản

### Phase 2: Mở rộng
- Thêm bảng xếp hạng theo chủ đề
- Triển khai hệ thống phân hạng
- Thêm huy hiệu thành tích

### Phase 3: Xã hội hóa
- Thêm thử thách bạn bè
- Chia sẻ thành tích
- Phần thưởng và ưu đãi

## Đo lường hiệu quả
- Thời gian sử dụng ứng dụng
- Tỷ lệ quay lại
- Số lượng bài quiz hoàn thành
- Tương tác xã hội (chia sẻ, thử thách)
- Chuyển đổi sang người dùng trả phí 