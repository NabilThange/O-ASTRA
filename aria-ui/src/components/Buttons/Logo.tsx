"use client";

const Logo = () => {
  return (
    <div className="fixed top-[2vw] left-7 flex items-center gap-1 z-40">
      {/* ARIA wordmark — minimal monogram */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f4efe7]"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <span className="text-[#181717] font-black text-[1rem] leading-none tracking-tighter">A</span>
      </div>
      <span
        className="text-[#f4efe7] font-semibold text-[0.85rem] tracking-widest uppercase"
        style={{ letterSpacing: "0.18em" }}
      >
        ARIA
      </span>
    </div>
  );
};

export default Logo;
