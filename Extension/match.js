function Wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

(async () => {
  const html = await fetch(window.location.href.toString().replace("/match", "")).then((res) => res.text());
  let terms = [];
  for (const [key, value] of Object.entries(
    JSON.parse(
      html.substring(
        html.indexOf('(function(){window.Quizlet["setPageData"] = ') +
        44,
        html.indexOf('; QLoad("Quizlet.setPageData");}).call(this)')
      )
    ).termIdToTermsMap
  )) {
    terms.push({
      term: value.word,
      definition: value.definition,
    });
  }

  while (document.querySelector(".MatchModeQuestionGridBoard") == null && document.querySelector(".MatchModeQuestionScatterBoard") == null) {
    await Wait(100);
  }

  let gameType = 0;
  if (document.querySelector(".MatchModeQuestionScatterBoard")) gameType = 1;

  switch (gameType) {
    case 0: {
      const gridElements = document.querySelectorAll(".MatchModeQuestionGridBoard-tile");
      let elements = [];
      for (el of gridElements) {
        elements.push({
          element: el,
          text: el.querySelector(".MatchModeQuestionGridTile-text").attributes["aria-label"].nodeValue
        })
      }

      for (el of elements) {
        const match = terms.map(t => {
          if (t.term == el.text) return { match: t.definition }
          if (t.definition == el.text) return { match: t.term }
        }).filter(t => t !== undefined)[0]
        let matchEl = elements.filter(e => e.text == match.match);
        matchEl = matchEl[matchEl.length - 1]

        el.element.style.border = "2px solid lime";
        matchEl.element.style.border = "2px solid lime";
        while (el.element.children.length > 0) {
          await Wait(100);
        }
        el.element.style.border = "none";
        matchEl.element.style.border = "none";
      }
      break;
    }
    case 1: {
      const gridElements = document.querySelectorAll(".MatchModeQuestionScatterTile");
      let elements = [];
      for (el of gridElements) {
        elements.push({
          element: el,
          text: el.querySelector(".TermText").attributes["aria-label"].nodeValue
        })
      }

      for (el of elements) {
        const match = terms.map(t => {
          if (t.term == el.text) return { match: t.definition }
          if (t.definition == el.text) return { match: t.term }
        }).filter(t => t !== undefined)[0]
        let matchEl = elements.filter(e => e.text == match.match);
        matchEl = matchEl[matchEl.length - 1]

        el.element.style.border = "2px solid lime";
        matchEl.element.style.border = "2px solid lime";
        while (!el.element.className.includes("is-correct")) {
          await Wait(100);
        }
      }
      break;
    }
  }
})()