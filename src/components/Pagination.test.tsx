// components/Pagination.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("tidak render apapun jika hanya 1 halaman", () => {
    const { container } = render(<Pagination page={1} total={5} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("disable tombol Previous di halaman pertama", () => {
    render(<Pagination page={1} total={100} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disable tombol Next di halaman terakhir", () => {
    render(<Pagination page={10} total={100} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("memanggil onChange dengan nomor halaman yang benar saat tombol page diklik", () => {
    const onChange = vi.fn();
    render(<Pagination page={1} total={100} onChange={onChange} />);
    fireEvent.click(screen.getByText("2"));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("menampilkan ellipsis saat total halaman lebih dari 7", () => {
    render(<Pagination page={5} total={1000} onChange={vi.fn()} />);
    expect(screen.getAllByText("…").length).toBeGreaterThan(0);
  });
});