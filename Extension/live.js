class QuizletRocks {
  constructor() {
    this.pin = 0;
    this.teamMode = false;
    this.terms = [];
    this.gotPin = false;
    this.markedAnswer = false;
    this.questionText = "";
    this.StartWatchQuestions();
  }

  async StartWatchQuestions() {
    if (document.querySelector(".StudentPrompt") === null) {
      setTimeout(function () {
        window.QuizletRocks.StartWatchQuestions();
      }, 100);
    } else {
      window.QuizletRocks.WatchQuestions();
    }
  }

  async WatchQuestions() {
    this.watchQuestionInterval = setInterval(() => {
      let questionText = document.querySelector(".StudentPrompt-text div");
      if (questionText === null) {
        this.questionText = "";
        clearInterval(this.watchQuestionInterval);
        delete window.QuizletRocks;
      } else {
        questionText = questionText.innerHTML;
        if (this.questionText != questionText) {
          this.HighlightCorrectAnswer();
          this.questionText = questionText;
        }
      }
    }, 200);
  }

  GetTerms(pin) {
    this.gotPin = true;
    this.pin = pin;
    fetch(
      `https://quizlet.com/webapi/3.2/game-instances?filters={"gameCode":${this.pin},"isInProgress":true,"isDeleted":false}&perPage=500`
    )
      .then((res) => res.json())
      .then(async (json) => {
        if (json.responses[0].models.gameInstance.length > 0) {
          const itemId = json.responses[0].models.gameInstance[0].itemId;
          const html = await fetch(
            `https://quizlet.com/${itemId}/`
          ).then((res) => res.text());
          this.terms = [];
          for (const [key, value] of Object.entries(
            JSON.parse(
              html.substring(
                html.indexOf('(function(){window.Quizlet["setPageData"] = ') +
                44,
                html.indexOf('; QLoad("Quizlet.setPageData");}).call(this)')
              )
            ).termIdToTermsMap
          )) {
            this.terms.push({
              term: value.word,
              definition: value.definition,
            });
          }
          this.HighlightCorrectAnswer();
        }
      });
  }

  HighlightCorrectAnswer() {
    try {
      if (document.querySelector(".StudentPrompt-text div") !== null) {
        let questionTextEl = document.querySelector(".StudentPrompt-text div");
        let answers = window.QuizletRocks.terms
          .map((t) =>
            t.term == questionTextEl.innerHTML
              ? t.definition
              : t.definition == questionTextEl.innerHTML
                ? t.term
                : null
          )
          .filter((a) => a !== null);
        let answerBtns = document.querySelectorAll(
          ".StudentAnswerOptions-optionCard > .StudentAnswerOption > button"
        );
        let gotAnswer = false;
        answerBtns.forEach((b) => {
          if (
            JSON.stringify(
              b.querySelector(".StudentAnswerOption-text").attributes[
                "aria-label"
              ].nodeValue
            ) === JSON.stringify(answers[0])
          ) {
            gotAnswer = true;
            b.style.border = "5px solid green";
          } else b.style.border = "";
        });
        if (!gotAnswer && answers.length > 0) {
          alert(`Correct answer: ${answers[0]}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

window.QuizletRocks = new QuizletRocks();

chrome.runtime.onMessage.addListener(function (msg) {
  if (msg.gamePin && !window.QuizletRocks.gotPin)
    window.QuizletRocks.GetTerms(msg.gamePin);
});
