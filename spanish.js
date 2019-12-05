const FetchCtrlEs = (function () {


    // Public Methods
    return {
        fetchDico: async function () {
                let response = await fetch('wiktionary-json/es.dict.v0.json');

                let responseData = await response.json();

                return responseData;
            }, // END OF fetchDico

    } // END OF return
})(); // END OF FetchCtrl()




// ItemCtrl ************************************************************************************************
const ItemCtrlEs = (function () {

    //    let dictionaryData;


    // Public Methods
    return {
        start: function (data) {

            // Shovel the Array
            data.sort(function (a, b) {
                return 0.5 - Math.random();
            });

            return {
                data
            }

        }, // END OF start

        starter: function () {
            // Set Default Phonetic Sound Type To IPA If No Sound In Storage
            let phoneticsSoundType = localStorage.getItem('Phonetics Sound(es)');

            if (phoneticsSoundType === null || phoneticsSoundType === '') {
                localStorage.setItem('Phonetics Sound(es)', 'IPA')
            }

            // Set Display / App Based On Phonetics Sound
            if (localStorage.getItem('Phonetics Sound(es)') === 'IPA') {
                AppCtrlEs.IPASoundInit()
            } else {
                AppCtrlEs.xSampaSoundInit();
            }

            // Load Current Attempted Questions Back To UI If Any
            if (localStorage.getItem('Current Attempted Questions(es)')) {
                let displayCurrentAttemptedQuestions = JSON.parse(localStorage.getItem('Current Attempted Questions(es)'));

                displayCurrentAttemptedQuestions.forEach(function (current) {

                    // Display Current Questions In UI (Right Side)
                    // currentAttemptedPhonics currentAttemptedWord currentClassName
                    let liElement = document.createElement('li');
                    liElement.className = 'list-group-item d-flex justify-content-between align-items-center';
                    let liText = current.currentAttemptedPhonics;

                    // Append liText To liElement
                    liElement.textContent = liText;

                    let spanElement = document.createElement('span');
                    //                    spanElement.className = 'badge badge-primary badge-pill';


                    let spanText = current.currentAttemptedWord;

                    // Create A Button To Link Words To Wiktionary For Defination/Meaning
                    let btnLink = document.createElement('a');
                    btnLink.setAttribute('target', '_blank');

                    let btnLinkSpan = current.currentAttemptedWord;
                    btnLinkSpan.toLowerCase();

                    btnLink.setAttribute('href', `https://en.wiktionary.org/wiki/${btnLinkSpan}`);
                    let className = current.currentClassName;

                    if (className === 'bg-warning') {
                        spanElement.className = `badge badge-pill text-dark ${className}`;
                        btnLink.className = 'btn btn-sm text-dark';
                        btnLink.style.fontWeight = '500';
                    } else {
                        spanElement.className = `badge badge-pill text-white ${className}`;
                        btnLink.className = 'btn btn-sm text-white';
                        btnLink.style.fontWeight = '500';
                    }

                    btnLink.textContent = spanText;

                    //                    console.log('spanText:-', spanText)

                    spanElement.appendChild(btnLink);

                    liElement.appendChild(spanElement);
                    UICtrlEs.getUISelector().currentQuestions.appendChild(liElement);
                }) // END OF forEach
            } // END OF LOAD CURRENT ATTEMPTED QUESTIONS BACK TO UI IF ANY

            /****************************************************************
             ** Delay Current Question Display In UI
             ** Delete From Session Storage On Load
             */
            if (sessionStorage.getItem('Previous Pronunciation(es)') === null && sessionStorage.getItem('Previous Word(es)') === null) {
                return
            } else {
                sessionStorage.removeItem('Previous Pronunciation(es)');
                sessionStorage.removeItem('Previous Word(es)');
            } // **************************************************************

        },

        iterationCounts: function (dataCount) {
            let indexCount = 0;

            return {
                next: function () {
                    return indexCount < dataCount.length ? {
                        value: dataCount[indexCount++],
                        done: false
                    } : {
                        done: true
                    }
                } // END OF next()
            } // END OF return
        }, // END OF iterationCounts()
    } // END OF return
})(); // END OF ItemCtrl()




