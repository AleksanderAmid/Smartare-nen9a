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
    const userAnswers = Array(9).fill(null).map(() => []); // 9 questions (slides 3-11), now storing arrays for multiple answers
    
    // Touch tracking variables for swipe detection
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Mouse tracking variables for swipe detection
    let mouseStartX = 0;
    let mouseEndX = 0;
    let isMouseDown = false;
    
    // Correct answers (from Facit.png)
    const correctAnswers = [
        [1], // Question 1 (Slide 3)
        [3], // Question 2 (Slide 4)
        [4], // Question 3 (Slide 5)
        [1, 4], // Question 4 (Slide 6) - Multiple answers
        [4], // Question 5 (Slide 7)
        [2], // Question 6 (Slide 8)
        [3], // Question 7 (Slide 9)
        [4], // Question 8 (Slide 10)
        [2, 4]  // Question 9 (Slide 11) - Multiple answers
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
            "taste",
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
        
        // Event listeners
        prevBtn.addEventListener('click', goToPrevSlide);
        nextBtn.addEventListener('click', goToNextSlide);
        submitBtn.addEventListener('click', submitQuiz);
        restartBtn.addEventListener('click', restartQuiz);
        
        // Add touch event listeners for swipe functionality
        slideContainer.addEventListener('touchstart', handleTouchStart, false);
        slideContainer.addEventListener('touchend', handleTouchEnd, false);
        
        // Add mouse event listeners for swipe-like functionality on desktop
        slideContainer.addEventListener('mousedown', handleMouseDown, false);
        slideContainer.addEventListener('mouseup', handleMouseUp, false);
        slideContainer.addEventListener('mouseleave', handleMouseLeave, false);
        
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
                    
                    // Check if the answer options container has overflow and apply the class if needed
                    checkForOverflow(answerOptions);
                }
            }
        }
    }
    
    // Check if the answer options container has overflow and apply the has-overflow class
    function checkForOverflow(container) {
        if (container.scrollHeight > container.clientHeight) {
            container.classList.add('has-overflow');
            
            // Add a scroll indicator animation
            showScrollIndicator(container);
            
            // Show the scroll indicator
            const slide = container.closest('.slide');
            const scrollIndicator = slide.querySelector('.scroll-indicator');
            if (scrollIndicator) {
                scrollIndicator.style.display = 'flex';
            }
        } else {
            container.classList.remove('has-overflow');
            
            // Hide the scroll indicator
            const slide = container.closest('.slide');
            const scrollIndicator = slide.querySelector('.scroll-indicator');
            if (scrollIndicator) {
                scrollIndicator.style.display = 'none';
            }
        }
        
        // Also listen for scroll events to hide the indicator when user has scrolled
        container.addEventListener('scroll', function() {
            if (container.scrollTop > 10) { // If user has scrolled a bit
                const slide = container.closest('.slide');
                const scrollIndicator = slide.querySelector('.scroll-indicator');
                if (scrollIndicator) {
                    // Fade out the indicator
                    scrollIndicator.style.opacity = '0';
                }
            }
        }, { once: true }); // Only trigger once
    }
    
    // Show a subtle scroll animation to indicate scrolling is possible
    function showScrollIndicator(container) {
        // Only show the indicator if the container is visible (active slide)
        if (!container.closest('.slide').classList.contains('active')) return;
        
        // Add a gentle scroll animation to hint that there's more content
        const currentScroll = container.scrollTop;
        
        // If already scrolled, don't animate
        if (currentScroll > 0) return;
        
        // Gently scroll down a bit and back to show there's more content
        setTimeout(() => {
            container.scrollTo({
                top: 15,
                behavior: 'smooth'
            });
            
            setTimeout(() => {
                container.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }, 800);
        }, 500);
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
                
                // Add a scroll indicator element
                const scrollIndicator = document.createElement('div');
                scrollIndicator.className = 'scroll-indicator';
                scrollIndicator.innerHTML = '<div class="arrow"></div><span>Scrolla för fler alternativ</span>';
                
                // Position the scroll indicator at the bottom of the container
                slide.appendChild(scrollIndicator);
                
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
                        option.className = `option ${userAnswers[questionIndex].includes(opt.value) ? 'selected' : ''}`;
                        option.dataset.value = opt.value;
                        option.textContent = `${opt.value}. ${opt.text}`;
                        
                        // Add click event to select answer
                        option.addEventListener('click', function() {
                            selectAnswer(questionIndex, opt.value);
                        });
                        
                        answerOptions.appendChild(option);
                    });
                } else {
                    // Add instruction for multiple selection questions
                    if (i === 6 || i === 11) {
                        const instruction = document.createElement('div');
                        instruction.className = 'instruction';
                        instruction.textContent = 'Välj alla korrekta alternativ (flera svar kan vara rätt).';
                        answerOptions.appendChild(instruction);
                    }
                    
                    // Create option elements for other slides
                    for (let j = 1; j <= 5; j++) {
                        const option = document.createElement('div');
                        option.className = `option ${userAnswers[questionIndex].includes(j) ? 'selected' : ''}`;
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
        // For questions 4 and 9 (indices 3 and 8), allow multiple selections
        if (questionIndex === 3 || questionIndex === 8) {
            // If the value is already selected, remove it
            const valueIndex = userAnswers[questionIndex].indexOf(value);
            if (valueIndex !== -1) {
                userAnswers[questionIndex].splice(valueIndex, 1);
            } else {
                // Otherwise add it
                userAnswers[questionIndex].push(value);
            }
        } else {
            // For other questions, just set the single answer
            userAnswers[questionIndex] = [value];
        }
        
        // Update UI to show selected options
        const options = document.querySelectorAll(`.slide[data-slide-index="${questionIndex + 3}"] .option`);
        options.forEach(option => {
            const optionValue = parseInt(option.dataset.value);
            if (questionIndex === 3 || questionIndex === 8) {
                // For multiple selection questions, toggle the selected class
                if (userAnswers[questionIndex].includes(optionValue)) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            } else {
                // For single selection questions
                option.classList.remove('selected');
                if (userAnswers[questionIndex].includes(optionValue)) {
                    option.classList.add('selected');
                }
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
                
                // Check for overflow on the current slide's answer options
                const answerOptions = slide.querySelector('.answer-options');
                if (answerOptions) {
                    setTimeout(() => checkForOverflow(answerOptions), 100);
                }
            }
        });
        
        // Adjust the position of answer options for the current slide
        setTimeout(adjustOptionsPositions, 10);
    }

    // Update navigation buttons based on current slide
    function updateNavButtons() {
        // Hide all navigation buttons (we'll use swipe instead)
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        
        // First slide
        if (currentSlide === 0) {
            submitBtn.style.display = 'none';
            scoreElement.style.display = 'none';
            restartBtn.style.display = 'none';
        } 
        // Second-to-last slide (slide 11)
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
            // For questions with multiple answers (4 and 9)
            if (i === 3 || i === 8) {
                // Check if arrays have the same elements (regardless of order)
                const userSet = new Set(userAnswers[i]);
                const correctSet = new Set(correctAnswers[i]);
                
                // Check if user selected all correct answers and no incorrect ones
                if (userSet.size === correctSet.size && 
                    correctAnswers[i].every(answer => userSet.has(answer))) {
                    score++;
                }
            } else {
                // For questions with single answers
                if (userAnswers[i].length === 1 && userAnswers[i][0] === correctAnswers[i][0]) {
                    score++;
                }
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
        // Reset user answers to empty arrays
        for (let i = 0; i < userAnswers.length; i++) {
            userAnswers[i] = [];
        }
        scoreElement.textContent = '';
        scoreElement.style.display = 'none';
        loadSlides();
        updateSlide();
        updateNavButtons();
    }

    // Handle touch start event
    function handleTouchStart(event) {
        touchStartX = event.touches[0].clientX;
    }
    
    // Handle touch end event
    function handleTouchEnd(event) {
        touchEndX = event.changedTouches[0].clientX;
        handleSwipe(touchEndX - touchStartX);
    }
    
    // Handle mouse down event
    function handleMouseDown(event) {
        isMouseDown = true;
        mouseStartX = event.clientX;
        slideContainer.classList.add('grabbing'); // Add grabbing cursor
    }
    
    // Handle mouse up event
    function handleMouseUp(event) {
        if (isMouseDown) {
            mouseEndX = event.clientX;
            handleSwipe(mouseEndX - mouseStartX);
            isMouseDown = false;
            slideContainer.classList.remove('grabbing'); // Remove grabbing cursor
        }
    }
    
    // Handle mouse leave event (when cursor leaves the container)
    function handleMouseLeave(event) {
        if (isMouseDown) {
            mouseEndX = event.clientX;
            handleSwipe(mouseEndX - mouseStartX);
            isMouseDown = false;
            slideContainer.classList.remove('grabbing'); // Remove grabbing cursor
        }
    }
    
    // Process swipe gesture
    function handleSwipe(swipeDistance) {
        const swipeThreshold = 50; // Minimum distance required for a swipe
        
        if (swipeDistance > swipeThreshold) {
            // Swipe right - go to previous slide
            goToPrevSlide();
        } else if (swipeDistance < -swipeThreshold) {
            // Swipe left - go to next slide or submit if on second-to-last slide
            if (currentSlide === totalSlides - 2) {
                submitQuiz();
            } else {
                goToNextSlide();
            }
        }
    }

    // Start the quiz
    initQuiz();
    
    // Show swipe notification on first slide change
    let hasShownSwipeNotification = false;
    
    function showSwipeNotification() {
        if (!hasShownSwipeNotification) {
            hasShownSwipeNotification = true;
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'swipe-notification';
            notification.textContent = 'Svep åt höger eller vänster för att navigera mellan sidor';
            document.body.appendChild(notification);
            
            // Show notification with animation
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            // Hide and remove notification after 5 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 500);
            }, 5000);
        }
    }
    
    // Update the goToNextSlide and goToPrevSlide functions to show notification
    const originalGoToNextSlide = goToNextSlide;
    goToNextSlide = function() {
        originalGoToNextSlide();
        showSwipeNotification();
    };
    
    const originalGoToPrevSlide = goToPrevSlide;
    goToPrevSlide = function() {
        originalGoToPrevSlide();
        showSwipeNotification();
    };
    
    // Show notification when quiz starts (after a short delay)
    setTimeout(showSwipeNotification, 1000);
}); 