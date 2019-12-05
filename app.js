let appUISelectors = function(){
    const appSelectors = {
        // Left Side
        phoneticStandardsTitle: document.getElementById('phonetic-standards-title'),
//        ipaBtn: document.getElementById('ipa-btn'),
//        xSampaBtn: document.getElementById('x-sampa-btn'),
        hintsBtn: document.getElementById('hints-btn'),
        selectPreferedLanguage: document.getElementById('select-prefered-language'),
        endPlay: document.getElementById('end-play'),
        winRateBtn: document.getElementById('win-rate-btn'),
        historyBtn: document.getElementById('history-btn'),
        // Center
        appTitle: document.getElementById('app-title'),
        knowYour: document.getElementById('know-your'),
//        soundType: document.getElementById('sound-type'),
        phoneticSound: document.getElementById('phonetic-sound'),
//        ipaXSampaDictionary: document.getElementById('ipa-x-sampa-dictionary'),
//        dictionary: document.getElementById('dictionary'),
        knowYourSpelling: document.getElementById('know-your-spelling'),
        dictionary: document.getElementById('dictionary'),
        attemptedCount: document.getElementById('attempted-count'),
//        correctAnswer: document.getElementById('correct-answer'),
//        timer: document.getElementById('timer'),
        typeInTheCorrectWord: document.getElementById('type-in-the-correct-word'),
        nextBtn: document.getElementById('next-btn'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        lastChanceBtn: document.getElementById('last-chance-btn'),
        // Right Side
        oralSoundTitle: document.getElementById('oral-sound-title'),
        oralSoundWord: document.getElementById('oral-sound-word'),
        // Modal
//        modalTitle: document.querySelector('.modal-title'),
        init2Sound: document.querySelector('.init2-sound'),
        init2Word: document.querySelector('.init2-word'),
        closeButton: document.querySelector('.close-button'),
        // Footer
        footer1: document.getElementById('footer-1'),
        footer1A: document.getElementById('footer-1-a'),
        footer1B: document.getElementById('footer-1-b'),
        footer2: document.getElementById('footer-2'),
        footer2A: document.getElementById('footer-2-a'),
        footer2B: document.getElementById('footer-2-b'),
        footer3: document.getElementById('footer-3'),
        footer4: document.getElementById('footer-4'),
        footer5: document.getElementById('footer-5'),
        footer5A: document.getElementById('footer-5-a'),
        footer5B: document.getElementById('footer-5-b'),
        footer5C: document.getElementById('footer-5-c'),
        footer5D: document.getElementById('footer-5-d'),
        footer6: document.getElementById('footer-6'),
        footer6A: document.getElementById('footer-6-a'),
        footer6AA: document.getElementById('footer-6-a-a'),
        footer6B: document.getElementById('footer-6-b'),
        footer6BA: document.getElementById('footer-6-b-a'),
        footer6C: document.getElementById('footer-6-c'),
        footer6CA: document.getElementById('footer-6-c-a'),
        footer6D: document.getElementById('footer-6-d'),
        footer6DA: document.getElementById('footer-6-d-a'),
        footer7: document.getElementById('footer-7'),
        footer8: document.getElementById('footer-8'),
        footer8A: document.getElementById('footer-8-a'),
        footer8B: document.getElementById('footer-8-b'),
        footer8C: document.getElementById('footer-8-c'),
        footer8D: document.getElementById('footer-8-d'),
        footer8E: document.getElementById('footer-8-e'),
        footer8F: document.getElementById('footer-8-f'),
        footer8G: document.getElementById('footer-8-g'),
        footer8G: document.getElementById('footer-8-g'),
        footer8H: document.getElementById('footer-8-h'),
        footer9: document.getElementById('footer-9'),
    }

    return {
        selectors: function(){
            return appSelectors
        }
    }
}


// Change Html Language To Chinese Language
let chineseHtml = function(){
    let selectors = appUISelectors().selectors();

    selectors.phoneticStandardsTitle.textContent = ' 语音标准 ';
    selectors.hintsBtn.textContent = '顯示提示 ';
    selectors.selectPreferedLanguage.textContent = ' 選擇首選語言 ';
    selectors.endPlay.textContent = ' 結束播放 ';
    selectors.winRateBtn.textContent = ' 顯示中獎率 ';
    selectors.historyBtn.textContent = ' 查看所有嘗試的問題 ';

    selectors.appTitle.textContent = ' 語音詞複製器 ';
    selectors.knowYour.textContent = ' 了解你的 ';
    selectors.phoneticSound.textContent = ' 語音！ ';
    selectors.knowYourSpelling.textContent = ' 知道你的拼寫！ ';
//    selectors.dictionary.textContent = '';
//    selectors.attemptedCount.textContent = '1個';
    selectors.typeInTheCorrectWord.textContent = ' 輸入正確的單詞 ';
    selectors.nextBtn.textContent = ' 下一個 ';
    selectors.tryAgainBtn.textContent = ' 再試一次 ';
    selectors.lastChanceBtn.textContent = ' 最後的機會 ';

    selectors.oralSoundTitle.textContent = ' /口語/ ';
    selectors.oralSoundWord.textContent = ' 字 ';

    selectors.init2Sound.textContent = ' /口語/ ';
    selectors.init2Word.textContent = ' 字 ';
    selectors.closeButton.textContent = ' 關 ';

    selectors.footer1.textContent = ' 語音單詞複製器被構建為具有靈活性，因為它並非旨在跟踪失敗，而是旨在通過拼寫來提高學生/用戶的發音。 ';
    selectors.footer1A.textContent = ' 只要遊戲正在進行，用戶就可以在任何時候結束遊戲。 ';
    selectors.footer1B.textContent = ' 用戶可以查看所有嘗試的問題，獲勝率，甚至可以單擊嘗試的單詞以獲取詳細信息（需要Internet連接）。 所有這些都可以實現，無論是否進行遊戲。 ';
    selectors.footer2.textContent = ' 語音單詞複製器專注於2個語音標準： ';
//    selectors.footer2A.textContent = '';
//    selectors.footer2B.textContent = '';
    selectors.footer3.textContent = ' 用戶每個問題有三（3）次嘗試以獲取正確的單詞。 ';
    selectors.footer4.textContent = ' 用戶可以查看歷史記錄中所有嘗試的問題。 ';
    selectors.footer5.textContent = ' 用戶可以通過單擊以下任何嘗試的單詞來獲取有關所有嘗試的問題的其他信息： ';
    selectors.footer5A.textContent = ' （需要Internet連接。下面介紹了顏色編碼） ';
    selectors.footer5B.textContent = ' 結束播放彈出窗口。 ';
    selectors.footer5C.textContent = ' 歷史。 ';
    selectors.footer5D.textContent = ' 當前播放區域（在屏幕右側）。 ';
    selectors.footer6.textContent = ' 嘗試單詞背景顏色編碼： ';
    selectors.footer6A.textContent = ' 藍色 ';
    selectors.footer6AA.textContent = ' 在第一次嘗試中得到了正確的單詞。 ';
    selectors.footer6B.textContent = ' 黃色 ';
    selectors.footer6BA.textContent = ' 在第二次嘗試中得到了正確的單詞。 ';
    selectors.footer6C.textContent = ' 紅色 ';
    selectors.footer6CA.textContent = ' 在第三次嘗試中得到了正確的答案。 ';
    selectors.footer6D.textContent = ' 灰色 ';
    selectors.footer6DA.textContent = ' 通過3次嘗試都給出了錯誤的答案。 ';
    selectors.footer7.textContent = ' 語音單詞複製器已被翻譯成8種語言 ';
    selectors.footer8.textContent = ' 根據語言播放保存用戶播放記錄 ';
    selectors.footer8A.textContent = ' 包含45,675個英語單詞。 ';
    selectors.footer8B.textContent = ' 包括68,261個中文單詞。 ';
    selectors.footer8C.textContent = ' 包括8,646個荷蘭語單詞。 ';
    selectors.footer8D.textContent = ' 包含41,819個法語單詞。 ';
    selectors.footer8E.textContent = ' 包括21,418個德語單詞。 ';
    selectors.footer8F.textContent = ' 包括1,702個印地語單詞。 ';
    selectors.footer8G.textContent = ' 包括4,718個意大利語單詞。 ';
    selectors.footer8H.textContent = ' 包括6,851個西班牙語單詞。 ';
    selectors.footer9.textContent = ' 致謝： ';

} // END OF CHANGE HTML TO CHINESE (((((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))))


// Change Html Language To Dutch Language
let dutchHtml = function(){
    let selectors = appUISelectors().selectors();

    selectors.phoneticStandardsTitle.textContent = ' Fonetische normen ';
    selectors.hintsBtn.textContent = ' Laat hints zien ';
    selectors.selectPreferedLanguage.textContent = ' Selecteer voorkeurstaal ';
    selectors.endPlay.textContent = ' Afspelen beëindigen ';
    selectors.winRateBtn.textContent = ' Win-snelheid weergeven ';
    selectors.historyBtn.textContent = ' Bekijk alle gepoogde vragen ';

    selectors.appTitle.textContent = ' Fonetische woordreplicator ';
    selectors.knowYour.textContent = ' Ken je ';
    selectors.phoneticSound.textContent = ' Fonetisch geluid! ';
    selectors.knowYourSpelling.textContent = ' Ken je spelling! ';
//    selectors.dictionary.textContent = '';
//    selectors.attemptedCount.textContent = '';
    selectors.typeInTheCorrectWord.textContent = ' Typ het juiste woord ';
    selectors.nextBtn.textContent = ' NEXT ';
    selectors.tryAgainBtn.textContent = ' PROBEER OPNIEUW ';
    selectors.lastChanceBtn.textContent = ' LAATSTE KANS ';

    selectors.oralSoundTitle.textContent = ' / Mondeling geluid / ';
    selectors.oralSoundWord.textContent = ' Woord ';

    selectors.init2Sound.textContent = ' / Mondeling geluid / ';
    selectors.init2Word.textContent = ' Woord ';
    selectors.closeButton.textContent = ' Dichtbij ';

    selectors.footer1.textContent = ' Fonetische Woordreplicator is gebouwd om flexibel te zijn omdat het niet bedoeld is om fouten te traceren, maar gericht op het verbeteren van de uitspraak van studenten / gebruikers met spelling. ';
    selectors.footer1A.textContent = ' Gebruikers kunnen het spel op elk moment beëindigen zolang het spel bezig is. ';
    selectors.footer1B.textContent = ' Gebruikers kunnen alle aangevraagde vragen bekijken, de winstpercentages bekijken en zelfs op een geprobeerd woord klikken voor gedetailleerde informatie (internetverbinding vereist). Al deze kunnen worden behaald Of het spel bezig is of niet. ';
    selectors.footer2.textContent = ' Fonetische woordreplicator concentreert zich op 2 fonetische normen: ';
//    selectors.footer2A.textContent = '';
//    selectors.footer2B.textContent = '';
    selectors.footer3.textContent = ' Gebruikers hebben drie (3) pogingen per vraag om het juiste woord te krijgen. ';
    selectors.footer4.textContent = ' Gebruikers kunnen alle aangevraagde vragen uit de geschiedenis bekijken. ';
    selectors.footer5.textContent = ' Gebruikers kunnen aanvullende informatie krijgen over alle pogingen door op een willekeurig woord te klikken van: ';
    selectors.footer5A.textContent = ' (Internetverbinding vereist. Kleurcodering hieronder uitgelegd) ';
    selectors.footer5B.textContent = ' Play Popup beëindigen. ';
    selectors.footer5C.textContent = ' Geschiedenis. ';
    selectors.footer5D.textContent = ' Huidig speelgebied (aan de rechterkant van het scherm). ';
    selectors.footer6.textContent = ' Poging tot achtergrondkleurcodering van woorden: ';
    selectors.footer6A.textContent = ' Blauw ';
    selectors.footer6AA.textContent = ' Ik kreeg het juiste woord bij de eerste poging. ';
    selectors.footer6B.textContent = ' Geel ';
    selectors.footer6BA.textContent = ' Ik kreeg het juiste woord bij de tweede poging. ';
    selectors.footer6C.textContent = ' Rood ';
    selectors.footer6CA.textContent = ' Ik kreeg het juiste woord bij de derde poging. ';
    selectors.footer6D.textContent = ' Grijs ';
    selectors.footer6DA.textContent = ' Onjuiste antwoorden tijdens alle 3 pogingen. ';
    selectors.footer7.textContent = ' Fonetische woordreplicator is gedomesticeerd in 8 talen ';
    selectors.footer8.textContent = ' Gebruikers spelen records worden opgeslagen op basis van taalweergave ';
    selectors.footer8A.textContent = ' 45,675 Engelse woorden inbegrepen. ';
    selectors.footer8B.textContent = ' 68,261 Chinese woorden inbegrepen. ';
    selectors.footer8C.textContent = ' 8,646 Nederlandse woorden inbegrepen. ';
    selectors.footer8D.textContent = ' 41,819 Franse woorden inbegrepen. ';
    selectors.footer8E.textContent = ' 21,418 Duitse woorden inbegrepen. ';
    selectors.footer8F.textContent = ' 1,702 Hindi-woorden inbegrepen. ';
    selectors.footer8G.textContent = ' 4,718 Italiaanse woorden inbegrepen. ';
    selectors.footer8H.textContent = ' 6,851 Spaanse woorden inbegrepen. ';
    selectors.footer9.textContent = ' Dank aan: ';

} // END OF CHANGE HTML TO DUTCH (((((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))))


// Change Html Language To French Language
let frenchHtml = function(){
    let selectors = appUISelectors().selectors();

    selectors.phoneticStandardsTitle.textContent = ' Normes phonétiques ';
    selectors.hintsBtn.textContent = ' Montrer indices ';
    selectors.selectPreferedLanguage.textContent = ' Sélectionnez la langue préférée ';
    selectors.endPlay.textContent = ' Fin du jeu ';
    selectors.winRateBtn.textContent = ' Afficher le taux de gain ';
    selectors.historyBtn.textContent = ' Voir toutes les questions tentées ';

    selectors.appTitle.textContent = ' Réplicateur de mots phonétique ';
    selectors.knowYour.textContent = ' Connaître ton ';
    selectors.phoneticSound.textContent = ' Son phonétique! ';
    selectors.knowYourSpelling.textContent = ' Connaissez votre orthographe! ';
//    selectors.dictionary.textContent = '';
//    selectors.attemptedCount.textContent = '';
    selectors.typeInTheCorrectWord.textContent = ' Tapez le mot correct ';
    selectors.nextBtn.textContent = ' SUIVANTE ';
    selectors.tryAgainBtn.textContent = ' RÉESSAYER ';
    selectors.lastChanceBtn.textContent = ' DERNIÈRE CHANCE ';

    selectors.oralSoundTitle.textContent = ' / Son Oral / ';
    selectors.oralSoundWord.textContent = ' Mot ';

    selectors.init2Sound.textContent = ' / Son Oral / ';
    selectors.init2Word.textContent = ' Mot ';
    selectors.closeButton.textContent = ' proche ';

    selectors.footer1.textContent = ' Phonetic Word Replicator est conçu pour être flexible car il ne vise pas à suivre les défaillances, mais vise à améliorer la prononciation des élèves / utilisateurs avec des orthographes. ';
    selectors.footer1A.textContent = ' Les utilisateurs peuvent terminer le jeu à tout moment tant que le jeu est en cours. ';
    selectors.footer1B.textContent = ' Les utilisateurs peuvent afficher toutes les questions tentées, le taux de victoires et même cliquer sur un mot tenté pour obtenir des informations détaillées (connexion Internet requise). Tous ces objectifs peuvent être atteints, que le jeu soit en cours ou non. ';
    selectors.footer2.textContent = ' Le réplicateur de mots phonétique se concentre sur 2 normes phonétiques: ';
//    selectors.footer2A.textContent = '';
//    selectors.footer2B.textContent = '';
    selectors.footer3.textContent = ' Les utilisateurs ont trois (3) tentatives par question pour obtenir le mot exact. ';
    selectors.footer4.textContent = ' Les utilisateurs peuvent afficher toutes les questions tentées de l\'historique. ';
    selectors.footer5.textContent = ' Les utilisateurs peuvent obtenir des informations supplémentaires sur toutes les questions tentées en cliquant sur un mot tenté à partir de: ';
    selectors.footer5A.textContent = ' (Connexion Internet requise. Codage couleur expliqué ci-dessous) ';
    selectors.footer5B.textContent = ' Fin de la lecture Popup. ';
    selectors.footer5C.textContent = ' Histoire. ';
    selectors.footer5D.textContent = ' Zone de lecture actuelle (à droite de l’écran). ';
    selectors.footer6.textContent = ' Tentative de codage couleur de fond des mots: ';
    selectors.footer6A.textContent = ' Bleu ';
    selectors.footer6AA.textContent = ' Vous avez le mot correct à la 1ère tentative. ';
    selectors.footer6B.textContent = ' Jaune ';
    selectors.footer6BA.textContent = ' Vous avez le mot correct à la 2e tentative. ';
    selectors.footer6C.textContent = ' Rouge ';
    selectors.footer6CA.textContent = ' Vous avez le mot correct à la 3ème tentative. ';
    selectors.footer6D.textContent = ' Grise ';
    selectors.footer6DA.textContent = ' Mauvaises réponses tout au long de 3 tentatives. ';
    selectors.footer7.textContent = ' Le réplicateur de mots phonétique est domestiqué en 8 langues ';
    selectors.footer8.textContent = ' Les enregistrements de lecture des utilisateurs sont enregistrés en fonction de la lecture par langue ';
    selectors.footer8A.textContent = ' 45,675 mots anglais inclus. ';
    selectors.footer8B.textContent = ' 68,261 mots chinois inclus. ';
    selectors.footer8C.textContent = ' 8,646 mots néerlandais inclus. ';
    selectors.footer8D.textContent = ' 41,819 mots français inclus. ';
    selectors.footer8E.textContent = ' 21,418 mots allemands inclus. ';
    selectors.footer8F.textContent = ' 1,702 mots hindi inclus. ';
    selectors.footer8G.textContent = ' 4,718 mots italiens inclus. ';
    selectors.footer8H.textContent = ' 6,851 mots espagnols inclus. ';
    selectors.footer9.textContent = ' Crédits À: ';

} // END OF CHANGE HTML TO FRENCH (((((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))))


// Change Html Language To German Language
let germanHtml = function(){
    let selectors = appUISelectors().selectors();

    selectors.phoneticStandardsTitle.textContent = ' Phonetische Standards ';
    selectors.hintsBtn.textContent = ' Zeige Hinweise ';
    selectors.selectPreferedLanguage.textContent = ' Bevorzugte Sprache auswählen ';
    selectors.endPlay.textContent = ' Endspiel ';
    selectors.winRateBtn.textContent = ' Win Rate anzeigen ';
    selectors.historyBtn.textContent = ' Alle versuchten Fragen anzeigen ';

    selectors.appTitle.textContent = ' Lautwort-Replikator ';
    selectors.knowYour.textContent = ' Kenne dein ';
    selectors.phoneticSound.textContent = ' Phonetischer Sound! ';
    selectors.knowYourSpelling.textContent = ' Kennen Sie Ihre Rechtschreibung! ';
//    selectors.dictionary.textContent = '';
//    selectors.attemptedCount.textContent = '';
    selectors.typeInTheCorrectWord.textContent = ' Geben Sie das richtige Wort ein ';
    selectors.nextBtn.textContent = ' NÄCHSTER ';
    selectors.tryAgainBtn.textContent = ' VERSUCH ES NOCH EINMAL ';
    selectors.lastChanceBtn.textContent = ' LETZTE MÖGLICHKEIT ';

    selectors.oralSoundTitle.textContent = ' / Oral Sound / ';
    selectors.oralSoundWord.textContent = ' Wort ';

    selectors.init2Sound.textContent = ' / Oral Sound / ';
    selectors.init2Word.textContent = ' Wort ';
    selectors.closeButton.textContent = ' Schließen ';

    selectors.footer1.textContent = ' Phonetic Word Replicator ist so konzipiert, dass es flexibel ist, da es nicht zum Nachverfolgen von Fehlern gedacht ist, sondern die Aussprache von Schülern / Benutzern mit Schreibweisen verbessern soll. ';
    selectors.footer1A.textContent = ' Benutzer können das Spiel jederzeit beenden, solange das Spiel läuft. ';
    selectors.footer1B.textContent = ' Benutzer können alle versuchten Fragen anzeigen, die Gewinnrate bestimmen und sogar auf ein versuchtes Wort klicken, um detaillierte Informationen zu erhalten (Internetverbindung erforderlich). All dies kann erreicht werden, entweder wenn das Spiel läuft oder nicht. ';
    selectors.footer2.textContent = ' Der phonetische Wortreplikator konzentriert sich auf zwei phonetische Standards: ';
//    selectors.footer2A.textContent = '';
//    selectors.footer2B.textContent = '';
    selectors.footer3.textContent = ' Benutzer haben drei (3) Versuche pro Frage, das richtige Wort zu finden. ';
    selectors.footer4.textContent = ' Benutzer können alle versuchten Fragen aus dem Verlauf anzeigen. ';
    selectors.footer5.textContent = ' Benutzer können zusätzliche Informationen zu allen versuchten Fragen erhalten, indem sie auf ein beliebiges versuchtes Wort von klicken: ';
    selectors.footer5A.textContent = ' (Internetverbindung erforderlich. Farbcodierung siehe unten) ';
    selectors.footer5B.textContent = 'Popup für Wiedergabe beenden. ';
    selectors.footer5C.textContent = ' Geschichte. ';
    selectors.footer5D.textContent = ' Aktueller Wiedergabebereich (auf der rechten Seite des Bildschirms). ';
    selectors.footer6.textContent = ' Versuchte Wörter Hintergrundfarbcodierung: ';
    selectors.footer6A.textContent = ' Blau ';
    selectors.footer6AA.textContent = ' Beim ersten Versuch das richtige Wort bekommen. ';
    selectors.footer6B.textContent = ' Gelb ';
    selectors.footer6BA.textContent = ' Beim zweiten Versuch das richtige Wort bekommen. ';
    selectors.footer6C.textContent = ' Rot ';
    selectors.footer6CA.textContent = ' Beim dritten Versuch das richtige Wort bekommen. ';
    selectors.footer6D.textContent = ' Grau ';
    selectors.footer6DA.textContent = ' Falsche Antworten bei 3 Versuchen. ';
    selectors.footer7.textContent = ' Der phonetische Wortreplikator ist in 8 Sprachen domestiziert ';
    selectors.footer8.textContent = ' Die Spieldatensätze der Benutzer werden basierend auf der Sprachwiedergabe gespeichert ';
    selectors.footer8A.textContent = ' 45,675 englische Wörter eingeschlossen. ';
    selectors.footer8B.textContent = ' 68,261 chinesische Wörter eingeschlossen. ';
    selectors.footer8C.textContent = ' 8,646 niederländische Wörter eingeschlossen. ';
    selectors.footer8D.textContent = ' 41,819 französische Wörter eingeschlossen. ';
    selectors.footer8E.textContent = ' 21,418 deutsche Wörter enthalten. ';
    selectors.footer8F.textContent = ' 1,702 Hindi Wörter enthalten. ';
    selectors.footer8G.textContent = ' 4,718 italienische Wörter eingeschlossen. ';
    selectors.footer8H.textContent = ' 6,851 spanische Wörter eingeschlossen. ';
    selectors.footer9.textContent = ' Anerkennung an: ';

} // END OF CHANGE HTML TO GERMAN (((((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))))


// Change Html Language To Hindi Language
let hindiHtml = function(){
    let selectors = appUISelectors().selectors();

    selectors.phoneticStandardsTitle.textContent = ' ध्वन्यात्मक मानक ';
    selectors.hintsBtn.textContent = ' संकेत दिखाओ ';
    selectors.selectPreferedLanguage.textContent = ' पसंदीदा भाषा का चयन करें ';
    selectors.endPlay.textContent = ' खेल का अंतिम चरण ';
    selectors.winRateBtn.textContent = ' विन दर प्रदर्शित करें ';
    selectors.historyBtn.textContent = ' सभी प्रयास किए गए प्रश्न देखें ';

    selectors.appTitle.textContent = ' ध्वन्यात्मक शब्द रेप्लिकेटर ';
    selectors.knowYour.textContent = ' पता है आपकी ';
    selectors.phoneticSound.textContent = ' ध्वन्यात्मक ध्वनि! ';
    selectors.knowYourSpelling.textContent = ' अपनी वर्तनी जानिए! ';
//    selectors.dictionary.textContent = '';
//    selectors.attemptedCount.textContent = '';
    selectors.typeInTheCorrectWord.textContent = ' सही शब्द टाइप करें ';
    selectors.nextBtn.textContent = ' आगामी ';
    selectors.tryAgainBtn.textContent = ' पुनः प्रयास करें ';
    selectors.lastChanceBtn.textContent = ' अंतिम अवसर ';

    selectors.oralSoundTitle.textContent = ' / मौखिक ध्वनि / ';
    selectors.oralSoundWord.textContent = ' शब्द ';

    selectors.init2Sound.textContent = ' / मौखिक ध्वनि / ';
    selectors.init2Word.textContent = ' शब्द ';
    selectors.closeButton.textContent = ' बंद करे ';

    selectors.footer1.textContent = ' ध्वन्यात्मक शब्द रेप्लिकेटर को लचीले होने के लिए बनाया गया है क्योंकि यह ट्रैक में विफलता के लिए इरादा नहीं है, लेकिन छात्रों / उपयोगकर्ताओं को सुधारने के उद्देश्य से इसका इस्तेमाल किया जाता है। ';
    selectors.footer1A.textContent = ' उपयोगकर्ता किसी भी बिंदु पर खेल को समाप्त कर सकते हैं जब तक कि प्रगति में है। ';
    selectors.footer1B.textContent = ' उपयोगकर्ता विस्तृत जानकारी के लिए सभी प्रयास किए गए प्रश्न, जीत दर, और यहां तक कि विस्तृत जानकारी के लिए एक शब्द पर क्लिक कर सकते हैं (इंटरनेट कनेक्शन आवश्यक)। इन सभी को या तो प्ले किया जा सकता है या तो प्रगति में है या नहीं। ';
    selectors.footer2.textContent = ' ध्वन्यात्मक शब्द रेप्लिकेटर 2 ध्वन्यात्मक मानकों पर केंद्रित है: ';
//    selectors.footer2A.textContent = '';
//    selectors.footer2B.textContent = '';
    selectors.footer3.textContent = ' उपयोगकर्ता तीन (3) सही शब्द प्राप्त करने के लिए प्रति प्रश्न प्रयास करता है। ';
    selectors.footer4.textContent = ' उपयोगकर्ता इतिहास से सभी प्रयास किए गए प्रश्नों को देख सकते हैं। ';
    selectors.footer5.textContent = ' उपयोगकर्ता किसी भी प्रयास किए गए शब्द पर क्लिक करके सभी प्रयास किए गए प्रश्नों पर अतिरिक्त जानकारी प्राप्त कर सकते हैं: ';
    selectors.footer5A.textContent = ' (इंटरनेट कनेक्शन की आवश्यकता ';
    selectors.footer5B.textContent = ' अंत खेलने पॉपअप। ';
    selectors.footer5C.textContent = ' इतिहास। ';
    selectors.footer5D.textContent = ' वर्तमान प्ले एरिया (स्क्रीन के दाईं ओर)। ';
    selectors.footer6.textContent = ' प्रयास किए गए शब्द पृष्ठभूमि रंग कोडिंग: ';
    selectors.footer6A.textContent = ' नीला ';
    selectors.footer6AA.textContent = ' 1 प्रयास पर सही शब्द मिला। ';
    selectors.footer6B.textContent = ' पीला ';
    selectors.footer6BA.textContent = ' 2 वें प्रयास पर सही शब्द मिला। ';
    selectors.footer6C.textContent = ' लाल ';
    selectors.footer6CA.textContent = ' 3 वें प्रयास पर सही शब्द मिला। ';
    selectors.footer6D.textContent = ' धूसर ';
    selectors.footer6DA.textContent = ' 3 प्रयासों के माध्यम से गलत जवाब। ';
    selectors.footer7.textContent = ' ध्वन्यात्मक शब्द रेप्लिकेटर 8 भाषाओं में पालतू है ';
    selectors.footer8.textContent = ' उपयोगकर्ता प्ले रिकॉर्ड भाषा के आधार पर सहेजे जाते हैं ';
    selectors.footer8A.textContent = ' 45,675 अंग्रेजी शब्द शामिल हैं। ';
    selectors.footer8B.textContent = ' 68,261 चीनी शब्द शामिल हैं। ';
    selectors.footer8C.textContent = ' 8,646 डच शब्द शामिल हैं। ';
    selectors.footer8D.textContent = ' 41,819 फ्रेंच शब्द शामिल। ';
    selectors.footer8E.textContent = ' 21,418 जर्मन शब्द शामिल। ';
    selectors.footer8F.textContent = ' 1,702 हिंदी शब्द शामिल। ';
    selectors.footer8G.textContent = ' 4,718 इतालवी शब्द शामिल। ';
    selectors.footer8H.textContent = ' 6,851 स्पैनिश शब्द शामिल हैं। ';
    selectors.footer9.textContent = ' आभार से: ';

} // END OF CHANGE HTML TO HINDI (((((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))))


// Change Html Language To Italia Language
let italiaHtml = function(){
    let selectors = appUISelectors().selectors();

    selectors.phoneticStandardsTitle.textContent = ' Standard fonetici ';
    selectors.hintsBtn.textContent = ' Mostra suggerimenti ';
    selectors.selectPreferedLanguage.textContent = ' Seleziona la lingua preferita ';
    selectors.endPlay.textContent = ' Termina il gioco ';
    selectors.winRateBtn.textContent = ' Visualizza la percentuale di vincita ';
    selectors.historyBtn.textContent = ' Visualizza tutte le domande tentate ';

    selectors.appTitle.textContent = ' Replicatore di parole fonetiche ';
    selectors.knowYour.textContent = ' Conosci il tuo ';
    selectors.phoneticSound.textContent = ' Suono fonetico! ';
    selectors.knowYourSpelling.textContent = ' Conosci la tua ortografia! ';
//    selectors.dictionary.textContent = '';
//    selectors.attemptedCount.textContent = '';
    selectors.typeInTheCorrectWord.textContent = ' Digita la parola corretta ';
    selectors.nextBtn.textContent = ' IL PROSSIMO ';
    selectors.tryAgainBtn.textContent = ' RIPROVA ';
    selectors.lastChanceBtn.textContent = ' ULTIMA POSSIBILITÀ ';

    selectors.oralSoundTitle.textContent = ' / Suono orale / ';
    selectors.oralSoundWord.textContent = ' Parola ';

    selectors.init2Sound.textContent = ' / Suono orale / ';
    selectors.init2Word.textContent = ' Parola ';
    selectors.closeButton.textContent = ' Presso ';

    selectors.footer1.textContent = ' Phonetic Word Replicator è progettato per essere flessibile in quanto non è destinato a tenere traccia dei guasti, ma è volto a migliorare la pronuncia degli studenti / utenti con l\'ortografia. ';
    selectors.footer1A.textContent = ' Gli utenti possono terminare il gioco in qualsiasi momento, purché il gioco sia in corso. ';
    selectors.footer1B.textContent = ' Gli utenti possono visualizzare tutte le domande tentate, la percentuale di vincita e persino fare clic su una parola tentata per informazioni dettagliate (connessione Internet richiesta). Tutti questi possono essere raggiunti O il gioco è in corso oppure no. ';
    selectors.footer2.textContent = ' Il replicatore di parole fonetiche si concentra su 2 standard fonetici: ';
//    selectors.footer2A.textContent = '';
//    selectors.footer2B.textContent = '';
    selectors.footer3.textContent = ' Gli utenti hanno tre (3) tentativi per domanda per ottenere la parola giusta. ';
    selectors.footer4.textContent = ' Gli utenti possono visualizzare tutte le domande tentate dalla cronologia. ';
    selectors.footer5.textContent = ' Gli utenti possono ottenere ulteriori informazioni su tutte le domande tentate facendo clic su qualsiasi parola tentata da: ';
    selectors.footer5A.textContent = ' (Connessione Internet richiesta. Codici colore spiegati di seguito) ';
    selectors.footer5B.textContent = ' Terminare Play Popup. ';
    selectors.footer5C.textContent = ' Storia. ';
    selectors.footer5D.textContent = ' Area di gioco corrente (sul lato destro dello schermo). ';
    selectors.footer6.textContent = ' Tentativo di codifica a colori per lo sfondo delle parole: ';
    selectors.footer6A.textContent = ' Blu ';
    selectors.footer6AA.textContent = ' Ho ottenuto la parola corretta al primo tentativo. ';
    selectors.footer6B.textContent = ' Giallo ';
    selectors.footer6BA.textContent = ' Ho ottenuto la parola corretta al secondo tentativo. ';
    selectors.footer6C.textContent = ' Rossa ';
    selectors.footer6CA.textContent = ' Ho ottenuto la parola corretta al terzo tentativo. ';
    selectors.footer6D.textContent = ' Grigio ';
    selectors.footer6DA.textContent = ' Risposte sbagliate per 3 tentativi. ';
    selectors.footer7.textContent = ' Il replicatore di parole fonetiche è addomesticato in 8 lingue ';
    selectors.footer8.textContent = ' Gli utenti riproducono i record vengono salvati in base alla riproduzione della lingua ';
    selectors.footer8A.textContent = ' 45,675 parole inglesi incluse. ';
    selectors.footer8B.textContent = ' 68,261 parole cinesi incluse. ';
    selectors.footer8C.textContent = ' 8,646 parole olandesi incluse. ';
    selectors.footer8D.textContent = ' 41,819 parole francesi incluse. ';
    selectors.footer8E.textContent = ' 21,418 parole tedesche incluse. ';
    selectors.footer8F.textContent = ' 1,702 parole hindi incluse. ';
    selectors.footer8G.textContent = ' 4,718 parole italiane incluse. ';
    selectors.footer8H.textContent = ' 6,851 palabras en español incluidas. ';
    selectors.footer9.textContent = ' Crediti a: ';

} // END OF CHANGE HTML TO ITALIA (((((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))))


// Change Html Language To Spnish Language
let spanishHtml = function(){
    let selectors = appUISelectors().selectors();

    selectors.phoneticStandardsTitle.textContent = ' Estándares fonéticos ';
    selectors.hintsBtn.textContent = ' Muestra pistas ';
    selectors.selectPreferedLanguage.textContent = ' Seleccionar idioma preferido ';
    selectors.endPlay.textContent = ' Fin de juego ';
    selectors.winRateBtn.textContent = ' Mostrar tasa de victorias ';
    selectors.historyBtn.textContent = ' Ver todas las preguntas intentadas ';

    selectors.appTitle.textContent = ' Replicador de palabras fonéticas ';
    selectors.knowYour.textContent = ' Conoce tu ';
    selectors.phoneticSound.textContent = ' Sonido fonético! ';
    selectors.knowYourSpelling.textContent = ' ¡Conoce tu ortografía! ';
//    selectors.dictionary.textContent = '';
//    selectors.attemptedCount.textContent = '';
    selectors.typeInTheCorrectWord.textContent = ' Escriba la palabra correcta ';
    selectors.nextBtn.textContent = ' SIGUIENTE ';
    selectors.tryAgainBtn.textContent = ' INTÉNTALO DE NUEVO ';
    selectors.lastChanceBtn.textContent = ' ÚLTIMA OPORTUNIDAD ';

    selectors.oralSoundTitle.textContent = ' / Sonido oral / ';
    selectors.oralSoundWord.textContent = ' Palabra ';

    selectors.init2Sound.textContent = ' / Sonido oral / ';
    selectors.init2Word.textContent = ' Palabra ';
    selectors.closeButton.textContent = ' Cerrar ';

    selectors.footer1.textContent = ' El replicador de palabras fonéticas está diseñado para ser flexible, ya que no está diseñado para rastrear fallas, sino que está destinado a mejorar la pronunciación de los estudiantes / usuarios con la ortografía. ';
    selectors.footer1A.textContent = ' Los usuarios pueden finalizar el juego en cualquier momento siempre que el juego esté en progreso. ';
    selectors.footer1B.textContent = ' Los usuarios pueden ver todas las preguntas intentadas, la tasa de ganancias e incluso hacer clic en una palabra intentada para obtener información detallada (se requiere conexión a Internet). Todo esto se puede lograr, ya sea que el juego esté en progreso o no. ';
    selectors.footer2.textContent = ' El replicador de palabras fonéticas se centra en 2 estándares fonéticos: ';
//    selectors.footer2A.textContent = '';
//    selectors.footer2B.textContent = '';
    selectors.footer3.textContent = ' Los usuarios tienen tres (3) intentos por pregunta para obtener la palabra correcta. ';
    selectors.footer4.textContent = ' Los usuarios pueden ver todas las preguntas intentadas del historial. ';
    selectors.footer5.textContent = ' Los usuarios pueden obtener información adicional sobre todas las preguntas intentadas haciendo clic en cualquier palabra intentada de: ';
    selectors.footer5A.textContent = ' (Se requiere conexión a Internet. La codificación de colores se explica a continuación) ';
    selectors.footer5B.textContent = ' Finalizando Play Popup. ';
    selectors.footer5C.textContent = ' Historia. ';
    selectors.footer5D.textContent = ' Área de juego actual (en el lado derecho de la pantalla). ';
    selectors.footer6.textContent = ' Código de color de fondo de palabras intentadas: ';
    selectors.footer6A.textContent = ' Azul ';
    selectors.footer6AA.textContent = ' Conseguí la palabra correcta en el 1er intento. ';
    selectors.footer6B.textContent = ' Amarilla ';
    selectors.footer6BA.textContent = ' Conseguí la palabra correcta en el segundo intento. ';
    selectors.footer6C.textContent = ' Roja ';
    selectors.footer6CA.textContent = ' Conseguí la palabra correcta en el tercer intento. ';
    selectors.footer6D.textContent = ' Gris ';
    selectors.footer6DA.textContent = ' Respuestas incorrectas a lo largo de 3 intentos. ';
    selectors.footer7.textContent = ' El replicador de palabras fonéticas se domestica en 8 idiomas ';
    selectors.footer8.textContent = ' Los registros de reproducción de los usuarios se guardan en función de la reproducción del idioma ';
    selectors.footer8A.textContent = ' 45,675 palabras en inglés incluidas. ';
    selectors.footer8B.textContent = ' 68,261 palabras chinas incluidas. ';
    selectors.footer8C.textContent = ' 8,646 palabras holandesas incluidas. ';
    selectors.footer8D.textContent = ' 41,819 palabras en francés incluidas. ';
    selectors.footer8E.textContent = ' 21,418 palabras alemanas incluidas. ';
    selectors.footer8F.textContent = ' 1,702 palabras en hindi incluidas. ';
    selectors.footer8G.textContent = ' 4,718 palabras en italiano incluidas. ';
    selectors.footer8H.textContent = '';
    selectors.footer9.textContent = 'Créditos para:';

} // END OF CHANGE HTML TO SPINSH (((((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))))




document.addEventListener('DOMContentLoaded', function () {
//    // Adjust Phonetics BTN With Dictionary Display
//    DOMLoaded();

    let selectLanguage = document.getElementById('select-language');

    // Set Language & Load Script Based On Selected Language
    let PWRLanguage = localStorage.getItem('PWR Language');

    if (PWRLanguage === null || PWRLanguage === '') {

        // Set English Language As The Default Script
        localStorage.setItem('PWR Language', 'English');

        // Change select-language Btn Image
        selectLanguage.className = 'btn btn-block btn-outline-secondary btn-block mt-5 mb-2';
        selectLanguage.style.backgroundImage = 'url(img/English.jpeg)';
        selectLanguage.style.backgroundSize = 'cover';
        selectLanguage.textContent = 'English';

        // Load English Script
        // Initialize AppCtrl
        AppCtrl.fetchedDico();

    } else if (PWRLanguage === 'Chinese') {

        // Change select-language Btn Image
        selectLanguage.className = 'btn btn-block btn-outline-dark btn-block mt-5 mb-2';
        selectLanguage.style.backgroundImage = 'url(img/Chinese.jpg)';
        selectLanguage.style.backgroundSize = 'cover';
        selectLanguage.textContent = 'Chinese';

        // Change HTML Language
        chineseHtml();

        // Load Chinese Script
        AppCtrlZh.fetchedDico();

    }else if (PWRLanguage === 'Dutch') {

        // Change select-language Btn Image
        selectLanguage.className = 'btn btn-block btn-outline-dark btn-block mt-5 mb-2';
        selectLanguage.style.backgroundImage = 'url(img/Dutch.jpg)';
        selectLanguage.style.backgroundSize = 'contain';
        selectLanguage.textContent = 'Dutch';

        // Change HTML Language
        dutchHtml();

        // Load Chinese Script
        AppCtrlNl.fetchedDico();

    } else if (PWRLanguage === 'French') {

        // Change select-language Btn Image
        selectLanguage.className = 'btn btn-block btn-outline-secondary btn-block mt-5 mb-2';
        selectLanguage.style.backgroundImage = 'url(img/french-flag.jpg)';
        selectLanguage.style.backgroundSize = 'cover';
        selectLanguage.textContent = 'French';

        frenchHtml();

        // Load French Script
        AppCtrlFr.fetchedDico();

    } else if (PWRLanguage === 'German') {

        // Change select-language Btn Image
        selectLanguage.className = 'btn btn-block btn-outline-success btn-block mt-5 mb-2';
        selectLanguage.style.backgroundImage = 'url(img/German.jpg)';
        selectLanguage.style.backgroundSize = 'contain';
        selectLanguage.textContent = 'German';

        germanHtml();

        // Load German Script
        AppCtrlDe.fetchedDico();

    } else if (PWRLanguage === 'Hindi') {

        // Change select-language Btn Image
        selectLanguage.className = 'btn btn-block btn-outline-secondary btn-block mt-5 mb-2';
        selectLanguage.style.backgroundImage = 'url(img/Hindi.jpg)';
        selectLanguage.style.backgroundSize = 'contain';
        selectLanguage.textContent = 'Hindi';

        hindiHtml();

        // Load Hindi Script
        AppCtrlHi.fetchedDico();

    } else if (PWRLanguage === 'Italia') {

        // Change select-language Btn Image
        selectLanguage.className = 'btn btn-block btn-outline-secondary btn-block mt-5 mb-2';
        selectLanguage.style.backgroundImage = 'url(img/italian.jpg)';
        selectLanguage.style.backgroundSize = 'cover';
        selectLanguage.textContent = 'Italia';

        // Change HTML Language
        italiaHtml();

        // Load Italia Script
        AppCtrlIt.fetchedDico();

    } else if (PWRLanguage === 'Spanish') {

        // Change select-language Btn Image
        selectLanguage.className = 'btn btn-block btn-outline-light btn-block mt-5 mb-2';
        selectLanguage.style.backgroundImage = 'url(img/Spanish.jpg)';
        selectLanguage.style.backgroundSize = 'contain';
        selectLanguage.textContent = 'Spanish';

        spanishHtml();

        // Load Spanish Script
        AppCtrlEs.fetchedDico();

    } else {

        // Change select-language Btn Image
        selectLanguage.className = 'btn btn-block btn-outline-secondary btn-block mt-5 mb-2';
        selectLanguage.style.backgroundImage = 'url(img/English.jpeg)';
        selectLanguage.style.backgroundSize = 'cover';
        selectLanguage.textContent = 'English';

        // Change select-language Btn Image
        selectLanguage.className = 'btn btn-block btn-outline-secondary btn-block mt-5 mb-2';
        selectLanguage.style.backgroundImage = 'url(img/English.jpeg)';
        selectLanguage.style.backgroundSize = 'cover';
        selectLanguage.textContent = 'English';

        // It's English, So Load English Script
        // Initialize AppCtrl
        AppCtrl.fetchedDico();
    }

});