const UICtrlEs = (function () {

    const UISelectors = {
        ipaBtn: document.getElementById('ipa-btn'),
        xSampaBtn: document.getElementById('x-sampa-btn'),
        hintsBtn: document.getElementById('hints-btn'),
        selectLanguage: document.getElementById('select-language'),
        endPlayBtn: document.getElementById('end-play'),
        winRateBtn: document.getElementById('win-rate-btn'),
        historyBtn: document.getElementById('history-btn'),
        nextBtn: document.getElementById('next-btn'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        lastChanceBtn: document.getElementById('last-chance-btn'),
        soundType: document.getElementById('sound-type'),
        ipaXSampaDictionary: document.getElementById('ipa-x-sampa-dictionary'),
        dictionary: document.getElementById('dictionary'),
        attemptedCount: document.getElementById('attempted-count'),
        vowelSound: document.getElementById('vowel-sound'),
        inputWord: document.getElementById('input-word'),
        currentQuestions: document.getElementById('current-questions'),
        addModalSm: document.getElementById('add-modal-sm'),

    } // END OF UISelectors


    // Public Methods
    return {
        getUISelector: function () {
            return UISelectors;

        } // END OF getUISelectors()

    } // END OF return
})(); // END OF UICtrl()




const AppCtrlEs = (function (fetchCtrlEs, itemCtrlEs, uiCtrlEs) {

    const UISelectors = uiCtrlEs.getUISelector();

    // Event Listeners
    let allEvents = function () {
        /* NOTE:
         ** Next Btn Event Is Located In AppCtrlEs.captureDico()
         */
        UISelectors.ipaBtn.addEventListener('click', IPASound);
        UISelectors.xSampaBtn.addEventListener('click', xSampaSound);
        UISelectors.historyBtn.addEventListener('click', wordsHistory);
    }; // END OF allEvents

    const IPASound = function () {
        // Capture Phonetics Sound Already In Storage
        let phoneticsSoundType = localStorage.getItem('Phonetics Sound(es)');

        let CurrentPronunciation = sessionStorage.getItem('Current Pronunciation(es)');
        let CurrentWord = sessionStorage.getItem('Current Word(es)');
        let EquivalentPronunciation = sessionStorage.getItem('Equivalent Pronunciation(es)');

        localStorage.setItem('Phonetics Sound(es)', 'IPA');

        // Change Btn BG
        UISelectors.ipaBtn.classList.remove('btn-primary')
        UISelectors.ipaBtn.classList.add('btn-secondary')

        UISelectors.xSampaBtn.classList.add('btn-primary');
        UISelectors.xSampaBtn.classList.remove('btn-secondary');

        // Change Text Content
        UISelectors.soundType.textContent = 'IPA';
        UISelectors.ipaXSampaDictionary.textContent = '/dik.θjoˈna.ɾjo/';
        UISelectors.dictionary.textContent = 'Diccionario';

        // Change Pronunciation On Click
        if (phoneticsSoundType === 'IPA') {
            // Retain Current UI Pronunciation Display
            UISelectors.vowelSound.textContent = sessionStorage.getItem('Current Pronunciation(es)');
            //            console.log('Already In IPA')
        } else {
            // Change Current UI Pronunciation Display
            UISelectors.vowelSound.textContent = sessionStorage.getItem('Equivalent Pronunciation(es)');
            //            console.log('Changed To IPA');

            // Change Current & Equivalent State
            sessionStorage.setItem('Current Pronunciation(es)', EquivalentPronunciation)
            sessionStorage.setItem('Equivalent Pronunciation(es)', CurrentPronunciation)
        }
    } // END OF IPASound()

    const xSampaSound = function () {
        // Capture Phonetics Sound Already In Storage
        let phoneticsSoundType = localStorage.getItem('Phonetics Sound(es)');

        let CurrentPronunciation = sessionStorage.getItem('Current Pronunciation(es)');
        let CurrentWord = sessionStorage.getItem('Current Word(es)');
        let EquivalentPronunciation = sessionStorage.getItem('Equivalent Pronunciation(es)');

        localStorage.setItem('Phonetics Sound(es)', 'X-SAMPA');

        // Change Btn BG
        UISelectors.xSampaBtn.classList.remove('btn-primary');
        UISelectors.xSampaBtn.classList.add('btn-secondary');

        UISelectors.ipaBtn.classList.add('btn-primary');
        UISelectors.ipaBtn.classList.remove('btn-secondary');

        // Change Text Content
        UISelectors.soundType.textContent = 'X-SAMPA';
        UISelectors.ipaXSampaDictionary.textContent = ''; // Change To XSAMPA (ES)
        UISelectors.dictionary.textContent = 'Diccionario';

        // Change Pronunciation On Click
        if (phoneticsSoundType === 'X-SAMPA') {
            // Retain Current UI Pronunciation Display
            UISelectors.vowelSound.textContent = sessionStorage.getItem('Current Pronunciation(es)');
            //            console.log('Already In X-SAMPA')
        } else {
            // Change Current UI Pronunciation Display
            UISelectors.vowelSound.textContent = sessionStorage.getItem('Equivalent Pronunciation(es)');
            //            console.log('Changed To X-SAMPA');

            // Change Current & Equivalent State
            sessionStorage.setItem('Current Pronunciation(es)', EquivalentPronunciation)
            sessionStorage.setItem('Equivalent Pronunciation(es)', CurrentPronunciation)
        }
    } // END OF xSampaSound()

    const endPlay = function () {

    } // END OF endPlay()

    const winRate = function () {

    } // END OF winRate()

    const wordsHistory = function () {

    } // END OF wordsHistory()


    // Public Methods
    return {
        fetchedDico: function () {
            fetchCtrlEs.fetchDico()
                .then(function (data) {
                    //                console.log(data);

                    itemCtrlEs.starter();

                    let returnedData = itemCtrlEs.start(data);
                    //                    console.log(returnedData);

                    AppCtrlEs.initCapturedDico(returnedData);
                    //                    AppCtrlEs.allEvents(returnedData)
                })
                .catch(function (err) {
                    console.error(err)
                }),

                allEvents()
        },

        IPASoundInit: function () {
            return IPASound()
        },

        xSampaSoundInit: function () {
            return xSampaSound();
        },

        countDownTimer: function (currentWord) {
            //            console.log('currentWord: ', currentWord)
            document.getElementById('correct-answer').innerHTML = `<p>Respuesta correcta: <span style="color: yellow; font-size: 1.4em"> ${currentWord} </span></p>`

            setTimeout(function () {
                // CountDown Timer To Dela Screen For 5Sec
                let timeLeft = 5;
                let downloadTimer = setInterval(function () {
                    document.getElementById('timer').innerHTML = 'Pregunta cambiante en ' + timeLeft + ' Segundo(s)';

                    timeLeft -= 1;

                    if (timeLeft < 0) {
                        clearInterval(downloadTimer);
                        document.getElementById('timer').innerHTML = '';
                        document.getElementById('correct-answer').innerHTML = '';
                    }
                }, 1000) // END OF setInterval
            }, 500) // END OF setTimeout
        }, // END OF countDownnTimer

        resetModalBody: function () {
            document.querySelector('#all-questions').innerHTML = '';

            let initLi = `
<li class="init2-list list-group-item d-flex justify-content-between align-items-center bg-secondary" style="color: white">
<span class="init2-sound">/ Sonido oral /</span>
<span class="init2-word badge badge-dark badge-pill" style="color: darkgoldenrod">Palabra</span>
</li>
`
            document.querySelector('#all-questions').innerHTML = initLi;
        },

        calculatePlayRatio: function (btnClickType) {
            let correctOn1stAttempt, correctOn2ndAttempt, correctOn3rdAttempt, wrongAfter3rdAttempt, totalCurrentAttempt, correctOn1stAttemptRatio, correctOn2ndAttemptRatio, correctOn3rdAttemptRatio, wrongAfter3rdAttemptRatio, totalCurrentPassedAttempt, totalAttempts, totalAttemptsRatio, deductedHintPoint, deductedHintPointRatio;

            if (btnClickType === 'endPlayBtn') {
                // Calculate & Display Current Statistics
                correctOn1stAttempt = Number(localStorage.getItem('Current Correct Word On 1st Attempt(es)'));
                correctOn2ndAttempt = Number(localStorage.getItem('Current Correct Word On 2nd Attempt(es)'));
                correctOn3rdAttempt = Number(localStorage.getItem('Current Correct Word On 3rd Attempt(es)'));
                wrongAfter3rdAttempt = Number(localStorage.getItem('Current Wrong Answer On 3rd Attempt(es)'));

                deductedHintPoint = Number(localStorage.getItem('Deducted Hint Point(es)'));

                totalCurrentAttempt = correctOn1stAttempt + correctOn2ndAttempt + correctOn3rdAttempt + wrongAfter3rdAttempt

                correctOn1stAttemptRatio = ((correctOn1stAttempt / totalCurrentAttempt) * 100).toFixed(2);
                correctOn2ndAttemptRatio = ((correctOn2ndAttempt / totalCurrentAttempt) * 100).toFixed(2);
                correctOn3rdAttemptRatio = ((correctOn3rdAttempt / totalCurrentAttempt) * 100).toFixed(2);
                wrongAfter3rdAttemptRatio = ((wrongAfter3rdAttempt / totalCurrentAttempt) * 100).toFixed(2);

                deductedHintPointRatio = ((deductedHintPoint / totalCurrentAttempt) * 100).toFixed(2);

                totalCurrentPassedAttempt = (((correctOn1stAttempt + correctOn2ndAttempt + correctOn3rdAttempt) / totalCurrentAttempt) * 100).toFixed(2)

                totalAttemptsRatio = Number(Number(correctOn1stAttemptRatio) + Number(correctOn2ndAttemptRatio) + Number(correctOn3rdAttemptRatio) - Number(deductedHintPointRatio)).toFixed(2);

                return {
                    correctOn1stAttempt,
                    correctOn2ndAttempt,
                    correctOn3rdAttempt,
                    wrongAfter3rdAttempt,
                    totalCurrentAttempt,
                    correctOn1stAttemptRatio,
                    correctOn2ndAttemptRatio,
                    correctOn3rdAttemptRatio,
                    wrongAfter3rdAttemptRatio,
                    totalCurrentPassedAttempt,
                    totalAttemptsRatio,
                    deductedHintPoint,
                    deductedHintPointRatio
                }
            } else {
                // Calculate & Display Current Statistics
                correctOn1stAttempt = Number(localStorage.getItem('Correct Word On 1st Attempt(es)'));
                correctOn2ndAttempt = Number(localStorage.getItem('Correct Word On 2nd Attempt(es)'));
                correctOn3rdAttempt = Number(localStorage.getItem('Correct Word On 3rd Attempt(es)'));
                wrongAfter3rdAttempt = Number(localStorage.getItem('Wrong Word(es)'));

                deductedHintPoint = Number(localStorage.getItem('Deducted Hint Point(es)'))

                totalCurrentAttempt = correctOn1stAttempt + correctOn2ndAttempt + correctOn3rdAttempt + wrongAfter3rdAttempt

                correctOn1stAttemptRatio = ((correctOn1stAttempt / totalCurrentAttempt) * 100).toFixed(2);
                correctOn2ndAttemptRatio = ((correctOn2ndAttempt / totalCurrentAttempt) * 100).toFixed(2);
                correctOn3rdAttemptRatio = ((correctOn3rdAttempt / totalCurrentAttempt) * 100).toFixed(2);
                wrongAfter3rdAttemptRatio = ((wrongAfter3rdAttempt / totalCurrentAttempt) * 100).toFixed(2);

                deductedHintPointRatio = ((deductedHintPoint / totalCurrentAttempt) * 100).toFixed(2);

                totalCurrentPassedAttempt = (((correctOn1stAttempt + correctOn2ndAttempt + correctOn3rdAttempt) / totalCurrentAttempt) * 100).toFixed(2);

                totalAttempts = correctOn1stAttempt + correctOn2ndAttempt + correctOn3rdAttempt + wrongAfter3rdAttempt;

                totalAttemptsRatio = Number(Number(correctOn1stAttemptRatio) + Number(correctOn2ndAttemptRatio) + Number(correctOn3rdAttemptRatio) - Number(deductedHintPointRatio)).toFixed(2);

                return {
                    correctOn1stAttempt,
                    correctOn2ndAttempt,
                    correctOn3rdAttempt,
                    wrongAfter3rdAttempt,
                    totalCurrentAttempt,
                    correctOn1stAttemptRatio,
                    correctOn2ndAttemptRatio,
                    correctOn3rdAttemptRatio,
                    wrongAfter3rdAttemptRatio,
                    totalCurrentPassedAttempt,
                    totalAttempts,
                    totalAttemptsRatio,
                    deductedHintPoint,
                    deductedHintPointRatio
                }
            } // END OF IF ELSE
        },

        displayToModal: function (liText, btnFunctionType) {

            // Avoid Error If liText === null
            if (liText !== null) {

                // Create An 'li', Apend A 'span' And Attach Questions
                liText.forEach(function (text) {
                    let liElement = document.createElement('li');
                    liElement.style.fontWeight = 'bold';
                    liElement.style.fontSize = '18px';
                    liElement.className = 'list-group-item d-flex justify-content-between align-items-center';

                    let spanElement = document.createElement('span');
                    spanElement.style.fontWeight = 'bold';
                    spanElement.style.fontSize = '18px'

                    // Create A Button To Link Words To Wiktionary For Defination/Meaning
                    let btnLink = document.createElement('a');
                    btnLink.setAttribute('target', '_blank');

                    let wordToLowerCase;
                    if (btnFunctionType === 'endPlayBtn') {
                        wordToLowerCase = text.currentAttemptedWord.toLowerCase()
                    } else {
                        wordToLowerCase = text.previousWord.toLowerCase();
                    }

                    btnLink.setAttribute('href', `https://es.wiktionary.org/wiki/${wordToLowerCase}`);
                    btnLink.className = 'btn';

                    let textClassName;
                    if (btnFunctionType === 'endPlayBtn') {
                        textClassName = text.currentClassName;
                    } else {
                        textClassName = text.className;
                    }


                    if (text.className === 'bg-warning' || text.currentClassName === 'bg-warning') {
                        spanElement.className = `badge badge-pill text-dark ${textClassName}`;
                    } else {
                        spanElement.className = `badge badge-pill text-white ${textClassName}`;
                    }

                    if (btnFunctionType === 'endPlayBtn') {
                        liElement.textContent += text.currentAttemptedPhonics;
                        spanElement.textContent += text.currentAttemptedWord;
                    } else {
                        liElement.innerHTML += `${text.previousIpa} <br> ${text.previousXSampa}`;
                        spanElement.textContent += text.previousWord;
                    }

                    btnLink.appendChild(spanElement)

                    liElement.appendChild(btnLink);

                    document.querySelector('#all-questions').appendChild(liElement);
                })
            }
        }, // END OF displayToModal()


        capturedDico: function (iteratedData, iteratedDataFile, className) {

            // Reload App If No More Word To Display
            if (iteratedDataFile === undefined) {
                window.location.reload();
            } else {
                // Continue With Current Words
                let phoneticsSoundType = localStorage.getItem('Phonetics Sound(es)');

                // Set Current Pronounciation On Page Load
                if (phoneticsSoundType === 'IPA') {
                    //                console.log('IPA')

                    // Extract Word
                    let iteratedDataFileTitle = iteratedDataFile.title;
//                    console.log(iteratedDataFileTitle)

                    // Extract Pronunciation
                    let iteratedDataFilePronunciationIPA = iteratedDataFile.pronunciation[0].IPA;
                    //                console.log('IPA', iteratedDataFilePronunciationIPA)

                    // Extract IPA Equivalent In X-SAMPA
                    let iteratedDataFilePronunciationXSAMPA = iteratedDataFile.pronunciation[0]["X-SAMPA"];
                    //                console.log('IPA ~ X-SAMPA', iteratedDataFilePronunciationXSAMPA)

                    // Display To UI
                    UISelectors.vowelSound.textContent = iteratedDataFilePronunciationIPA;

                    // Save Current Pronunnciation / Word To Session Storage
                    sessionStorage.setItem('Current Pronunciation(es)', iteratedDataFilePronunciationIPA);
                    sessionStorage.setItem('Current Word(es)', iteratedDataFileTitle);

                    // Save IPA Equivalent Pronunnciation To Session Storage
                    sessionStorage.setItem('Equivalent Pronunciation(es)', iteratedDataFilePronunciationXSAMPA);

                    /*
                     * Delay Current Question Display In UI
                     * Previous Pronounciation Always Removed On Page Load From ItemCtrlEs.start()
                     */
                    if (sessionStorage.getItem('Previous Pronunciation(es)') === null && sessionStorage.getItem('Previous Word(es)') === null) {
                        //                    console.log('Nothing To Display');
                    } else {

                        // Display Current Questions In UI (Right Side)
                        let liElement = document.createElement('li');
                        liElement.className = 'list-group-item d-flex justify-content-between align-items-center';
                        let liText = document.createTextNode(sessionStorage.getItem('Previous Pronunciation(es)'));

                        // Append liText To liElement
                        liElement.appendChild(liText);

                        let spanElement = document.createElement('span');
                        //                    spanElement.className = 'badge badge-primary badge-pill';


                        let spanText = document.createTextNode(sessionStorage.getItem('Previous Word(es)'));

                        // Create A Button To Link Words To Wiktionary For Defination/Meaning
                        let btnLink = document.createElement('a');
                        btnLink.setAttribute('target', '_blank');

                        let btnLinkSpan = sessionStorage.getItem('Previous Word(es)');
                        btnLinkSpan.toLowerCase();

                        btnLink.setAttribute('href', `https://es.wiktionary.org/wiki/${btnLinkSpan}`);

                        if (className === 'bg-warning') {
                            spanElement.className = `badge badge-pill text-dark ${className}`;
                            btnLink.className = 'btn btn-sm text-dark';
                            btnLink.style.fontWeight = '500';
                        } else {
                            spanElement.className = `badge badge-pill text-white ${className}`;
                            btnLink.className = 'btn btn-sm text-white';
                            btnLink.style.fontWeight = '500';
                        }

                        btnLink.appendChild(spanText);

                        //                    console.log('spanText:-', spanText)

                        spanElement.appendChild(btnLink);

                        liElement.appendChild(spanElement)
                        UISelectors.currentQuestions.appendChild(liElement);

                        // Save liText To Session For End Game Modal --------------------------------------------
                        let currentAttemptedPhonics = sessionStorage.getItem('Previous Pronunciation(es)')
                        let currentAttemptedWord = sessionStorage.getItem('Previous Word(es)');
                        let currentClassName = className;

                        let currentAttemptedQuestions;
                        let currentAttemptedPhoniceWord = {
                            currentAttemptedPhonics: currentAttemptedPhonics,
                            currentAttemptedWord: currentAttemptedWord,
                            currentClassName: currentClassName
                        }
                        if (localStorage.getItem('Current Attempted Questions(es)') === null) {
                            currentAttemptedQuestions = [];

                        } else {
                            currentAttemptedQuestions = JSON.parse(localStorage.getItem('Current Attempted Questions(es)'))

                        }

                        currentAttemptedQuestions.push(currentAttemptedPhoniceWord);
                        localStorage.setItem('Current Attempted Questions(es)', JSON.stringify(currentAttemptedQuestions))

                        // Save All Attempted Questions To Local Storage
                        let previousWord = sessionStorage.getItem('Previous Word(es)');
                        let previousIpa = sessionStorage.getItem('Previous Pronunciation(es)');
                        let previousXSampa = sessionStorage.getItem('Previous Equivalent Pronunciation(es)');

                        let allAttemptedQuestions;
                        let storeAttemptedQuestion = {
                            previousWord: previousWord,
                            previousIpa: previousIpa,
                            previousXSampa: previousXSampa,
                            className: className
                        }

                        if (localStorage.getItem('All Attempted Questions(es)') === null) {
                            allAttemptedQuestions = [];

                        } else {
                            allAttemptedQuestions = JSON.parse(localStorage.getItem('All Attempted Questions(es)'))

                        }

                        allAttemptedQuestions.push(storeAttemptedQuestion);
                        localStorage.setItem('All Attempted Questions(es)', JSON.stringify(allAttemptedQuestions));
                    }

                    ////////////////////////////////////////////////////////////////
                    // Delay Display Of Right Side Value By First Saving It To Session Storage As Previous
                    sessionStorage.setItem('Previous Pronunciation(es)', iteratedDataFilePronunciationIPA);
                    sessionStorage.setItem('Previous Equivalent Pronunciation(es)', iteratedDataFilePronunciationXSAMPA);
                    sessionStorage.setItem('Previous Word(es)', iteratedDataFileTitle);

                    return {
                        iteratedDataFileTitle,
                        iteratedDataFilePronunciationIPA
                    }

                } else {
                    //                console.log('X-SAMPA')

                    // Extract Word
                    let iteratedDataFileTitle = iteratedDataFile.title;
                    console.log(iteratedDataFileTitle)

                    // Extract Pronunciation
                    let iteratedDataFilePronunciationXSAMPA = iteratedDataFile.pronunciation[0]["X-SAMPA"];
                    //                console.log('X-SAMPA', iteratedDataFilePronunciationXSAMPA)

                    // Extract X-SAMPA Equivalent In IPA
                    let iteratedDataFilePronunciationIPA = iteratedDataFile.pronunciation[0].IPA;
                    //                console.log('X-SAMPA ~ IPA', iteratedDataFilePronunciationIPA)

                    // Display To UI
                    UISelectors.vowelSound.textContent = iteratedDataFilePronunciationXSAMPA;

                    // Save Current Pronunnciation / Word To Session Storage
                    sessionStorage.setItem('Current Pronunciation(es)', iteratedDataFilePronunciationXSAMPA);
                    sessionStorage.setItem('Current Word(es)', iteratedDataFileTitle);

                    // Save X-SAMPA Equivalent Pronunnciation To Session Storage
                    sessionStorage.setItem('Equivalent Pronunciation(es)', iteratedDataFilePronunciationIPA);

                    /*
                     * Delay Current Question Display In UI
                     * Previous Pronounciation Always Removed On Page Load From ItemCtrlEs.start()
                     */
                    if (sessionStorage.getItem('Previous Pronunciation(es)') === null && sessionStorage.getItem('Previous Word(es)') === null) {
                        //                    console.log('Nothing To Display');
                    } else {

                        // Display Current Questions In UI (Right Side)
                        let liElement = document.createElement('li');
                        liElement.className = 'list-group-item d-flex justify-content-between align-items-center';
                        let liText = document.createTextNode(sessionStorage.getItem('Previous Pronunciation(es)'));

                        // Append liText To liElement
                        liElement.appendChild(liText);

                        let spanElement = document.createElement('span');
                        //                    spanElement.className = 'badge badge-primary badge-pill';
                        if (className === 'bg-warning') {
                            spanElement.className = `badge badge-pill text-dark ${className}`;
                        } else {
                            spanElement.className = `badge badge-pill text-white ${className}`;
                        }
                        let spanText = document.createTextNode(sessionStorage.getItem('Previous Word(es)'));
                        spanElement.appendChild(spanText);

                        liElement.appendChild(spanElement)
                        UISelectors.currentQuestions.appendChild(liElement);

                        // Save liText To Session For End Game Modal --------------------------------------------
                        let currentAttemptedPhonics = sessionStorage.getItem('Previous Pronunciation(es)')
                        let currentAttemptedWord = sessionStorage.getItem('Previous Word(es)');
                        let currentClassName = className;

                        let currentAttemptedQuestions;
                        let currentAttemptedPhoniceWord = {
                            currentAttemptedPhonics: currentAttemptedPhonics,
                            currentAttemptedWord: currentAttemptedWord,
                            currentClassName: currentClassName
                        }
                        if (localStorage.getItem('Current Attempted Questions(es)') === null) {
                            currentAttemptedQuestions = [];

                        } else {
                            currentAttemptedQuestions = JSON.parse(localStorage.getItem('Current Attempted Questions(es)'))

                        }

                        currentAttemptedQuestions.push(currentAttemptedPhoniceWord);
                        localStorage.setItem('Current Attempted Questions(es)', JSON.stringify(currentAttemptedQuestions))

                        // Save All Attempted Questions To Local Storage
                        let previousWord = sessionStorage.getItem('Previous Word(es)');
                        let previousIpa = sessionStorage.getItem('Previous Pronunciation(es)');
                        let previousXSampa = sessionStorage.getItem('Previous Equivalent Pronunciation(es)');

                        let allAttemptedQuestions;
                        let storeAttemptedQuestion = {
                            previousWord: previousWord,
                            previousIpa: previousIpa,
                            previousXSampa: previousXSampa,
                            className: className
                        }

                        if (localStorage.getItem('All Attempted Questions(es)') === null) {
                            allAttemptedQuestions = [];

                        } else {
                            allAttemptedQuestions = JSON.parse(localStorage.getItem('All Attempted Questions(es)'))

                        }

                        allAttemptedQuestions.push(storeAttemptedQuestion);
                        localStorage.setItem('All Attempted Questions(es)', JSON.stringify(allAttemptedQuestions))

                        //                    console.log(allAttemptedQuestions)

                        //                    console.log(liElement);
                    }

                    // Delay Display Of Right Side Value By First Saving It To Session Storage As Previous
                    if (phoneticsSoundType === 'IPA') {
                        sessionStorage.setItem('Previous Pronunciation(es)', iteratedDataFilePronunciationIPA);
                        sessionStorage.setItem('Previous Equivalent Pronunciation(es)', iteratedDataFilePronunciationXSAMPA);
                        sessionStorage.setItem('Previous Word(es)', iteratedDataFileTitle);
                    } else {
                        sessionStorage.setItem('Previous Pronunciation(es)', iteratedDataFilePronunciationXSAMPA);
                        sessionStorage.setItem('Previous Equivalent Pronunciation(es)', iteratedDataFilePronunciationIPA);
                        sessionStorage.setItem('Previous Word(es)', iteratedDataFileTitle);
                    }
                }
            } // END OF RELOAD IF NO MORE WORDS
        }, // END OF capturedDico()

        initCapturedDico: function (returnedData) {
            //            console.log(returnedData)

            let dicoFile = returnedData.data;
            let iteratedData = itemCtrlEs.iterationCounts(dicoFile);
            //            let phoneticsSoundType = localStorage.getItem('Phonetics Sound(es)');

            //            console.log(returnedData.data);

            let iteratedDataFile = iteratedData.next().value;
            AppCtrlEs.capturedDico(iteratedData, iteratedDataFile);

            // Disable Submit On Enter KeyPress
            document.addEventListener('keypress', function (e) {
                if (e.keyCode === 13 || e.which === 13) {
                    e.preventDefault();
                    return false;
                }
            }) // END OF DISABLE SUBMIT ON ENNTER

            // hints-btn
            UISelectors.hintsBtn.addEventListener('click', function () {
                //                console.log('HINTS');

                let showHints = confirm('Uso de la opción de sugerencias (cada) 3 veces contaría como 1 pérdida: ', ' CONTINUAR');

                if (showHints === false) {
                    //                    console.log('No Hints')
                    return;
                } else {
                    // Check & Save Hints Attempt To Local Storage
                    let hintsStorage = 0;
                    if (localStorage.getItem('Hints Count(es)') === null) {
                        //                        console.log('No Hints In Storage(es)')
                        localStorage.setItem('Hints Count(es)', '1')
                    } else {
                        //                        console.log('Hints Available In Storage');
                        hintsStorage = Number(localStorage.getItem('Hints Count(es)'))
                        hintsStorage += 1;

                        localStorage.setItem('Hints Count(es)', JSON.parse(hintsStorage))

                        // Deduct  Point After Every 3 Hints
                        let deductedHintPoint = 1;
                        if (Number(localStorage.getItem('Hints Count(es)')) === 3) {
                            // Delete Point
                            if (localStorage.getItem('Deducted Hint Point(es)') === null) {
                                localStorage.setItem('Deducted Hint Point(es)', '1')
                            } else {
                                deductedHintPoint = Number(localStorage.getItem('Deducted Hint Point(es)'));
                                deductedHintPoint += 1
                            }
                            localStorage.setItem('Deducted Hint Point(es)', JSON.parse(deductedHintPoint))

                            // Delete Hints Count From Storage On Reaching 3 Count
                            localStorage.removeItem('Hints Count(es)');
                        }
                    } // END OF IF HINT COUNT === NULL

                    // Randomise Hints Display
                    let hintsDisplayRandom = Math.round(Math.random() + 1)

                    // Display Hints
                    let currentWord = sessionStorage.getItem('Current Word(es)');

                    let arr = currentWord;
                    let newStr = '';
                    let i;

                    if (arr.length <= 4) {

                        document.getElementById('display-hints').textContent = `SORRY: No Hints Available For ${arr.length} Letter Word(s)`
                    } else {
                        if (hintsDisplayRandom === 1) {
                            // Hide Even Letters
                            for (i = 0; i < arr.length; i++) {
                                if (([i] % 2) !== 1) {
                                    newStr += ' - ';
                                } else {
                                    newStr += arr[i];
                                }
                            }
                            document.getElementById('display-hints').textContent = newStr;
                        } else {
                            // Hide Odd Letters
                            for (i = 0; i < arr.length; i++) {
                                if (([i] % 2) !== 1) {
                                    if (i === 0) {
                                        newStr += arr[i].toUpperCase();
                                    } else {
                                        newStr += arr[i];
                                    }
                                } else {
                                    newStr += ' - ';
                                }
                            }
                            document.getElementById('display-hints').textContent = newStr;
                        } // END OF IF ELSE hintsDisplayRandom === 1
                    } // END OF IF ELSE arr.length <= 3
                } // END OF IF ELSE showHints === false
            }) // END OF hintsBBtn EVENT


            // Select Language
            UISelectors.selectLanguage.addEventListener('click', function () {
                // Make Modal Small
                UISelectors.addModalSm.classList.add('modal-sm');
                //                console.log('Select Language');

                // Reset Modal
                AppCtrlEs.resetModalBody();
                //                console.log('Win Rate');

                // Clear Hints
                document.getElementById('display-hints').textContent = '';

                // Click Modal Button
                document.getElementById('modal-btn').click();

                // Clear All .init2-list siblings
                let init2List = document.querySelector('.init2-list')
                while (init2List.nextElementSibling) {
                    init2List.nextElementSibling.remove();
                }

                // Modal Titlle
                document.querySelector('.modal-title').innerHTML = `Elige tu idioma`;

                let modalTable = `
<table class="table table-hover table-striped">
<thead class="bg-dark" style="color: white">
<tr>
<th>Idioma</th>
<th>Seleccionar bandera</th>
</tr>
</thead>
<tbody>
<tr>
<td>Inglés</td>
<td><button id="english" class="btn btn-block btn-outline-secondary" style="background-image: url(img/English.jpeg); background-size: cover">English</button></td>
</tr>
<tr>
<td>Chino</td>
<td><button id="chinese" class="btn btn-block btn-outline-dark" style="background-image: url(img/Chinese.jpg); background-size: cover">Chinese</button></td>
</tr>

<tr>
<td>Holandés</td>
<td><button id="dutch" class="btn btn-block btn-outline-dark" style="background-image: url(img/Dutch.jpg); background-size: contain">Dutch</button></td>
</tr>
<tr>
<td>Francés</td>
<td><button id="french" class="btn btn-block btn-outline-secondary" style="background-image: url(img/french-flag.jpg); background-size: cover">French</button></td>
</tr>
<tr>
<td>Alemán</td>
<td><button id="german" class="btn btn-block btn-outline-success" style="background-image: url(img/German.jpg); background-size: contain">German</button></td>
</tr>
<tr>
<td>Hindi</td>
<td><button id="hindi" class="btn btn-block btn-outline-secondary" style="background-image: url(img/Hindi.jpg); background-size: contain">Hindi</button></td>
</tr>
<tr>
<td>Italia</td>
<td><button id="italia" class="btn btn-block btn-outline-secondary" style="background-image: url(img/italian.jpg); background-size: cover">Italia</button></td>
</tr>
<tr>
<td>Español</td>
<td><button id="spanish" class="btn btn-block btn-outline-light" style="background-image: url(img/Spanish.jpg); background-size: contain">Spinish</button></td>
</tr>

</tbody>
</table>
`
                document.querySelector('#all-questions').innerHTML = modalTable;

                // English Language
                document.getElementById('english').addEventListener('click', function () {

                    UISelectors.selectLanguage.className = 'btn btn-block btn-outline-secondary btn-block mt-5 mb-2';
                    UISelectors.selectLanguage.style.backgroundImage = 'url(img/English.jpeg)';
                    UISelectors.selectLanguage.style.backgroundSize = 'cover';
                    UISelectors.selectLanguage.textContent = 'English';

                    // Save Language To Local Storage
                    localStorage.setItem('PWR Language', 'English');

                    // Reload Page
                    window.location.reload();
                })

                // Chinese Language
                document.getElementById('chinese').addEventListener('click', function () {

                    UISelectors.selectLanguage.className = 'btn btn-block btn-outline-dark btn-block mt-5 mb-2';
                    UISelectors.selectLanguage.style.backgroundImage = 'url(img/Chinese.jpg)';
                    UISelectors.selectLanguage.style.backgroundSize = 'cover';
                    UISelectors.selectLanguage.textContent = 'Chinese';

                    // Save Language To Local Storage
                    localStorage.setItem('PWR Language', 'Chinese');

                    // Reload Page
                    window.location.reload();
                })

                // Dutch Language
                document.getElementById('dutch').addEventListener('click', function () {

                    UISelectors.selectLanguage.className = 'btn btn-block btn-outline-dark btn-block mt-5 mb-2';
                    UISelectors.selectLanguage.style.backgroundImage = 'url(img/Dutch.jpg)';
                    UISelectors.selectLanguage.style.backgroundSize = 'contain';
                    UISelectors.selectLanguage.textContent = 'Dutch';

                    // Save Language To Local Storage
                    localStorage.setItem('PWR Language', 'Dutch');

                    // Reload Page
                    window.location.reload();
                })

                // French Language
                document.getElementById('french').addEventListener('click', function () {

                    UISelectors.selectLanguage.className = 'btn btn-block btn-outline-secondary btn-block mt-5 mb-2';
                    UISelectors.selectLanguage.style.backgroundImage = 'url(img/french-flag.jpg)';
                    UISelectors.selectLanguage.style.backgroundSize = 'cover';
                    UISelectors.selectLanguage.textContent = 'French';

                    // Save Language To Local Storage
                    localStorage.setItem('PWR Language', 'French');

                    // Reload Page
                    window.location.reload();
                })

                // German Language
                document.getElementById('german').addEventListener('click', function () {

                    UISelectors.selectLanguage.className = 'btn btn-block btn-outline-success btn-block mt-5 mb-2';
                    UISelectors.selectLanguage.style.backgroundImage = 'url(img/German.jpg)';
                    UISelectors.selectLanguage.style.backgroundSize = 'contain';
                    UISelectors.selectLanguage.textContent = 'German';

                    // Save Language To Local Storage
                    localStorage.setItem('PWR Language', 'German');

                    // Reload Page
                    window.location.reload();
                })

                // Hindi Language
                document.getElementById('hindi').addEventListener('click', function () {

                    UISelectors.selectLanguage.className = 'btn btn-block btn-outline-secondary btn-block mt-5 mb-2';
                    UISelectors.selectLanguage.style.backgroundImage = 'url(img/Hindi.jpg)';
                    UISelectors.selectLanguage.style.backgroundSize = 'contain';
                    UISelectors.selectLanguage.textContent = 'Hindi';

                    // Save Language To Local Storage
                    localStorage.setItem('PWR Language', 'Hindi');

                    // Reload Page
                    window.location.reload();
                })

                // Italia Language
                document.getElementById('italia').addEventListener('click', function () {

                    UISelectors.selectLanguage.className = 'btn btn-block btn-outline-secondary btn-block mt-5 mb-2';
                    UISelectors.selectLanguage.style.backgroundImage = 'url(img/italian.jpg)';
                    UISelectors.selectLanguage.style.backgroundSize = 'cover';
                    UISelectors.selectLanguage.textContent = 'Italia';

                    // Save Language To Local Storage
                    localStorage.setItem('PWR Language', 'Italia');

                    // Reload Page
                    window.location.reload();
                })

                // Spanish Language
                document.getElementById('spanish').addEventListener('click', function () {
                    // Dont Reload If Language is The Same
                    if (localStorage.getItem('PWR Language') === 'Spanish') {
                        // Close Modal
                        document.querySelector('.close-modal').click();
                    } else {

                        UISelectors.selectLanguage.className = 'btn btn-block btn-outline-light btn-block mt-5 mb-2';
                        UISelectors.selectLanguage.style.backgroundImage = 'url(img/Spanish.jpg)';
                        UISelectors.selectLanguage.style.backgroundSize = 'contain';
                        UISelectors.selectLanguage.textContent = 'Spanish';

                        // Save Language To Local Storage
                        localStorage.setItem('PWR Language', 'Spanish');

                        // Reload Page
                        window.location.reload();
                    }
                })
            }) // END OF selectLanguage EVENT


            // End Play Button Event
            UISelectors.endPlayBtn.addEventListener('click', function () {
                // Make Modal Big
                UISelectors.addModalSm.classList.remove('modal-sm');
                // Reset Modal
                AppCtrlEs.resetModalBody();

                // Clear Hints
                document.getElementById('display-hints').textContent = '';

                // Ensure Play Has Started
                if (localStorage.getItem('Current Attempted Questions(es)') === null) {
                    alert('No puede continuar sin intentar ninguna pregunta')
                    return
                } else {
                    // Confirm Player Wants To End Game
                    let endPlay = confirm('Está a punto de finalizar su sesión de práctica: CONFIRMAR');

                    if (endPlay === false) {
                        return;
                    } else {
                        // Click Modal Button
                        document.getElementById('modal-btn').click();

                        // Clear All .init2-list siblings
                        let init2List = document.querySelector('.init2-list')
                        while (init2List.nextElementSibling) {
                            init2List.nextElementSibling.remove();
                        }

                        let totalCurrentPassedAttempt = AppCtrlEs.calculatePlayRatio('endPlayBtn').totalCurrentPassedAttempt;

                        // Modal Titlle
                        document.querySelector('.modal-title').innerHTML = `Preguntas respondidas: <small style="color: darkgoldenrod"> ${totalCurrentPassedAttempt}% Exactitud </small>`;

                        // Get Current Questions From Session Storage
                        let liText = JSON.parse(localStorage.getItem('Current Attempted Questions(es)'));

                        // Display Current Questions To Modal Body
                        AppCtrlEs.displayToModal(liText, 'endPlayBtn');
                    }
                }

                // Clear Current Questions + Calculation From Session Storage
                localStorage.removeItem('Current Correct Word On 1st Attempt(es)');
                localStorage.removeItem('Current Correct Word On 2nd Attempt(es)');
                localStorage.removeItem('Current Correct Word On 3rd Attempt(es)');
                localStorage.removeItem('Current Wrong Answer On 3rd Attempt(es)')
                localStorage.removeItem('Current Attempted Questions(es)');

                // Clear All .init-list siblings
                let initList = document.querySelector('.init-list')
                while (initList.nextElementSibling) {
                    initList.nextElementSibling.remove();
                }

            }) // END OF endPlayBtn EVENT


            UISelectors.winRateBtn.addEventListener('click', function () {
                // Make Modal Big
                UISelectors.addModalSm.classList.remove('modal-sm');

                // Reset Modal
                AppCtrlEs.resetModalBody();
                //                console.log('Win Rate');

                // Clear Hints
                document.getElementById('display-hints').textContent = '';

                // Click Modal Button
                document.getElementById('modal-btn').click();

                // Clear All .init2-list siblings
                let init2List = document.querySelector('.init2-list')
                while (init2List.nextElementSibling) {
                    init2List.nextElementSibling.remove();
                }

                // Calculate & Display Current Statistics
                let calculatePlayRatio = AppCtrlEs.calculatePlayRatio();

                let correctOn1stAttempt = calculatePlayRatio.correctOn1stAttempt;
                let correctOn2ndAttempt = calculatePlayRatio.correctOn2ndAttempt;
                let correctOn3rdAttempt = calculatePlayRatio.correctOn3rdAttempt;
                let wrongAfter3rdAttempt = calculatePlayRatio.wrongAfter3rdAttempt;
                let correctOn1stAttemptRatio = calculatePlayRatio.correctOn1stAttemptRatio;
                let correctOn2ndAttemptRatio = calculatePlayRatio.correctOn2ndAttemptRatio;
                let correctOn3rdAttemptRatio = calculatePlayRatio.correctOn3rdAttemptRatio;
                let wrongAfter3rdAttemptRatio = calculatePlayRatio.wrongAfter3rdAttemptRatio;
                let totalAttempts = calculatePlayRatio.totalAttempts;
                let totalAttemptsRatio = calculatePlayRatio.totalAttemptsRatio;
                let deductedHintPoint = calculatePlayRatio.deductedHintPoint;
                let deductedHintPointRatio = calculatePlayRatio.deductedHintPointRatio;

                // Modal Titlle
                document.querySelector('.modal-title').innerHTML = `Análisis de todas las preguntas respondidas`;

                let modalTable = `
<table class="table table-hover table-striped">
<thead class="bg-dark" style="color: white">
<tr>
<th>TÍTULO</th>
<th>No de juego</th>
<th>Porcentaje de ganancia</th>
</tr>
</thead>
<tbody>
<tr>
<td>Porcentaje total de victorias en el primer intento</td>
<td><b style="color: blue">${correctOn1stAttempt}</b></td>
<td><b style="color: blue">${correctOn1stAttemptRatio}%</b></td>
</tr>
<tr>
<td>Porcentaje total de victorias en el segundo intento</td>
<td><b style="color: blue">${correctOn2ndAttempt}</b></td>
<td><b style="color: blue">${correctOn2ndAttemptRatio}%</b></td>
</tr>
<tr>
<td>Porcentaje total de victorias en el tercer intento</td>
<td><b style="color: blue">${correctOn3rdAttempt}</b></td>
<td><b style="color: blue">${correctOn3rdAttemptRatio}%</b></td>
</tr>
<tr>
<td>Respuesta incorrecta después del tercer intento</td>
<td><b style="color: blue">${wrongAfter3rdAttempt}</b></td>
<td><b style="color: blue">${wrongAfter3rdAttemptRatio}%</b></td>
</tr>
<tr id="hide-tr" class="lead">
<td>Deducción de puntos de pistas ...</td>
<td id="hide-td"><b style="color: blue">${deductedHintPoint}</b></td>
<td><b style="color: red">${deductedHintPointRatio}%</b></td>
</tr>
<tr>
<td><b>JUEGO TOTAL</b></td>
<td><b>${totalAttempts}</b></td>
<td><b>${totalAttemptsRatio}%</b></td>
</tr>
</tbody>
</table>
`
                document.querySelector('#all-questions').innerHTML = modalTable;

                // Hide Deducted Hints If === 0
                if (document.getElementById('hide-td').textContent == 0) {
                    document.getElementById('hide-tr').style.display = 'none';
                }
            })


            UISelectors.historyBtn.addEventListener('click', function () {
                // Make Modal Big
                UISelectors.addModalSm.classList.remove('modal-sm');

                // Reset Modal
                AppCtrlEs.resetModalBody();

                // Clear Hints
                document.getElementById('display-hints').textContent = '';

                // Click Modal Button
                document.getElementById('modal-btn').click();

                // Clear All .init2-list siblings
                let init2List = document.querySelector('.init2-list')
                while (init2List.nextElementSibling) {
                    init2List.nextElementSibling.remove();
                }

                // Calculate & Display Current Statistics
                let calculatePlayRatio = AppCtrlEs.calculatePlayRatio('historyBtn');

                let totalAttemptsRatio = calculatePlayRatio.totalAttemptsRatio

                // Modal Titlle
                document.querySelector('.modal-title').innerHTML = `Todas las preguntas respondidas: <small style="color: darkgoldenrod"> ${totalAttemptsRatio}% Exactitud </small>`;


                // Get Current Questions From Session Storage
                let liText = JSON.parse(localStorage.getItem('All Attempted Questions(es)'));


                // Display Current Questions To Modal Body
                AppCtrlEs.displayToModal(liText, 'historyBtn');

            }) // END OF winRateBtn EVENT


            // Next Button Event
            UISelectors.nextBtn.addEventListener('click', function () {

                // Clear Hints
                document.getElementById('display-hints').textContent = '';

                let currentWord = sessionStorage.getItem('Current Word(es)').toLowerCase();
                let attemptedCount = UISelectors.attemptedCount;

                // Check If Answer Is Correct On 1st Attempt
                //                console.log('INPUT', UISelectors.inputWord.value)
                if (UISelectors.inputWord.value.toLowerCase() === '' || UISelectors.inputWord.value.toLowerCase() === ' ') {
                    alert('El campo de entrada no puede estar vacío');

                } else if (UISelectors.inputWord.value.toLowerCase() !== currentWord) {

                    //                    console.log('Current Word 1', currentWord);
                    // Wrong Answer
                    // Change Try Number To 2 & bg-color
                    attemptedCount.textContent = 2;
                    attemptedCount.classList.remove('badge-primary');
                    attemptedCount.classList.add('badge-warning');

                    // Adjust Disply Buttons
                    UISelectors.nextBtn.style.display = 'none';
                    UISelectors.tryAgainBtn.style.display = 'block';
                    UISelectors.lastChanceBtn.style.display = 'none';

                    //                    console.log('INPUT IS NOT === WORD 1')
                    //                    console.log('Input Value:', UISelectors.inputWord.value)
                    //                    console.log('Word from Storage:', currentWord)
                    //                    console.log('Word from Input UI:', UISelectors.inputWord.value);

                } else {
                    // Save Winning Rate On First Attempt To Local Storage
                    // For Display Win Rate & View All Attempted uestionns
                    if (localStorage.getItem('Correct Word On 1st Attempt(es)') === null) {
                        localStorage.setItem('Correct Word On 1st Attempt(es)', '1');

                    } else {
                        let currentWinOn1 = Number(localStorage.getItem('Correct Word On 1st Attempt(es)'))
                        currentWinOn1 += 1;
                        localStorage.setItem('Correct Word On 1st Attempt(es)', JSON.parse(currentWinOn1))
                    }

                    // Save Current Winning Attempt To Session Storage
                    // For End Game Calculation
                    if (localStorage.getItem('Current Correct Word On 1st Attempt(es)') === null) {
                        localStorage.setItem('Current Correct Word On 1st Attempt(es)', '1');

                    } else {
                        let currentCorrectWinOn1 = Number(localStorage.getItem('Current Correct Word On 1st Attempt(es)'))
                        currentCorrectWinOn1 += 1;
                        localStorage.setItem('Current Correct Word On 1st Attempt(es)', JSON.parse(currentCorrectWinOn1))
                    }

                    // Play Sound Indicating A Correct Answer
                    let audio = document.createElement('audio')
                    audio.src = 'audio/Facebook%20Message.mp3';
                    audio.play();

                    let className = 'bg-primary';
                    let iteratedDataFile = iteratedData.next().value;
                    let capturedData = AppCtrlEs.capturedDico(iteratedData, iteratedDataFile, className);
                    //                    console.log('WORD:', sessionStorage.getItem('Current Word(es)'), 'IPA:', sessionStorage.getItem('Current Pronunciation(es)'))

                    // Adjust Disply Buttons
                    UISelectors.nextBtn.style.display = 'block';
                    UISelectors.tryAgainBtn.style.display = 'none';
                    UISelectors.lastChanceBtn.style.display = 'none';
                }

                // Clear Input Value
                UISelectors.inputWord.value = '';

            }) // END OF nextBtn Event


            // tryAgain Button
            UISelectors.tryAgainBtn.addEventListener('click', function () {

                // Clear Hints
                document.getElementById('display-hints').textContent = '';

                let currentWord = sessionStorage.getItem('Current Word(es)').toLowerCase();
                let attemptedCount = UISelectors.attemptedCount;

                //                console.log('Current Word 2', currentWord)

                if (UISelectors.inputWord.value.toLowerCase() === '' || UISelectors.inputWord.value.toLowerCase() === ' ') {
                    alert('El campo de entrada no puede estar vacío');

                } else if (UISelectors.inputWord.value.toLowerCase() !== currentWord) {
                    // Answer Still Wrong. Try Again
                    // Change Try Number To 3 & bg-color
                    attemptedCount.textContent = 3;
                    attemptedCount.classList.remove('badge-warning');
                    attemptedCount.classList.add('badge-danger');

                    // Adjust Disply Buttons
                    UISelectors.nextBtn.style.display = 'none';
                    UISelectors.tryAgainBtn.style.display = 'none';
                    UISelectors.lastChanceBtn.style.display = 'block';

                    //                    console.log('INPUT IS NOT === WORD 2')
                    //                    console.log('Input Value:', UISelectors.inputWord.value)
                    //                    console.log('Word from Storage:', currentWord)
                    //                    console.log('Word from Input UI:', UISelectors.inputWord.value)

                } else {
                    // Save Winning Rate On First Attempt To Local Storage
                    if (localStorage.getItem('Correct Word On 2nd Attempt(es)') === null) {
                        localStorage.setItem('Correct Word On 2nd Attempt(es)', '1');

                    } else {
                        let currentWinOn2 = Number(localStorage.getItem('Correct Word On 2nd Attempt(es)'))
                        currentWinOn2 += 1;
                        localStorage.setItem('Correct Word On 2nd Attempt(es)', JSON.parse(currentWinOn2))
                    }

                    // Save Current Winning Attempt To Session Storage
                    // For End Game Calculation
                    if (localStorage.getItem('Current Correct Word On 2nd Attempt(es)') === null) {
                        localStorage.setItem('Current Correct Word On 2nd Attempt(es)', '1');

                    } else {
                        let currentCorrectWinOn2 = Number(localStorage.getItem('Current Correct Word On 2nd Attempt(es)'))
                        currentCorrectWinOn2 += 1;
                        localStorage.setItem('Current Correct Word On 2nd Attempt(es)', JSON.parse(currentCorrectWinOn2))
                    }

                    // Play Sound Indicating A Correct Answer
                    let audio = document.createElement('audio')
                    audio.src = 'audio/Facebook%20Message.mp3';
                    audio.play();

                    let className = 'bg-warning';
                    let iteratedDataFile = iteratedData.next().value;
                    AppCtrlEs.capturedDico(iteratedData, iteratedDataFile, className);

                    // Change Try Number To 1 & bg-color
                    attemptedCount.textContent = 1;
                    attemptedCount.classList.remove('badge-warning');
                    attemptedCount.classList.add('badge-primary');

                    // Adjust Disply Buttons
                    UISelectors.nextBtn.style.display = 'block';
                    UISelectors.tryAgainBtn.style.display = 'none';
                    UISelectors.lastChanceBtn.style.display = 'none';

                }

                // Clear Input Value
                UISelectors.inputWord.value = '';

            }) // END OF tyrAgain2


            // tryAgain3 Button
            UISelectors.lastChanceBtn.addEventListener('click', function () {

                // Clear Hints
                document.getElementById('display-hints').textContent = '';

                let currentWord = sessionStorage.getItem('Current Word(es)').toLowerCase();
                let attemptedCount = UISelectors.attemptedCount;

                //                console.log('Current Word 3', currentWord);
                if (UISelectors.inputWord.value.toLowerCase() === '' || UISelectors.inputWord.value.toLowerCase() === ' ') {
                    alert('El campo de entrada no puede estar vacío');

                } else if (UISelectors.inputWord.value.toLowerCase() !== currentWord) {

                    /*
                     ** Show Correct Answer with Timmer
                     ** CountDown Timer To Delay Screen For 5 Sec
                     */

                    // Answer Still Wrong. But Moving To Next Question
                    AppCtrlEs.countDownTimer(currentWord);
                    // Hide Button
                    UISelectors.lastChanceBtn.style.display = 'none';
                    UISelectors.ipaBtn.disabled = true;
                    UISelectors.xSampaBtn.disabled = true;
                    UISelectors.endPlayBtn.disabled = true;
                    UISelectors.winRateBtn.disabled = true;
                    UISelectors.historyBtn.disabled = true;

                    // Delay Next Question For 6.5Sec
                    setTimeout(function () {
                        // Play Audio On Question Change
                        let audio = document.createElement('audio');
                        audio.src = 'audio/Facebook%20Chat%20Pop.mp3';
                        audio.play();

                        let className = 'bg-secondary';
                        let iteratedDataFile = iteratedData.next().value;
                        AppCtrlEs.capturedDico(iteratedData, iteratedDataFile, className);

                        // Change Try Number To 1 & bg-color
                        attemptedCount.textContent = 1;
                        attemptedCount.classList.remove('badge-danger');
                        attemptedCount.classList.add('badge-primary');

                        // Adjust Disply Buttons
                        UISelectors.nextBtn.style.display = 'block';
                        UISelectors.tryAgainBtn.style.display = 'none';
                        UISelectors.ipaBtn.disabled = false;
                        UISelectors.xSampaBtn.disabled = false;
                        UISelectors.endPlayBtn.disabled = false;
                        UISelectors.winRateBtn.disabled = false;
                        UISelectors.historyBtn.disabled = false;

                        // Save Wrong Answer Status To local Storage
                        if (localStorage.getItem('Wrong Word(es)') === null) {
                            localStorage.setItem('Wrong Word(es)', '1');

                        } else {
                            let wrongWord = Number(localStorage.getItem('Wrong Word(es)'))
                            wrongWord += 1;
                            localStorage.setItem('Wrong Word(es)', JSON.parse(wrongWord))
                        }

                        // Save Current Wrong Attempt To Session Storage
                        // For End Game Calculation
                        if (localStorage.getItem('Current Wrong Answer On 3rd Attempt(es)') === null) {
                            localStorage.setItem('Current Wrong Answer On 3rd Attempt(es)', '1');

                        } else {
                            let currentWrongAnsOn3 = Number(localStorage.getItem('Current Wrong Answer On 3rd Attempt(es)'))
                            currentWrongAnsOn3 += 1;
                            localStorage.setItem('Current Wrong Answer On 3rd Attempt(es)', JSON.parse(currentWrongAnsOn3))
                        }

                        //                        console.log('INPUT IS NOT === WORD 3')
                        //                        console.log('Input Value:', UISelectors.inputWord.value)
                        //                        console.log('Word from Storage:', currentWord)
                        //                        console.log('Word from Input UI:', UISelectors.inputWord.value)
                    }, 6500) // END OF setTimeout

                } else {
                    // Answer Is Correct On 3rd Attempt

                    // Save Winning Rate On First Attempt To Local Storage
                    if (localStorage.getItem('Correct Word On 3rd Attempt(es)') === null) {
                        localStorage.setItem('Correct Word On 3rd Attempt(es)', '1');

                    } else {
                        let currentWinOn3 = Number(localStorage.getItem('Correct Word On 3rd Attempt(es)'))
                        currentWinOn3 += 1;
                        localStorage.setItem('Correct Word On 3rd Attempt(es)', JSON.parse(currentWinOn3))
                    }

                    // Save Current Winning Attempt To Session Storage
                    // For End Game Calculation
                    if (localStorage.getItem('Current Correct Word On 3rd Attempt(es)') === null) {
                        localStorage.setItem('Current Correct Word On 3rd Attempt(es)', '1');

                    } else {
                        let currentCorrectWinOn3 = Number(localStorage.getItem('Current Correct Word On 3rd Attempt(es)'))
                        currentCorrectWinOn3 += 1;
                        localStorage.setItem('Current Correct Word On 3rd Attempt(es)', JSON.parse(currentCorrectWinOn3))
                    }

                    // Play Sound Indicating A Correct Answer
                    let audio = document.createElement('audio')
                    audio.src = 'audio/Facebook%20Message.mp3';
                    audio.play();

                    let className = 'bg-danger';
                    let iteratedDataFile = iteratedData.next().value;
                    AppCtrlEs.capturedDico(iteratedData, iteratedDataFile, className);

                    // Change Try Number To 1 & bg-color
                    attemptedCount.textContent = 1;
                    attemptedCount.classList.remove('badge-danger');
                    attemptedCount.classList.add('badge-primary');

                    // Adjust Disply Buttons
                    UISelectors.nextBtn.style.display = 'block';
                    UISelectors.tryAgainBtn.style.display = 'none';
                    UISelectors.lastChanceBtn.style.display = 'none';

                }

                // Clear Input Value
                UISelectors.inputWord.value = '';

            }) // END OF tryAgain3
        }, // END OF intCaptureDico()

    } // END OF return
})(FetchCtrlEs, ItemCtrlEs, UICtrlEs); // END OF AppCtrlEs()

//// Initialize AppCtrl
//AppCtrlEs.fetchedDico();
