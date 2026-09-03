// Schedule calculator for video slots.
// Entries are flat with t = seconds-since-UTC-day-start. All viewers worldwide
// resolve the same slot at the same instant (UTC clock).

class Scheduler {
  constructor() {
    this.schedule = [];
    this.weekStart = new Date('2025-10-11T00:00:00Z');
    this.state = {
      currentWeek: 1,
      currentSlot: null,
      upcomingSlots: [],
    };
    window.__debug.scheduler = this.state;
  }

  setSchedule(schedule) {
    this.schedule = schedule;
  }

  getCurrentWeek() {
    const now = new Date();
    const elapsed = now.getTime() - this.weekStart.getTime();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weekNum = Math.floor(elapsed / weekMs) % 101 + 1;
    this.state.currentWeek = weekNum;
    return weekNum;
  }

  secondsSinceUtcDayStart(now) {
    return now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  }

  getCurrentSlot() {
    const now = new Date();
    const sec = this.secondsSinceUtcDayStart(now);

    if (!this.schedule || this.schedule.length === 0) return null;

    for (let i = 0; i < this.schedule.length; i++) {
      const entry = this.schedule[i];
      const nextEntry = this.schedule[i + 1];
      const start = entry.t;
      const end = nextEntry ? nextEntry.t : 86400;

      if (sec >= start && sec < end) {
        // elapsed within this entry's playback. For a segment, the show resumes
        // at entry.seek + elapsed; for a movie spanning slots, elapsed measures
        // from the movie's true start (entry.t) across hour boundaries.
        const elapsed = sec - start;
        const seek = (entry.seek || 0) + elapsed;
        return {
          index: i,
          entry,
          startTime: start,
          endTime: end,
          elapsed,
          seek,
        };
      }
    }
    return null;
  }

  getUpcomingSlots(count = 5) {
    const now = new Date();
    const sec = this.secondsSinceUtcDayStart(now);
    const slots = [];
    for (const entry of this.schedule) {
      if (entry.t > sec) {
        slots.push({ entry, time: entry.t });
        if (slots.length >= count) break;
      }
    }
    this.state.upcomingSlots = slots;
    return slots;
  }
}

export default Scheduler;
