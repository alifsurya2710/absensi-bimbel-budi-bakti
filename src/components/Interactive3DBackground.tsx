"use client";

import { useEffect, useRef } from "react";

export default function Interactive3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 25;
      const y = (e.clientY - innerHeight / 2) / 25;

      const elements = containerRef.current.querySelectorAll<HTMLElement>("[data-speed]");
      elements.forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-speed") || "1");
        el.style.transform = `translate3d(${x * speed}px, ${y * speed}px, 0px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* Dynamic Aurora Sky Gradient Glows */}
      <div
        data-speed="0.6"
        className="absolute -top-40 left-1/4 w-[42rem] h-[36rem] rounded-full bg-gradient-to-br from-sky-400/35 via-cyan-300/25 to-blue-500/20 blur-[100px] animate-float-orb1"
      />
      <div
        data-speed="0.9"
        className="absolute top-1/3 -right-32 w-[34rem] h-[34rem] rounded-full bg-gradient-to-bl from-blue-400/30 via-sky-300/25 to-indigo-300/20 blur-[110px] animate-float-orb2"
      />
      <div
        data-speed="0.7"
        className="absolute -bottom-36 -left-20 w-[38rem] h-[38rem] rounded-full bg-gradient-to-tr from-sky-300/35 via-blue-200/30 to-indigo-200/20 blur-[100px] animate-float-orb1"
        style={{ animationDelay: "3s" }}
      />

      {/* Floating 3D Frosted Glass Geometric Elements */}
      {/* 3D Glass Cube 1 - Top Left */}
      <div
        data-speed="1.8"
        className="absolute top-24 left-[8%] w-20 h-20 rounded-3xl bg-gradient-to-br from-white/80 via-sky-100/60 to-blue-200/40 backdrop-blur-xl border border-white/90 shadow-[0_20px_40px_rgba(56,189,248,0.25)] animate-float-slow transition-transform duration-200"
        style={{ transform: "perspective(800px) rotateX(15deg) rotateY(-18deg)" }}
      >
        <div className="absolute inset-1.5 rounded-2xl border border-white/60 bg-gradient-to-br from-white/40 to-transparent" />
      </div>

      {/* 3D Glass Prism 2 - Top Right */}
      <div
        data-speed="2.2"
        className="absolute top-36 right-[10%] w-28 h-28 rounded-3xl bg-gradient-to-tl from-sky-200/60 via-blue-100/50 to-white/90 backdrop-blur-xl border border-white/90 shadow-[0_25px_50px_rgba(14,165,233,0.22)] animate-float-reverse transition-transform duration-200"
        style={{ transform: "perspective(800px) rotateX(-20deg) rotateY(22deg)" }}
      >
        <div className="absolute inset-2 rounded-2xl border border-sky-200/60 bg-gradient-to-tl from-sky-300/20 to-transparent" />
      </div>

      {/* 3D Floating Pill 3 - Center Left */}
      <div
        data-speed="1.4"
        className="absolute top-1/2 left-[5%] w-16 h-32 rounded-full bg-gradient-to-b from-white/85 via-sky-100/65 to-sky-200/40 backdrop-blur-xl border border-white/90 shadow-[0_20px_45px_rgba(37,99,235,0.18)] animate-float-slow transition-transform duration-200"
        style={{ transform: "perspective(800px) rotateZ(-25deg)", animationDelay: "1s" }}
      />

      {/* 3D Glass Cube 4 - Bottom Right */}
      <div
        data-speed="2.4"
        className="absolute bottom-28 right-[14%] w-22 h-22 rounded-3xl bg-gradient-to-tr from-sky-300/40 via-blue-200/50 to-white/85 backdrop-blur-xl border border-white/90 shadow-[0_22px_45px_rgba(56,189,248,0.25)] animate-float-reverse transition-transform duration-200"
        style={{ transform: "perspective(800px) rotateX(25deg) rotateY(15deg)", animationDelay: "2s" }}
      >
        <div className="absolute inset-2 rounded-2xl border border-white/70" />
      </div>

      {/* 3D Glass Sphere / Orb - Bottom Left */}
      <div
        data-speed="1.6"
        className="absolute bottom-16 left-[22%] w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400/30 via-sky-200/60 to-white/90 backdrop-blur-md border border-white/90 shadow-[0_15px_35px_rgba(56,189,248,0.3)] animate-float-slow transition-transform duration-200"
        style={{ animationDelay: "4s" }}
      />

      {/* Modern Sky Subtle Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.4] bg-[linear-gradient(to_right,rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]"
      />
    </div>
  );
}
