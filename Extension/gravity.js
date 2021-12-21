alert("Quizizz Rocks will autofill the answer, you just have to press space then enter")

function Wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function removeFormatCharacters(input) {
  return input
    .replace(/(&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});)+/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/ {2,}/g, " ");
}

(async () => {
  const html = await fetch(window.location.href.toString().replace("/gravity", "")).then((res) => res.text());
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
      term: value.word.replace(/\r?\n|\r/g, " "),
      definition: value.definition.replace(/\r?\n|\r/g, " "),
    });
  }

  let pastQuestion = "";
  while (true) {
    try {
      if (document.querySelector(".GravityTerm-text > span")) {
        const text = removeFormatCharacters(document.querySelector(".GravityTerm-text > span").innerHTML);
        console.log(text);
        const inputField = document.querySelector(".GravityTypingPrompt-input");
        if (text !== pastQuestion || inputField.value === "") {
          pastQuestion = text;
          let correct = terms.map(t => {
            if (t.term == text) return t.definition;
            if (t.definition == text) return t.term;
          }).filter(t => t !== undefined);
          correct = correct[correct.length - 1];
          inputField.value = correct;
        }
      }
    } catch { }
    await Wait(100)
  }
})()



// equation of the mirror line <br>eg y = 3