// Cấu hình Supabase cho HistoQuiz
// Hướng dẫn: 
// 1. Đăng ký tài khoản Supabase tại https://supabase.com
// 2. Tạo dự án mới
// 3. Thay thế URL và API Key bên dưới từ trang cài đặt của dự án của bạn

import { createClient } from '@supabase/supabase-js'

// Biến môi trường sẽ được thiết lập khi triển khai
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Tạo client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Hàm xác thực người dùng
export const auth = {
  // Đăng ký người dùng mới
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email, 
      password
    })
    return { data, error }
  },
  
  // Đăng nhập
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, 
      password
    })
    return { data, error }
  },
  
  // Đăng xuất
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },
  
  // Lấy thông tin người dùng hiện tại
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }
}

// Hàm quản lý dữ liệu câu hỏi
export const questions = {
  // Lấy câu hỏi theo chủ đề
  getByTopic: async (topic, difficulty, limit) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic', topic)
      .eq('difficulty', difficulty)
      .limit(limit)
    
    return { data, error }
  },
  
  // Lấy câu hỏi ngẫu nhiên
  getRandom: async (limit, difficulty) => {
    // Phù hợp cho tính năng "Tạo ngẫu nhiên"
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('difficulty', difficulty)
      .limit(limit)
      .order('random()') // PostgreSQL hỗ trợ truy vấn ngẫu nhiên
    
    return { data, error }
  }
}

// Hàm quản lý bảng xếp hạng
export const leaderboard = {
  // Lấy bảng xếp hạng toàn cầu
  getGlobal: async (limit = 10) => {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('*, profiles(username, avatar_url)')
      .order('score', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },
  
  // Lấy bảng xếp hạng theo chủ đề
  getByTopic: async (topic, limit = 10) => {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('*, profiles(username, avatar_url)')
      .eq('topic', topic)
      .order('score', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },
  
  // Cập nhật điểm số
  updateScore: async (userId, topic, score) => {
    // Kiểm tra nếu đã có bản ghi
    const { data: existingScore } = await supabase
      .from('leaderboards')
      .select('id, score')
      .eq('user_id', userId)
      .eq('topic', topic)
      .single()
    
    if (existingScore) {
      // Chỉ cập nhật nếu điểm mới cao hơn
      if (score > existingScore.score) {
        const { data, error } = await supabase
          .from('leaderboards')
          .update({ score, updated_at: new Date() })
          .eq('id', existingScore.id)
        
        return { data, error }
      }
      return { data: existingScore, error: null }
    } else {
      // Tạo bản ghi mới
      const { data, error } = await supabase
        .from('leaderboards')
        .insert([{ 
          user_id: userId, 
          topic,
          score,
          created_at: new Date()
        }])
      
      return { data, error }
    }
  }
}

// Hàm quản lý thành tích
export const achievements = {
  // Lấy danh sách thành tích người dùng
  getUserAchievements: async (userId) => {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId)
    
    return { data, error }
  },
  
  // Cập nhật thành tích khi người dùng đạt được
  unlockAchievement: async (userId, achievementId) => {
    // Kiểm tra xem người dùng đã có thành tích này chưa
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single()
    
    if (!existing) {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert([{
          user_id: userId,
          achievement_id: achievementId,
          unlocked_at: new Date()
        }])
      
      return { data, error }
    }
    
    return { data: existing, error: null }
  }
}

// Hàm quản lý hồ sơ người dùng
export const profiles = {
  // Lấy thông tin hồ sơ người dùng
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  },
  
  // Cập nhật thông tin hồ sơ
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
    
    return { data, error }
  }
}

/*
  Cấu trúc database Supabase cho HistoQuiz:
  
  1. Table: questions
     - id (primary key)
     - question (text)
     - answers (json array)
     - correct (integer)
     - difficulty (enum: 'easy', 'medium', 'hard')
     - topic (string)
     - created_at (timestamp)
     - updated_at (timestamp)
  
  2. Table: profiles
     - id (primary key, references auth.users.id)
     - username (string)
     - avatar_url (string)
     - level (integer)
     - xp (integer)
     - streak (integer)
     - last_active (timestamp)
     - created_at (timestamp)
     - updated_at (timestamp)
  
  3. Table: leaderboards
     - id (primary key)
     - user_id (references profiles.id)
     - topic (string, null for global)
     - score (integer)
     - created_at (timestamp)
     - updated_at (timestamp)
  
  4. Table: achievements
     - id (primary key)
     - name (string)
     - description (string)
     - icon (string)
     - category (string: 'rank', 'streak', 'topics', etc.)
     - requirement (json - logic cho việc đạt được)
     - created_at (timestamp)
  
  5. Table: user_achievements
     - id (primary key)
     - user_id (references profiles.id)
     - achievement_id (references achievements.id)
     - unlocked_at (timestamp)
     - progress (integer, phần trăm hoàn thành)
     
  6. Table: user_progress
     - id (primary key)
     - user_id (references profiles.id)
     - topic (string)
     - correct_answers (integer)
     - total_questions (integer)
     - last_quiz_at (timestamp)
     - updated_at (timestamp)
*/ 