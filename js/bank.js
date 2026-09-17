(function () {
  const drawerRoot = document.getElementById("drawerRoot");
  const accountsSub = document.getElementById("accountsSub");
  const moveSub = document.getElementById("moveSub");
  const accountsToggle = document.getElementById("accountsToggle");
  const moveToggle = document.getElementById("moveToggle");
  const axosOnlySwitch = document.getElementById("axosOnlySwitch");
  const linkedSection = document.getElementById("linkedSection");
  const accountSheet = document.getElementById("accountSheet");
  const headerAvatar = document.getElementById("headerAvatar");
  const profileAvatar = document.getElementById("profileAvatar");
  const headerBadge = document.getElementById("headerBadge");
  const headerLogo = document.getElementById("headerLogo");
  const defaultWordmark = document.getElementById("defaultWordmark");
  const accountLogo = document.getElementById("accountLogo");
  const defaultAccountLogo = document.getElementById("defaultAccountLogo");

  let logoTaps = 0;
  let logoTapTimer = 0;

  function closeMenus() {
    drawerRoot.classList.remove("open", "nav-open", "profile-open");
    headerBadge.classList.remove("show");
  }

  function openNav() {
    drawerRoot.classList.add("open", "nav-open");
    drawerRoot.classList.remove("profile-open");
    headerBadge.classList.add("show");
  }

  function openProfile() {
    drawerRoot.classList.add("open", "profile-open");
    drawerRoot.classList.remove("nav-open");
    headerBadge.classList.remove("show");
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function applyState(state) {
    const money = BankStore.money;
    const initials = state.initials || BankStore.initialsFromName(state.firstName, state.lastName);
    document.title = state.browserUrl || "Online Banking";
    document.body.classList.toggle("show-chrome", Boolean(state.showBrowserChrome));
    document.body.style.setProperty("--avatar", state.avatarColor || "#F44437");

    setText("clockTime", state.useLiveClock ? liveClock() : state.clockTime);
    setText("browserUrl", state.browserUrl);
    setText("headerInitials", initials);
    setText("profileInitials", initials);
    document.getElementById("profileName").innerHTML =
      escapeHtml(state.firstName || "") + "<br />" + escapeHtml(state.lastName || "");
    headerAvatar.style.background = state.avatarColor;
    profileAvatar.style.background = state.avatarColor;
    headerBadge.textContent = String(state.messageCount || 1);

    setText("totalAssets", money(state.totalAssets));
    setText("totalDebt", money(state.totalDebt));
    setText("checkingTotal", money(state.balance));
    setText("accountBalance", money(state.balance));
    setText("accountName", state.accountName);
    setText("accountLast4", state.last4);
    setText("accountLast4b", state.last4);
    setText("accountBank", state.bankName);
    setText("brandNameLabel", state.brandName || "Axos");
    setText("footerBank", state.bankName);
    setText("linkedName", state.linkedName);
    setText("linkedLast4", state.linkedLast4);
    setText("linkedLast4b", state.linkedLast4);
    setText("linkedBank", state.linkedBank);
    setText("linkedInitials", state.linkedInitials || "WF");

    axosOnlySwitch.classList.toggle("on", Boolean(state.showOnlyAxos));
    linkedSection.classList.toggle(
      "hidden",
      Boolean(state.showOnlyAxos) || !state.showLinkedAccount
    );

    if (state.bankLogo) {
      headerLogo.src = state.bankLogo;
      headerLogo.classList.remove("hidden");
      defaultWordmark.classList.add("hidden");
    } else {
      headerLogo.classList.add("hidden");
      defaultWordmark.classList.remove("hidden");
    }

    if (state.accountLogo) {
      accountLogo.src = state.accountLogo;
      accountLogo.classList.remove("hidden");
      defaultAccountLogo.classList.add("hidden");
    } else {
      accountLogo.classList.add("hidden");
      defaultAccountLogo.classList.remove("hidden");
    }
  }

  function liveClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    hours = hours % 12 || 12;
    return hours + ":" + minutes;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  document.getElementById("openNav").addEventListener("click", openNav);
  document.getElementById("closeNav").addEventListener("click", closeMenus);
  document.getElementById("openProfile").addEventListener("click", openProfile);
  document.getElementById("closeProfile").addEventListener("click", closeMenus);
  document.getElementById("backdrop").addEventListener("click", closeMenus);

  accountsToggle.addEventListener("click", function () {
    accountsSub.classList.toggle("open");
    const chev = accountsToggle.querySelector(".chev path");
    chev.setAttribute("d", accountsSub.classList.contains("open") ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6");
  });

  moveToggle.addEventListener("click", function () {
    moveSub.classList.toggle("open");
    const chev = moveToggle.querySelector(".chev path");
    chev.setAttribute("d", moveSub.classList.contains("open") ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6");
  });

  drawerRoot.addEventListener("click", function (event) {
    const close = event.target.closest("[data-close]");
    if (close) closeMenus();
  });

  document.getElementById("axosOnlyToggle").addEventListener("click", function () {
    const state = BankStore.get();
    BankStore.save({ showOnlyAxos: !state.showOnlyAxos });
  });

  function showSheet(title, body) {
    accountSheet.querySelector("h2").textContent = title;
    accountSheet.querySelector("p").textContent = body;
    accountSheet.classList.add("show");
  }

  function hideSheet() {
    accountSheet.classList.remove("show");
  }

  document.getElementById("openAccountBtn").addEventListener("click", function () {
    showSheet(
      "Open an Account",
      "Choose a checking or savings product. A banker will follow up to finish your application."
    );
  });
  document.getElementById("closeSheet").addEventListener("click", hideSheet);
  document.getElementById("closeSheetPrimary").addEventListener("click", hideSheet);

  document.getElementById("chatBtn").addEventListener("click", function () {
    showSheet(
      "Help",
      "Hi! How can we help you today? Send us a message and a banker will reply shortly."
    );
  });

  document.getElementById("headerLogoWrap").addEventListener("click", function () {
    logoTaps += 1;
    clearTimeout(logoTapTimer);
    logoTapTimer = setTimeout(function () {
      logoTaps = 0;
    }, 900);
    if (logoTaps >= 5) {
      window.location.href = "admin.html";
    }
  });

  document.getElementById("adminHotspot").addEventListener("click", function () {
    window.location.href = "admin.html";
  });

  BankStore.subscribe(applyState);

  BankStore.load().then(function (state) {
    applyState(state);
  });

  setInterval(function () {
    const state = BankStore.get();
    if (state.useLiveClock) {
      setText("clockTime", liveClock());
    }
  }, 1000);
})();
