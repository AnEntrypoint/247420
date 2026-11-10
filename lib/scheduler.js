class Scheduler {
  constructor() {
    this.schedule = [];
    this.weekStart = new Date('2025-10-11T00:00:00Z');
    this.weekCount = 183;
    this.state = {
      currentWeek: 1,
      currentDay: 'monday',
      currentSlot: null,
      upcomingSlots: [],
    };
    window.__debug.scheduler = this.state;
  }

  setSchedule(schedule) {
    this.schedule = schedule;
  }

  setWeekCount(count) {
    if (!Number.isInteger(count) || count < 1) throw new Error('week count must be a positive integer, got ' + count);
    this.weekCount = count;
  }

  getCurrentWeek(now = new Date()) {
    const elapsed = now.getTime() - this.weekStart.getTime();
    if (elapsed < 0) throw new Error('schedule epoch ' + this.weekStart.toISOString() + ' is in the future relative to ' + now.toISOString());
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weekNum = Math.floor(elapsed / weekMs) % this.weekCount + 1;
    this.state.currentWeek = weekNum;
    return weekNum;
  }

  getCurrentDay(now = new Date()) {
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getUTCDay()];
    this.state.currentDay = day;
    return day;
  }

  secondsSinceUtcDayStart(now) {
    return now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  }

  secondsSinceWeekStart(now = new Date()) {
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getUTCDay()];
    const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day);
    if (dayIndex < 0) throw new Error('unknown UTC day: ' + day);
    return dayIndex * 86400 + this.secondsSinceUtcDayStart(now);
  }

  activeSlots(now = new Date()) {
    if (!Array.isArray(this.schedule) || !this.schedule.length) return [];
    const sec = this.secondsSinceWeekStart(now);
    return this.schedule.filter(entry => entry.t <= sec && sec < entry.end);
  }

  getCurrentSlot(now = new Date()) {
    const slots = this.activeSlots(now);
    if (!slots.length) return null;
    const entry = slots.sort((a, b) => b.t - a.t)[0];
    const elapsed = this.secondsSinceWeekStart(now) - entry.t;
    return {
      index: this.schedule.indexOf(entry),
      entry,
      startTime: entry.t,
      endTime: entry.end,
      elapsed,
      seek: (entry.seek || 0) + elapsed,
    };
  }

  getUpcomingSlots(count = 5, now = new Date()) {
    const sec = this.secondsSinceWeekStart(now);
    const slots = this.schedule
      .filter(entry => entry.t > sec)
      .sort((a, b) => a.t - b.t)
      .slice(0, count)
      .map(entry => ({ entry, time: entry.t }));
    this.state.upcomingSlots = slots;
    return slots;
  }
}

export default Scheduler;
