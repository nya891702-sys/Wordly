window.WordlyQuiz = (() => {
  let questions = [], index = 0, score = 0, answered = false, direction = "en-ja";
  const $ = id => document.getElementById(id);
  function shuffle(items){ return [...items].sort(()=>Math.random()-.5); }
  function start(words, count, dir){
    direction = dir;
    const pool = shuffle(words);
    questions = pool.slice(0, count === "all" ? pool.length : Math.min(Number(count), pool.length));
    index = 0; score = 0;
    $("quiz-setup").classList.add("hidden");
    $("quiz-result").classList.add("hidden");
    $("quiz-playing").classList.remove("hidden");
    render();
  }
  function render(){
    answered = false;
    const q = questions[index];
    $("quiz-progress").textContent = `${index+1} / ${questions.length}`;
    $("quiz-score").textContent = `正解 ${score}`;
    const prompt = direction === "en-ja" ? q.word : q.meanings[0];
    const answer = direction === "en-ja" ? q.meanings[0] : q.word;
    $("quiz-question").textContent = prompt;
    $("quiz-feedback").textContent = "";
    $("quiz-next").classList.add("hidden");
    const others = shuffle(window.WordlyWords.filter(w=>w.id!==q.id)).slice(0,3)
      .map(w=>direction==="en-ja"?w.meanings[0]:w.word);
    const choices = shuffle([answer,...others]);
    const root = $("quiz-choices"); root.innerHTML = "";
    choices.forEach(choice=>{
      const button=document.createElement("button");
      button.className="choice"; button.textContent=choice;
      button.addEventListener("click",()=>choose(button,choice,answer));
      root.appendChild(button);
    });
  }
  function choose(button, choice, answer){
    if(answered)return; answered=true;
    const buttons=[...$("quiz-choices").children];
    buttons.forEach(b=>{b.disabled=true;if(b.textContent===answer)b.classList.add("correct");});
    if(choice===answer){score++;$("quiz-feedback").textContent="正解！";}
    else{button.classList.add("wrong");$("quiz-feedback").textContent=`不正解。正解は「${answer}」`;}
    $("quiz-score").textContent=`正解 ${score}`;
    $("quiz-next").textContent=index===questions.length-1?"結果を見る":"次の問題";
    $("quiz-next").classList.remove("hidden");
  }
  function next(){
    if(!answered)return;
    index++;
    if(index>=questions.length){
      $("quiz-playing").classList.add("hidden");$("quiz-result").classList.remove("hidden");
      $("result-score").textContent=`${score} / ${questions.length}`;
      $("result-detail").textContent=`正答率 ${Math.round(score/questions.length*100)}%`;
    }else render();
  }
  return {start,next};
})();
