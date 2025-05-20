let firstCard = null;
let secondCard = null;
let lockBoard = false;
let clickCount = 0;
let matchedPairs = 0;
let totalPairs = 0;
let timer = 0;
let timerInterval;
let powerupUses = 0;
const maxPowerupUses = 2;

function GameStart() {
  clearInterval(timerInterval);
  resetGameState();

  const difficulty = $("#difficulty").val();
  totalPairs = difficulty === "easy" ? 6 : difficulty === "medium" ? 9 : 12;
  $("#matched").text(0);
  $("#clicks").text(0);
  $("#remaining").text(totalPairs);
  $("#timer").text(0);

  fetch("https://pokeapi.co/api/v2/pokemon?limit=1000")
    .then(res => res.json())
    .then(data => {
      const pokemonList = data.results;
      const chosen = [];

      while (chosen.length < totalPairs) {
        const idx = Math.floor(Math.random() * pokemonList.length);
        const poke = pokemonList[idx];
        if (!chosen.find(p => p.name === poke.name)) {
          chosen.push(poke);
        }
      }

      return Promise.all(chosen.map(p =>
        fetch(p.url)
          .then(res => res.json())
          .then(details => {
            const img = details.sprites.other["official-artwork"].front_default;
            if (!img) throw new Error("No image");
            return {
              name: details.name,
              img
            };
          })
      )).catch(() => {
        // If any image is invalid, restart the game to fetch new set
        GameStart();
      });
    })
    .then(pokemonCards => {
      const allCards = shuffle([...pokemonCards, ...pokemonCards]);
      renderCards(allCards);
      startTimer(difficulty);
    });
}

function renderCards(cards) {
  $("#game_grid").empty();
  cards.forEach((poke, index) => {
    const card = $(`
      <div class="col-4 col-sm-3 col-md-2">
        <div class="card" data-name="${poke.name}">
          <img class="front_face" src="${poke.img}" alt="${poke.name}">
          <img class="back_face" src="back.webp" alt="Pokéball">
        </div>
      </div>
    `);
    $("#game_grid").append(card);
  });

  $(".card").on("click", handleCardClick);
}

function handleCardClick() {
  if (lockBoard || $(this).hasClass("flip")) return;

  $(this).addClass("flip");
  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  lockBoard = true;
  clickCount++;
  $("#clicks").text(clickCount);

  const name1 = $(firstCard).data("name");
  const name2 = $(secondCard).data("name");

  if (name1 === name2) {
    matchedPairs++;
    $("#matched").text(matchedPairs);
    $("#remaining").text(totalPairs - matchedPairs);
    $(firstCard).off("click").addClass("matched");
    $(secondCard).off("click").addClass("matched");
    $(firstCard).off("click");
    $(secondCard).off("click");
    resetTurn();

    if (matchedPairs === totalPairs) {
      clearInterval(timerInterval);
      setTimeout(() => {
        alert("🎉 You win!");
        window.location.href = "index.html";
      }, 100); // allow DOM to settle before redirect
    } 
  } else {
    setTimeout(() => {
      $(firstCard).removeClass("flip");
      $(secondCard).removeClass("flip");
      resetTurn();
    }, 1000);
  }
}

function resetTurn() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

function startTimer(difficulty) {
  timer = difficulty === "easy" ? 60 : difficulty === "medium" ? 90 : 120;
  $("#timer").text(timer);

  timerInterval = setInterval(() => {
    timer--;
    $("#timer").text(timer);
    if (timer <= 0) {
      clearInterval(timerInterval);
      lockBoard = true;
      setTimeout(() => {
        alert("⏰ Time's up! Game Over.");
        window.location.href = "index.html";
      }, 100);
    }
  }, 1000);
}

function resetGameState() {
  powerupUses = 0;
  powerupCooldown = false;
  $("#game_grid").empty();
  [firstCard, secondCard] = [null, null];
  [clickCount, matchedPairs] = [0, 0];
  lockBoard = false;
  $("#clicks").text(0);
  $("#matched").text(0);
  $("#remaining").text(0);
  $("#timer").text(0);
  $("#powerup").prop("disabled", false);

}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

$("#start").on("click", GameStart);
$("#reset").on("click", GameStart);
let currentTheme = 1;
$("#theme").on("click", () => {
  currentTheme = currentTheme % 3 + 1;
  $("body").removeClass("theme-1 theme-2 theme-3").addClass(`theme-${currentTheme}`);
});
$("#powerup").on("click", () => {
  if (powerupCooldown || powerupUses >= maxPowerupUses) return;

  powerupUses++;
  powerupCooldown = true;
  $("#powerup").prop("disabled", true);


  $(".card").each(function () {
    const isMatched = $(this).hasClass("matched");
    if (!isMatched) {
      $(this).addClass("flip temp-flip");
    }
  });


  setTimeout(() => {
    $(".temp-flip").each(function () {
      
      const isMatched = $(this).hasClass("matched");
      if (!isMatched) {
        $(this).removeClass("flip");
      }
      $(this).removeClass("temp-flip"); 
    });
  }, 1000);

  
  setTimeout(() => {
    powerupCooldown = false;
    if (powerupUses < maxPowerupUses) {
      $("#powerup").prop("disabled", false);
    }
  }, 30000);
});

