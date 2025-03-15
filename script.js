document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const slideContainer = document.getElementById('slide-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const scoreElement = document.getElementById('score');
    const restartBtn = document.getElementById('restart-btn');
    const quizContainer = document.getElementById('quiz-container');

    // Quiz state
    let currentSlide = 0;
    const totalSlides = 12; // 12 slides in total (1-12)
    const userAnswers = Array(9).fill(null); // 9 questions (slides 3-11)
    
    // Correct answers (from Facit.png)
    const correctAnswers = [
        4, // Question 1 (Slide 3)
        3, // Question 2 (Slide 4)
        5, // Question 3 (Slide 5)
        3, // Question 4 (Slide 6)
        5, // Question 5 (Slide 7)
        4, // Question 6 (Slide 8)
        3, // Question 7 (Slide 9)
        4, // Question 8 (Slide 10)
        2  // Question 9 (Slide 11)
    ];

    // Answer options text (based on the images)
    const answerOptionsText = {
        // Slide 3 (Question 1) - How many people choose pasta salad?
        3: [
            "34 personer",
            "16 personer",
            "7 personer",
            "53 personer",
            "56 personer"
        ],
        // Slide 4 (Question 2) - Best approximation for 13 divided by 4.32
        4: [
            "0,03",
            "0,3",
            "3",
            "30",
            "300"
        ],
        // Slide 5 (Question 3) - Percentage change in price per kg
        5: [
            "13%",
            "23%",
            "45%",
            "18%",
            "33%"
        ],
        // Slide 6 (Question 4) - Replace numbers with words
        6: [
            "celebrated",
            "stopped",
            "divided",
            "imagined",
            "painted"
        ],
        // Slide 7 (Question 5) - Where is chemical energy stored in photosynthesis?
        7: [
            "Vattnet",
            "Syret",
            "Koldioxiden",
            "Solljuset",
            "Druvsockret"
        ],
        // Slide 8 (Question 6) - Matching celestial objects with distances
        8: [
            "1. Solen - A. Cirka 8 ljusminuter från jorden",
            "2. Andromedagalaxen - B. Cirka 30 000 ljusår från jorden",
            "3. Vintergatans centrum - C. Cirka 2 000 000 ljusår från jorden",
            "",
            ""
        ],
        // Slide 9 (Question 7) - Biggest difference between Judaism and Christianity
        9: [
            "Att judar menar att Mose var Guds son",
            "Att Paulus bara är en viktig person inom judendomen",
            "Att judar inte tror att Jesus var Guds son",
            "Att Abraham bara är en viktig person inom judendom",
            "Att kristendomen är mycket äldre"
        ],
        // Slide 10 (Question 8) - Where is the Atacama Desert located?
        10: [
            "Himalaya",
            "Kaukasus",
            "Atlasbergen",
            "Anderna",
            "Balkanbergen"
        ],
        // Slide 11 (Question 9) - Which statement about the EU is correct?
        11: [
            "Om du ska sälja en vara inom EU måste du betala tull.",
            "Det kan fattas beslut inom EU som Sverige måste följa utan att den svenska riksdagen först godkänner förslaget.",
            "Vart femte år har alla röstberättigade inom EU möjlighet att välja representanter till Europaparlamentet.",
            "EU-samarbetet innebär att det är lättare att handla mellan medlemsländerna.",
            "EU-samarbetet berör enbart frågor som handlar om handel."
        ]
    };

    // Position settings for answer options based on slide number
    const optionsPositions = {
        3: { top: 0.75, height: 0.20 },
        4: { top: 0.75, height: 0.20 },
        5: { top: 0.75, height: 0.20 },
        6: { top: 0.75, height: 0.20 },
        7: { top: 0.75, height: 0.20 },
        8: { top: 0.75, height: 0.20 },
        9: { top: 0.75, height: 0.20 },
        10: { top: 0.75, height: 0.20 },
        11: { top: 0.75, height: 0.20 }
    };

    // Initialize the quiz
    function initQuiz() {
        loadSlides();
        updateNavButtons();
        
        // Add swipe instruction
        addSwipeInstruction();
        
        // Event listeners
        prevBtn.addEventListener('click', goToPrevSlide);
        nextBtn.addEventListener('click', goToNextSlide);
        submitBtn.addEventListener('click', submitQuiz);
        restartBtn.addEventListener('click', restartQuiz);
        
        // Add touch event listeners for swipe functionality
        let touchStartX = 0;
        let touchEndX = 0;
        
        quizContainer.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        quizContainer.addEventListener('touchmove', function(e) {
            // Check if horizontal swipe is happening
            const touchMoveX = e.changedTouches[0].screenX;
            const xDiff = touchMoveX - touchStartX;
            
            // If it's a significant horizontal swipe, prevent default scrolling
            if (Math.abs(xDiff) > 10) {
                e.preventDefault();
            }
        }, { passive: false });
        
        quizContainer.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        
        // Add mouse events for desktop swipe-like functionality
        let mouseStartX = 0;
        let mouseEndX = 0;
        let isMouseDown = false;
        
        quizContainer.addEventListener('mousedown', function(e) {
            isMouseDown = true;
            mouseStartX = e.clientX;
        }, false);
        
        quizContainer.addEventListener('mousemove', function(e) {
            if (!isMouseDown) return;
            mouseEndX = e.clientX;
        }, false);
        
        quizContainer.addEventListener('mouseup', function(e) {
            if (!isMouseDown) return;
            mouseEndX = e.clientX;
            isMouseDown = false;
            handleMouseSwipe();
        }, false);
        
        quizContainer.addEventListener('mouseleave', function(e) {
            if (!isMouseDown) return;
            mouseEndX = e.clientX;
            isMouseDown = false;
            handleMouseSwipe();
        }, false);
        
        // Add keyboard navigation for accessibility
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                goToPrevSlide();
            } else if (e.key === 'ArrowRight') {
                goToNextSlide();
            }
        });
        
        // Handle mouse swipe gesture
        function handleMouseSwipe() {
            const swipeThreshold = 100; // Slightly higher threshold for mouse
            
            if (mouseEndX < mouseStartX - swipeThreshold) {
                // Swipe left - go to next slide
                goToNextSlide();
            }
            
            if (mouseEndX > mouseStartX + swipeThreshold) {
                // Swipe right - go to previous slide
                goToPrevSlide();
            }
        }
        
        // Handle swipe gesture
        function handleSwipe() {
            const swipeThreshold = 50; // Minimum distance required for a swipe
            
            if (touchEndX < touchStartX - swipeThreshold) {
                // Swipe left - go to next slide
                goToNextSlide();
            }
            
            if (touchEndX > touchStartX + swipeThreshold) {
                // Swipe right - go to previous slide
                goToPrevSlide();
            }
        }
        
        // Handle window resize to adjust answer options positioning
        window.addEventListener('resize', adjustOptionsPositions);
        
        // Handle zoom events by listening for user input that might trigger zoom
        window.addEventListener('wheel', function(e) {
            if (e.ctrlKey) { // Ctrl+wheel is often used for zooming
                setTimeout(adjustOptionsPositions, 100);
            }
        });
        
        // Also listen for keyboard zoom shortcuts
        window.addEventListener('keydown', function(e) {
            if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0')) {
                setTimeout(adjustOptionsPositions, 100);
            }
        });
        
        // Ensure options are positioned correctly after all images load
        window.addEventListener('load', function() {
            setTimeout(adjustOptionsPositions, 100);
        });
        
        // Also try to position immediately and after a short delay
        adjustOptionsPositions();
        setTimeout(adjustOptionsPositions, 50);
        setTimeout(adjustOptionsPositions, 200);
    }
    
    // Add a visual instruction to help users understand they can swipe
    function addSwipeInstruction() {
        const instruction = document.createElement('div');
        instruction.className = 'swipe-instruction';
        instruction.innerHTML = 'Svep <span>←</span> eller <span>→</span> för att navigera';
        
        // Add the instruction to the quiz container
        quizContainer.appendChild(instruction);
        
        // Hide the instruction after 5 seconds
        setTimeout(() => {
            instruction.classList.add('fade-out');
            setTimeout(() => {
                instruction.remove();
            }, 1000);
        }, 5000);
    }
    
    // Adjust positions of all answer options
    function adjustOptionsPositions() {
        // For better performance, only adjust the current slide if it's a question slide
        if (currentSlide + 1 >= 3 && currentSlide + 1 <= 11) {
            const currentSlideIndex = currentSlide + 1;
            const slide = document.querySelector(`.slide[data-slide-index="${currentSlideIndex}"]`);
            
            if (slide) {
                const img = slide.querySelector('img');
                const answerOptions = slide.querySelector('.answer-options');
                
                if (img && answerOptions && img.complete) {
                    const imgHeight = img.clientHeight;
                    const position = optionsPositions[currentSlideIndex];
                    
                    // Position the top of the options container
                    answerOptions.style.top = `${imgHeight * position.top}px`;
                    
                    // Calculate the bottom position of the blue line (approximately 95% from the top)
                    const blueLinePosition = imgHeight * 0.95;
                    
                    // Calculate the maximum height to ensure options don't go below the blue line
                    const maxHeight = blueLinePosition - (imgHeight * position.top) - 5; // 5px buffer
                    
                    // Set the height, ensuring it doesn't exceed the calculated maximum
                    answerOptions.style.height = `${Math.min(imgHeight * position.height, maxHeight)}px`;
                }
            }
        }
    }

    // Load all slides
    function loadSlides() {
        slideContainer.innerHTML = '';
        
        for (let i = 1; i <= totalSlides; i++) {
            const slide = document.createElement('div');
            slide.className = `slide ${i === currentSlide + 1 ? 'active' : ''}`;
            slide.dataset.slideIndex = i;
            
            // Create slide content
            const img = document.createElement('img');
            img.src = `Visningsslides/${i}.png`;
            img.alt = `Slide ${i}`;
            
            // Make the last slide's image clickable and redirect to Läxhjälpen website
            if (i === totalSlides) {
                img.style.cursor = 'pointer';
                img.title = 'Klicka för att besöka Läxhjälpen';
                img.addEventListener('click', function() {
                    window.open('https://laxhjalpen.se/bli-laxhjalpare/', '_blank');
                });
            }
            
            slide.appendChild(img);
            
            // Add answer options for question slides (3-11)
            if (i >= 3 && i <= 11) {
                const questionIndex = i - 3;
                
                // For slides with answer options, add the options container
                const answerOptions = document.createElement('div');
                answerOptions.className = 'answer-options';
                
                // Position the answer options at the bottom part of the image
                // This will be adjusted when the image loads
                img.onload = function() {
                    const imgHeight = img.clientHeight;
                    const position = optionsPositions[i];
                    
                    // Position the top of the options container
                    answerOptions.style.top = `${imgHeight * position.top}px`;
                    
                    // Calculate the bottom position of the blue line (approximately 95% from the top)
                    const blueLinePosition = imgHeight * 0.95;
                    
                    // Calculate the maximum height to ensure options don't go below the blue line
                    const maxHeight = blueLinePosition - (imgHeight * position.top) - 5; // 5px buffer
                    
                    // Set the height, ensuring it doesn't exceed the calculated maximum
                    answerOptions.style.height = `${Math.min(imgHeight * position.height, maxHeight)}px`;
                };
                
                // Also try to position immediately if the image is already loaded from cache
                if (img.complete) {
                    const imgHeight = img.clientHeight;
                    if (imgHeight > 0) {
                        const position = optionsPositions[i];
                        answerOptions.style.top = `${imgHeight * position.top}px`;
                        const blueLinePosition = imgHeight * 0.95;
                        const maxHeight = blueLinePosition - (imgHeight * position.top) - 5;
                        answerOptions.style.height = `${Math.min(imgHeight * position.height, maxHeight)}px`;
                    }
                }
                
                // Special case for slide 8 (question 6) which has a different format
                if (i === 8) {
                    // Create a special instruction for this question
                    const instruction = document.createElement('div');
                    instruction.className = 'instruction';
                    instruction.textContent = 'Kombinera ihop vart och ett av alternativen 1-3, med avstånden A-C från jorden.';
                    answerOptions.appendChild(instruction);
                    
                    // Create option elements for slide 8
                    const options = [
                        { value: 1, text: "1-A, 2-B, 3-C" },
                        { value: 2, text: "1-B, 2-C, 3-A" },
                        { value: 3, text: "1-C, 2-A, 3-B" },
                        { value: 4, text: "1-B, 2-A, 3-C" },
                        { value: 5, text: "1-A, 2-C, 3-B" }
                    ];
                    
                    options.forEach(opt => {
                        const option = document.createElement('div');
                        option.className = `option ${userAnswers[questionIndex] === opt.value ? 'selected' : ''}`;
                        option.dataset.value = opt.value;
                        option.textContent = `${opt.value}. ${opt.text}`;
                        
                        // Add click event to select answer
                        option.addEventListener('click', function() {
                            selectAnswer(questionIndex, opt.value);
                        });
                        
                        answerOptions.appendChild(option);
                    });
                } else {
                    // Create option elements for other slides
                    for (let j = 1; j <= 5; j++) {
                        const option = document.createElement('div');
                        option.className = `option ${userAnswers[questionIndex] === j ? 'selected' : ''}`;
                        option.dataset.value = j;
                        option.textContent = `${j}. ${answerOptionsText[i][j-1]}`;
                        
                        // Add click event to select answer
                        option.addEventListener('click', function() {
                            selectAnswer(questionIndex, j);
                        });
                        
                        answerOptions.appendChild(option);
                    }
                }
                
                slide.appendChild(answerOptions);
            }
            
            slideContainer.appendChild(slide);
        }
    }

    // Select an answer
    function selectAnswer(questionIndex, value) {
        userAnswers[questionIndex] = value;
        
        // Update UI to show selected option
        const options = document.querySelectorAll(`.slide[data-slide-index="${questionIndex + 3}"] .option`);
        options.forEach(option => {
            option.classList.remove('selected');
            if (parseInt(option.dataset.value) === value) {
                option.classList.add('selected');
            }
        });
    }

    // Go to previous slide
    function goToPrevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlide();
            updateNavButtons();
        }
    }

    // Go to next slide
    function goToNextSlide() {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateSlide();
            updateNavButtons();
        }
    }

    // Update the visible slide
    function updateSlide() {
        const slides = document.querySelectorAll('.slide');
        slides.forEach(slide => {
            slide.classList.remove('active');
            if (parseInt(slide.dataset.slideIndex) === currentSlide + 1) {
                slide.classList.add('active');
            }
        });
        
        // Update swipe indicators based on current slide
        updateSwipeIndicators();
        
        // Adjust the position of answer options for the current slide
        setTimeout(adjustOptionsPositions, 10);
    }
    
    // Update swipe indicators based on current slide
    function updateSwipeIndicators() {
        const slideContainer = document.getElementById('slide-container');
        
        // Remove any existing indicators
        const existingLeftIndicator = document.querySelector('.swipe-indicator-left');
        const existingRightIndicator = document.querySelector('.swipe-indicator-right');
        
        if (existingLeftIndicator) existingLeftIndicator.remove();
        if (existingRightIndicator) existingRightIndicator.remove();
        
        // Create new indicators
        if (currentSlide > 0) {
            const leftIndicator = document.createElement('div');
            leftIndicator.className = 'swipe-indicator swipe-indicator-left';
            leftIndicator.innerHTML = '←';
            slideContainer.appendChild(leftIndicator);
        }
        
        if (currentSlide < totalSlides - 1) {
            const rightIndicator = document.createElement('div');
            rightIndicator.className = 'swipe-indicator swipe-indicator-right';
            rightIndicator.innerHTML = '→';
            slideContainer.appendChild(rightIndicator);
        }
    }

    // Update navigation buttons based on current slide
    function updateNavButtons() {
        // Hide all navigation buttons since we're using swipe gestures
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        
        // First slide
        if (currentSlide === 0) {
            submitBtn.style.display = 'none';
            scoreElement.style.display = 'none';
            restartBtn.style.display = 'none';
        }
        // Second-to-last slide (slide 11): show "Submit" button
        else if (currentSlide === totalSlides - 2) {
            submitBtn.style.display = 'block';
            scoreElement.style.display = 'none';
            restartBtn.style.display = 'none';
        }
        // Last slide: show score and "Testa igen" button
        else if (currentSlide === totalSlides - 1) {
            submitBtn.style.display = 'none';
            restartBtn.style.display = 'block'; // Show "Testa igen" button
            
            // If user has submitted, show score
            if (scoreElement.textContent) {
                scoreElement.style.display = 'block';
            } else {
                scoreElement.style.display = 'none';
            }
        } 
        // Middle slides
        else {
            submitBtn.style.display = 'none';
            scoreElement.style.display = 'none';
            restartBtn.style.display = 'none';
        }
    }

    // Submit the quiz and show results
    function submitQuiz() {
        let score = 0;
        
        // Calculate score
        for (let i = 0; i < userAnswers.length; i++) {
            if (userAnswers[i] === correctAnswers[i]) {
                score++;
            }
        }
        
        // Display results
        scoreElement.textContent = `Du fick ${score} av ${userAnswers.length} rätt!`;
        
        // Go to the last slide to show results
        currentSlide = totalSlides - 1;
        updateSlide();
        updateNavButtons();
    }

    // Restart the quiz
    function restartQuiz() {
        currentSlide = 0;
        userAnswers.fill(null);
        scoreElement.textContent = '';
        scoreElement.style.display = 'none';
        loadSlides();
        updateSlide();
        updateNavButtons();
    }

    // Start the quiz
    initQuiz();
}); 