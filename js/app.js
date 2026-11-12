(() => {
  const $ = id => document.getElementById(id);
  let allWords = [], shownWords = [], wordIndex = 0;
  const setLoading=(message,detail,progress)=>{$("loading-message").textContent=message;$("loading-detail").textContent=detail;$("loading-progress").style.width=progress+"%";};
  const fail=message=>{$("loading-screen").classList.add("hidden");$("error-screen").classList.remove("hidden");$("error-message").textContent=message;};
  async function loadData(){
    try{
      setLoading("バージョン情報を確認しています...","versions.json を読み込み中",10);
      const manifestResponse=await fetch("data/versions.json",{cache:"no-store"});
      if(!manifestResponse.ok)throw new Error("data/versions.json を読み込めません。");
      const manifest=await manifestResponse.json();
      if(!manifest.latest||!Array.isArray(manifest.versions)||!manifest.versions.length)throw new Error("versions.json の形式が正しくありません。");
      if(!manifest.versions.includes(manifest.latest))throw new Error("latest に指定されたバージョンが一覧にありません。");
      const combined=[], ids=new Set(), words=new Set();
      for(let i=0;i<manifest.versions.length;i++){
        const version=manifest.versions[i];
        setLoading("単語データを読み込んでいます...",`${version} (${i+1}/${manifest.versions.length})`,20+Math.round((i/manifest.versions.length)*65));
        const response=await fetch(`data/versions/${version}.json`,{cache:"no-store"});
        if(!response.ok)throw new Error(`${version}.json を読み込めません。ファイル名と配置を確認してください。`);
        const data=await response.json();
        if(data.version!==version||!Array.isArray(data.words))throw new Error(`${version}.json のデータ形式が正しくありません。`);
        for(const w of data.words){
          if(!w.id||!w.word||!Array.isArray(w.meanings)||!w.meanings.length)throw new Error(`${version}.json に必須項目が不足した単語があります。`);
          const normalized=w.word.trim().toLowerCase();
          if(ids.has(w.id))throw new Error(`単語IDが重複しています: ${w.id}`);
          if(words.has(normalized))throw new Error(`単語が重複しています: ${w.word}`);
          ids.add(w.id);words.add(normalized);
          combined.push({...w,pronunciation:w.pronunciation||"",partOfSpeech:w.partOfSpeech||""});
        }
      }
      if(!combined.length)throw new Error("単語データが0件です。");
      allWords=combined;window.WordlyWords=combined;window.WordlyVersion=manifest.latest;
      $("header-version").textContent=manifest.latest;$("home-version").textContent=manifest.latest;
      setLoading("起動しています...","単語データの確認が完了しました",100);
      setTimeout(()=>{$("loading-screen").classList.add("hidden");$("app").classList.remove("hidden");},250);
    }catch(error){fail(error.message||"不明なエラーが発生しました。");}
  }
  function showView(name){
    document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
    $(`${name}-view`).classList.remove("hidden");
    if(name==="words")refreshWords();
    if(name==="quiz")resetQuiz();
  }
  function refreshWords(){
    const term=$("word-search").value.trim().toLowerCase();
    shownWords=allWords.filter(w=>w.word.toLowerCase().includes(term)||w.meanings.some(m=>m.toLowerCase().includes(term)));
    wordIndex=Math.min(wordIndex,Math.max(0,shownWords.length-1));
    $("word-total").textContent=`${shownWords.length}語`;
    renderCard();
  }
  function renderCard(){
    const card=$("flashcard");card.classList.remove("flipped");
    if(!shownWords.length){
      $("card-word").textContent="見つかりません";
      $("card-pronunciation").textContent="";$("card-pos").textContent="";
      $("card-meaning").textContent="検索条件を変更してください";
      $("card-counter").textContent="0 / 0";$("card-progress-bar").style.width="0%";
      $("previous-word").disabled=true;$("next-word").disabled=true;return;
    }
    const w=shownWords[wordIndex];
    $("card-word").textContent=w.word;
    $("card-pronunciation").textContent=w.pronunciation;
    $("card-pos").textContent=w.partOfSpeech;
    $("card-meaning").textContent=w.meanings.join("、");
    $("card-back-pos").textContent=w.partOfSpeech;
    $("card-counter").textContent=`${wordIndex+1} / ${shownWords.length}`;
    $("card-progress-bar").style.width=`${(wordIndex+1)/shownWords.length*100}%`;
    $("previous-word").disabled=wordIndex===0;
    $("next-word").disabled=wordIndex===shownWords.length-1;
  }
  function resetQuiz(){
    $("quiz-setup").classList.remove("hidden");$("quiz-playing").classList.add("hidden");$("quiz-result").classList.add("hidden");
  }
  document.addEventListener("click",e=>{
    const target=e.target.closest("[data-view]");
    if(target)showView(target.dataset.view);
  });
  $("flashcard").addEventListener("click",()=>{if(shownWords.length)$("flashcard").classList.toggle("flipped");});
  $("previous-word").addEventListener("click",()=>{if(wordIndex>0){wordIndex--;renderCard();}});
  $("next-word").addEventListener("click",()=>{if(wordIndex<shownWords.length-1){wordIndex++;renderCard();}});
  $("word-search").addEventListener("input",()=>{wordIndex=0;refreshWords();});
  $("start-quiz").addEventListener("click",()=>{
    if(allWords.length<4){alert("四択クイズには4語以上必要です。");return;}
    window.WordlyQuiz.start(allWords,$("quiz-count").value,$("quiz-direction").value);
  });
  $("quiz-next").addEventListener("click",()=>window.WordlyQuiz.next());
  $("retry-quiz").addEventListener("click",resetQuiz);
  loadData();
})();
