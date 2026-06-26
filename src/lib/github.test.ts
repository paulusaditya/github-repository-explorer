// lib/github.test.ts
import { describe, it, expect } from "vitest";
import { formatNumber, formatDate, formatBytes, getURLParams, pushURLParams } from "./github";

describe("formatNumber", () => {
  it("formats angka di bawah 1000 apa adanya", () => {
    expect(formatNumber(999)).toBe("999");
  });
  it("formats ribuan dengan suffix k", () => {
    expect(formatNumber(1500)).toBe("1.5k");
  });
  it("formats jutaan dengan suffix M", () => {
    expect(formatNumber(2_300_000)).toBe("2.3M");
  });
});

describe("formatDate", () => {
  it('return "today" untuk tanggal hari ini', () => {
    expect(formatDate(new Date().toISOString())).toBe("today");
  });
  it('return "yesterday" untuk 1 hari lalu', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(formatDate(d.toISOString())).toBe("yesterday");
  });
  // tambahkan case: 5 hari lalu -> "5d ago", 2 bulan lalu -> "2mo ago", 2 tahun lalu -> "2y ago"
});

describe("formatBytes", () => {
  it("menampilkan KB jika di bawah 1024", () => {
    expect(formatBytes(500)).toBe("500 KB");
  });
  it("konversi ke MB jika 1024 atau lebih", () => {
    expect(formatBytes(2048)).toBe("2.0 MB");
  });
});

describe("getURLParams", () => {
  it("parse query params dari window.location", () => {
    window.history.pushState({}, "", "?q=react&sort=stars&lang=TypeScript&page=2");
    const params = getURLParams();
    expect(params).toEqual({ query: "react", sort: "stars", language: "TypeScript", page: 2 });
  });
  it("return default jika tidak ada query params", () => {
    window.history.pushState({}, "", "/");
    expect(getURLParams()).toEqual({ query: "", sort: "best-match", language: "", page: 1 });
  });
});