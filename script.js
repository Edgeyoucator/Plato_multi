let placements = {
  image: [null, null, null, null, null, null],
  caption: [null, null, null, null, null, null]
};

let draggedElement = null;
let draggedType = null;

const db = firebase.database();

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
    zone.addEventListener("dragover", e => e.preventDefault(), { capture: true });

    const dropHandler = () => {
      if (!draggedElement) return;

      const slot = +zone.dataset.slot;
      const zoneType = zone.dataset.type;

      if (zoneType !== draggedType || zone.classList.contains("locked")) return;

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

      db.ref("sharedState/placements").set(placements);
      checkFinalPassword();
    };

    zone.addEventListener("drop", dropHandler, { capture: true });
  });

  allBanks.forEach(bank => {
    bank.addEventListener("dragover", e => e.preventDefault(), { capture: true });

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

      db.ref("sharedState/placements").set(placements);
      checkFinalPassword();
    }, { capture: true });
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

      checkFinalPassword();
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

  // 🔁 Firebase sync listener with null guard
  db.ref("sharedState/placements").on("value", snapshot => {
    const data = snapshot.val();
    if (!data) return;

    placements = data;

    ["image", "caption"].forEach(type => {
      placements[type].forEach((id, index) => {
        const zone = document.querySelector(`.drop-zone[data-type="${type}"][data-slot="${index}"]`);
        if (!zone) return;

        if (!id) {
          const existing = zone.querySelector(".draggable");
          if (existing) {
            const bank = document.querySelector(`.drag-items[data-type="${type}"]`);
            if (bank) {
              bank.appendChild(existing);
              attachDragEvents(existing);
            } else {
              existing.remove();
            }
          }
          return;
        }

        const el = document.querySelector(`.draggable[data-id="${id}"]`);

        if (!el) return;

        const currentParent = el.parentElement;
        if (currentParent && currentParent !== zone && currentParent.classList.contains("drop-zone")) {
          if (currentParent.contains(el)) currentParent.removeChild(el);
        }

        if (!zone.contains(el)) {
          zone.appendChild(el);
          attachDragEvents(el);
        }
      });
    });
  });

  // 🔒 Ensure initial placements exist
  db.ref("sharedState/placements").once("value").then(snapshot => {
    if (!snapshot.exists()) {
      db.ref("sharedState/placements").set(placements);
    }
  });
});
