(function (global) {
  const STORAGE_KEY = "film-bank-prop-v1";
  const CHANNEL = "film-bank-prop";

  const DEFAULT_STATE = {
    firstName: "Leslie",
    lastName: "Winston",
    initials: "L W",
    avatarColor: "#F44437",
    accountName: "Business Checking",
    last4: "3365",
    bankName: "Axos Bank",
    brandName: "Axos",
    balance: 540.1,
    totalAssets: 540.1,
    totalDebt: 0,
    syncAssetsToBalance: true,
    bankLogo: "",
    accountLogo: "",
    showLinkedAccount: true,
    linkedName: "EVERYDAY CHECKING",
    linkedLast4: "3936",
    linkedBank: "Wells Fargo Bank",
    linkedInitials: "WF",
    clockTime: "8:50",
    useLiveClock: false,
    browserUrl: "onlinebanking.axosbank.com",
    showBrowserChrome: false,
    messageCount: 1,
    showOnlyAxos: false,
  };

  let memory = null;
  let channel = null;
  const listeners = new Set();
  let lastSerialized = "";
  let serverAvailable = null;

  try {
    channel = new BroadcastChannel(CHANNEL);
  } catch (e) {
    channel = null;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function initialsFromName(firstName, lastName) {
    const first = (firstName || "").trim();
    const last = (lastName || "").trim();
    const a = first ? first[0].toUpperCase() : "";
    const b = last ? last[0].toUpperCase() : "";
    return [a, b].filter(Boolean).join(" ");
  }

  function normalize(raw) {
    const state = Object.assign(clone(DEFAULT_STATE), raw || {});
    state.balance = Number(state.balance);
    state.totalDebt = Number(state.totalDebt);
    if (!Number.isFinite(state.balance)) state.balance = 0;
    if (!Number.isFinite(state.totalDebt)) state.totalDebt = 0;
    if (state.syncAssetsToBalance) {
      state.totalAssets = state.balance;
    } else {
      state.totalAssets = Number(state.totalAssets);
      if (!Number.isFinite(state.totalAssets)) state.totalAssets = state.balance;
    }
    if (!String(state.initials || "").trim()) {
      state.initials = initialsFromName(state.firstName, state.lastName);
    }
    state.showLinkedAccount = Boolean(state.showLinkedAccount);
    state.showOnlyAxos = Boolean(state.showOnlyAxos);
    state.showBrowserChrome = Boolean(state.showBrowserChrome);
    state.useLiveClock = Boolean(state.useLiveClock);
    state.syncAssetsToBalance = Boolean(state.syncAssetsToBalance);
    state.messageCount = Number(state.messageCount) || 0;
    return state;
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_STATE);
      return normalize(JSON.parse(raw));
    } catch (e) {
      return clone(DEFAULT_STATE);
    }
  }

  function writeLocal(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  async function fetchState() {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (response.status === 204) throw new Error("no server state");
    if (!response.ok) throw new Error("no server state");
    const data = await response.json();
    if (!data || !Object.keys(data).length) throw new Error("no server state");
    return normalize(data);
  }

  async function postState(state) {
    const response = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!response.ok) throw new Error("save failed");
    return normalize(await response.json());
  }

  function emit(state) {
    const serialized = JSON.stringify(state);
    if (serialized === lastSerialized) return;
    lastSerialized = serialized;
    listeners.forEach(function (fn) {
      try {
        fn(clone(state));
      } catch (e) {
        console.error(e);
      }
    });
  }

  function setMemory(state, broadcast) {
    memory = normalize(state);
    writeLocal(memory);
    emit(memory);
    if (broadcast && channel) {
      channel.postMessage({ type: "state", state: memory });
    }
    return clone(memory);
  }

  async function load() {
    if (serverAvailable !== false) {
      try {
        const state = await fetchState();
        serverAvailable = true;
        return setMemory(state, false);
      } catch (e) {
        serverAvailable = false;
      }
    }
    return setMemory(readLocal(), false);
  }

  async function save(partial) {
    const next = normalize(Object.assign(clone(get()), partial || {}));
    if (next.syncAssetsToBalance) next.totalAssets = next.balance;
    setMemory(next, true);
    if (serverAvailable) {
      try {
        const saved = await postState(next);
        return setMemory(saved, false);
      } catch (e) {
        serverAvailable = false;
      }
    }
    return clone(memory);
  }

  function get() {
    return clone(memory || readLocal());
  }

  function reset() {
    return save(clone(DEFAULT_STATE));
  }

  function subscribe(fn) {
    listeners.add(fn);
    return function () {
      listeners.delete(fn);
    };
  }

  function money(value) {
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (channel) {
    channel.onmessage = function (event) {
      if (event.data && event.data.type === "state") {
        setMemory(event.data.state, false);
      }
    };
  }

  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        setMemory(JSON.parse(event.newValue), false);
      } catch (e) {}
    }
  });

  setInterval(async function () {
    if (serverAvailable !== true) return;
    try {
      const state = await fetchState();
      setMemory(state, false);
    } catch (e) {}
  }, 600);

  global.BankStore = {
    DEFAULT_STATE: clone(DEFAULT_STATE),
    initialsFromName: initialsFromName,
    load: load,
    save: save,
    get: get,
    reset: reset,
    subscribe: subscribe,
    money: money,
    fileToDataUrl: fileToDataUrl,
    normalize: normalize,
  };
})(window);
