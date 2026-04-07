var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  useAdaptiveDebounce: () => useAdaptiveDebounce_default
});
module.exports = __toCommonJS(index_exports);

// src/engine/util.ts
var EMA = (avg, value, samples, alpha = null) => {
  if (!alpha) alpha = getAlpha(samples);
  return value * alpha + avg * (1 - alpha);
};
var meanAvg = (values) => {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};
var variance = (values, avg = null, useSample = true) => {
  if (values.length < 2) return 0;
  if (!avg) avg = meanAvg(values);
  const squaredDiffs = values.map((value) => Math.pow(value - avg, 2));
  const variance2 = squaredDiffs.reduce((sum, value) => sum + value, 0) / (useSample ? values.length - 1 : values.length);
  return variance2;
};
var stdDev = (values, avg = null, useSample = true) => {
  return Math.sqrt(variance(values, avg, useSample));
};
var alpha_min = 0.04;
var alpha_max = 0.135;
var decay_rate = 80;
var rise_rate = 12;
var getAlpha = (n) => {
  return alpha_min + alpha_max * (1 - Math.exp(-n / rise_rate)) - alpha_max * (1 - Math.exp(-n / decay_rate));
};
var getIntervals = (values) => {
  if (values.length < 2) return [0];
  let result = [];
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] - values[i - 1]);
  }
  return result;
};
var intervalsToFrequency = (intervals) => {
  if (intervals.length < 1) return 0;
  return 1e3 / meanAvg(intervals);
};
var truncateOldTimestamps = (timestamps, threshold = 2e3, now = (/* @__PURE__ */ new Date()).getTime()) => {
  return timestamps.filter((t) => now - t <= threshold);
};
var getEditWeight = (expectedEditSize, consecutiveEdits) => {
  if (expectedEditSize <= 0) return 1;
  return expectedEditSize / (expectedEditSize + consecutiveEdits);
};

// src/engine/analyse.ts
var shouldCountAsTyping = (inputType, isComposing) => {
  switch (inputType) {
    case "insertText": {
      return true;
    }
    case "insertCompositionText": {
      if (isComposing) return false;
      return true;
    }
    default: {
      return false;
    }
  }
};
var getTypingTimeout = (avgCPS, devCPS, timestamp = (/* @__PURE__ */ new Date()).getTime()) => {
  const devConfidence = 2;
  const avgInterval = 1e3 / avgCPS;
  const devInterval = 1e3 / devCPS;
  const t = avgInterval + devConfidence * devInterval;
  return { timeout: timestamp + t, interval: t };
};
var getPauseTimeout = (pauseProfile, typingTimeout, editSignal, fireTolerance) => {
  const devConfidence = 2;
  const avgPause = 1e3 / pauseProfile.meanPause;
  const dev = 1e3 / pauseProfile.deviation;
  const t = avgPause + devConfidence * dev;
  const pauseTimeout = typingTimeout + getWeightedPauseThreshold(t, editSignal, fireTolerance);
  return { pauseTimeout, t };
};
var getWeightedPauseThreshold = (timeoutInterval, editSignal, fireTolerance) => {
  return (timeoutInterval - (1 - editSignal)) * (1.2 * Math.exp(-0.4 * fireTolerance));
};
var getEditLikelihood = (editState, editRate, isTyping) => {
  if (!editState.prevLength) editState.prevLength = 0;
  const delta = Math.abs(editState.length - editState.prevLength);
  if (delta === 0) {
    return { ...editState, effort: editState.effort++, consecutiveEdits: 0 };
  }
  const expectedEditSize = Math.max(1, 1 / (editRate || 0.01));
  if (isTyping) {
    const DECAY_RATE = Math.exp(-delta / expectedEditSize);
    return {
      ...editState,
      prevLength: length,
      progress: editState.progress + delta,
      effort: editState.progress + delta,
      consecutiveEdits: 0,
      signal: editState.signal * DECAY_RATE
    };
  }
  editState.consecutiveEdits = editState.consecutiveEdits + delta;
  const weight = getEditWeight(expectedEditSize, editState.consecutiveEdits);
  const spike = (1 - editState.signal) * weight;
  return {
    ...editState,
    prevLength: length,
    effort: editState.effort + delta,
    signal: editState.signal + spike
  };
};

