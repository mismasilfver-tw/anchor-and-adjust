// Anchor & Adjust Demo App
// Simple static app using localStorage

(function () {
  const LS_KEYS = {
    selectedQuestionId: 'aa_selected_question_id',
    lastAnchor: 'aa_last_anchor',
    lastResult: 'aa_last_result',
  };

  // Question database (hardcoded)
  const QUESTIONS = [
    {
      id: 'q1',
      text:
        'We are modifying flight card styling in the flight select page. We are going to change the shadow effect, hover effect and size of the prices. How many points you think the change will be?',
    },
    {
      id: 'q2',
      text:
        'Customer has asked you to estimate what it takes to modify existing API end point that fetches information about used car listing. Customer wants to add information whether the car has been crashed before or not. What would be your estimate for the change in points',
    },
    {
      id: 'q3',
      text:
        'Customer has asked estimate of effort for changing the passenger information page. We want to change the passenger information to have large yellow boxes around each filed that is required, to help customer quickly find information they need to fill out. What would be your estimate for the change in points?',
    },
  ];

  // Elements
  const questionSelectSection = document.getElementById('question-select-section');
  const questionSelect = document.getElementById('question-select');
  const btnSelectQuestion = document.getElementById('btn-select-question');

  const questionDisplaySection = document.getElementById('question-display-section');
  const questionText = document.getElementById('question-text');
  const btnHideQuestion = document.getElementById('btn-hide-question');

  const diceSection = document.getElementById('dice-section');
  const diceHeading = diceSection.querySelector('h2');
  const anchorChoiceEl = diceSection.querySelector('.anchor-choice');
  const btnRoll = document.getElementById('btn-roll');
  const die1El = document.getElementById('die1');
  const die2El = document.getElementById('die2');
  const rollResultEl = document.getElementById('roll-result');

  const postRollSection = document.getElementById('post-roll-section');
  const btnHideResults = document.getElementById('btn-hide-results');

  const anchorRadios = () => Array.from(document.querySelectorAll('input[name="anchor"]'));

  // Helpers
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function load(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function show(el) {
    el.classList.remove('hidden');
  }
  function hide(el) {
    el.classList.add('hidden');
  }

  function populateQuestions() {
    // Clear
    questionSelect.innerHTML = '';
    QUESTIONS.forEach((q, idx) => {
      const opt = document.createElement('option');
      opt.value = q.id;
      opt.textContent = `${idx + 1}. ${q.text.slice(0, 80)}${q.text.length > 80 ? '…' : ''}`;
      questionSelect.appendChild(opt);
    });

    const savedId = load(LS_KEYS.selectedQuestionId, QUESTIONS[0].id);
    const found = QUESTIONS.find((q) => q.id === savedId);
    questionSelect.value = found ? savedId : QUESTIONS[0].id;
  }

  function getSelectedQuestion() {
    const id = questionSelect.value;
    const q = QUESTIONS.find((q) => q.id === id) || QUESTIONS[0];
    return q;
  }

  function displayQuestion(q) {
    questionText.textContent = q.text;
  }

  // Dice logic
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Pick a total according to selected anchor
  // low (near 3): totals in [2,3,4,5]
  // high (near 9): totals in [8,9,10]
  function pickLoadedTotal(anchor) {
    if (anchor === 'low') {
      const options = [2, 3, 4, 5];
      // Slightly weight towards 3 and 4 to keep it around the anchor
      const weights = [1, 3, 3, 1];
      return weightedPick(options, weights);
    } else {
      const options = [8, 9, 10];
      // Slightly weight toward 9
      const weights = [2, 3, 2];
      return weightedPick(options, weights);
    }
  }

  function weightedPick(values, weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < values.length; i++) {
      if ((r -= weights[i]) <= 0) return values[i];
    }
    return values[values.length - 1];
  }

  // Given a total T between 2 and 12, pick two die faces (1..6) uniformly among valid pairs.
  function pickDiceForTotal(total) {
    const pairs = [];
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = 1; d2 <= 6; d2++) {
        if (d1 + d2 === total) pairs.push([d1, d2]);
      }
    }
    if (pairs.length === 0) return [1, 1];
    return pairs[randomInt(0, pairs.length - 1)];
  }

  function setDiceFaces(d1, d2) {
    die1El.textContent = d1;
    die2El.textContent = d2;
  }

  function clearDice() {
    setDiceFaces('-', '-');
    hide(rollResultEl);
    rollResultEl.textContent = '';
  }

  function hideDiceSelection() {
    hide(diceHeading);
    hide(anchorChoiceEl);
    hide(btnRoll);
  }

  function showDiceSelection() {
    show(diceHeading);
    show(anchorChoiceEl);
    show(btnRoll);
  }

  // Animation then loaded result
  function animateAndRoll(anchor) {
    const ANIM_MS = 1200;
    const TICK_MS = 80;

    let elapsed = 0;
    // During the roll, hide selection UI to show only dice
    hideDiceSelection();
    diceSection.classList.add('rolling');
    const anim = setInterval(() => {
      setDiceFaces(randomInt(1, 6), randomInt(1, 6));
      elapsed += TICK_MS;
      if (elapsed >= ANIM_MS) {
        clearInterval(anim);
        diceSection.classList.remove('rolling');
        // Loaded outcome
        const total = pickLoadedTotal(anchor);
        const [d1, d2] = pickDiceForTotal(total);
        setDiceFaces(d1, d2);
        rollResultEl.textContent = `Result: ${d1} + ${d2} = ${total}`;
        show(rollResultEl);
        // Keep selection hidden while showing result
        hideDiceSelection();
        diceSection.classList.add('showing-result');
        save(LS_KEYS.lastAnchor, anchor);
        save(LS_KEYS.lastResult, { d1, d2, total, ts: Date.now() });
        // Show post-roll controls
        show(postRollSection);
      }
    }, TICK_MS);
  }

  function resetAnchorChoice() {
    anchorRadios().forEach((r) => (r.checked = false));
    btnRoll.disabled = true;
  }

  // Event bindings
  function bindEvents() {
    btnSelectQuestion.addEventListener('click', () => {
      const q = getSelectedQuestion();
      save(LS_KEYS.selectedQuestionId, q.id);
      displayQuestion(q);
      hide(questionSelectSection);
      show(questionDisplaySection);
    });

    btnHideQuestion.addEventListener('click', () => {
      hide(questionDisplaySection);
      clearDice();
      resetAnchorChoice();
      showDiceSelection();
      show(diceSection);
    });

    anchorRadios().forEach((r) =>
      r.addEventListener('change', () => {
        const hasSelection = anchorRadios().some((x) => x.checked);
        btnRoll.disabled = !hasSelection;
        if (hasSelection) {
          // Hide the anchor choice immediately after selection
          hide(anchorChoiceEl);
        }
      })
    );

    btnRoll.addEventListener('click', () => {
      btnRoll.disabled = true;
      const selected = anchorRadios().find((r) => r.checked);
      const anchor = selected ? selected.value : 'low';
      animateAndRoll(anchor);
    });

    btnHideResults.addEventListener('click', () => {
      hide(postRollSection);
      // Reset state classes and show question again
      diceSection.classList.remove('rolling');
      diceSection.classList.remove('showing-result');
      hide(diceSection);
      // Return to question selection so user can pick a different question
      show(questionSelectSection);
      hide(questionDisplaySection);
      // Reset selection UI for next roll
      show(diceHeading);
      show(btnRoll);
      // Keep anchor choice visible again so user can choose new anchor
      show(anchorChoiceEl);
      // Clear anchor radios for clarity (optional)
      anchorRadios.forEach(r => (r.checked = false));
      // Hide any previous roll result text
      hide(rollResultEl);
    });
  }

  function restoreQuestionIfAny() {
    const savedId = load(LS_KEYS.selectedQuestionId, null);
    if (savedId) {
      const q = QUESTIONS.find((x) => x.id === savedId);
      if (q) {
        questionSelect.value = q.id;
        displayQuestion(q);
      }
    }
  }

  function init() {
    populateQuestions();
    bindEvents();
    // If user previously selected a question, show it immediately
    const savedId = load(LS_KEYS.selectedQuestionId, null);
    if (savedId) {
      hide(questionSelectSection);
      show(questionDisplaySection);
      restoreQuestionIfAny();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
