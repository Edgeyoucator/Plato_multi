const placements = {
  image: [null, null, null, null, null, null],
  caption: [null, null, null, null, null, null]
};

let draggedElement = null;
let draggedType = null;

document.addEventListener("DOMContentLoaded", () => {
  const dropZones = document.querySelectorAll(".drop-zone");
  const allBanks = document.querySelectorAll(".drag-items");
  const passwordField = document.getElementById("passwordField");

  function attachDragEvents(el) {
    el.setAttribute("draggable", "true");

    if (el.dataset.dragEventsAttached === "true") return;
    el.dataset.dragEventsAttached = "true";

    el.addEventListener("dragstart", () => {
      draggedElement = el;
      const parentBank = el.closest(".drag-items");
      draggedType = parentBank ? parentBank.dataset.type : el.closest(".drop-zone")?.dataset.type;
      el.classList.add("dragging");
      setTimeout(() => el.classList.add("hidden"), 0);
    });

    el.addEventListener("dragend", () => {
      if (draggedElement) draggedElement.classList.remove("hidden", "dragging");
      draggedElement = null;
      draggedType = null;
    });
  }

  document.querySelectorAll(".draggable").forEach(attachDragEvents);

  dropZones.forEach(zone => {
    zone.addEventListener("dragover", e => e.preventDefault());

    zone.addEventListener("drop", () => {
      if (!draggedElement) return;

      const slot = +zone.dataset.slot;
      const zoneType = zone.dataset.type;

      if (zoneType !== draggedType) return;
      if (zone.classList.contains("locked")) return;

      if (zone.firstChild) {
        const existingItem = zone.firstChild;
        const correctBank = document.querySelector(`.drag-items[data-type="${zoneType}"]`);
        if (correctBank) correctBank.appendChild(existingItem);
      }

      ["image", "caption"].forEach(type => {
        placements[type] = placements[type].map(id =>
          id === draggedElement.dataset.id ? null : id
        );
      });

      placements[zoneType][slot] = draggedElement.dataset.id;
      zone.appendChild(draggedElement);
      attachDragEvents(draggedElement);

      checkFinalPassword(); // <- added here
    });
  });

  allBanks.forEach(bank => {
    bank.addEventListener("dragover", e => e.preventDefault());

    bank.addEventListener("drop", () => {
      if (!draggedElement) return;

      const bankType = bank.dataset.type;
      if (bankType !== draggedType) return;

      ["image", "caption"].forEach(type => {
        placements[type] = placements[type].map(id =>
          id === draggedElement.dataset.id ? null : id
        );
      });

      bank.appendChild(draggedElement);
      attachDragEvents(draggedElement);

      checkFinalPassword(); // <- also check here
    });
  });

  const correctPairs = [
    { image: "E", caption: "3" },
    { image: "F", caption: "2" },
    { image: "C", caption: "4" },
    { image: "A", caption: "6" },
    { image: "D", caption: "1" },
    { image: "B", caption: "5" }
  ];

  document.querySelectorAll(".check-btn").forEach(button => {
    button.addEventListener("click", () => {
      const slot = +button.parentElement.dataset.slot;
      const imgId = placements.image[slot];
      const capId = placements.caption[slot];

      const isCorrect =
        imgId === correctPairs[slot].image &&
        capId === correctPairs[slot].caption;

      const resultIcon = document.createElement("span");
      resultIcon.classList.add("check-icon", isCorrect ? "correct" : "incorrect");
      resultIcon.textContent = isCorrect ? "✔" : "✖";

      button.replaceWith(resultIcon);

      if (isCorrect) {
        document.querySelectorAll(`.drop-zone[data-slot="${slot}"]`).forEach(zone => {
          zone.classList.add("locked");
          const item = zone.querySelector(".draggable");
          if (item) item.setAttribute("draggable", "false");
        });
      } else {
        setTimeout(() => {
          resultIcon.replaceWith(button);
        }, 1500);
      }

      checkFinalPassword(); // <- also check on check
    });
  });

  function checkFinalPassword() {
    for (let i = 0; i < 6; i++) {
      if (
        placements.image[i] !== correctPairs[i].image ||
        placements.caption[i] !== correctPairs[i].caption
      ) {
        passwordField.value = "";
        return;
      }
    }

    passwordField.value = "reality";
  }
});