// src/profile/update.ts
var updateLocalTempoProfile = (tempoProfile, timestamps) => {
  const s = tempoProfile.samples;
  const intervals = getIntervals(timestamps);
  const mean = meanAvg(intervals);
  const dev = stdDev(intervals, mean);
  tempoProfile.meanCPS = EMA(tempoProfile.meanCPS, intervalsToFrequency(intervals), s);
  tempoProfile.deviation = EMA(tempoProfile.deviation, dev, s);
  tempoProfile.samples++;
  return tempoProfile;
};
var updateLocalPauseProfile = (pauseProfile, intervals, applyDefaultGrowth = false, positiveGrowth = false) => {
  const s = pauseProfile.samples;
  if (applyDefaultGrowth) {
    const multiplier = positiveGrowth ? 1 + getAlpha(s) : 1 - getAlpha(s);
    intervals = [...intervals, pauseProfile.meanPause * multiplier];
  }
  const mean = meanAvg(intervals);
  const dev = stdDev(intervals, mean);
  pauseProfile.meanPause = EMA(pauseProfile.meanPause, mean, s);
  pauseProfile.deviation = EMA(pauseProfile.deviation, dev, s);
  return pauseProfile;
};
var updateToleranceProfile = (toleranceProfile, exceededSessionTimeout) => {
  const s = toleranceProfile.samples;
  const multiplier = exceededSessionTimeout ? Math.min(1, 1 - getAlpha(s)) : Math.max(0, 1 + getAlpha(s));
  const fireTolerance = toleranceProfile.fireTolerance * multiplier;
  toleranceProfile.fireTolerance = fireTolerance;
  toleranceProfile.samples++;
  return toleranceProfile;
};
var updateEditProfile = (editProfile, editState) => {
  const s = editProfile.samples;
  const editRate = editState.progress / editState.effort;
  editProfile.editRate = EMA(editProfile.editRate, editRate, s);
  editProfile.samples++;
  return editProfile;
};

// src/engine/store.ts
var import_vanilla = require("zustand/vanilla");

// src/profile/default.ts
var DEFAULT_PROFILE = {
  version: 2,
  tempoProfile: {
    meanCPS: 4.5,
    deviation: 1.5,
    samples: 0
  },
  pauseProfile: {
    meanPause: 3.5,
    deviation: 1.12,
    samples: 0
  },
  editProfile: {
    editRate: 0.18,
    samples: 0
  },
  toleranceProfile: {
    fireTolerance: 0.65,
    samples: 0
  },
  lastUpdated: void 0
};

// src/engine/cookie.ts
var COOKIE_NAME = "typace_profile_v1";
var deserialiseProfile = (cookie) => ({
  version: cookie.v,
  tempoProfile: {
    meanCPS: cookie.tc,
    deviation: cookie.td,
    samples: cookie.st
  },
  pauseProfile: {
    meanPause: cookie.pc * 10,
    deviation: cookie.pd * 10,
    longPauseThreshold: cookie.pc * 10 + 2 * cookie.pd * 10,
    samples: cookie.sp
  },
  editProfile: {
    editRate: cookie.er,
    samples: cookie.se
  },
  toleranceProfile: {
    fireTolerance: cookie.ft,
    samples: cookie.sf
  },
  lastUpdated: cookie.ts
});
var getCookie = async (name) => {
  const cookie = await cookieStore.get({ name });
  return cookie ? cookie.value : void 0;
};
var fetchProfile = async () => {
  const cookieData = await getCookie(COOKIE_NAME) ?? void 0;
  if (!cookieData) return DEFAULT_PROFILE;
  return deserialiseProfile(JSON.parse(cookieData));
};

// src/profile/profile.ts
var ProfileController = class _ProfileController {
  static instance;
  // FIX: TS(264) 
  profile = DEFAULT_PROFILE;
  listeners = [];
  constructor() {
  }
  static getInstance() {
    if (!_ProfileController.instance) {
      _ProfileController.instance = new _ProfileController();
      _ProfileController.instance.initialise();
    }
    return _ProfileController.instance;
  }
  async initialise() {
    const fetchedProfile = await fetchProfile();
    if (fetchedProfile) {
      this.profile = fetchedProfile;
      this.notifyListeners();
    }
  }
  setProfile(profile) {
    this.profile = { ...profile, lastUpdated: Date.now() };
    this.notifyListeners();
  }
  updateProfile(update) {
    if (!this.profile) return;
    this.profile = {
      ...this.profile,
      ...update,
      lastUpdated: Date.now()
    };
    this.notifyListeners();
  }
  getProfile() {
    return this.profile;
  }
  subscribe(listener) {
    this.listeners.push(listener);
    return () => this.listeners = this.listeners.filter((l) => l !== listener);
  }
  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.profile));
  }
};
var profileController = ProfileController.getInstance();
var profile_default = profileController;

// src/engine/store.ts
var initialState = {
  profile: {
    ...profile_default.getProfile()
  },
  timestamps: [],
  typing: {
    timeout: 0,
    interval: 0
  },
  edit: {
    length: 0,
    prevLength: void 0,
    effort: 0,
    progress: 0,
    consecutiveEdits: 0,
    signal: 0
  },
  pause: {
    start: null,
    timeout: void 0,
    interval: void 0,
    intervals: [],
    awaitedFalsePositive: false
  },
  fire: {
    hasFired: false
  },
  terminated: false
};
var sessionStore = (0, import_vanilla.createStore)(() => initialState);
profile_default.subscribe((updatedProfile) => {
  if (updatedProfile) {
    sessionStore.setState({
      profile: { ...updatedProfile }
    });
  }
});

