$(document).ready(function() {
    let currentTopic = '';
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timeLeft = 0;
    let timer = null;
    let userAnswers = []; // Mảng lưu câu trả lời của người dùng
    let resultsChart = null; // Biến lưu biểu đồ kết quả
    let isRandomMode = false; // Biến đánh dấu chế độ ngẫu nhiên
    let initialTimeLimit = 0; // Lưu thời gian ban đầu
    let questionCache = {}; // Cache dữ liệu câu hỏi

    // Kiểm tra và nạp cache câu hỏi từ localStorage
    initializeQuestionCache();

    // Hiển thị thông báo chào mừng sau khi trang tải xong
    setTimeout(() => {
        showQuickToast('Chào mừng đến với HistoQuiz! 🎓', 'success', 3000);
    }, 1000);

    // Kiểm tra và khôi phục trạng thái từ localStorage nếu có
    initializeFromLocalStorage();

    // Xử lý sự kiện chọn chủ đề
    $('.topic-card').click(function() {
        const topicIndex = $(this).index();
        let topicName = '';
        
        // Kiểm tra nếu là chủ đề "Tạo ngẫu nhiên" (index = 4)
        if (topicIndex === 4) {
            currentTopic = 'random';
            isRandomMode = true;
            topicName = 'Ngẫu nhiên';
        } else {
            // Ánh xạ index của topic-card sang key trong quizQuestions
            const topicMapping = {
                0: 'bac-thuoc-va-khoi-nghia',  // Thứ nhất - Thời kỳ Bắc thuộc
                1: 'thoi-ky-dai-viet',         // Thứ hai - Thời kỳ Đại Việt
                2: 'cach-mang-viet-nam',       // Thứ ba - Cách mạng Việt Nam
                3: 'viet-nam-hien-dai'         // Thứ tư - Việt Nam hiện đại
            };
            
            currentTopic = topicMapping[topicIndex];
            isRandomMode = false;
            
            // Lấy tên chủ đề hiển thị
            switch(currentTopic) {
                case 'thoi-ky-dai-viet':
                    topicName = 'Thời kỳ Đại Việt';
                    break;
                case 'cach-mang-viet-nam':
                    topicName = 'Cách mạng Việt Nam';
                    break;
                case 'viet-nam-hien-dai':
                    topicName = 'Việt Nam hiện đại';
                    break;
                case 'bac-thuoc-va-khoi-nghia':
                    topicName = 'Thời kỳ Bắc thuộc';
                    break;
            }
        }
        
        $('#topic-selection').hide();
        $('#quiz-config').show();
        
        // Hiển thị thông báo đã chọn chủ đề
        showQuickToast(`Đã chọn chủ đề: ${topicName}`, 'info', 2000);
        
        // Lưu chủ đề đã chọn
        saveStateToLocalStorage();
    });

    // Xử lý sự kiện khi chọn radio button cho các tùy chọn
    $('.question-count-radio').change(function() {
        // Chỉ xóa trong nhóm các nút số câu hỏi
        $('.question-count-radio').siblings('.option-box').removeClass('bg-blue-500 text-white');
        $(this).siblings('.option-box').addClass('bg-blue-500 text-white');
        saveStateToLocalStorage();
    });
    
    $('.time-limit-radio').change(function() {
        $('.time-limit-radio').siblings('.option-box').removeClass('bg-green-500 text-white');
        $(this).siblings('.option-box').addClass('bg-green-500 text-white');
        saveStateToLocalStorage();
    });
    
    $('.difficulty-radio').change(function() {
        $('.difficulty-radio').siblings('.option-box').removeClass('bg-purple-500 text-white');
        $(this).siblings('.option-box').addClass('bg-purple-500 text-white');
        saveStateToLocalStorage();
    });
    
    // Tự động chọn radio button đầu tiên trong mỗi nhóm
    $('.question-count-radio:first').prop('checked', true).trigger('change');
    $('.time-limit-radio:first').prop('checked', true).trigger('change');
    $('.difficulty-radio:first').prop('checked', true).trigger('change');

    // Xử lý sự kiện bắt đầu quiz
    $('#start-quiz').click(function() {
        // Lấy giá trị từ radio button thay vì dropdown
        const questionCount = parseInt($('input[name="question-count"]:checked').val());
        const timeLimit = parseInt($('input[name="time-limit"]:checked').val());
        const difficulty = $('input[name="difficulty"]:checked').val();
        
        initialTimeLimit = timeLimit * 60; // Lưu thời gian ban đầu

        // Lấy và trộn câu hỏi ngẫu nhiên
        if (isRandomMode) {
            // Nếu là chế độ ngẫu nhiên, lấy câu hỏi từ tất cả chủ đề
            currentQuestions = getRandomQuestionsFromAllTopics(questionCount, difficulty);
        } else {
            // Kiểm tra xem có trong cache không
            const cacheKey = `${currentTopic}_${questionCount}_${difficulty}`;
            if (questionCache[cacheKey]) {
                console.log('Lấy câu hỏi từ cache: ' + cacheKey);
                currentQuestions = questionCache[cacheKey];
                // Trộn lại câu hỏi để không bị trùng thứ tự
                currentQuestions = [...currentQuestions].sort(() => Math.random() - 0.5);
            } else {
                // Nếu là chế độ chủ đề cụ thể
                currentQuestions = shuffleQuestions(quizQuestions[currentTopic], questionCount, difficulty);
                // Lưu vào cache
                questionCache[cacheKey] = [...currentQuestions];
                saveQuestionCache();
            }
        }
        
        if (currentQuestions.length === 0) {
            customAlert('Không có đủ câu hỏi phù hợp với mức độ đã chọn!');
            return;
        }

        currentQuestionIndex = 0;
        score = 0;
        timeLeft = timeLimit * 60;
        userAnswers = []; // Reset câu trả lời của người dùng

        $('#quiz-config').hide();
        $('#quiz-section').show();
        $('#total-questions').text(currentQuestions.length);
        
        // Hiển thị thông báo bắt đầu
        let difficultyText = '';
        switch(difficulty) {
            case 'easy':
                difficultyText = 'Dễ';
                break;
            case 'medium':
                difficultyText = 'Trung bình';
                break;
            case 'hard':
                difficultyText = 'Khó';
                break;
        }
        
        showQuickToast(`Bắt đầu bài kiểm tra ${difficultyText} với ${questionCount} câu hỏi`, 'info', 3000);
        
        displayQuestion();
        startTimer();
        
        // Lưu trạng thái khi bắt đầu làm bài
        saveStateToLocalStorage();
    });

    // Hàm lấy câu hỏi ngẫu nhiên từ tất cả chủ đề
    function getRandomQuestionsFromAllTopics(count, difficulty) {
        // Tạo mảng chứa tất cả câu hỏi từ tất cả chủ đề phù hợp với độ khó
        let allQuestions = [];
        
        // Duyệt qua tất cả chủ đề và lấy câu hỏi theo độ khó
        Object.keys(quizQuestions).forEach(topic => {
            quizQuestions[topic].forEach(question => {
                if (question.difficulty === difficulty) {
                    // Thêm thông tin chủ đề vào câu hỏi để hiển thị khi cần
                    const questionWithTopic = {...question, topic: topic};
                    allQuestions.push(questionWithTopic);
                }
            });
        });
        
        // Trộn và lấy số lượng câu hỏi cần thiết
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // Xử lý sự kiện chọn câu trả lời
    $('#answers').off('click', '.answer-option').on('click', '.answer-option', function() {
        $('.answer-option').removeClass('bg-blue-200 scale-105').addClass('bg-white');
        $(this).removeClass('bg-white').addClass('bg-blue-200 scale-105');
        
        // Lưu trạng thái khi chọn câu trả lời
        saveStateToLocalStorage();
    });

    // Xử lý sự kiện next question
    $('#next-question').click(function() {
        const selectedAnswer = $('#answers .bg-blue-200').index();
        
        if (selectedAnswer === -1) {
            customAlert('Vui lòng chọn một câu trả lời!');
            return;
        }

        // Lưu câu trả lời của người dùng
        saveUserAnswer(selectedAnswer);

        currentQuestionIndex++;

        if (currentQuestionIndex < currentQuestions.length) {
            displayQuestion();
            // Hiển thị thông báo tiếp theo nếu không phải câu cuối
            showQuickToast(`Đã lưu câu trả lời ${currentQuestionIndex}/${currentQuestions.length}`, 'success', 1500);
        } else {
            showQuickToast('Đang xử lý kết quả...', 'info', 1500);
            setTimeout(() => {
                endQuiz();
            }, 1000);
        }
        
        // Lưu trạng thái sau khi chuyển câu hỏi
        saveStateToLocalStorage();
    });

    // Xử lý sự kiện prev question
    $('#prev-question').click(function() {
        if (currentQuestionIndex > 0) {
            // Lưu câu trả lời hiện tại nếu đã chọn
            const selectedAnswer = $('#answers .bg-blue-200').index();
            if (selectedAnswer !== -1) {
                saveUserAnswer(selectedAnswer);
            }
            
            // Quay lại câu hỏi trước
            currentQuestionIndex--;
            displayQuestion();
            
            // Hiển thị câu trả lời đã chọn trước đó (nếu có)
            const prevAnswer = userAnswers.find(a => a.questionIndex === currentQuestionIndex);
            if (prevAnswer) {
                $('.answer-option').eq(prevAnswer.userAnswer).removeClass('bg-white').addClass('bg-blue-200 scale-105');
            }
            
            // Hiển thị thông báo quay lại
            showQuickToast(`Quay lại câu ${currentQuestionIndex + 1}`, 'info', 1500);
            
            // Lưu trạng thái sau khi quay lại câu trước
            saveStateToLocalStorage();
        }
    });

    // Hàm lưu câu trả lời người dùng
    function saveUserAnswer(selectedAnswer) {
        // Kiểm tra xem đã có câu trả lời cho câu hỏi này chưa
        const existingAnswerIndex = userAnswers.findIndex(a => a.questionIndex === currentQuestionIndex);
        
        const answerData = {
            questionIndex: currentQuestionIndex,
            userAnswer: selectedAnswer,
            correctAnswer: currentQuestions[currentQuestionIndex].correct,
            isCorrect: selectedAnswer === currentQuestions[currentQuestionIndex].correct
        };
        
        if (existingAnswerIndex !== -1) {
            // Cập nhật câu trả lời đã tồn tại
            const oldAnswer = userAnswers[existingAnswerIndex];
            userAnswers[existingAnswerIndex] = answerData;
            
            // Cập nhật điểm số nếu thay đổi trạng thái đúng/sai
            if (oldAnswer.isCorrect && !answerData.isCorrect) {
                score--; // Trừ điểm nếu trước đó đúng nhưng giờ sai
            } else if (!oldAnswer.isCorrect && answerData.isCorrect) {
                score++; // Cộng điểm nếu trước đó sai nhưng giờ đúng
            }
        } else {
            // Thêm câu trả lời mới
            userAnswers.push(answerData);
            
            // Cập nhật điểm số
            if (answerData.isCorrect) {
                score++;
            }
        }
    }

    // Xử lý sự kiện làm lại quiz
    $('#retry-quiz').click(function() {
        $('#results-section').hide();
        $('#quiz-config').show();
        
        // Hủy biểu đồ cũ nếu có
        if (resultsChart) {
            resultsChart.destroy();
            resultsChart = null;
        }
        
        // Xóa trạng thái hiện tại khỏi localStorage
        clearQuizState();
    });

    // Xử lý sự kiện quay lại chọn chủ đề
    $('#back-to-topics').click(function() {
        $('#results-section').hide();
        $('#topic-selection').show();
        
        // Hủy biểu đồ cũ nếu có
        if (resultsChart) {
            resultsChart.destroy();
            resultsChart = null;
        }
        
        // Xóa trạng thái hiện tại khỏi localStorage
        clearQuizState();
    });

    // Xử lý sự kiện nút quay lại (từ quiz tới cấu hình)
    $('#back-button').click(function() {
        // Hiển thị thông báo xác nhận
        customConfirm('Bạn có chắc muốn quay lại? Tiến trình của bạn sẽ không được lưu.', function() {
            // Dừng bộ đếm thời gian
            clearInterval(timer);
            timer = null;
            
            // Ẩn phần quiz và hiển thị lại phần cấu hình
            $('#quiz-section').hide();
            $('#quiz-config').show();
            
            // Reset các giá trị
            currentQuestionIndex = 0;
            score = 0;
            userAnswers = [];
            
            // Ẩn nút prev-question và reset text của nút next-question
            $('#prev-question').addClass('hidden');
            $('#next-question').text('Câu tiếp theo');
            
            // Xóa trạng thái hiện tại khỏi localStorage
            clearQuizState();
        });
    });

    // Xử lý sự kiện nút quay lại từ cấu hình tới chọn chủ đề
    $('#config-back-button').click(function() {
        $('#quiz-config').hide();
        $('#topic-selection').show();
        
        // Xóa dữ liệu chủ đề đã chọn
        clearQuizState();
    });

    // Hàm hiển thị câu hỏi
    function displayQuestion() {
        const question = currentQuestions[currentQuestionIndex];
        $('#current-question').text(currentQuestionIndex + 1);
        
        // Hiển thị hoặc ẩn nút quay lại dựa vào vị trí câu hỏi
        if (currentQuestionIndex > 0) {
            $('#prev-question').removeClass('hidden');
        } else {
            $('#prev-question').addClass('hidden');
        }
        
        // Cập nhật text của nút next question
        if (currentQuestionIndex === currentQuestions.length - 1) {
            $('#next-question').text('Hoàn thành');
        } else {
            $('#next-question').text('Câu tiếp theo');
        }
        
        // Hiển thị câu hỏi, thêm thông tin chủ đề nếu đang ở chế độ ngẫu nhiên
        if (isRandomMode && question.topic) {
            let topicName = '';
            switch(question.topic) {
                case 'thoi-ky-dai-viet':
                    topicName = 'Thời kỳ Đại Việt';
                    break;
                case 'cach-mang-viet-nam':
                    topicName = 'Cách mạng Việt Nam';
                    break;
                case 'viet-nam-hien-dai':
                    topicName = 'Việt Nam hiện đại';
                    break;
                case 'bac-thuoc-va-khoi-nghia':
                    topicName = 'Thời kỳ Bắc thuộc';
                    break;
            }
            $('#question-content p').html(`<span class="text-xs font-semibold px-2 py-1 rounded bg-blue-200 text-blue-800 mr-2">${topicName}</span> ${question.question}`);
        } else {
            $('#question-content p').text(question.question);
        }
        
        const answersHtml = question.answers.map((answer, index) => `
            <div class="answer-option bg-white border border-blue-100 p-3.5 rounded-lg cursor-pointer hover:bg-blue-50 transition-all duration-300 text-base mb-2 sm:mb-0 shadow-sm hover:shadow flex items-center">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-full border border-blue-200 text-blue-600 mr-3 font-medium">${String.fromCharCode(65 + index)}</span>
                ${answer}
            </div>
        `).join('');
        
        $('#answers').html(answersHtml);
    }

    // Hàm trộn và lọc câu hỏi theo độ khó
    function shuffleQuestions(questions, count, difficulty) {
        const filteredQuestions = questions.filter(q => q.difficulty === difficulty);
        const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // Hàm bắt đầu đếm thời gian
    function startTimer() {
        if (timer) clearInterval(timer);
        
        timer = setInterval(function() {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            $('#timer').text(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);

            // Lưu trạng thái mỗi 5 giây để không ảnh hưởng hiệu suất
            if (timeLeft % 5 === 0) {
                saveStateToLocalStorage();
            }

            if (timeLeft <= 0) {
                endQuiz();
            }
        }, 1000);
    }

    // Hàm kết thúc quiz
    function endQuiz() {
        clearInterval(timer);
        $('#quiz-section').hide();
        $('#results-section').show();
        
        // Tính toán kết quả
        const correctCount = score;
        const wrongCount = currentQuestions.length - score;
        const percentage = Math.round((score / currentQuestions.length) * 100);
        
        // Hiển thị thông tin kết quả
        $('#score').text(score);
        $('#max-score').text(currentQuestions.length);
        $('#score-percentage').text(percentage);
        $('#progress-bar').css('width', percentage + '%');
        $('#correct-answers').text(correctCount);
        $('#wrong-answers').text(wrongCount);
        
        // Cập nhật badge kết quả
        updateResultBadge(percentage);
        
        // Thay đổi màu sắc của progress bar theo kết quả
        updateProgressBarColor(percentage);
        
        // Tính và hiển thị thời gian hoàn thành
        const timeSpentSeconds = initialTimeLimit - timeLeft;
        
        // Phân tách thành phút và giây
        const minutes = Math.floor(timeSpentSeconds / 60);
        const seconds = timeSpentSeconds % 60;
        
        // Hiển thị thời gian
        $('#completion-time-minutes').text(minutes);
        $('#completion-time-seconds').text(seconds);
        
        // Hiển thị biểu đồ kết quả
        createResultsChart(correctCount, wrongCount);
        
        // Hiển thị chi tiết kết quả
        displayDetailedResults();
        
        // Hiển thị thông báo kết quả
        let resultMessage, resultType;
        if (percentage >= 80) {
            resultMessage = 'Xuất sắc! Bạn đã hoàn thành bài kiểm tra với kết quả rất tốt!';
            resultType = 'success';
        } else if (percentage >= 60) {
            resultMessage = 'Tốt! Bạn đã hoàn thành bài kiểm tra.';
            resultType = 'success';
        } else if (percentage >= 40) {
            resultMessage = 'Bạn đã hoàn thành bài kiểm tra. Hãy ôn tập thêm nhé!';
            resultType = 'warning';
        } else {
            resultMessage = 'Bạn cần cố gắng hơn. Hãy ôn tập lại kiến thức!';
            resultType = 'warning';
        }
        
        showQuickToast(resultMessage, resultType, 4000);
        
        // Xóa trạng thái quiz khỏi localStorage vì đã hoàn thành
        clearQuizState();
    }
    
    // Hàm cập nhật badge kết quả
    function updateResultBadge(percentage) {
        let badgeText, badgeClass;
        
        if (percentage >= 90) {
            badgeText = 'Xuất sắc';
            badgeClass = 'bg-purple-100 text-purple-800';
        } else if (percentage >= 80) {
            badgeText = 'Giỏi';
            badgeClass = 'bg-green-100 text-green-800';
        } else if (percentage >= 65) {
            badgeText = 'Khá';
            badgeClass = 'bg-blue-100 text-blue-800';
        } else if (percentage >= 50) {
            badgeText = 'Trung bình';
            badgeClass = 'bg-yellow-100 text-yellow-800';
        } else {
            badgeText = 'Cần cố gắng';
            badgeClass = 'bg-red-100 text-red-800';
        }
        
        $('#result-badge')
            .text(badgeText)
            .removeClass('bg-blue-100 bg-green-100 bg-yellow-100 bg-red-100 bg-purple-100 text-blue-800 text-green-800 text-yellow-800 text-red-800 text-purple-800')
            .addClass(badgeClass);
    }
    
    // Hàm cập nhật màu sắc progress bar
    function updateProgressBarColor(percentage) {
        if (percentage >= 80) {
            $('#progress-bar').removeClass('bg-blue-600 bg-yellow-500 bg-red-500').addClass('bg-green-500');
        } else if (percentage >= 60) {
            $('#progress-bar').removeClass('bg-green-500 bg-yellow-500 bg-red-500').addClass('bg-blue-600');
        } else if (percentage >= 40) {
            $('#progress-bar').removeClass('bg-green-500 bg-blue-600 bg-red-500').addClass('bg-yellow-500');
        } else {
            $('#progress-bar').removeClass('bg-green-500 bg-blue-600 bg-yellow-500').addClass('bg-red-500');
        }
    }
    
    // Hàm tạo biểu đồ kết quả
    function createResultsChart(correctCount, wrongCount) {
        // Hủy biểu đồ cũ nếu có
        if (resultsChart) {
            resultsChart.destroy();
        }
        
        const ctx = document.getElementById('results-chart').getContext('2d');
        resultsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Đúng', 'Sai'],
                datasets: [{
                    data: [correctCount, wrongCount],
                    backgroundColor: ['#10B981', '#EF4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: {
                                size: window.innerWidth < 640 ? 10 : 12
                            }
                        }
                    },
                    tooltip: {
                        bodyFont: {
                            size: window.innerWidth < 640 ? 10 : 12
                        },
                        titleFont: {
                            size: window.innerWidth < 640 ? 11 : 14
                        }
                    }
                }
            }
        });
    }

    // Hàm hiển thị chi tiết kết quả
    function displayDetailedResults() {
        let detailedResultsHtml = '';
        
        userAnswers.forEach((answer, index) => {
            const question = currentQuestions[answer.questionIndex];
            const userAnswerText = question.answers[answer.userAnswer];
            const correctAnswerText = question.answers[answer.correctAnswer];
            const resultClass = answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
            const resultIcon = answer.isCorrect ? 
                '<span class="text-green-500">✓</span>' : 
                '<span class="text-red-500">✗</span>';
            
            // Thêm nhãn chủ đề nếu đang ở chế độ ngẫu nhiên
            let topicLabel = '';
            if (isRandomMode && question.topic) {
                let topicName = '';
                let topicClass = '';
                
                switch(question.topic) {
                    case 'thoi-ky-dai-viet':
                        topicName = 'Thời kỳ Đại Việt';
                        topicClass = 'bg-blue-100 text-blue-800';
                        break;
                    case 'cach-mang-viet-nam':
                        topicName = 'Cách mạng Việt Nam';
                        topicClass = 'bg-red-100 text-red-800';
                        break;
                    case 'viet-nam-hien-dai':
                        topicName = 'Việt Nam hiện đại';
                        topicClass = 'bg-green-100 text-green-800';
                        break;
                    case 'bac-thuoc-va-khoi-nghia':
                        topicName = 'Thời kỳ Bắc thuộc';
                        topicClass = 'bg-purple-100 text-purple-800';
                        break;
                }
                
                topicLabel = `<span class="text-xs font-semibold px-2 py-1 rounded ${topicClass} ml-2 mt-1 inline-block">${topicName}</span>`;
            }
            
            // Tạo một giao diện chi tiết thân thiện với thiết bị di động hơn
            detailedResultsHtml += `
                <div class="${resultClass} p-3 sm:p-4 rounded-lg border">
                    <div class="flex flex-wrap justify-between items-center mb-1">
                        <div class="font-semibold text-sm sm:text-base mb-1 sm:mb-0">
                            Câu ${index + 1}: ${resultIcon}
                        </div>
                        <div class="flex items-center">
                            <div class="text-gray-600 text-xs sm:text-sm px-2 py-1 rounded-full ${answer.isCorrect ? 'bg-green-100' : 'bg-red-100'}">
                                ${answer.isCorrect ? 'Đúng' : 'Sai'}
                            </div>
                            ${topicLabel}
                        </div>
                    </div>
                    <p class="mt-2 text-sm sm:text-base border-t border-gray-100 pt-2">${question.question}</p>
                    <div class="mt-2 bg-white bg-opacity-60 p-2 rounded">
                        <div class="text-xs sm:text-sm text-gray-600 font-medium">Câu trả lời của bạn:</div>
                        <div class="${answer.isCorrect ? 'text-green-600' : 'text-red-600'} font-medium text-sm sm:text-base pl-2 border-l-2 ${answer.isCorrect ? 'border-green-400' : 'border-red-400'} mt-1">
                            ${userAnswerText}
                        </div>
                    </div>
                    ${!answer.isCorrect ? `
                        <div class="mt-2 bg-white bg-opacity-60 p-2 rounded">
                            <div class="text-xs sm:text-sm text-gray-600 font-medium">Đáp án đúng:</div>
                            <div class="text-green-600 font-medium text-sm sm:text-base pl-2 border-l-2 border-green-400 mt-1">
                                ${correctAnswerText}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        $('#detailed-results').html(detailedResultsHtml);
    }

    // Hàm lưu trạng thái vào localStorage
    function saveStateToLocalStorage() {
        // Chỉ lưu khi đang trong quá trình làm bài
        if ($('#quiz-section').is(':visible')) {
            const quizState = {
                currentTopic: currentTopic,
                isRandomMode: isRandomMode,
                currentQuestions: currentQuestions,
                currentQuestionIndex: currentQuestionIndex,
                score: score,
                timeLeft: timeLeft,
                userAnswers: userAnswers,
                questionCount: parseInt($('input[name="question-count"]:checked').val()),
                timeLimit: parseInt($('input[name="time-limit"]:checked').val()),
                difficulty: $('input[name="difficulty"]:checked').val(),
                initialTimeLimit: initialTimeLimit,
                lastUpdated: new Date().getTime()
            };
            
            localStorage.setItem('histoQuizState', JSON.stringify(quizState));
            
            // Hiển thị thông báo lưu trạng thái mỗi 30 giây
            if (timeLeft % 30 === 0 && timeLeft > 0) {
                showQuickToast('Tiến trình của bạn đã được lưu tự động', 'info', 2000);
            }
        } 
        // Lưu trạng thái cấu hình nếu đang ở màn hình cấu hình
        else if ($('#quiz-config').is(':visible')) {
            const configState = {
                currentTopic: currentTopic,
                isRandomMode: isRandomMode,
                questionCount: parseInt($('input[name="question-count"]:checked').val()),
                timeLimit: parseInt($('input[name="time-limit"]:checked').val()),
                difficulty: $('input[name="difficulty"]:checked').val(),
                screen: 'config',
                lastUpdated: new Date().getTime()
            };
            
            localStorage.setItem('histoQuizState', JSON.stringify(configState));
        }
    }
    
    // Hàm khôi phục trạng thái từ localStorage
    function initializeFromLocalStorage() {
        const savedState = localStorage.getItem('histoQuizState');
        
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Kiểm tra nếu trạng thái được lưu trong vòng 2 giờ
            const twoHoursInMs = 2 * 60 * 60 * 1000;
            const isStateValid = (new Date().getTime() - state.lastUpdated) < twoHoursInMs;
            
            if (isStateValid) {
                // Hiển thị thông báo xác nhận để tiếp tục phiên trước
                if (state.screen !== 'config' && state.currentQuestions && state.currentQuestions.length > 0) {
                    const minutesAgo = Math.floor((new Date().getTime() - state.lastUpdated) / 60000);
                    const minutesLeft = Math.floor(state.timeLeft / 60);
                    const secondsLeft = state.timeLeft % 60;
                    
                    customConfirm(
                        `<div class="text-center">
                            <div class="mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-blue-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <p class="text-lg font-medium">Phát hiện bài làm trước đó</p>
                            </div>
                            <div class="bg-blue-50 p-3 rounded-lg mb-3 text-left">
                                <p class="mb-1"><span class="font-semibold">Thời gian:</span> ${minutesAgo} phút trước</p>
                                <p class="mb-1"><span class="font-semibold">Tiến độ:</span> Câu ${state.currentQuestionIndex + 1}/${state.currentQuestions.length}</p>
                                <p><span class="font-semibold">Thời gian còn lại:</span> ${minutesLeft}:${String(secondsLeft).padStart(2, '0')}</p>
                            </div>
                            <p>Bạn có muốn tiếp tục làm bài không?</p>
                        </div>`,
                        function() {
                            // Khôi phục trạng thái
                            restoreState(state);
                        },
                        function() {
                            // Xóa trạng thái cũ
                            clearQuizState();
                        }
                    );
                    return;
                }
                
                // Khôi phục trạng thái màn hình cấu hình
                if (state.screen === 'config') {
                    currentTopic = state.currentTopic;
                    isRandomMode = state.isRandomMode;
                    
                    // Hiển thị màn hình cấu hình
                    $('#topic-selection').hide();
                    $('#quiz-config').show();
                    
                    // Chọn các radio button tương ứng
                    $(`input[name="question-count"][value="${state.questionCount}"]`).prop('checked', true).trigger('change');
                    $(`input[name="time-limit"][value="${state.timeLimit}"]`).prop('checked', true).trigger('change');
                    $(`input[name="difficulty"][value="${state.difficulty}"]`).prop('checked', true).trigger('change');
                    
                    return;
                }
                
                // Hàm khôi phục trạng thái
                restoreState(state);
            } else {
                // Trạng thái quá cũ, xóa đi
                clearQuizState();
            }
        }
    }
    
    // Hàm khôi phục trạng thái
    function restoreState(state) {
        // Khôi phục trạng thái đang làm quiz
        currentTopic = state.currentTopic;
        isRandomMode = state.isRandomMode;
        currentQuestions = state.currentQuestions;
        currentQuestionIndex = state.currentQuestionIndex;
        score = state.score;
        timeLeft = state.timeLeft;
        userAnswers = state.userAnswers;
        initialTimeLimit = state.initialTimeLimit;
        
        // Chọn các radio button tương ứng
        $(`input[name="question-count"][value="${state.questionCount}"]`).prop('checked', true).trigger('change');
        $(`input[name="time-limit"][value="${state.timeLimit}"]`).prop('checked', true).trigger('change');
        $(`input[name="difficulty"][value="${state.difficulty}"]`).prop('checked', true).trigger('change');
        
        // Hiển thị màn hình quiz và bắt đầu lại
        $('#topic-selection').hide();
        $('#quiz-config').hide();
        $('#quiz-section').show();
        $('#total-questions').text(currentQuestions.length);
        
        displayQuestion();
        startTimer();
        
        // Hiển thị câu trả lời đã chọn trước đó (nếu có)
        const currentAnswer = userAnswers.find(a => a.questionIndex === currentQuestionIndex);
        if (currentAnswer) {
            $('.answer-option').eq(currentAnswer.userAnswer).removeClass('bg-white').addClass('bg-blue-200 scale-105');
        }
        
        // Hiển thị thông báo nhanh
        showQuickToast('Đã khôi phục bài làm của bạn!', 'success', 3000);
    }
    
    // Hàm xóa trạng thái quiz khỏi localStorage
    function clearQuizState() {
        localStorage.removeItem('histoQuizState');
    }

    // Hàm lưu và tải cache câu hỏi
    function initializeQuestionCache() {
        const cachedData = localStorage.getItem('histoQuiz_questionCache');
        if (cachedData) {
            try {
                questionCache = JSON.parse(cachedData);
                console.log('Đã tải cache câu hỏi từ localStorage');
            } catch (error) {
                console.error('Lỗi khi đọc cache câu hỏi:', error);
                questionCache = {};
            }
        }
    }

    function saveQuestionCache() {
        try {
            localStorage.setItem('histoQuiz_questionCache', JSON.stringify(questionCache));
            console.log('Đã lưu cache câu hỏi vào localStorage');
        } catch (error) {
            console.error('Lỗi khi lưu cache câu hỏi:', error);
            // Nếu lưu thất bại (quá giới hạn localStorage), xóa cache cũ
            clearQuestionCache();
        }
    }

    function clearQuestionCache() {
        questionCache = {};
        localStorage.removeItem('histoQuiz_questionCache');
        console.log('Đã xóa cache câu hỏi');
    }

    // Xử lý sự kiện khi người dùng quay lại trang chọn chủ đề
    document.addEventListener('DOMContentLoaded', function() {
        // Tự động xóa cache khi người dùng quay lại trang chủ
        if (window.location.hash === '' || window.location.hash === '#') {
            clearQuestionCache();
            localStorage.removeItem('histoQuiz_state');
        }
    });
}); 