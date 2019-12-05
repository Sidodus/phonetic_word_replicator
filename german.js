const FetchCtrlDe = (function () {


    // Public Methods
    return {
        fetchDico: async function () {
                let response = await fetch('wiktionary-json/de.dict.v0.json');

                let responseData = await response.json();

                return responseData;
            }, // END OF fetchDico

    } // END OF return
})(); // END OF FetchCtrl()




// ItemCtrl ************************************************************************************************
const ItemCtrlDe = (function () {

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
            let phoneticsSoundType = localStorage.getItem('Phonetics Sound(de)');

            if (phoneticsSoundType === null || phoneticsSoundType === '') {
                localStorage.setItem('Phonetics Sound(de)', 'IPA')
            }

            // Set Display / App Based On Phonetics Sound
            if (localStorage.getItem('Phonetics Sound(de)') === 'IPA') {
                AppCtrlDe.IPASoundInit()
            } else {
                AppCtrlDe.xSampaSoundInit();
            }

            // Load Current Attempted Questions Back To UI If Any
            if (localStorage.getItem('Current Attempted Questions(de)')) {
                let displayCurrentAttemptedQuestions = JSON.parse(localStorage.getItem('Current Attempted Questions(de)'));

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
                    UICtrlDe.getUISelector().currentQuestions.appendChild(liElement);
                }) // END OF forEach
            } // END OF LOAD CURRENT ATTEMPTED QUESTIONS BACK TO UI IF ANY

            /****************************************************************
             ** Delay Current Question Display In UI
             ** Delete From Session Storage On Load
             */
            if (sessionStorage.getItem('Previous Pronunciation(de)') === null && sessionStorage.getItem('Previous Word(de)') === null) {
                return
            } else {
                sessionStorage.removeItem('Previous Pronunciation(de)');
                sessionStorage.removeItem('Previous Word(de)');
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




const UICtrlDe = (function () {

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




const AppCtrlDe = (function (fetchCtrlDe, itemCtrlDe, uiCtrlDe) {

    const UISelectors = uiCtrlDe.getUISelector();

    // Event Listeners
    let allEvents = function () {
        /* NOTE:
         ** Next Btn Event Is Located In AppCtrlDe.captureDico()
         */
        UISelectors.ipaBtn.addEventListener('click', IPASound);
        UISelectors.xSampaBtn.addEventListener('click', xSampaSound);
        UISelectors.historyBtn.addEventListener('click', wordsHistory);
    }; // END OF allEvents

    const IPASound = function () {
        // Capture Phonetics Sound Already In Storage
        let phoneticsSoundType = localStorage.getItem('Phonetics Sound(de)');

        let CurrentPronunciation = sessionStorage.getItem('Current Pronunciation(de)');
        let CurrentWord = sessionStorage.getItem('Current Word(de)');
        let EquivalentPronunciation = sessionStorage.getItem('Equivalent Pronunciation(de)');

        localStorage.setItem('Phonetics Sound(de)', 'IPA');

        // Change Btn BG
        UISelectors.ipaBtn.classList.remove('btn-primary')
        UISelectors.ipaBtn.classList.add('btn-secondary')

        UISelectors.xSampaBtn.classList.add('btn-primary');
        UISelectors.xSampaBtn.classList.remove('btn-secondary');

        // Change Text Content
        UISelectors.soundType.textContent = 'IPA';
        UISelectors.ipaXSampaDictionary.textContent = '/ˈvœʁtɐˌbuːx/';
        UISelectors.dictionary.textContent = 'Wörterbuch';

        // Change Pronunciation On Click
        if (phoneticsSoundType === 'IPA') {
            // Retain Current UI Pronunciation Display
            UISelectors.vowelSound.textContent = sessionStorage.getItem('Current Pronunciation(de)');
            //            console.log('Already In IPA')
        } else {
            // Change Current UI Pronunciation Display
            UISelectors.vowelSound.textContent = sessionStorage.getItem('Equivalent Pronunciation(de)');
            //            console.log('Changed To IPA');

            // Change Current & Equivalent State
            sessionStorage.setItem('Current Pronunciation(de)', EquivalentPronunciation)
            sessionStorage.setItem('Equivalent Pronunciation(de)', CurrentPronunciation)
        }
    } // END OF IPASound()

    const xSampaSound = function () {
        // Capture Phonetics Sound Already In Storage
        let phoneticsSoundType = localStorage.getItem('Phonetics Sound(de)');

        let CurrentPronunciation = sessionStorage.getItem('Current Pronunciation(de)');
        let CurrentWord = sessionStorage.getItem('Current Word(de)');
        let EquivalentPronunciation = sessionStorage.getItem('Equivalent Pronunciation(de)');

        localStorage.setItem('Phonetics Sound(de)', 'X-SAMPA');

        // Change Btn BG
        UISelectors.xSampaBtn.classList.remove('btn-primary');
        UISelectors.xSampaBtn.classList.add('btn-secondary');

        UISelectors.ipaBtn.classList.add('btn-primary');
        UISelectors.ipaBtn.classList.remove('btn-secondary');

        // Change Text Content
        UISelectors.soundType.textContent = 'X-SAMPA';
        UISelectors.ipaXSampaDictionary.textContent = ''; // Change To XSAMPA (DE)
        UISelectors.dictionary.textContent = 'Wörterbuch';

        // Change Pronunciation On Click
        if (phoneticsSoundType === 'X-SAMPA') {
            // Retain Current UI Pronunciation Display
            UISelectors.vowelSound.textContent = sessionStorage.getItem('Current Pronunciation(de)');
            //            console.log('Already In X-SAMPA')
        } else {
            // Change Current UI Pronunciation Display
            UISelectors.vowelSound.textContent = sessionStorage.getItem('Equivalent Pronunciation(de)');
            //            console.log('Changed To X-SAMPA');

            // Change Current & Equivalent State
            sessionStorage.setItem('Current Pronunciation(de)', EquivalentPronunciation)
            sessionStorage.setItem('Equivalent Pronunciation(de)', CurrentPronunciation)
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
            fetchCtrlDe.fetchDico()
                .then(function (data) {
                    //                console.log(data);

                    itemCtrlDe.starter();

                    let returnedData = itemCtrlDe.start(data);
                    //                    console.log(returnedData);

                    AppCtrlDe.initCapturedDico(returnedData);
                    //                    AppCtrlDe.allEvents(returnedData)
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
            document.getElementById('correct-answer').innerHTML = `<p>Richtige Antwort: <span style="color: yellow; font-size: 1.4em"> ${currentWord} </span></p>`

            setTimeout(function () {
                // CountDown Timer To Dela Screen For 5Sec
                let timeLeft = 5;
                let downloadTimer = setInterval(function () {
                    document.getElementById('timer').innerHTML = 'Frage ändern in ' + timeLeft + ' Sekunde(n)';

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
<span class="init2-sound">/ Oral Sound /</span>
<span class="init2-word badge badge-dark badge-pill" style="color: darkgoldenrod">Wort</span>
</li>
`
            document.querySelector('#all-questions').innerHTML = initLi;
        },

        calculatePlayRatio: function (btnClickType) {
            let correctOn1stAttempt, correctOn2ndAttempt, correctOn3rdAttempt, wrongAfter3rdAttempt, totalCurrentAttempt, correctOn1stAttemptRatio, correctOn2ndAttemptRatio, correctOn3rdAttemptRatio, wrongAfter3rdAttemptRatio, totalCurrentPassedAttempt, totalAttempts, totalAttemptsRatio, deductedHintPoint, deductedHintPointRatio;

            if (btnClickType === 'endPlayBtn') {
                // Calculate & Display Current Statistics
                correctOn1stAttempt = Number(localStorage.getItem('Current Correct Word On 1st Attempt(de)'));
                correctOn2ndAttempt = Number(localStorage.getItem('Current Correct Word On 2nd Attempt(de)'));
                correctOn3rdAttempt = Number(localStorage.getItem('Current Correct Word On 3rd Attempt(de)'));
                wrongAfter3rdAttempt = Number(localStorage.getItem('Current Wrong Answer On 3rd Attempt(de)'));

                deductedHintPoint = Number(localStorage.getItem('Deducted Hint Point(de)'));

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
                correctOn1stAttempt = Number(localStorage.getItem('Correct Word On 1st Attempt(de)'));
                correctOn2ndAttempt = Number(localStorage.getItem('Correct Word On 2nd Attempt(de)'));
                correctOn3rdAttempt = Number(localStorage.getItem('Correct Word On 3rd Attempt(de)'));
                wrongAfter3rdAttempt = Number(localStorage.getItem('Wrong Word(de)'));

                deductedHintPoint = Number(localStorage.getItem('Deducted Hint Point(de)'))

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

                    btnLink.setAttribute('href', `https://de.wiktionary.org/wiki/${wordToLowerCase}`);
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
                let phoneticsSoundType = localStorage.getItem('Phonetics Sound(de)');

                // Set Current Pronounciation On Page Load
                if (phoneticsSoundType === 'IPA') {
                    //                console.log('IPA')

                    // Extract Word
                    let iteratedDataFileTitle = iteratedDataFile.title;
                    console.log(iteratedDataFileTitle)

                    // Extract Pronunciation
                    let iteratedDataFilePronunciationIPA = iteratedDataFile.pronunciation[0].IPA;
                    //                console.log('IPA', iteratedDataFilePronunciationIPA)

                    // Extract IPA Equivalent In X-SAMPA
                    let iteratedDataFilePronunciationXSAMPA = iteratedDataFile.pronunciation[0]["X-SAMPA"];
                    //                console.log('IPA ~ X-SAMPA', iteratedDataFilePronunciationXSAMPA)

                    // Display To UI
                    UISelectors.vowelSound.textContent = iteratedDataFilePronunciationIPA;

                    // Save Current Pronunnciation / Word To Session Storage
                    sessionStorage.setItem('Current Pronunciation(de)', iteratedDataFilePronunciationIPA);
                    sessionStorage.setItem('Current Word(de)', iteratedDataFileTitle);

                    // Save IPA Equivalent Pronunnciation To Session Storage
                    sessionStorage.setItem('Equivalent Pronunciation(de)', iteratedDataFilePronunciationXSAMPA);

                    /*
                     * Delay Current Question Display In UI
                     * Previous Pronounciation Always Removed On Page Load From ItemCtrlDe.start()
                     */
                    if (sessionStorage.getItem('Previous Pronunciation(de)') === null && sessionStorage.getItem('Previous Word(de)') === null) {
                        //                    console.log('Nothing To Display');
                    } else {

                        // Display Current Questions In UI (Right Side)
                        let liElement = document.createElement('li');
                        liElement.className = 'list-group-item d-flex justify-content-between align-items-center';
                        let liText = document.createTextNode(sessionStorage.getItem('Previous Pronunciation(de)'));

                        // Append liText To liElement
                        liElement.appendChild(liText);

                        let spanElement = document.createElement('span');
                        //                    spanElement.className = 'badge badge-primary badge-pill';


                        let spanText = document.createTextNode(sessionStorage.getItem('Previous Word(de)'));

                        // Create A Button To Link Words To Wiktionary For Defination/Meaning
                        let btnLink = document.createElement('a');
                        btnLink.setAttribute('target', '_blank');

                        let btnLinkSpan = sessionStorage.getItem('Previous Word(de)');
                        btnLinkSpan.toLowerCase();

                        btnLink.setAttribute('href', `https://de.wiktionary.org/wiki/${btnLinkSpan}`);

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
                        let currentAttemptedPhonics = sessionStorage.getItem('Previous Pronunciation(de)')
                        let currentAttemptedWord = sessionStorage.getItem('Previous Word(de)');
                        let currentClassName = className;

                        let currentAttemptedQuestions;
                        let currentAttemptedPhoniceWord = {
                            currentAttemptedPhonics: currentAttemptedPhonics,
                            currentAttemptedWord: currentAttemptedWord,
                            currentClassName: currentClassName
                        }
                        if (localStorage.getItem('Current Attempted Questions(de)') === null) {
                            currentAttemptedQuestions = [];

                        } else {
                            currentAttemptedQuestions = JSON.parse(localStorage.getItem('Current Attempted Questions(de)'))

                        }

                        currentAttemptedQuestions.push(currentAttemptedPhoniceWord);
                        localStorage.setItem('Current Attempted Questions(de)', JSON.stringify(currentAttemptedQuestions))

                        // Save All Attempted Questions To Local Storage
                        let previousWord = sessionStorage.getItem('Previous Word(de)');
                        let previousIpa = sessionStorage.getItem('Previous Pronunciation(de)');
                        let previousXSampa = sessionStorage.getItem('Previous Equivalent Pronunciation(de)');

                        let allAttemptedQuestions;
                        let storeAttemptedQuestion = {
                            previousWord: previousWord,
                            previousIpa: previousIpa,
                            previousXSampa: previousXSampa,
                            className: className
                        }

                        if (localStorage.getItem('All Attempted Questions(de)') === null) {
                            allAttemptedQuestions = [];

                        } else {
                            allAttemptedQuestions = JSON.parse(localStorage.getItem('All Attempted Questions(de)'))

                        }

                        allAttemptedQuestions.push(storeAttemptedQuestion);
                        localStorage.setItem('All Attempted Questions(de)', JSON.stringify(allAttemptedQuestions));
                    }

                    ////////////////////////////////////////////////////////////////
                    // Delay Display Of Right Side Value By First Saving It To Session Storage As Previous
                    sessionStorage.setItem('Previous Pronunciation(de)', iteratedDataFilePronunciationIPA);
                    sessionStorage.setItem('Previous Equivalent Pronunciation(de)', iteratedDataFilePronunciationXSAMPA);
                    sessionStorage.setItem('Previous Word(de)', iteratedDataFileTitle);

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
                    sessionStorage.setItem('Current Pronunciation(de)', iteratedDataFilePronunciationXSAMPA);
                    sessionStorage.setItem('Current Word(de)', iteratedDataFileTitle);

                    // Save X-SAMPA Equivalent Pronunnciation To Session Storage
                    sessionStorage.setItem('Equivalent Pronunciation(de)', iteratedDataFilePronunciationIPA);

                    /*
                     * Delay Current Question Display In UI
                     * Previous Pronounciation Always Removed On Page Load From ItemCtrlDe.start()
                     */
                    if (sessionStorage.getItem('Previous Pronunciation(de)') === null && sessionStorage.getItem('Previous Word(de)') === null) {
                        //                    console.log('Nothing To Display');
                    } else {

                        // Display Current Questions In UI (Right Side)
                        let liElement = document.createElement('li');
                        liElement.className = 'list-group-item d-flex justify-content-between align-items-center';
                        let liText = document.createTextNode(sessionStorage.getItem('Previous Pronunciation(de)'));

                        // Append liText To liElement
                        liElement.appendChild(liText);

                        let spanElement = document.createElement('span');
                        //                    spanElement.className = 'badge badge-primary badge-pill';
                        if (className === 'bg-warning') {
                            spanElement.className = `badge badge-pill text-dark ${className}`;
                        } else {
                            spanElement.className = `badge badge-pill text-white ${className}`;
                        }
                        let spanText = document.createTextNode(sessionStorage.getItem('Previous Word(de)'));
                        spanElement.appendChild(spanText);

                        liElement.appendChild(spanElement)
                        UISelectors.currentQuestions.appendChild(liElement);

                        // Save liText To Session For End Game Modal --------------------------------------------
                        let currentAttemptedPhonics = sessionStorage.getItem('Previous Pronunciation(de)')
                        let currentAttemptedWord = sessionStorage.getItem('Previous Word(de)');
                        let currentClassName = className;

                        let currentAttemptedQuestions;
                        let currentAttemptedPhoniceWord = {
                            currentAttemptedPhonics: currentAttemptedPhonics,
                            currentAttemptedWord: currentAttemptedWord,
                            currentClassName: currentClassName
                        }
                        if (localStorage.getItem('Current Attempted Questions(de)') === null) {
                            currentAttemptedQuestions = [];

                        } else {
                            currentAttemptedQuestions = JSON.parse(localStorage.getItem('Current Attempted Questions(de)'))

                        }

                        currentAttemptedQuestions.push(currentAttemptedPhoniceWord);
                        localStorage.setItem('Current Attempted Questions(de)', JSON.stringify(currentAttemptedQuestions))

                        // Save All Attempted Questions To Local Storage
                        let previousWord = sessionStorage.getItem('Previous Word(de)');
                        let previousIpa = sessionStorage.getItem('Previous Pronunciation(de)');
                        let previousXSampa = sessionStorage.getItem('Previous Equivalent Pronunciation(de)');

                        let allAttemptedQuestions;
                        let storeAttemptedQuestion = {
                            previousWord: previousWord,
                            previousIpa: previousIpa,
                            previousXSampa: previousXSampa,
                            className: className
                        }

                        if (localStorage.getItem('All Attempted Questions(de)') === null) {
                            allAttemptedQuestions = [];

                        } else {
                            allAttemptedQuestions = JSON.parse(localStorage.getItem('All Attempted Questions(de)'))

                        }

                        allAttemptedQuestions.push(storeAttemptedQuestion);
                        localStorage.setItem('All Attempted Questions(de)', JSON.stringify(allAttemptedQuestions))

                        //                    console.log(allAttemptedQuestions)

                        //                    console.log(liElement);
                    }

                    // Delay Display Of Right Side Value By First Saving It To Session Storage As Previous
                    if (phoneticsSoundType === 'IPA') {
                        sessionStorage.setItem('Previous Pronunciation(de)', iteratedDataFilePronunciationIPA);
                        sessionStorage.setItem('Previous Equivalent Pronunciation(de)', iteratedDataFilePronunciationXSAMPA);
                        sessionStorage.setItem('Previous Word(de)', iteratedDataFileTitle);
                    } else {
                        sessionStorage.setItem('Previous Pronunciation(de)', iteratedDataFilePronunciationXSAMPA);
                        sessionStorage.setItem('Previous Equivalent Pronunciation(de)', iteratedDataFilePronunciationIPA);
                        sessionStorage.setItem('Previous Word(de)', iteratedDataFileTitle);
                    }
                }
            } // END OF RELOAD IF NO MORE WORDS
        }, // END OF capturedDico()

        initCapturedDico: function (returnedData) {
            //            console.log(returnedData)

            let dicoFile = returnedData.data;
            let iteratedData = itemCtrlDe.iterationCounts(dicoFile);
            //            let phoneticsSoundType = localStorage.getItem('Phonetics Sound(de)');

            //            console.log(returnedData.data);

            let iteratedDataFile = iteratedData.next().value;
            AppCtrlDe.capturedDico(iteratedData, iteratedDataFile);

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

                let showHints = confirm('Wenn Sie die Option "Hinweise" (alle) dreimal verwenden, wird dies als 1 Verlust gewertet: ', ' WEITER');

                if (showHints === false) {
                    //                    console.log('No Hints')
                    return;
                } else {
                    // Check & Save Hints Attempt To Local Storage
                    let hintsStorage = 0;
                    if (localStorage.getItem('Hints Count(de)') === null) {
                        //                        console.log('No Hints In Storage(de)')
                        localStorage.setItem('Hints Count(de)', '1')
                    } else {
                        //                        console.log('Hints Available In Storage');
                        hintsStorage = Number(localStorage.getItem('Hints Count(de)'))
                        hintsStorage += 1;

                        localStorage.setItem('Hints Count(de)', JSON.parse(hintsStorage))

                        // Deduct  Point After Every 3 Hints
                        let deductedHintPoint = 1;
                        if (Number(localStorage.getItem('Hints Count(de)')) === 3) {
                            // Delete Point
                            if (localStorage.getItem('Deducted Hint Point(de)') === null) {
                                localStorage.setItem('Deducted Hint Point(de)', '1')
                            } else {
                                deductedHintPoint = Number(localStorage.getItem('Deducted Hint Point(de)'));
                                deductedHintPoint += 1
                            }
                            localStorage.setItem('Deducted Hint Point(de)', JSON.parse(deductedHintPoint))

                            // Delete Hints Count From Storage On Reaching 3 Count
                            localStorage.removeItem('Hints Count(de)');
                        }
                    } // END OF IF HINT COUNT === NULL

                    // Randomise Hints Display
                    let hintsDisplayRandom = Math.round(Math.random() + 1)

                    // Display Hints
                    let currentWord = sessionStorage.getItem('Current Word(de)');

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
                AppCtrlDe.resetModalBody();
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
                document.querySelector('.modal-title').innerHTML = `Wähle deine Sprache`;

                let modalTable = `
<table class="table table-hover table-striped">
<thead class="bg-dark" style="color: white">
<tr>
<th>Sprache</th>
<th>Wählen Sie Flagge</th>
</tr>
</thead>
<tbody>
<tr>
<td>Englisch</td>
<td><button id="english" class="btn btn-block btn-outline-secondary" style="background-image: url(img/English.jpeg); background-size: cover">English</button></td>
</tr>
<tr>
<td>Chinesisch</td>
<td><button id="chinese" class="btn btn-block btn-outline-dark" style="background-image: url(img/Chinese.jpg); background-size: cover">Chinese</button></td>
</tr>

<tr>
<td>Niederländisch</td>
<td><button id="dutch" class="btn btn-block btn-outline-dark" style="background-image: url(img/Dutch.jpg); background-size: contain">Dutch</button></td>
</tr>
<tr>
<td>Französisch</td>
<td><button id="french" class="btn btn-block btn-outline-secondary" style="background-image: url(img/french-flag.jpg); background-size: cover">French</button></td>
</tr>
<tr>
<td>Deutsche</td>
<td><button id="german" class="btn btn-block btn-outline-success" style="background-image: url(img/German.jpg); background-size: contain">German</button></td>
</tr>
<tr>
<td>Hindi</td>
<td><button id="hindi" class="btn btn-block btn-outline-secondary" style="background-image: url(img/Hindi.jpg); background-size: contain">Hindi</button></td>
</tr>
<tr>
<td>Italien</td>
<td><button id="italia" class="btn btn-block btn-outline-secondary" style="background-image: url(img/italian.jpg); background-size: cover">Italia</button></td>
</tr>
<tr>
<td>Spanisch</td>
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
                    // Dont Reload If Language is The Same
                    if (localStorage.getItem('PWR Language') === 'German') {
                        // Close Modal
                        document.querySelector('.close-modal').click();
                    } else {

                        UISelectors.selectLanguage.className = 'btn btn-block btn-outline-success btn-block mt-5 mb-2';
                        UISelectors.selectLanguage.style.backgroundImage = 'url(img/German.jpg)';
                        UISelectors.selectLanguage.style.backgroundSize = 'contain';
                        UISelectors.selectLanguage.textContent = 'German';

                        // Save Language To Local Storage
                        localStorage.setItem('PWR Language', 'German');

                        // Reload Page
                        window.location.reload();
                    }
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

                    UISelectors.selectLanguage.className = 'btn btn-block btn-outline-light btn-block mt-5 mb-2';
                    UISelectors.selectLanguage.style.backgroundImage = 'url(img/Spanish.jpg)';
                    UISelectors.selectLanguage.style.backgroundSize = 'contain';
                    UISelectors.selectLanguage.textContent = 'Spanish';

                    // Save Language To Local Storage
                    localStorage.setItem('PWR Language', 'Spanish');

                    // Reload Page
                    window.location.reload();
                })
            }) // ENND OF selectLanguage EVENT


            // End Play Button Event
            UISelectors.endPlayBtn.addEventListener('click', function () {
                // Make Modal Big
                UISelectors.addModalSm.classList.remove('modal-sm');
                // Reset Modal
                AppCtrlDe.resetModalBody();

                // Clear Hints
                document.getElementById('display-hints').textContent = '';

                // Ensure Play Has Started
                if (localStorage.getItem('Current Attempted Questions(de)') === null) {
                    alert('Sie können nicht fortfahren, ohne eine Frage zu beantworten')
                    return
                } else {
                    // Confirm Player Wants To End Game
                    let endPlay = confirm('Sie beenden gerade Ihre Übungsstunde: BESTÄTIGEN');

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

                        let totalCurrentPassedAttempt = AppCtrlDe.calculatePlayRatio('endPlayBtn').totalCurrentPassedAttempt;

                        // Modal Titlle
                        document.querySelector('.modal-title').innerHTML = `Beantwortete Fragen: <small style="color: darkgoldenrod"> ${totalCurrentPassedAttempt}% Richtigkeit </small>`;

                        // Get Current Questions From Session Storage
                        let liText = JSON.parse(localStorage.getItem('Current Attempted Questions(de)'));

                        // Display Current Questions To Modal Body
                        AppCtrlDe.displayToModal(liText, 'endPlayBtn');
                    }
                }

                // Clear Current Questions + Calculation From Session Storage
                localStorage.removeItem('Current Correct Word On 1st Attempt(de)');
                localStorage.removeItem('Current Correct Word On 2nd Attempt(de)');
                localStorage.removeItem('Current Correct Word On 3rd Attempt(de)');
                localStorage.removeItem('Current Wrong Answer On 3rd Attempt(de)')
                localStorage.removeItem('Current Attempted Questions(de)');

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
                AppCtrlDe.resetModalBody();
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
                let calculatePlayRatio = AppCtrlDe.calculatePlayRatio();

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
                document.querySelector('.modal-title').innerHTML = `Analyse aller beantworteten Fragen`;

                let modalTable = `
<table class="table table-hover table-striped">
<thead class="bg-dark" style="color: white">
<tr>
<th>TITEL</th>
<th>Nein zum Spiel</th>
<th>Gewinnprozentsatz</th>
</tr>
</thead>
<tbody>
<tr>
<td>Gesamtgewinnprozentsatz beim ersten Versuch</td>
<td><b style="color: blue">${correctOn1stAttempt}</b></td>
<td><b style="color: blue">${correctOn1stAttemptRatio}%</b></td>
</tr>
<tr>
<td>Gesamtgewinnprozentsatz bei 2. Versuch</td>
<td><b style="color: blue">${correctOn2ndAttempt}</b></td>
<td><b style="color: blue">${correctOn2ndAttemptRatio}%</b></td>
</tr>
<tr>
<td>Gesamtsiegprozentsatz beim 3. Versuch</td>
<td><b style="color: blue">${correctOn3rdAttempt}</b></td>
<td><b style="color: blue">${correctOn3rdAttemptRatio}%</b></td>
</tr>
<tr>
<td>Falsche Antwort nach 3. Versuch</td>
<td><b style="color: blue">${wrongAfter3rdAttempt}</b></td>
<td><b style="color: blue">${wrongAfter3rdAttemptRatio}%</b></td>
</tr>
<tr id="hide-tr" class="lead">
<td>Hinweispunkte werden abgezogen ...</td>
<td id="hide-td"><b style="color: blue">${deductedHintPoint}</b></td>
<td><b style="color: red">${deductedHintPointRatio}%</b></td>
</tr>
<tr>
<td><b>GESAMT SPIELEN</b></td>
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
                AppCtrlDe.resetModalBody();

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
                let calculatePlayRatio = AppCtrlDe.calculatePlayRatio('historyBtn');

                let totalAttemptsRatio = calculatePlayRatio.totalAttemptsRatio

                // Modal Titlle
                document.querySelector('.modal-title').innerHTML = `Alle beantworteten Fragen: <small style="color: darkgoldenrod"> ${totalAttemptsRatio}% Richtigkeit </small>`;


                // Get Current Questions From Session Storage
                let liText = JSON.parse(localStorage.getItem('All Attempted Questions(de)'));


                // Display Current Questions To Modal Body
                AppCtrlDe.displayToModal(liText, 'historyBtn');

            }) // END OF winRateBtn EVENT


            // Next Button Event
            UISelectors.nextBtn.addEventListener('click', function () {

                // Clear Hints
                document.getElementById('display-hints').textContent = '';

                let currentWord = sessionStorage.getItem('Current Word(de)').toLowerCase();
                let attemptedCount = UISelectors.attemptedCount;

                // Check If Answer Is Correct On 1st Attempt
                //                console.log('INPUT', UISelectors.inputWord.value)
                if (UISelectors.inputWord.value.toLowerCase() === '' || UISelectors.inputWord.value.toLowerCase() === ' ') {
                    alert('Eingabefeld darf nicht leer sein');

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
                    if (localStorage.getItem('Correct Word On 1st Attempt(de)') === null) {
                        localStorage.setItem('Correct Word On 1st Attempt(de)', '1');

                    } else {
                        let currentWinOn1 = Number(localStorage.getItem('Correct Word On 1st Attempt(de)'))
                        currentWinOn1 += 1;
                        localStorage.setItem('Correct Word On 1st Attempt(de)', JSON.parse(currentWinOn1))
                    }

                    // Save Current Winning Attempt To Session Storage
                    // For End Game Calculation
                    if (localStorage.getItem('Current Correct Word On 1st Attempt(de)') === null) {
                        localStorage.setItem('Current Correct Word On 1st Attempt(de)', '1');

                    } else {
                        let currentCorrectWinOn1 = Number(localStorage.getItem('Current Correct Word On 1st Attempt(de)'))
                        currentCorrectWinOn1 += 1;
                        localStorage.setItem('Current Correct Word On 1st Attempt(de)', JSON.parse(currentCorrectWinOn1))
                    }

                    // Play Sound Indicating A Correct Answer
                    let audio = document.createElement('audio')
                    audio.src = 'audio/Facebook%20Message.mp3';
                    audio.play();

                    let className = 'bg-primary';
                    let iteratedDataFile = iteratedData.next().value;
                    let capturedData = AppCtrlDe.capturedDico(iteratedData, iteratedDataFile, className);
                    //                    console.log('WORD:', sessionStorage.getItem('Current Word(de)'), 'IPA:', sessionStorage.getItem('Current Pronunciation(de)'))

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

                let currentWord = sessionStorage.getItem('Current Word(de)').toLowerCase();
                let attemptedCount = UISelectors.attemptedCount;

                //                console.log('Current Word 2', currentWord)

                if (UISelectors.inputWord.value.toLowerCase() === '' || UISelectors.inputWord.value.toLowerCase() === ' ') {
                    alert('Eingabefeld darf nicht leer sein');

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
                    if (localStorage.getItem('Correct Word On 2nd Attempt(de)') === null) {
                        localStorage.setItem('Correct Word On 2nd Attempt(de)', '1');

                    } else {
                        let currentWinOn2 = Number(localStorage.getItem('Correct Word On 2nd Attempt(de)'))
                        currentWinOn2 += 1;
                        localStorage.setItem('Correct Word On 2nd Attempt(de)', JSON.parse(currentWinOn2))
                    }

                    // Save Current Winning Attempt To Session Storage
                    // For End Game Calculation
                    if (localStorage.getItem('Current Correct Word On 2nd Attempt(de)') === null) {
                        localStorage.setItem('Current Correct Word On 2nd Attempt(de)', '1');

                    } else {
                        let currentCorrectWinOn2 = Number(localStorage.getItem('Current Correct Word On 2nd Attempt(de)'))
                        currentCorrectWinOn2 += 1;
                        localStorage.setItem('Current Correct Word On 2nd Attempt(de)', JSON.parse(currentCorrectWinOn2))
                    }

                    // Play Sound Indicating A Correct Answer
                    let audio = document.createElement('audio')
                    audio.src = 'audio/Facebook%20Message.mp3';
                    audio.play();

                    let className = 'bg-warning';
                    let iteratedDataFile = iteratedData.next().value;
                    AppCtrlDe.capturedDico(iteratedData, iteratedDataFile, className);

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

                let currentWord = sessionStorage.getItem('Current Word(de)').toLowerCase();
                let attemptedCount = UISelectors.attemptedCount;

                //                console.log('Current Word 3', currentWord);
                if (UISelectors.inputWord.value.toLowerCase() === '' || UISelectors.inputWord.value.toLowerCase() === ' ') {
                    alert('Eingabefeld darf nicht leer sein');

                } else if (UISelectors.inputWord.value.toLowerCase() !== currentWord) {

                    /*
                     ** Show Correct Answer with Timmer
                     ** CountDown Timer To Delay Screen For 5 Sec
                     */

                    // Answer Still Wrong. But Moving To Next Question
                    AppCtrlDe.countDownTimer(currentWord);
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
                        AppCtrlDe.capturedDico(iteratedData, iteratedDataFile, className);

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
                        if (localStorage.getItem('Wrong Word(de)') === null) {
                            localStorage.setItem('Wrong Word(de)', '1');

                        } else {
                            let wrongWord = Number(localStorage.getItem('Wrong Word(de)'))
                            wrongWord += 1;
                            localStorage.setItem('Wrong Word(de)', JSON.parse(wrongWord))
                        }

                        // Save Current Wrong Attempt To Session Storage
                        // For End Game Calculation
                        if (localStorage.getItem('Current Wrong Answer On 3rd Attempt(de)') === null) {
                            localStorage.setItem('Current Wrong Answer On 3rd Attempt(de)', '1');

                        } else {
                            let currentWrongAnsOn3 = Number(localStorage.getItem('Current Wrong Answer On 3rd Attempt(de)'))
                            currentWrongAnsOn3 += 1;
                            localStorage.setItem('Current Wrong Answer On 3rd Attempt(de)', JSON.parse(currentWrongAnsOn3))
                        }

                        //                        console.log('INPUT IS NOT === WORD 3')
                        //                        console.log('Input Value:', UISelectors.inputWord.value)
                        //                        console.log('Word from Storage:', currentWord)
                        //                        console.log('Word from Input UI:', UISelectors.inputWord.value)
                    }, 6500) // END OF setTimeout

                } else {
                    // Answer Is Correct On 3rd Attempt

                    // Save Winning Rate On First Attempt To Local Storage
                    if (localStorage.getItem('Correct Word On 3rd Attempt(de)') === null) {
                        localStorage.setItem('Correct Word On 3rd Attempt(de)', '1');

                    } else {
                        let currentWinOn3 = Number(localStorage.getItem('Correct Word On 3rd Attempt(de)'))
                        currentWinOn3 += 1;
                        localStorage.setItem('Correct Word On 3rd Attempt(de)', JSON.parse(currentWinOn3))
                    }

                    // Save Current Winning Attempt To Session Storage
                    // For End Game Calculation
                    if (localStorage.getItem('Current Correct Word On 3rd Attempt(de)') === null) {
                        localStorage.setItem('Current Correct Word On 3rd Attempt(de)', '1');

                    } else {
                        let currentCorrectWinOn3 = Number(localStorage.getItem('Current Correct Word On 3rd Attempt(de)'))
                        currentCorrectWinOn3 += 1;
                        localStorage.setItem('Current Correct Word On 3rd Attempt(de)', JSON.parse(currentCorrectWinOn3))
                    }

                    // Play Sound Indicating A Correct Answer
                    let audio = document.createElement('audio')
                    audio.src = 'audio/Facebook%20Message.mp3';
                    audio.play();

                    let className = 'bg-danger';
                    let iteratedDataFile = iteratedData.next().value;
                    AppCtrlDe.capturedDico(iteratedData, iteratedDataFile, className);

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
})(FetchCtrlDe, ItemCtrlDe, UICtrlDe); // END OF AppCtrlDe()

//// Initialize AppCtrl
//AppCtrlDe.fetchedDico();