// src/engine/session.ts
var CYCLE_DURATION_MS = 20;
var HISTORY_LIMIT_MS = 5e3;
var intervalId = null;
var startSession = () => {
  if (!intervalId) {
    intervalId = setInterval(processTick, CYCLE_DURATION_MS);
  }
};
var stopSession = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    const state = sessionStore.getState();
    profile_default.updateProfile({
      ...state.profile,
      editProfile: updateEditProfile(state.profile.editProfile, state.edit)
    });
    sessionStore.setState(() => sessionStore.getInitialState());
  } else {
    throw new Error("Interval ID not found. Execution failed.");
  }
};
var cleanTimestamps = (timestamps, now) => {
  return truncateOldTimestamps(timestamps, HISTORY_LIMIT_MS, now);
};
var processTick = () => {
  if (sessionStore.getState().terminated) stopSession();
  const now = Date.now();
  sessionStore.setState((curr) => {
    const cleanedTimestamps = cleanTimestamps([...curr.timestamps], now);
    const state = {
      ...curr,
      timestamps: cleanedTimestamps
    };
    if (state.typing.timeout > now) {
      const interval = state.pause.start ? now - state.pause.start : void 0;
      const intervals = interval ? [...state.pause.intervals, interval] : state.pause.intervals;
      const pauseProfile2 = state.fire.hasFired ? updateLocalPauseProfile(state.profile.pauseProfile, intervals, true, true) : updateLocalPauseProfile(state.profile.pauseProfile, intervals);
      return {
        ...state,
        profile: {
          ...state.profile,
          pauseProfile: pauseProfile2,
          toleranceProfile: state.fire.hasFired ? updateToleranceProfile(state.profile.toleranceProfile, false) : state.profile.toleranceProfile
        },
        pause: {
          ...state.pause,
          start: null,
          intervals,
          awaitedFalsePositive: false
        },
        fire: {
          ...state.fire,
          hasFired: false
        }
      };
    }
    const start = !state.pause.start ? now : state.pause.start;
    const { pauseTimeout, t } = getPauseTimeout(state.profile.pauseProfile, state.typing.timeout, state.edit.signal, state.profile.toleranceProfile.fireTolerance);
    const updatedPause = {
      ...state.pause,
      start,
      timeout: pauseTimeout,
      interval: t
    };
    if (pauseTimeout > now || !state.fire.fire) {
      return {
        ...state,
        pause: updatedPause
      };
    }
    if (!state.fire.hasFired) state.fire.fire();
    const awaitTimeout = pauseTimeout + state.typing.interval;
    if (awaitTimeout > now) {
      return {
        ...state,
        pause: updatedPause,
        fire: {
          ...state.fire,
          hasFired: true
        }
      };
    }
    const pauseProfile = state.pause.awaitedFalsePositive ? state.profile.pauseProfile : (
      // Negative growth because we have exceeded threshold. Thus pause may have been to short.
      updateLocalPauseProfile(state.profile.pauseProfile, state.pause.intervals, true, false)
    );
    const sessionTimeout = awaitTimeout + t;
    if (sessionTimeout > now) {
      return {
        ...state,
        profile: {
          ...state.profile,
          pauseProfile
        },
        pause: {
          ...updatedPause,
          awaitedFalsePositive: true
        }
      };
    }
    return {
      ...state,
      profile: {
        ...state.profile,
        toleranceProfile: updateToleranceProfile(state.profile.toleranceProfile, true)
      },
      terminated: true
    };
  });
};
var addEvent = (length2, inputType, isComposing, timestamp = Date.now(), fire) => {
  if (!intervalId) startSession();
  const isTyping = shouldCountAsTyping(inputType, isComposing);
  sessionStore.setState((state) => {
    const timestamps = isTyping ? [...state.timestamps, timestamp] : state.timestamps;
    const tempoProfile = updateLocalTempoProfile(
      state.profile.tempoProfile,
      timestamps
    );
    const editState = {
      ...state.edit,
      length: length2,
      prevLength: state.edit.length
    };
    return {
      timestamps,
      profile: {
        ...state.profile,
        tempoProfile
      },
      timeout: getTypingTimeout(tempoProfile.meanCPS, tempoProfile.deviation, Date.now()),
      edit: getEditLikelihood(editState, state.profile.editProfile.editRate, isTyping),
      fire: {
        ...state.fire,
        fire
      }
    };
  });
};
var session_default = {
  addEvent,
  stopSession
};

// src/react/useAdaptiveDebounce.ts
var useAdaptiveDebounce = (onFire, minFireLength) => {
  const bind = {
    onBeforeInput(e) {
      const length2 = e.currentTarget.value.length;
      const inputType = e.nativeEvent.inputType;
      const isComposing = e.nativeEvent.isComposing;
      const timestamp = e.nativeEvent.timeStamp;
      const fire = () => onFire("e.currentTarget.value");
      session_default.addEvent(length2, inputType, isComposing, timestamp, fire);
    }
  };
  return {
    bind
  };
};
var useAdaptiveDebounce_default = useAdaptiveDebounce;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useAdaptiveDebounce
});
