(function () {
  const status = document.getElementById("status");
  const bankLogoPreview = document.getElementById("bankLogoPreview");
  const accountLogoPreview = document.getElementById("accountLogoPreview");
  let saveTimer = 0;
  let applying = false;

  function inputs() {
    return Array.prototype.slice.call(document.querySelectorAll("input[name]"));
  }

  function fill(state) {
    applying = true;
    inputs().forEach(function (input) {
      if (input.type === "checkbox") {
        input.checked = Boolean(state[input.name]);
      } else if (input.type === "number") {
        input.value = state[input.name];
      } else {
        input.value = state[input.name] == null ? "" : state[input.name];
      }
    });
    document.querySelector("[name=totalAssets]").disabled = Boolean(state.syncAssetsToBalance);
    if (state.syncAssetsToBalance) {
      document.querySelector("[name=totalAssets]").value = state.balance;
    }
    bankLogoPreview.src = state.bankLogo || "";
    accountLogoPreview.src = state.accountLogo || "";
    applying = false;
  }

  function readPartial() {
    const partial = {};
    inputs().forEach(function (input) {
      if (input.type === "checkbox") {
        partial[input.name] = input.checked;
      } else if (input.type === "number") {
        partial[input.name] = input.value === "" ? 0 : Number(input.value);
      } else {
        partial[input.name] = input.value;
      }
    });
    if (!partial.initials.trim()) {
      partial.initials = BankStore.initialsFromName(partial.firstName, partial.lastName);
    }
    return partial;
  }

  function flash(message) {
    status.textContent = message;
  }

  function queueSave() {
    if (applying) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      BankStore.save(readPartial()).then(function () {
        flash("Saved — dashboard updated.");
      });
    }, 160);
  }

  inputs().forEach(function (input) {
    input.addEventListener("input", function () {
      if (input.name === "firstName" || input.name === "lastName") {
        const initials = document.querySelector("[name=initials]");
        if (!initials.dataset.manual) {
          initials.value = BankStore.initialsFromName(
            document.querySelector("[name=firstName]").value,
            document.querySelector("[name=lastName]").value
          );
        }
      }
      if (input.name === "initials") input.dataset.manual = "1";
      if (input.name === "syncAssetsToBalance") {
        document.querySelector("[name=totalAssets]").disabled = input.checked;
      }
      if (
        (input.name === "balance" || input.name === "syncAssetsToBalance") &&
        document.querySelector("[name=syncAssetsToBalance]").checked
      ) {
        document.querySelector("[name=totalAssets]").value =
          document.querySelector("[name=balance]").value;
      }
      queueSave();
    });
    input.addEventListener("change", queueSave);
  });

  async function onLogo(input, key, preview) {
    const file = input.files && input.files[0];
    if (!file) return;
    const dataUrl = await BankStore.fileToDataUrl(file);
    preview.src = dataUrl;
    await BankStore.save({ [key]: dataUrl });
    flash("Logo updated.");
    input.value = "";
  }

  document.getElementById("bankLogoFile").addEventListener("change", function (event) {
    onLogo(event.target, "bankLogo", bankLogoPreview);
  });
  document.getElementById("accountLogoFile").addEventListener("change", function (event) {
    onLogo(event.target, "accountLogo", accountLogoPreview);
  });
  document.getElementById("clearBankLogo").addEventListener("click", function () {
    bankLogoPreview.src = "";
    BankStore.save({ bankLogo: "" }).then(function () {
      flash("Header logo reset.");
    });
  });
  document.getElementById("clearAccountLogo").addEventListener("click", function () {
    accountLogoPreview.src = "";
    BankStore.save({ accountLogo: "" }).then(function () {
      flash("Account icon reset.");
    });
  });
  document.getElementById("resetBtn").addEventListener("click", function () {
    BankStore.reset().then(function (state) {
      document.querySelector("[name=initials]").dataset.manual = "";
      fill(state);
      flash("Restored the reference account.");
    });
  });

  document.getElementById("adminForm").addEventListener("submit", function (event) {
    event.preventDefault();
    queueSave();
  });

  BankStore.subscribe(function (state) {
    if (document.activeElement && document.activeElement.matches("input")) return;
    fill(state);
  });

  BankStore.load().then(fill);
})();
